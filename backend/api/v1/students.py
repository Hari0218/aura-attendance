from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from motor.motor_asyncio import AsyncIOMotorDatabase
from database.config import get_db
from .auth import get_current_user
from models import schemas
from models.models import student_doc
from services.attendance_service import register_student_face
from typing import List

router = APIRouter()


def _student_response(s: dict) -> dict:
    return {
        "id": s["_id"],
        "name": s["name"],
        "roll_number": s["roll_number"],
        "class_id": s.get("class_id", ""),
        "email": s.get("email", ""),
        "created_at": s["created_at"]
    }


@router.get("/")
async def get_students(
    class_id: str = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all students, optionally filtered by class_id."""
    query = {}
    if class_id:
        query["class_id"] = class_id
    students = await db.students.find(query).to_list(length=5000)
    return [_student_response(s) for s in students]


@router.post("/")
async def create_student(
    student: schemas.StudentCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new student."""
    existing = await db.students.find_one({"roll_number": student.roll_number})
    if existing:
        raise HTTPException(status_code=400, detail="Roll number already exists")

    doc = student_doc(
        name=student.name,
        roll_number=student.roll_number,
        class_id=student.class_id,
        email=student.email or ""
    )
    await db.students.insert_one(doc)
    return _student_response(doc)


@router.put("/{id}")
async def update_student(
    id: str,
    student_update: schemas.StudentUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update a student's details."""
    existing = await db.students.find_one({"_id": id})
    if not existing:
        raise HTTPException(status_code=404, detail="Student not found")

    update_data = student_update.dict(exclude_unset=True)

    if "roll_number" in update_data:
        dup = await db.students.find_one({
            "roll_number": update_data["roll_number"],
            "_id": {"$ne": id}
        })
        if dup:
            raise HTTPException(status_code=400, detail="Roll number already exists")

    if update_data:
        await db.students.update_one({"_id": id}, {"$set": update_data})

    updated = await db.students.find_one({"_id": id})
    return _student_response(updated)


@router.delete("/{id}")
async def delete_student(
    id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete a student and all associated data."""
    existing = await db.students.find_one({"_id": id})
    if not existing:
        raise HTTPException(status_code=404, detail="Student not found")

    await db.face_embeddings.delete_many({"student_id": id})
    await db.attendance.delete_many({"student_id": id})
    await db.notifications.delete_many({"student_id": id})
    await db.students.delete_one({"_id": id})

    return {"message": f"Student {existing['name']} deleted successfully"}


@router.post("/{id}/faces")
async def upload_face(
    id: str,
    file: UploadFile = File(...),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Upload a face image for student registration."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Must be an image file")

    image_bytes = await file.read()
    success, message = await register_student_face(db, id, image_bytes)
    if not success:
        raise HTTPException(status_code=400, detail=message)

    face_count = await db.face_embeddings.count_documents({"student_id": id})
    return {"message": message, "face_count": face_count}
