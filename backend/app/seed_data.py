from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.models.models import (
    User,
    UserRole,
    Department,
    Building,
    Complaint,
    ComplaintStatus,
    ComplaintPriority,
    ComplaintCategory,
    ComplaintUpdate,
    AIAnalysis,
    DuplicateMatch,
    Notification,
    Feedback
)
from app.core.security import get_password_hash

def seed_database(db: Session):
    # Only seed if no users exist
    if db.query(User).count() > 0:
        return

    print(">>> Seeding CampusFix AI demo database...")
    now = datetime.now(timezone.utc)

    # 1. Departments
    dept_data = [
        {"name": "Electrical Maintenance", "desc": "Power distribution, lighting, wiring, lifts, generators and appliances.", "email": "electrical@campusfix.edu"},
        {"name": "Plumbing & Water Works", "desc": "Water supply, drainage, washrooms, RO filters, and water leakage.", "email": "plumbing@campusfix.edu"},
        {"name": "Housekeeping & Sanitation", "desc": "Cleaning, waste management, pest control, and hygiene.", "email": "housekeeping@campusfix.edu"},
        {"name": "IT & Campus Network Services", "desc": "Wi-Fi access points, ethernet LAN, smart boards, and computer lab hardware.", "email": "ithelpdesk@campusfix.edu"},
        {"name": "Civil Infrastructure & Works", "desc": "Building structure, walls, roofing, paintwork, and masonry.", "email": "civil@campusfix.edu"},
        {"name": "Estate & Furniture Maintenance", "desc": "Desks, chairs, podiums, doors, window panes, and locks.", "email": "estate@campusfix.edu"},
        {"name": "Campus Security & Vigilance", "desc": "Campus gates, CCTV surveillance, safety escorts, and incident response.", "email": "security@campusfix.edu"},
    ]

    dept_map = {}
    for d in dept_data:
        dept = Department(
            department_name=d["name"],
            description=d["desc"],
            contact_email=d["email"]
        )
        db.add(dept)
        db.flush()
        dept_map[d["name"]] = dept

    # 2. Campus Buildings
    buildings_data = [
        {"name": "Academic Block A (Science & Tech)", "code": "AB-A", "lat": 28.5450, "lng": 77.1926, "desc": "Lecture halls LH-101 to LH-310 and Advanced Research Labs"},
        {"name": "Academic Block B (Engineering Labs)", "code": "AB-B", "lat": 28.5465, "lng": 77.1915, "desc": "Computer Centers, Electronics Workshop, Robotics Lab"},
        {"name": "Central Library Complex", "code": "LIB-01", "lat": 28.5458, "lng": 77.1938, "desc": "3-floor library, digital repository, silent study carrels"},
        {"name": "Nalanda Boys Hostel (Block 3)", "code": "NBH-3", "lat": 28.5475, "lng": 77.1950, "desc": "Undergraduate residence, dining hall, indoor recreation"},
        {"name": "Gargi Girls Hostel (Block 1)", "code": "GGH-1", "lat": 28.5440, "lng": 77.1960, "desc": "Undergraduate residence, common room, cafeteria annex"},
        {"name": "Student Activity Center & Cafeteria", "code": "SAC-01", "lat": 28.5435, "lng": 77.1920, "desc": "Food court, auditorium, sports arena, gym"},
    ]

    bld_map = {}
    for b in buildings_data:
        building = Building(
            building_name=b["name"],
            block_code=b["code"],
            latitude=b["lat"],
            longitude=b["lng"],
            description=b["desc"]
        )
        db.add(building)
        db.flush()
        bld_map[b["name"]] = building

    # 3. Users
    pwd_admin = get_password_hash("Admin@123")
    pwd_staff = get_password_hash("Staff@123")
    pwd_student = get_password_hash("Student@123")

    admin_user = User(
        name="Chief Campus Administrator",
        email="admin@campusfix.edu",
        password_hash=pwd_admin,
        role=UserRole.ADMIN.value,
        phone_number="+91 98765 43210"
    )
    db.add(admin_user)

    staff_elec = User(
        name="Ramesh Verma (Electrical Lead)",
        email="electrical.staff@campusfix.edu",
        password_hash=pwd_staff,
        role=UserRole.STAFF.value,
        department_id=dept_map["Electrical Maintenance"].id,
        phone_number="+91 98111 22334"
    )
    db.add(staff_elec)

    staff_it = User(
        name="Sunil Joshi (Senior Network Eng)",
        email="it.staff@campusfix.edu",
        password_hash=pwd_staff,
        role=UserRole.STAFF.value,
        department_id=dept_map["IT & Campus Network Services"].id,
        phone_number="+91 98222 33445"
    )
    db.add(staff_it)

    staff_plumb = User(
        name="Manoj Kumar (Plumbing Supervisor)",
        email="plumbing.staff@campusfix.edu",
        password_hash=pwd_staff,
        role=UserRole.STAFF.value,
        department_id=dept_map["Plumbing & Water Works"].id,
        phone_number="+91 98333 44556"
    )
    db.add(staff_plumb)

    student1 = User(
        name="Arjun Sharma",
        email="arjun.sharma@student.campusfix.edu",
        password_hash=pwd_student,
        role=UserRole.STUDENT.value,
        phone_number="+91 99000 11223"
    )
    db.add(student1)

    student2 = User(
        name="Priya Verma",
        email="priya.verma@student.campusfix.edu",
        password_hash=pwd_student,
        role=UserRole.STUDENT.value,
        phone_number="+91 99111 22334"
    )
    db.add(student2)

    student3 = User(
        name="Rohit Kumar",
        email="rohit.kumar@student.campusfix.edu",
        password_hash=pwd_student,
        role=UserRole.STUDENT.value,
        phone_number="+91 99222 33445"
    )
    db.add(student3)
    db.flush()

    # 4. Realistic Complaints with AI Predictions
    complaint_1 = Complaint(
        title="Sparks and burning smell from 2nd Floor Distribution Box",
        description="Severe electrical sparks observed coming from the main fuse box near Lab 204. Strong burning odor detected. Poses immediate electric shock hazard to students walking in the corridor.",
        category=ComplaintCategory.ELECTRICAL.value,
        priority=ComplaintPriority.CRITICAL.value,
        status=ComplaintStatus.IN_PROGRESS.value,
        location="Floor 2 Corridor, outside Lab 204",
        latitude=28.5465,
        longitude=28.5465, # Building AB-B
        building_id=bld_map["Academic Block B (Engineering Labs)"].id,
        department_id=dept_map["Electrical Maintenance"].id,
        student_id=student1.id,
        assigned_staff_id=staff_elec.id,
        ai_summary="CRITICAL: Severe electrical spark risk detected near high-traffic lab corridor. Immediate technician deployment recommended.",
        sla_deadline=now + timedelta(hours=2),
        created_at=now - timedelta(hours=3),
        updated_at=now - timedelta(hours=1)
    )
    db.add(complaint_1)
    db.flush()

    db.add(AIAnalysis(
        complaint_id=complaint_1.id,
        predicted_category="Electrical",
        predicted_priority="Critical",
        suggested_department="Electrical Maintenance",
        confidence=0.97,
        summary="Sparks and acute burning odor from power distribution panel.",
        safety_concerns="HIGH ELECTRICAL HAZARD: Active sparking with risk of fire breakout or student electrocution.",
        recommended_actions="1. Disconnect main breaker for 2nd floor wing. 2. Cordon off corridor. 3. Dispatch technician with thermal camera.",
        model_version="gemini-1.5-flash"
    ))
    db.add(ComplaintUpdate(
        complaint_id=complaint_1.id,
        actor_id=student1.id,
        old_status=None,
        new_status=ComplaintStatus.PENDING.value,
        note="Emergency complaint submitted with AI high-priority flag.",
        created_at=now - timedelta(hours=3)
    ))
    db.add(ComplaintUpdate(
        complaint_id=complaint_1.id,
        actor_id=admin_user.id,
        old_status=ComplaintStatus.PENDING.value,
        new_status=ComplaintStatus.IN_PROGRESS.value,
        note="Assigned to Ramesh Verma. Sub-station breaker isolated.",
        created_at=now - timedelta(hours=1)
    ))

    # Complaint 2: Duplicate of complaint 1 (to showcase duplicate detection engine!)
    complaint_2 = Complaint(
        title="Electric spark in Lab 204 corridor fuse box",
        description="Fuses sparking near Lab 204. Smells like burnt plastic wires.",
        category=ComplaintCategory.ELECTRICAL.value,
        priority=ComplaintPriority.CRITICAL.value,
        status=ComplaintStatus.PENDING.value,
        location="Lab 204 hallway, Block B",
        latitude=28.5466,
        longitude=77.1916,
        building_id=bld_map["Academic Block B (Engineering Labs)"].id,
        department_id=dept_map["Electrical Maintenance"].id,
        student_id=student2.id,
        ai_summary="Potential duplicate report of active electrical distribution hazard.",
        sla_deadline=now + timedelta(hours=3),
        created_at=now - timedelta(hours=2),
        updated_at=now - timedelta(hours=2)
    )
    db.add(complaint_2)
    db.flush()

    db.add(AIAnalysis(
        complaint_id=complaint_2.id,
        predicted_category="Electrical",
        predicted_priority="Critical",
        suggested_department="Electrical Maintenance",
        confidence=0.95,
        summary="Sparking fuse box in corridor outside Lab 204.",
        safety_concerns="Severe electrical fire hazard.",
        recommended_actions="Consolidate with active ticket #1.",
        model_version="gemini-1.5-flash"
    ))
    # Link as duplicate
    db.add(DuplicateMatch(
        complaint_id=complaint_2.id,
        matched_complaint_id=complaint_1.id,
        similarity_score=0.88,
        reason="Matching campus building, Electrical category, and high text similarity (88%)"
    ))

    # Complaint 3: IT Wi-Fi Failure
    complaint_3 = Complaint(
        title="Campus Wi-Fi connectivity dropped across Central Library",
        description="EDUROAM and Campus-Secure Wi-Fi SSIDs are dropping every 2 minutes on the 2nd floor digital reading room. Over 80 students unable to access research journals for project submissions.",
        category=ComplaintCategory.IT.value,
        priority=ComplaintPriority.HIGH.value,
        status=ComplaintStatus.IN_PROGRESS.value,
        location="2nd Floor Digital Commons",
        latitude=28.5458,
        longitude=77.1938,
        building_id=bld_map["Central Library Complex"].id,
        department_id=dept_map["IT & Campus Network Services"].id,
        student_id=student2.id,
        assigned_staff_id=staff_it.id,
        ai_summary="High priority network degradation affecting multiple reading room users. Cisco AP failure suspected.",
        sla_deadline=now + timedelta(hours=18),
        created_at=now - timedelta(hours=6),
        updated_at=now - timedelta(hours=4)
    )
    db.add(complaint_3)
    db.flush()

    db.add(AIAnalysis(
        complaint_id=complaint_3.id,
        predicted_category="Internet and IT",
        predicted_priority="High",
        suggested_department="IT & Campus Network Services",
        confidence=0.94,
        summary="Library Wi-Fi access point failure affecting 80+ researchers.",
        safety_concerns="No physical safety risk. Academic timeline disruption.",
        recommended_actions="1. Check PoE switch port status. 2. Reboot AP-LIB-02. 3. Monitor channel congestion.",
        model_version="gemini-1.5-flash"
    ))
    db.add(ComplaintUpdate(
        complaint_id=complaint_3.id,
        actor_id=staff_it.id,
        old_status=ComplaintStatus.PENDING.value,
        new_status=ComplaintStatus.IN_PROGRESS.value,
        note="Inspecting core switch rack in Library basement.",
        created_at=now - timedelta(hours=4)
    ))

    # Complaint 4: Resolved Plumbing with Feedback
    complaint_4 = Complaint(
        title="Water cooler leaking heavily causing slippery floor",
        description="Cold water cooler in Nalanda Boys Hostel 1st floor lobby is overflowing. Water puddles accumulating near the staircase.",
        category=ComplaintCategory.PLUMBING.value,
        priority=ComplaintPriority.MEDIUM.value,
        status=ComplaintStatus.RESOLVED.value,
        location="1st Floor Common Lobby near stairs",
        latitude=28.5475,
        longitude=77.1950,
        building_id=bld_map["Nalanda Boys Hostel (Block 3)"].id,
        department_id=dept_map["Plumbing & Water Works"].id,
        student_id=student3.id,
        assigned_staff_id=staff_plumb.id,
        ai_summary="Plumbing drainage overflow presenting slip & fall hazard in hostel foyer.",
        resolution_notes="Replaced the cracked overflow pipe and cleaned drain trap. Floor mopped and dried.",
        sla_deadline=now - timedelta(hours=4),
        created_at=now - timedelta(days=1, hours=2),
        updated_at=now - timedelta(hours=5),
        resolved_at=now - timedelta(hours=5)
    )
    db.add(complaint_4)
    db.flush()

    db.add(AIAnalysis(
        complaint_id=complaint_4.id,
        predicted_category="Plumbing",
        predicted_priority="Medium",
        suggested_department="Plumbing & Water Works",
        confidence=0.92,
        summary="Water overflow from hostel RO drinking cooler.",
        safety_concerns="Slippery surface risk in primary transit corridor.",
        recommended_actions="Shut inlet valve, service float assembly, clear drain.",
        model_version="gemini-1.5-flash"
    ))
    db.add(Feedback(
        complaint_id=complaint_4.id,
        student_id=student3.id,
        rating=5,
        comment="Resolved within 3 hours! The plumber fixed the valve and the area was cleaned nicely. Great job!",
        created_at=now - timedelta(hours=4)
    ))

    # Complaint 5: Broken Chairs in Seminar Hall (Furniture)
    complaint_5 = Complaint(
        title="Broken ergonomic chairs with exposed metal screws",
        description="Rows 4 and 5 in LH-101 have 6 broken revolving chairs. Two chairs have exposed screws that tore student backpacks.",
        category=ComplaintCategory.FURNITURE.value,
        priority=ComplaintPriority.LOW.value,
        status=ComplaintStatus.PENDING.value,
        location="LH-101, Rows 4 and 5",
        latitude=28.5450,
        longitude=77.1926,
        building_id=bld_map["Academic Block A (Science & Tech)"].id,
        department_id=dept_map["Estate & Furniture Maintenance"].id,
        student_id=student1.id,
        ai_summary="Furniture structural defect in main lecture hall requiring replacement parts.",
        sla_deadline=now + timedelta(hours=50),
        created_at=now - timedelta(hours=12),
        updated_at=now - timedelta(hours=12)
    )
    db.add(complaint_5)
    db.flush()

    db.add(AIAnalysis(
        complaint_id=complaint_5.id,
        predicted_category="Furniture",
        predicted_priority="Low",
        suggested_department="Estate & Furniture Maintenance",
        confidence=0.91,
        summary="Damaged auditorium seating with minor injury hazard.",
        safety_concerns="Sharp edges or screws may cause minor scratches.",
        recommended_actions="Remove broken chairs, replace with reserve stock from warehouse.",
        model_version="gemini-1.5-flash"
    ))

    # Notifications
    db.add(Notification(
        user_id=student1.id,
        title="Complaint Update: In Progress",
        message="Chief Administrator assigned your electrical report to technician Ramesh Verma.",
        link=f"/complaints/{complaint_1.id}",
        is_read=True,
        created_at=now - timedelta(hours=1)
    ))

    db.add(Notification(
        user_id=admin_user.id,
        title="CRITICAL COMPLAINT ALERT",
        message="Active electrical spark reported at Academic Block B outside Lab 204.",
        link=f"/complaints/{complaint_1.id}",
        is_read=False,
        created_at=now - timedelta(hours=3)
    ))

    db.commit()
    print(">>> Seed completed successfully with demo users, buildings, complaints & AI analyses.")
