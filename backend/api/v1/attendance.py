from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from database.config import get_db
from services.attendance_service import process_attendance
from models import schemas
from models.models import attendance_doc
from .auth import get_current_user
from typing import List, Optional
import datetime

router = APIRouter()


@router.post("/upload-photo", response_model=schemas.AttendanceResponse)
async def upload_classroom_photo(
    file: UploadFile = File(...),
    class_id: Optional[str] = Query(None),
    period: Optional[str] = Query(None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Upload a classroom photo to automatically mark attendance."""
    if file.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
        raise HTTPException(status_code=400, detail="Only JPEG/PNG images are accepted")

    image_bytes = await file.read()
    result, message = await process_attendance(db, image_bytes, class_id=class_id, period=period)
    return {**result, "message": message}


@router.get("/today")
async def get_today_attendance(
    class_id: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get today's attendance records with student details."""
    today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    query = {"date": {"$gte": today_start}}
    records = await db.attendance.find(query).to_list(length=5000)

    results = []
    for att in records:
        student = await db.students.find_one({"_id": att["student_id"]})
        if not student:
            continue
        if class_id and student.get("class_id") != class_id:
            continue
        results.append({
            "student_id": att["student_id"],
            "student_name": student["name"],
            "roll_number": student["roll_number"],
            "status": att["status"],
            "confidence": att.get("confidence", 0.0),
            "date": att["date"]
        })

    return results


@router.get("/history")
async def get_attendance_history(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    class_id: Optional[str] = None,
    student_id: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get attendance history with date-range and class filtering."""
    query = {}

    if start_date:
        try:
            start = datetime.datetime.strptime(start_date, "%Y-%m-%d")
            query.setdefault("date", {})["$gte"] = start
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")

    if end_date:
        try:
            end = datetime.datetime.strptime(end_date, "%Y-%m-%d") + datetime.timedelta(days=1)
            query.setdefault("date", {})["$lt"] = end
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")

    if student_id:
        query["student_id"] = student_id

    records = await db.attendance.find(query).sort("date", -1).to_list(length=10000)

    results = []
    for att in records:
        student = await db.students.find_one({"_id": att["student_id"]})
        if not student:
            continue
        if class_id and student.get("class_id") != class_id:
            continue
        results.append({
            "student_id": att["student_id"],
            "student_name": student["name"],
            "roll_number": student["roll_number"],
            "status": att["status"],
            "confidence": att.get("confidence", 0.0),
            "date": att["date"]
        })

    return results


@router.post("/finalize")
async def finalize_attendance(
    payload: schemas.AttendanceFinalizeRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Persist the teacher-confirmed attendance.

    REPLACE strategy: Deletes ALL existing attendance records for this
    class+period+today before inserting the new confirmed list. This guarantees
    the teacher's explicit selection is what gets saved — no stale records.
    """
    today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    present_ids = list(dict.fromkeys(payload.present_student_ids))
    absent_ids = [sid for sid in dict.fromkeys(payload.absent_student_ids) if sid not in present_ids]
    all_ids = present_ids + absent_ids

    # Validate all students belong to the selected class
    query = {}
    if payload.class_id:
        query["class_id"] = payload.class_id
    students = await db.students.find(query).to_list(length=5000)
    valid_student_ids = {s["_id"] for s in students}

    invalid_ids = [sid for sid in all_ids if sid not in valid_student_ids]
    if invalid_ids:
        raise HTTPException(status_code=400, detail="Attendance list contains students outside the selected classroom")

    period = payload.period

    # ---- REPLACE: delete existing records for these students for today ----
    delete_filter = {
        "student_id": {"$in": all_ids},
        "date": {"$gte": today_start}
    }
    if period:
        delete_filter["period"] = period
    await db.attendance.delete_many(delete_filter)

    # ---- Insert fresh confirmed records ----
    docs = []
    for student_id in present_ids:
        docs.append(attendance_doc(student_id=student_id, status="PRESENT", confidence=1.0, period=period))
    for student_id in absent_ids:
        docs.append(attendance_doc(student_id=student_id, status="ABSENT", confidence=0.0, period=period))

    if docs:
        await db.attendance.insert_many(docs)

    return {
        "message": "Attendance saved successfully",
        "present_count": len(present_ids),
        "absent_count": len(absent_ids)
    }
