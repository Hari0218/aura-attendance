from fastapi import APIRouter, Depends, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from database.config import get_db
from models import schemas
from .auth import get_current_user
from typing import List, Optional
import datetime

router = APIRouter()


@router.get("/frequently-absent", response_model=List[schemas.FrequentlyAbsentStudent])
async def get_frequently_absent(
    days: int = Query(30, description="Look back period in days"),
    threshold: int = Query(5, description="Minimum absences to be flagged"),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get students who are frequently absent in the given time period."""
    cutoff_date = datetime.datetime.utcnow() - datetime.timedelta(days=days)

    # Aggregate absence counts per student
    pipeline = [
        {"$match": {"date": {"$gte": cutoff_date}, "status": "ABSENT"}},
        {"$group": {"_id": "$student_id", "absent_count": {"$sum": 1}}},
        {"$match": {"absent_count": {"$gte": threshold}}}
    ]
    absence_counts = await db.attendance.aggregate(pipeline).to_list(length=1000)

    result = []
    for item in absence_counts:
        student_id = item["_id"]
        absent_count = item["absent_count"]

        student = await db.students.find_one({"_id": student_id})
        if not student:
            continue

        total_days = await db.attendance.count_documents({
            "student_id": student_id,
            "date": {"$gte": cutoff_date}
        })

        absence_rate = round((absent_count / total_days * 100) if total_days > 0 else 0, 1)

        result.append({
            "student_id": student["_id"],
            "student_name": student["name"],
            "roll_number": student["roll_number"],
            "absent_count": absent_count,
            "total_days": total_days,
            "absence_rate": absence_rate
        })

    result.sort(key=lambda x: x["absence_rate"], reverse=True)
    return result


@router.get("/trends", response_model=List[schemas.AttendanceTrend])
async def get_attendance_trends(
    days: int = Query(30, description="Number of days to look back"),
    class_id: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get daily attendance rate trends over the specified period."""
    cutoff_date = datetime.datetime.utcnow() - datetime.timedelta(days=days)

    # Get student IDs optionally filtered by class
    student_filter = {}
    if class_id:
        student_filter["class_id"] = class_id

    total_students = await db.students.count_documents(student_filter)
    if total_students == 0:
        return []

    # Build attendance query
    att_query = {"date": {"$gte": cutoff_date}}
    if class_id:
        student_ids = [s["_id"] async for s in db.students.find(student_filter, {"_id": 1})]
        att_query["student_id"] = {"$in": student_ids}

    all_records = await db.attendance.find(att_query).to_list(length=50000)

    # Group by date
    daily_data = {}
    for record in all_records:
        if record.get("date"):
            date_str = record["date"].strftime("%Y-%m-%d")
            if date_str not in daily_data:
                daily_data[date_str] = {"present": 0, "absent": 0}
            if record["status"] == "PRESENT":
                daily_data[date_str]["present"] += 1
            else:
                daily_data[date_str]["absent"] += 1

    trends = []
    for date_str in sorted(daily_data.keys()):
        data = daily_data[date_str]
        total = data["present"] + data["absent"]
        rate = round((data["present"] / total * 100) if total > 0 else 0, 1)
        trends.append({
            "date": date_str,
            "total_students": total,
            "present_count": data["present"],
            "absent_count": data["absent"],
            "attendance_rate": rate
        })

    return trends


@router.get("/risk-alerts", response_model=List[schemas.RiskAlert])
async def get_risk_alerts(
    days: int = Query(14, description="Recent period to evaluate (days)"),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get risk alerts for students with declining attendance patterns."""
    cutoff_date = datetime.datetime.utcnow() - datetime.timedelta(days=days)

    all_students = await db.students.find().to_list(length=5000)

    alerts = []
    for student in all_students:
        recent_records = await db.attendance.find({
            "student_id": student["_id"],
            "date": {"$gte": cutoff_date}
        }).to_list(length=1000)

        if not recent_records:
            continue

        total = len(recent_records)
        absent_count = len([r for r in recent_records if r["status"] == "ABSENT"])
        absence_rate = round((absent_count / total * 100) if total > 0 else 0, 1)

        if absence_rate >= 50:
            risk_level = "HIGH"
            message = f"{student['name']} has been absent {absence_rate}% of the time in the last {days} days. Immediate attention needed."
        elif absence_rate >= 30:
            risk_level = "MEDIUM"
            message = f"{student['name']} has an absence rate of {absence_rate}% in the last {days} days. Monitor closely."
        elif absence_rate >= 20:
            risk_level = "LOW"
            message = f"{student['name']} has missed {absent_count} out of {total} days recently."
        else:
            continue

        alerts.append({
            "student_id": student["_id"],
            "student_name": student["name"],
            "roll_number": student["roll_number"],
            "risk_level": risk_level,
            "recent_absence_rate": absence_rate,
            "message": message
        })

    risk_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    alerts.sort(key=lambda x: risk_order.get(x["risk_level"], 3))

    return alerts
