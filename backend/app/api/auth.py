from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.models import User, UserRole, Department
from app.schemas.schemas import UserRegister, UserLogin, Token, UserResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    # Check if email exists
    existing = db.query(User).filter(User.email.ilike(user_in.email)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Security: Do not allow registering as ADMIN directly via public endpoint
    role = user_in.role.upper() if user_in.role else UserRole.STUDENT.value
    if role == UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator accounts must be provisioned by existing management."
        )
    if role not in [UserRole.STUDENT.value, UserRole.STAFF.value]:
        role = UserRole.STUDENT.value

    # Create new user
    new_user = User(
        name=user_in.name.strip(),
        email=user_in.email.strip().lower(),
        password_hash=get_password_hash(user_in.password),
        role=role,
        department_id=user_in.department_id,
        phone_number=user_in.phone_number
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create JWT
    token = create_access_token(subject=new_user.id, role=new_user.role)
    
    dept_name = new_user.department.department_name if new_user.department else None
    user_resp = UserResponse(
        id=new_user.id,
        name=new_user.name,
        email=new_user.email,
        role=new_user.role,
        department_id=new_user.department_id,
        department_name=dept_name,
        phone_number=new_user.phone_number,
        avatar_url=new_user.avatar_url,
        created_at=new_user.created_at
    )

    return Token(access_token=token, token_type="bearer", user=user_resp)

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email.ilike(login_data.email.strip())).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(subject=user.id, role=user.role)
    dept_name = user.department.department_name if user.department else None

    user_resp = UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        department_id=user.department_id,
        department_name=dept_name,
        phone_number=user.phone_number,
        avatar_url=user.avatar_url,
        created_at=user.created_at
    )

    return Token(access_token=token, token_type="bearer", user=user_resp)

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    dept_name = current_user.department.department_name if current_user.department else None
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        department_id=current_user.department_id,
        department_name=dept_name,
        phone_number=current_user.phone_number,
        avatar_url=current_user.avatar_url,
        created_at=current_user.created_at
    )

@router.post("/demo-login/{role}", response_model=Token)
def demo_login(role: str, db: Session = Depends(get_db)):
    """Convenience endpoint for quick hackathon demonstrations"""
    target_role = role.upper()
    if target_role not in [UserRole.STUDENT.value, UserRole.STAFF.value, UserRole.ADMIN.value]:
        raise HTTPException(status_code=400, detail="Invalid role specified.")

    user = db.query(User).filter(User.role == target_role).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"No demo user with role {target_role} found.")

    token = create_access_token(subject=user.id, role=user.role)
    dept_name = user.department.department_name if user.department else None

    user_resp = UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        department_id=user.department_id,
        department_name=dept_name,
        phone_number=user.phone_number,
        avatar_url=user.avatar_url,
        created_at=user.created_at
    )

    return Token(access_token=token, token_type="bearer", user=user_resp)
