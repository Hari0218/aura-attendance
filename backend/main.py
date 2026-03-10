from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.v1 import auth, students, attendance, reports, notifications, insights, classrooms
from database.config import create_indexes, db as mongo_db
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="AI Attendance System API",
    description="Backend API for AI-powered face recognition attendance system",
    version="1.0.0"
)

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    logging.error(f"422 Validation Error: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )


@app.on_event("startup")
async def startup_event():
    """Create MongoDB indexes and seed data on startup."""
    await create_indexes()
    # Add classroom index
    await mongo_db.classrooms.create_index("name", unique=True)
    logging.info("MongoDB indexes created successfully.")

    # Seed default classrooms if none exist
    count = await mongo_db.classrooms.count_documents({})
    if count == 0:
        import uuid, datetime
        default_classrooms = ["AIDS-A", "AIDS-B", "AIDS-C"]
        for name in default_classrooms:
            await mongo_db.classrooms.insert_one({
                "_id": str(uuid.uuid4()),
                "name": name,
                "description": f"Classroom {name}",
                "created_at": datetime.datetime.utcnow()
            })
        logging.info(f"Seeded {len(default_classrooms)} default classrooms.")

    # Seed default teacher if none exist
    teacher_count = await mongo_db.teachers.count_documents({})
    if teacher_count == 0:
        from api.v1.auth import get_password_hash
        from models.models import teacher_doc
        hashed_password = get_password_hash("password123")
        doc = teacher_doc(name="Teacher", email="teacher@school.edu", password_hash=hashed_password)
        await mongo_db.teachers.insert_one(doc)
        logging.info("Seeded default teacher: teacher@school.edu (password: password123)")


# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(students.router, prefix="/api/v1/students", tags=["Students"])
app.include_router(attendance.router, prefix="/api/v1/attendance", tags=["Attendance"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["Reports"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["Notifications"])
app.include_router(insights.router, prefix="/api/v1/insights", tags=["AI Insights"])
app.include_router(classrooms.router, prefix="/api/v1/classrooms", tags=["Classrooms"])


@app.get("/")
async def root():
    return {"message": "Welcome to AI Attendance System API"}
