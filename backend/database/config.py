import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load .env file from the backend directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))


class Settings(BaseSettings):
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # MongoDB Settings
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "aura_attendance")

    # SMTP Settings
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "")


settings = Settings()

# MongoDB client (async via motor)
client = AsyncIOMotorClient(settings.MONGODB_URL)
db = client[settings.MONGODB_DB_NAME]


async def get_db():
    """Dependency that returns the MongoDB database instance."""
    return db


async def create_indexes():
    """Create MongoDB indexes for performance."""
    await db.teachers.create_index("email", unique=True)
    await db.students.create_index("roll_number", unique=True)
    await db.students.create_index("class_id")
    await db.face_embeddings.create_index("student_id")
    await db.attendance.create_index([("student_id", 1), ("date", -1)])
    await db.attendance.create_index("date")
    await db.notifications.create_index("student_id")
    await db.notifications.create_index("created_at")
