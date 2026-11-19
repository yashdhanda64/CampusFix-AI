import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import engine, Base, SessionLocal
from app.seed_data import seed_database
from app.ai.gemini_service import analyze_with_fallback
from app.services.duplicate_service import compute_text_similarity

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_demo_login_and_auth_me(client):
    # Test logging in as student
    resp = client.post("/api/auth/demo-login/STUDENT")
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["role"] == "STUDENT"

    token = data["access_token"]
    # Test GET /api/auth/me
    headers = {"Authorization": f"Bearer {token}"}
    me_resp = client.get("/api/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == data["user"]["email"]

def test_role_authorization_admin_protection(client):
    # Student cannot access /api/admin/dashboard
    resp = client.post("/api/auth/demo-login/STUDENT")
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    forbidden_resp = client.get("/api/admin/dashboard", headers=headers)
    assert forbidden_resp.status_code == 403

    # Admin CAN access /api/admin/dashboard
    admin_login = client.post("/api/auth/demo-login/ADMIN")
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    allowed_resp = client.get("/api/admin/dashboard", headers=admin_headers)
    assert allowed_resp.status_code == 200
    assert "total_complaints" in allowed_resp.json()

def test_ai_fallback_classifier():
    # Test electrical detection with safety hazard
    res = analyze_with_fallback(
        title="Sparks coming from corridor switchboard",
        description="Electric sparks and smoke seen from the socket near classroom 101."
    )
    assert res["predicted_category"] == "Electrical"
    assert res["predicted_priority"] == "Critical"
    assert "safety hazard" in res["safety_concerns"].lower()

    # Test plumbing detection
    res_plumb = analyze_with_fallback(
        title="Restroom tap water leakage",
        description="The pipe in the 2nd floor toilet is leaking water continuously."
    )
    assert res_plumb["predicted_category"] == "Plumbing"
    assert res_plumb["predicted_priority"] in ["Medium", "High"]

def test_duplicate_text_similarity():
    title1 = "Water cooler leaking in hostel lobby"
    desc1 = "Cold water drinking cooler overflowing onto the floor"
    title2 = "Water cooler overflow and leaking floor"
    desc2 = "Hostel drinking water dispenser is broken and leaking water"

    similarity = compute_text_similarity(title1, desc1, title2, desc2)
    assert similarity > 0.45

def test_get_buildings_and_departments(client):
    resp_bld = client.get("/api/buildings")
    assert resp_bld.status_code == 200
    assert len(resp_bld.json()) >= 6

    resp_dept = client.get("/api/departments")
    assert resp_dept.status_code == 200
    assert len(resp_dept.json()) >= 7

def test_create_and_fetch_complaint(client):
    student_login = client.post("/api/auth/demo-login/STUDENT")
    token = student_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    buildings = client.get("/api/buildings").json()
    bld_id = buildings[0]["id"]

    new_complaint_payload = {
        "title": "Broken classroom bench LH-202",
        "description": "Wooden desk leg is split and wobbling dangerously.",
        "location": "Room 202, Row 3",
        "building_id": bld_id,
        "category": "Furniture",
        "priority": "Medium"
    }

    create_resp = client.post("/api/complaints", json=new_complaint_payload, headers=headers)
    assert create_resp.status_code == 201
    comp_data = create_resp.json()
    assert comp_data["title"] == new_complaint_payload["title"]
    assert comp_data["category"] == "Furniture"
    assert "ai_analysis" in comp_data
    assert comp_data["ai_analysis"] is not None
