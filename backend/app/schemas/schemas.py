from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# ----------------- Auth Schemas -----------------
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: Optional[str] = "STUDENT"
    department_id: Optional[int] = None
    phone_number: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ----------------- Department & Building Schemas -----------------
class DepartmentBase(BaseModel):
    department_name: str
    description: Optional[str] = None
    contact_email: Optional[EmailStr] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    id: int
    created_at: datetime
    active_complaints_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

class BuildingBase(BaseModel):
    building_name: str
    block_code: str
    latitude: float
    longitude: float
    description: Optional[str] = None

class BuildingCreate(BuildingBase):
    pass

class BuildingResponse(BuildingBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ----------------- AI Schemas -----------------
class AIAnalysisResponse(BaseModel):
    id: Optional[int] = None
    complaint_id: Optional[int] = None
    predicted_category: str
    predicted_priority: str
    suggested_department: Optional[str] = None
    confidence: float
    summary: Optional[str] = None
    safety_concerns: Optional[str] = None
    recommended_actions: Optional[str] = None
    model_version: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class AIAnalyzeRequest(BaseModel):
    title: str
    description: str
    location: Optional[str] = None
    building_id: Optional[int] = None
    image_base64: Optional[str] = None

class DuplicateCheckRequest(BaseModel):
    title: str
    description: str
    building_id: int
    category: Optional[str] = None

class DuplicateMatchItem(BaseModel):
    complaint_id: int
    title: str
    status: str
    priority: str
    similarity_score: float
    reason: str
    created_at: datetime

class DuplicateCheckResponse(BaseModel):
    is_duplicate_suspected: bool
    confidence_score: float
    matches: List[DuplicateMatchItem]

# ----------------- Complaint Schemas -----------------
class ComplaintCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=5)
    location: str = Field(..., min_length=2, max_length=200)
    building_id: int
    category: Optional[str] = None
    priority: Optional[str] = None
    image_url: Optional[str] = None
    audio_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ComplaintUpdateStatus(BaseModel):
    status: str
    note: Optional[str] = None
    resolution_notes: Optional[str] = None
    resolution_image_url: Optional[str] = None

class ComplaintAssignRequest(BaseModel):
    department_id: Optional[int] = None
    assigned_staff_id: Optional[int] = None
    priority: Optional[str] = None

class ComplaintUpdateTimeline(BaseModel):
    id: int
    actor_id: Optional[int] = None
    actor_name: Optional[str] = "System"
    actor_role: Optional[str] = None
    old_status: Optional[str] = None
    new_status: str
    note: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class FeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class FeedbackResponse(BaseModel):
    id: int
    complaint_id: int
    student_id: int
    student_name: Optional[str] = None
    rating: int
    comment: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ComplaintResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    priority: str
    status: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    building_id: int
    building_name: Optional[str] = None
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    student_id: int
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    assigned_staff_id: Optional[int] = None
    assigned_staff_name: Optional[str] = None
    image_url: Optional[str] = None
    audio_url: Optional[str] = None
    ai_summary: Optional[str] = None
    resolution_notes: Optional[str] = None
    resolution_image_url: Optional[str] = None
    sla_deadline: Optional[datetime] = None
    is_sla_violated: Optional[bool] = False
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    
    ai_analysis: Optional[AIAnalysisResponse] = None
    feedback: Optional[FeedbackResponse] = None
    updates_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

class ComplaintDetailResponse(ComplaintResponse):
    updates: List[ComplaintUpdateTimeline] = []
    duplicate_matches: List[DuplicateMatchItem] = []

# ----------------- Notification Schemas -----------------
class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    is_read: bool
    link: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ----------------- Dashboard & Analytics Schemas -----------------
class DashboardStats(BaseModel):
    total_complaints: int
    pending_complaints: int
    in_progress_complaints: int
    resolved_complaints: int
    critical_complaints: int
    high_complaints: int
    avg_resolution_hours: float
    sla_compliance_rate: float
    satisfaction_rate: float

class CategoryCount(BaseModel):
    category: str
    count: int

class PriorityCount(BaseModel):
    priority: str
    count: int

class StatusCount(BaseModel):
    status: str
    count: int

class MonthlyTrend(BaseModel):
    month: str
    complaints: int
    resolved: int

class DepartmentPerformance(BaseModel):
    department_id: int
    department_name: str
    total_assigned: int
    resolved: int
    pending: int
    avg_hours: float
    sla_violations: int

class AdminAnalyticsResponse(BaseModel):
    stats: DashboardStats
    categories: List[CategoryCount]
    priorities: List[PriorityCount]
    statuses: List[StatusCount]
    monthly_trends: List[MonthlyTrend]
    department_performance: List[DepartmentPerformance]
    sla_violations_count: int
