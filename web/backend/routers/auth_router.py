"""Auth router: registration and login endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import create_access_token, hash_password, verify_password
from database import get_db
from models import User
from schemas import LoginRequest, RegisterRequest, TokenResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def register(request: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """Register a new user.
    
    - Validates email and password (min 8 chars)
    - Checks email uniqueness
    - Hashes password with bcrypt
    - Creates user in DB
    - Returns JWT token
    
    Raises:
        HTTPException(409): Email already registered
        HTTPException(422): Invalid email or password < 8 chars
    """
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    
    # Hash password
    hashed_password = hash_password(request.password)
    
    # Create new user
    new_user = User(
        email=request.email,
        hashed_password=hashed_password,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create access token
    access_token = create_access_token({"sub": str(new_user.id)})
    
    return TokenResponse(access_token=access_token, token_type="bearer")


@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def login(request: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """Login user.
    
    - Finds user by email
    - Verifies password
    - Returns JWT token
    
    Raises:
        HTTPException(401): Invalid credentials (wrong email or password)
    """
    # Find user by email
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    
    # Verify password
    if not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    
    # Create access token
    access_token = create_access_token({"sub": str(user.id)})
    
    return TokenResponse(access_token=access_token, token_type="bearer")
