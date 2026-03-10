from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from database.config import get_db, settings
from models import schemas
from models.models import notification_doc
from .auth import get_current_user
from typing import List
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


def _send_email(to_email: str, subject: str, body: str) -> bool:
    """Send an email via SMTP."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP credentials not configured. Email not sent.")
        return False

    try:
        msg = MIMEMultipart()
        msg['From'] = settings.SMTP_FROM_EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html'))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)

        logger.info(f"Email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False


@router.post("/send")
async def send_notification(
    notification: schemas.NotificationCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Send a notification to a specific student and store in DB."""
    student = await db.students.find_one({"_id": notification.student_id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    email_sent = False
    logger.info(f"Notification for {student['name']}: {notification.message}")

    doc = notification_doc(
        student_id=notification.student_id,
        message=notification.message,
        status="SENT" if email_sent else "PENDING"
    )
    await db.notifications.insert_one(doc)

    return {
        "id": doc["_id"],
        "student_id": doc["student_id"],
        "message": doc["message"],
        "status": doc["status"],
        "created_at": doc["created_at"]
    }


@router.post("/send-absent")
async def send_absent_notifications(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Send notifications to all students marked absent today."""
    today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    absent_records = await db.attendance.find({
        "date": {"$gte": today_start},
        "status": "ABSENT"
    }).to_list(length=5000)

    if not absent_records:
        return {"message": "No absent students today", "notifications_sent": 0}

    notifications = []
    for record in absent_records:
        student = await db.students.find_one({"_id": record["student_id"]})
        if student:
            message = (
                f"Dear {student['name']}, you were marked absent on "
                f"{datetime.datetime.utcnow().strftime('%Y-%m-%d')}. "
                f"Please contact your teacher if this is an error."
            )
            doc = notification_doc(student_id=student["_id"], message=message, status="PENDING")
            await db.notifications.insert_one(doc)
            notifications.append({
                "student_name": student["name"],
                "message": message
            })

    return {
        "message": f"Notifications created for {len(notifications)} absent students",
        "notifications_sent": len(notifications),
        "details": notifications
    }


@router.get("/")
async def get_notifications(
    student_id: str = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all notifications, optionally filtered by student."""
    query = {}
    if student_id:
        query["student_id"] = student_id

    records = await db.notifications.find(query).sort("created_at", -1).to_list(length=5000)

    return [
        {
            "id": n["_id"],
            "student_id": n["student_id"],
            "message": n["message"],
            "status": n["status"],
            "created_at": n["created_at"]
        }
        for n in records
    ]
