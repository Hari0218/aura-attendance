from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from database.config import get_db
from .auth import get_current_user
from pydantic import BaseModel
from typing import Optional
import uuid
import datetime

router = APIRouter()


class ClassroomCreate(BaseModel):
    name: str  # e.g. "AIDS-A"
    description: Optional[str] = ""


class ClassroomUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


def classroom_doc(name: str, description: str = "") -> dict:
    return {
        "_id": str(uuid.uuid4()),
        "name": name,
        "description": description,
        "created_at": datetime.datetime.utcnow()
    }


@router.get("")
async def get_classrooms(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all classrooms with student count."""
    classrooms = await db.classrooms.find().to_list(length=500)
    result = []
    for c in classrooms:
        student_count = await db.students.count_documents({"class_id": c["_id"]})
        result.append({
            "id": c["_id"],
            "name": c["name"],
            "description": c.get("description", ""),
            "student_count": student_count,
            "created_at": c["created_at"]
        })
    return result


@router.post("")
async def create_classroom(
    classroom: ClassroomCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new classroom."""
    existing = await db.classrooms.find_one({"name": classroom.name})
    if existing:
        raise HTTPException(status_code=400, detail="Classroom name already exists")

    doc = classroom_doc(name=classroom.name, description=classroom.description or "")
    await db.classrooms.insert_one(doc)
    return {
        "id": doc["_id"],
        "name": doc["name"],
        "description": doc["description"],
        "student_count": 0,
        "created_at": doc["created_at"]
    }


@router.get("/{id}")
async def get_classroom(
    id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a classroom with its students."""
    classroom = await db.classrooms.find_one({"_id": id})
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")

    students = await db.students.find({"class_id": id}).to_list(length=5000)
    student_list = [{
        "id": s["_id"],
        "name": s["name"],
        "roll_number": s["roll_number"],
        "created_at": s["created_at"]
    } for s in students]

    return {
        "id": classroom["_id"],
        "name": classroom["name"],
        "description": classroom.get("description", ""),
        "student_count": len(student_list),
        "students": student_list,
        "created_at": classroom["created_at"]
    }


@router.put("/{id}")
async def update_classroom(
    id: str,
    classroom_update: ClassroomUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update a classroom."""
    existing = await db.classrooms.find_one({"_id": id})
    if not existing:
        raise HTTPException(status_code=404, detail="Classroom not found")

    update_data = classroom_update.dict(exclude_unset=True)

    if "name" in update_data:
        dup = await db.classrooms.find_one({"name": update_data["name"], "_id": {"$ne": id}})
        if dup:
            raise HTTPException(status_code=400, detail="Classroom name already exists")

    if update_data:
        await db.classrooms.update_one({"_id": id}, {"$set": update_data})

    updated = await db.classrooms.find_one({"_id": id})
    return {
        "id": updated["_id"],
        "name": updated["name"],
        "description": updated.get("description", ""),
        "created_at": updated["created_at"]
    }


@router.delete("/{id}")
async def delete_classroom(
    id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete a classroom. Students in this classroom will have their class_id cleared."""
    existing = await db.classrooms.find_one({"_id": id})
    if not existing:
        raise HTTPException(status_code=404, detail="Classroom not found")

    # Unassign students from this classroom
    await db.students.update_many({"class_id": id}, {"$set": {"class_id": ""}})
    await db.classrooms.delete_one({"_id": id})

    return {"message": f"Classroom {existing['name']} deleted successfully"}
