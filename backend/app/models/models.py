from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database.session import Base

def utc_now():
    return datetime.now(timezone.utc)

class UserRole(str, enum.Enum):
    STUDENT = "STUDENT"
    STAFF = "STAFF"
    ADMIN = "ADMIN"

class ComplaintStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    REOPENED = "REOPENED"
    REJECTED = "REJECTED"

class ComplaintPriority(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class ComplaintCategory(str, enum.Enum):
    ELECTRICAL = "Electrical"
    PLUMBING = "Plumbing"
    HOUSEKEEPING = "Housekeeping"
    IT = "Internet and IT"
    CIVIL = "Civil Maintenance"
    FURNITURE = "Furniture"
    SECURITY = "Security"
    OTHER = "Other"

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    department_name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    contact_email = Column(String(120), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    users = relationship("User", back_populates="department")
    complaints = relationship("Complaint", back_populates="department")

class Building(Base):
    __tablename__ = "buildings"

    id = Column(Integer, primary_key=True, index=True)
    building_name = Column(String(120), unique=True, nullable=False)
    block_code = Column(String(50), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    complaints = relationship("Complaint", back_populates="building")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default=UserRole.STUDENT.value, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    phone_number = Column(String(30), nullable=True)
    avatar_url = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    department = relationship("Department", back_populates="users")
    complaints_filed = relationship("Complaint", foreign_keys="Complaint.student_id", back_populates="student")
    complaints_assigned = relationship("Complaint", foreign_keys="Complaint.assigned_staff_id", back_populates="assigned_staff")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=False)
    category = Column(String(50), default=ComplaintCategory.OTHER.value, index=True)
    priority = Column(String(20), default=ComplaintPriority.MEDIUM.value, index=True)
    status = Column(String(30), default=ComplaintStatus.PENDING.value, index=True)
    
    location = Column(String(200), nullable=False)  # specific room/floor/area description
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    building_id = Column(Integer, ForeignKey("buildings.id", ondelete="CASCADE"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assigned_staff_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    image_url = Column(String(500), nullable=True)
    audio_url = Column(String(500), nullable=True)
    ai_summary = Column(Text, nullable=True)
    
    # Resolution details
    resolution_notes = Column(Text, nullable=True)
    resolution_image_url = Column(String(500), nullable=True)
    
    # SLA tracking: deadline estimation based on priority
    sla_deadline = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    building = relationship("Building", back_populates="complaints")
    department = relationship("Department", back_populates="complaints")
    student = relationship("User", foreign_keys=[student_id], back_populates="complaints_filed")
    assigned_staff = relationship("User", foreign_keys=[assigned_staff_id], back_populates="complaints_assigned")
    
    updates = relationship("ComplaintUpdate", back_populates="complaint", cascade="all, delete-orphan", order_by="desc(ComplaintUpdate.created_at)")
    ai_analysis = relationship("AIAnalysis", back_populates="complaint", uselist=False, cascade="all, delete-orphan")
    feedback = relationship("Feedback", back_populates="complaint", uselist=False, cascade="all, delete-orphan")
    duplicate_matches = relationship("DuplicateMatch", foreign_keys="DuplicateMatch.complaint_id", back_populates="complaint", cascade="all, delete-orphan")

class ComplaintUpdate(Base):
    __tablename__ = "complaint_updates"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False)
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    old_status = Column(String(30), nullable=True)
    new_status = Column(String(30), nullable=False)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    complaint = relationship("Complaint", back_populates="updates")
    actor = relationship("User")

class AIAnalysis(Base):
    __tablename__ = "ai_analysis"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, unique=True)
    predicted_category = Column(String(50), nullable=False)
    predicted_priority = Column(String(20), nullable=False)
    suggested_department = Column(String(100), nullable=True)
    confidence = Column(Float, default=0.92)
    summary = Column(Text, nullable=True)
    safety_concerns = Column(Text, nullable=True)
    recommended_actions = Column(Text, nullable=True)
    model_version = Column(String(50), default="gemini-1.5-flash")
    created_at = Column(DateTime(timezone=True), default=utc_now)

    complaint = relationship("Complaint", back_populates="ai_analysis")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    link = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    user = relationship("User", back_populates="notifications")

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, unique=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False) # 1 to 5
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    complaint = relationship("Complaint", back_populates="feedback")
    student = relationship("User")

class DuplicateMatch(Base):
    __tablename__ = "duplicate_matches"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    matched_complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    similarity_score = Column(Float, nullable=False)
    reason = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    complaint = relationship("Complaint", foreign_keys=[complaint_id], back_populates="duplicate_matches")
    matched_complaint = relationship("Complaint", foreign_keys=[matched_complaint_id])
