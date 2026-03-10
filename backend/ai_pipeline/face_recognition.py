import cv2
import numpy as np
import os
import logging
import datetime
import pickle
from sklearn.svm import SVC

# Robust logging for the main project
LOG_FILE = os.path.join(os.path.dirname(__file__), '..', '..', 'ai_debug.log')
logger = logging.getLogger("face_ai")
logger.setLevel(logging.INFO)
if not logger.handlers:
    fh = logging.FileHandler(LOG_FILE, encoding='utf-8')
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    fh.setFormatter(formatter)
    logger.addHandler(fh)
    # Also add console
    ch = logging.StreamHandler()
    ch.setFormatter(formatter)
    logger.addHandler(ch)

# Try to import deepface for ArcFace embeddings
DEEPFACE_AVAILABLE = False
try:
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
    logger.info("DeepFace loaded successfully — ArcFace embeddings available.")
except ImportError:
    logger.warning("deepface not installed.")

# Try to import MTCNN as face detector
MTCNN_AVAILABLE = False
try:
    from mtcnn import MTCNN
    MTCNN_AVAILABLE = True
except ImportError:
    logger.warning("MTCNN not installed.")

from sklearn.svm import SVC
import pickle


class FaceRecognitionSystem:
    def __init__(self):
        self.detector = None
        self.classifier = SVC(kernel='linear', probability=True)
        self.model_path = os.path.join(os.path.dirname(__file__), '..', '..', 'ai_models', 'svm_model.pkl')
        self._initialized = False

        # Ensure ai_models directory exists
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)

        # Load saved SVM classifier if exists
        if os.path.exists(self.model_path):
            self.load_classifier()

    def _lazy_init(self):
        """Lazily initialize heavy AI models on first use."""
        if self._initialized:
            return

        if MTCNN_AVAILABLE:
            try:
                self.detector = MTCNN()
                logger.info("MTCNN detector initialized.")
            except Exception as e:
                logger.error(f"Failed to initialize MTCNN: {e}")

        self._initialized = True

    def detect_faces(self, image):
        """Detect faces in an image with multi-detector fallback."""
        self._lazy_init()
        img_h, img_w = image.shape[:2]
        logger.info(f"--- Detection Start (Image: {img_w}x{img_h}) ---")

        all_faces = []
        
        # 1. Try MTCNN
        if self.detector is not None:
            mtcnn_faces = self._detect_mtcnn(image)
            logger.info(f"MTCNN found {len(mtcnn_faces)} faces.")
            all_faces.extend(mtcnn_faces)
            
        # 2. Try RetinaFace (High accuracy for crowds)
        if DEEPFACE_AVAILABLE:
            logger.info("Running DeepFace/RetinaFace...")
            try:
                rf_faces = self._detect_deepface(image, backend='retinaface')
                logger.info(f"RetinaFace found {len(rf_faces)} faces.")
                all_faces.extend(rf_faces)
            except Exception as e:
                logger.error(f"RetinaFace error: {e}")
            
        # 3. Last resort: OpenCV (only if nothing found yet)
        if len(all_faces) < 1 and DEEPFACE_AVAILABLE:
            logger.info("No faces found yet. Trying DeepFace/OpenCV...")
            cv_faces = self._detect_deepface(image, backend='opencv')
            all_faces.extend(cv_faces)
            
        # Deduplicate overlapping boxes across different detectors
        unique_faces = self._deduplicate_faces(all_faces)
            
        logger.info(f"--- Detection End: Total {len(unique_faces)} unique faces after merge ---")
        return unique_faces

    def _deduplicate_faces(self, faces, iou_threshold=0.3):
        """Remove overlapping face boxes detected by different backends."""
        if not faces:
            return []
            
        # Sort by confidence
        sorted_faces = sorted(faces, key=lambda x: x.get('confidence', 0), reverse=True)
        keep = []
        
        for f in sorted_faces:
            box1 = f['box'] # [x, y, w, h]
            is_duplicate = False
            for k in keep:
                box2 = k['box']
                iou = self._calculate_iou(box1, box2)
                if iou > iou_threshold:
                    is_duplicate = True
                    break
            if not is_duplicate:
                keep.append(f)
                
        return keep

    def _calculate_iou(self, box1, box2):
        """Calculate Intersection over Union (IoU)."""
        x1, y1, w1, h1 = box1
        x2, y2, w2, h2 = box2
        
        # Intersection
        xi1 = max(x1, x2)
        yi1 = max(y1, y2)
        xi2 = min(x1 + w1, x2 + w2)
        yi2 = min(y1 + h1, y2 + h2)
        
        inter_area = max(0, xi2 - xi1) * max(0, yi2 - yi1)
        
        # Union
        box1_area = w1 * h1
        box2_area = w2 * h2
        union_area = box1_area + box2_area - inter_area
        
        return inter_area / union_area if union_area > 0 else 0

    def _detect_mtcnn(self, image):
        """Detect faces using MTCNN."""
        try:
            results = self.detector.detect_faces(image)
        except Exception as e:
            logger.error(f"MTCNN detection failed: {e}")
            return []

        faces = []
        for res in results:
            x, y, w, h = res['box']
            y_start = max(0, y)
            y_end = min(image.shape[0], y + h)
            x_start = max(0, x)
            x_end = min(image.shape[1], x + w)
            face_img = image[y_start:y_end, x_start:x_end]

            if face_img.size == 0:
                continue

            faces.append({
                'box': [x, y, w, h],
                'confidence': res['confidence'],
                'image': face_img
            })
        return faces

    def _detect_deepface(self, image, backend='opencv'):
        """Detect faces using DeepFace with specified backend."""
        try:
            # use a slightly lower confidence for detection fallback
            face_objs = DeepFace.extract_faces(
                img_path=image,
                detector_backend=backend,
                enforce_detection=False,
                align=True
            )
            faces = []
            for face_obj in face_objs:
                conf = face_obj.get('confidence', 0)
                # If enforce_detection=False, it might return the whole image if no face found
                # but DeepFace 0.0.99+ usually has a very low confidence for those.
                if conf < 0.2: 
                    continue
                    
                area = face_obj['facial_area']
                x, y, w, h = area['x'], area['y'], area['w'], area['h']
                
                # Validation: DeepFace sometimes returns the whole image with low confidence
                # If the "face" is the entire image, it might be a false positive
                if w >= image.shape[1] * 0.9 and h >= image.shape[0] * 0.9 and conf < 0.5:
                    continue

                y_start = max(0, y)
                y_end = min(image.shape[0], y + h)
                x_start = max(0, x)
                x_end = min(image.shape[1], x + w)
                face_img = image[y_start:y_end, x_start:x_end]

                if face_img.size == 0:
                    continue

                faces.append({
                    'box': [x, y, w, h],
                    'confidence': conf,
                    'image': face_img
                })
            logger.info(f"DeepFace/{backend} detected {len(faces)} faces.")
            return faces
        except Exception as e:
            logger.error(f"DeepFace detection failed ({backend}): {e}")
            return []

    def extract_embeddings(self, face_image):
        """
        Extract face embeddings using DeepFace with ArcFace model.
        Falls back to dummy embeddings if DeepFace is not available.
        """
        if DEEPFACE_AVAILABLE and face_image is not None and face_image.size > 0:
            try:
                # DeepFace expects a proper image — resize to minimum size
                if face_image.shape[0] < 10 or face_image.shape[1] < 10:
                    face_image = cv2.resize(face_image, (112, 112))

                result = DeepFace.represent(
                    img_path=face_image,
                    model_name='ArcFace',
                    detector_backend='skip',  # Already cropped
                    enforce_detection=False
                )

                if result and len(result) > 0:
                    embedding = result[0]['embedding']
                    logger.info(f"ArcFace embedding extracted successfully (dim={len(embedding)})")
                    return embedding
            except Exception as e:
                logger.error(f"DeepFace embedding extraction failed: {e}")

        # Fallback: NO MORE DUMMY DATA. Returning None so service can handle error correctly.
        logger.error("!!! CRITICAL: AI Signature Extraction Failed !!!")
        return None

    def train_classifier(self, embeddings, labels):
        """Train SVM classifier with student embeddings."""
        if len(embeddings) < 2 or len(set(labels)) < 2:
            logger.warning("Need at least 2 students with embeddings to train SVM.")
            return False

        try:
            self.classifier.fit(embeddings, labels)
            self.save_classifier()
            logger.info(f"SVM classifier trained with {len(set(labels))} students.")
            return True
        except Exception as e:
            logger.error(f"Failed to train SVM classifier: {e}")
            return False

    def predict(self, embedding, student_embeddings=None):
        """
        Predict student identity from embedding.
        Uses SVM if available, otherwise falls back to Cosine Similarity.
        """
        # 1. Try SVM first
        if hasattr(self.classifier, "classes_") and len(self.classifier.classes_) >= 2:
            try:
                probs = self.classifier.predict_proba([embedding])[0]
                max_idx = np.argmax(probs)
                confidence = float(probs[max_idx])
                prediction = self.classifier.predict([embedding])[0]
                
                # If SVM is very confident, use it
                if confidence > 0.6:
                    return prediction, confidence
            except Exception as e:
                logger.error(f"SVM prediction error: {e}")

            # exhaustive logging for debugging
            similarities = []
            for sid, stored_emb in student_embeddings:
                sim = self.cosine_similarity(embedding, stored_emb)
                similarities.append((sid, sim))
            
            # aggregate by student
            student_best_sims = {}
            for sid, stored_emb in student_embeddings:
                sim = self.cosine_similarity(embedding, stored_emb)
                if sid not in student_best_sims or sim > student_best_sims[sid]:
                    student_best_sims[sid] = sim
            
            # Sort students by their best match
            sorted_students = sorted(student_best_sims.items(), key=lambda x: x[1], reverse=True)
            top_3 = sorted_students[:3]
            
            logger.info(f"Top 3 Student Matches: {top_3}")
            
            if sorted_students:
                best_sid, max_sim = sorted_students[0]
                if max_sim > 0.25:  # Lowered for better recall in group photos
                    return best_sid, max_sim
                else:
                    logger.warning(f"Best student match {best_sid} with {max_sim:.4f} is too low.")
        
        return "Unknown", 0.0

    @staticmethod
    def cosine_similarity(v1, v2):
        """Calculate cosine similarity between two vectors."""
        v1 = np.array(v1)
        v2 = np.array(v2)
        if v1.size == 0 or v2.size == 0:
            return 0.0
        return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-7)

    def save_classifier(self):
        """Save SVM model to disk."""
        try:
            with open(self.model_path, 'wb') as f:
                pickle.dump(self.classifier, f)
            logger.info(f"SVM model saved to {self.model_path}")
        except Exception as e:
            logger.error(f"Failed to save SVM model: {e}")

    def load_classifier(self):
        """Load SVM model from disk."""
        try:
            with open(self.model_path, 'rb') as f:
                self.classifier = pickle.load(f)
            logger.info(f"SVM model loaded from {self.model_path}")
        except Exception as e:
            logger.error(f"Failed to load SVM model: {e}")


# Singleton instance
face_system = FaceRecognitionSystem()
