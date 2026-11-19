import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.database.session import engine, Base, SessionLocal
from app.seed_data import seed_database
from app.services.websocket_manager import ws_manager

# API Routers
from app.api.auth import router as auth_router
from app.api.complaints import router as complaints_router
from app.api.ai import router as ai_router
from app.api.departments import router as departments_router
from app.api.department_routes import router as department_routes_router
from app.api.admin_routes import router as admin_router
from app.api.buildings import router as buildings_router
from app.api.notifications import router as notifications_router
from app.api.feedback_routes import router as feedback_router
from app.api.reports import router as reports_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure static upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    # Create DB tables
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed initial demo dataset
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
        
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="CampusFix AI - AI-Powered Campus Facility & Complaint Management Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploaded images & media
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# WebSocket for live updates
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, user_id: int = Query(None)):
    await ws_manager.connect(websocket, user_id)
    try:
        while True:
            # Keep socket alive and receive any incoming ping/events
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, user_id)
    except Exception:
        ws_manager.disconnect(websocket, user_id)

# Health Check
@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "ai_engine": "Gemini 1.5 Flash (with NLP Fallback)" if settings.GEMINI_API_KEY else "Built-in NLP Classifier Active"
    }

# Register API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(complaints_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)
app.include_router(departments_router, prefix=settings.API_V1_STR)
app.include_router(department_routes_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(buildings_router, prefix=settings.API_V1_STR)
app.include_router(notifications_router, prefix=settings.API_V1_STR)
app.include_router(feedback_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
