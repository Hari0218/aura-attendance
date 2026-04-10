from motor.motor_asyncio import AsyncIOMotorDatabase
from models.models import face_embedding_doc, attendance_doc
from ai_pipeline.face_recognition import face_system
import cv2
import numpy as np
import os
import datetime
import logging

logger = logging.getLogger(__name__)

# Ensure uploads directory exists
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'uploads', 'students')
os.makedirs(UPLOAD_DIR, exist_ok=True)


def correct_orientation(image_bytes):
    """Correct image orientation based on EXIF data."""
    from PIL import Image, ExifTags
    import io
    try:
        img = Image.open(io.BytesIO(image_bytes))
        try:
            for orientation in ExifTags.TAGS.keys():
                if ExifTags.TAGS[orientation] == 'Orientation':
                    break
            exif = dict(img._getexif().items())
            if exif[orientation] == 3:
                img = img.rotate(180, expand=True)
            elif exif[orientation] == 6:
                img = img.rotate(270, expand=True)
            elif exif[orientation] == 8:
                img = img.rotate(90, expand=True)
        except (AttributeError, KeyError, IndexError, TypeError):
            # No EXIF or no orientation tag
            pass
        
        # Convert back to CV2 format
        img = img.convert('RGB')
        return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
    except Exception as e:
        logger.warning(f"Orientation correction failed: {e}")
        return None


async def register_student_face(db: AsyncIOMotorDatabase, student_id: str, image_bytes: bytes):
    """Process student face image, extract embedding, and store in DB."""
    # Verify student exists
    student = await db.students.find_one({"_id": student_id})
    if not student:
        return False, "Student not found"

    # Convert bytes to cv2 image and correct orientation
    image = correct_orientation(image_bytes)
    if image is None:
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
    if image is None:
        return False, "Invalid image data"

    # Detect faces
    faces = face_system.detect_faces(image)
    if not faces:
        return False, "No face detected in the image"

    if len(faces) > 1:
        logger.warning(f"Multiple faces detected for student {student_id}, using largest face.")

    # Use the largest face
    face = max(faces, key=lambda f: f['box'][2] * f['box'][3])
    embedding = face_system.extract_embeddings(face_image=face['image'])
    
    if embedding is None:
        return False, "AI failed to extract a valid face signature. Please use a clearer photo."

    # Save the face image to disk with unique filename
    import uuid as _uuid
    face_filename = f"{student_id}_{_uuid.uuid4().hex[:8]}.jpg"
    image_path = os.path.join(UPLOAD_DIR, face_filename)
    try:
        cv2.imwrite(image_path, face['image'])
    except Exception as e:
        logger.warning(f"Failed to save face image: {e}")

    # Store embedding in MongoDB
    doc = face_embedding_doc(
        student_id=student_id,
        embedding_vector=embedding,
        image_path=f"uploads/students/{face_filename}"
    )
    await db.face_embeddings.insert_one(doc)

    # Re-train classifier with all embeddings
    await _retrain_classifier(db)

    return True, "Face registered successfully"


async def _retrain_classifier(db: AsyncIOMotorDatabase):
    """Re-train the SVM classifier with all stored embeddings."""
    all_embeddings = await db.face_embeddings.find().to_list(length=10000)

    if len(all_embeddings) < 2:
        logger.info("Not enough embeddings to train classifier (need at least 2).")
        return False

    X = [e["embedding_vector"] for e in all_embeddings]
    y = [e["student_id"] for e in all_embeddings]

    if len(set(y)) < 2:
        logger.info("Need embeddings from at least 2 different students to train.")
        return False

    return face_system.train_classifier(X, y)




async def process_attendance(db: AsyncIOMotorDatabase, classroom_image_bytes: bytes, class_id: str = None):
    """Process classroom photo, identify students, and mark attendance."""
    # First, try to correct orientation using PIL
    image = correct_orientation(classroom_image_bytes)
    
    # Fallback to standard decode if orientation correction fails
    if image is None:
        nparr = np.frombuffer(classroom_image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
    if image is None:
        return {"recognized_students": [], "absent_students": [], "confidence_scores": [], "unknown_faces_count": 0}, "Invalid image data"

    faces = face_system.detect_faces(image)
    if not faces:
        return {"recognized_students": [], "absent_students": [], "confidence_scores": []}, "No faces detected in the image"

    logger.info(f"Detected {len(faces)} faces in classroom photo.")

    # Fetch all stored embeddings for cosine similarity fallback
    all_embs = await db.face_embeddings.find().to_list(length=10000)
    student_embeddings = [(e["student_id"], e["embedding_vector"]) for e in all_embs]

    # student_id -> highest_confidence
    best_matches = {}
    unknown_count = 0
    today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    # Fetch all students for name resolution
    all_students_data = await db.students.find().to_list(length=5000)
    student_map = {s["_id"]: s for s in all_students_data}

    for i, face in enumerate(faces):
        embedding = face_system.extract_embeddings(face_image=face['image'])
        student_id, confidence = face_system.predict(embedding, student_embeddings=student_embeddings)
        
        student_name = student_map.get(student_id, {}).get("name", "Unknown")
        logger.info(f"Face {i+1}: Result={student_name} ({student_id}), Confidence={confidence:.4f}")

        if student_id != "Unknown":
            if class_id and student_map.get(student_id, {}).get("class_id") != class_id:
                unknown_count += 1
                continue
            if student_id not in best_matches or confidence > best_matches[student_id]:
                best_matches[student_id] = confidence
        else:
            unknown_count += 1

    recognized_students = []
    confidence_scores = []
    
    for student_id, confidence in best_matches.items():
        recognized_students.append(student_id)
        confidence_scores.append(round(confidence, 4))

        # Avoid duplicate attendance for today
        existing = await db.attendance.find_one({
            "student_id": student_id,
            "date": {"$gte": today_start}
        })

        if not existing:
            logger.info(f"Marking student {student_id} as PRESENT")
            doc = attendance_doc(student_id=student_id, status="PRESENT", confidence=confidence)
            await db.attendance.insert_one(doc)
        else:
            logger.info(f"Student {student_id} already marked today.")

    # Identify absent students
    student_query = {}
    if class_id:
        student_query["class_id"] = class_id
    all_students = await db.students.find(student_query).to_list(length=5000)

    recognized_ids = set(recognized_students)
    absent_students = [s["_id"] for s in all_students if s["_id"] not in recognized_ids]

    # Mark absent students
    for s_id in absent_students:
        existing = await db.attendance.find_one({
            "student_id": s_id,
            "date": {"$gte": today_start}
        })
        if not existing:
            doc = attendance_doc(student_id=s_id, status="ABSENT", confidence=0.0)
            await db.attendance.insert_one(doc)

    # Get student names for response
    recognized_names = []
    for sid in recognized_students:
        student = await db.students.find_one({"_id": sid})
        recognized_names.append(student["name"] if student else sid)

    absent_names = []
    for sid in absent_students:
        student = await db.students.find_one({"_id": sid})
        absent_names.append(student["name"] if student else sid)

    return {
        "recognized_students": recognized_names,
        "absent_students": absent_names,
        "recognized_student_ids": recognized_students,
        "absent_student_ids": absent_students,
        "confidence_scores": confidence_scores,
        "unknown_faces_count": unknown_count
    }, f"Attendance processed: {len(recognized_students)} present, {len(absent_students)} absent"
