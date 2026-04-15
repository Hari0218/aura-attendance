# MongoDB does not use ORM models like SQLAlchemy.
# This file provides helper functions for creating document dicts
# with consistent structure and auto-generated IDs.

import uuid
import datetime


def generate_id():
    return str(uuid.uuid4())


def teacher_doc(name: str, email: str, password_hash: str) -> dict:
    return {
        "_id": generate_id(),
        "name": name,
        "email": email,
        "password_hash": password_hash,
        "created_at": datetime.datetime.utcnow()
    }


def student_doc(name: str, roll_number: str, class_id: str, email: str = "") -> dict:
    return {
        "_id": generate_id(),
        "name": name,
        "roll_number": roll_number,
        "class_id": class_id,
        "email": email,
        "created_at": datetime.datetime.utcnow()
    }


def face_embedding_doc(student_id: str, embedding_vector: list, image_path: str) -> dict:
    return {
        "_id": generate_id(),
        "student_id": student_id,
        "embedding_vector": embedding_vector,
        "image_path": image_path,
        "created_at": datetime.datetime.utcnow()
    }


def attendance_doc(student_id: str, status: str, confidence: float, period: str = None) -> dict:
    doc = {
        "_id": generate_id(),
        "student_id": student_id,
        "date": datetime.datetime.utcnow(),
        "status": status,
        "confidence": confidence,
    }
    if period:
        doc["period"] = period
    return doc


def notification_doc(student_id: str, message: str, status: str = "PENDING") -> dict:
    return {
        "_id": generate_id(),
        "student_id": student_id,
        "message": message,
        "status": status,
        "created_at": datetime.datetime.utcnow()
    }
