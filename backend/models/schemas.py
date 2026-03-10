from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


# --- Teacher Schemas ---
class TeacherResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Student Schemas ---
class StudentBase(BaseModel):
    name: str
    roll_number: str
    class_id: str
    email: Optional[str] = ""


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    roll_number: Optional[str] = None
    class_id: Optional[str] = None
    email: Optional[str] = None


class Student(StudentBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Attendance Schemas ---
class AttendanceBase(BaseModel):
    student_id: str
    status: str
    confidence: float
    date: datetime


class Attendance(AttendanceBase):
    id: str

    class Config:
        from_attributes = True


class AttendanceResponse(BaseModel):
    recognized_students: List[str]
    absent_students: List[str]
    confidence_scores: List[float]
    unknown_faces_count: int
    message: str


class AttendanceDetail(BaseModel):
    student_id: str
    student_name: str
    roll_number: str
    status: str
    confidence: float
    date: datetime

    class Config:
        from_attributes = True


# --- Notification Schemas ---
class NotificationCreate(BaseModel):
    student_id: str
    message: str


class NotificationResponse(BaseModel):
    id: str
    student_id: str
    message: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Insight Schemas ---
class FrequentlyAbsentStudent(BaseModel):
    student_id: str
    student_name: str
    roll_number: str
    absent_count: int
    total_days: int
    absence_rate: float


class AttendanceTrend(BaseModel):
    date: str
    total_students: int
    present_count: int
    absent_count: int
    attendance_rate: float


class RiskAlert(BaseModel):
    student_id: str
    student_name: str
    roll_number: str
    risk_level: str  # HIGH, MEDIUM, LOW
    recent_absence_rate: float
    message: str
