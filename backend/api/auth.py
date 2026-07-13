from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
import datetime
import random
import os
import re
from typing import Optional
from pydantic import BaseModel

from models.database import get_db, User
from utils.security import hash_password, verify_password, generate_token, verify_token

router = APIRouter()

# Input Validation Schemas
class UserRegister(BaseModel):
    email: str
    username: str
    password: str

class UserLogin(BaseModel):
    username_or_email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class VerifyOTPRequest(BaseModel):
    email: str
    otp: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

# Helper dependency to authenticate users
def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in."
        )
    token = authorization.split(" ")[1]
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid. Please sign in again."
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found."
        )
    return user

@router.post("/register")
def register_user(req: UserRegister, db: Session = Depends(get_db)):
    # Basic email verification
    email_regex = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    if not re.match(email_regex, req.email):
        raise HTTPException(status_code=400, detail="Invalid email format.")
        
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
        
    if len(req.username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters.")

    # Check existence
    existing_email = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email is already registered.")

    existing_user = db.query(User).filter(User.username == req.username.strip()).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username is already taken.")

    # Hash and save
    new_user = User(
        email=req.email.strip().lower(),
        username=req.username.strip(),
        hashed_password=hash_password(req.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = generate_token(new_user.id)
    return {
        "token": token,
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email
        }
    }

@router.post("/login")
def login_user(req: UserLogin, db: Session = Depends(get_db)):
    term = req.username_or_email.strip()
    
    # Search by email or username
    user = db.query(User).filter((User.email == term.lower()) | (User.username == term)).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email/username or password.")

    token = generate_token(user.id)
    return {
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    }

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Avoid user enumeration attacks: return same success message but don't do anything
        return {"message": "If this email exists in our records, an OTP has been sent."}

    # Generate 6 digit OTP
    otp = f"{random.randint(100000, 999999)}"
    user.otp_code = otp
    user.otp_expiry = datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
    db.commit()

    # Log to console and save to a local text file for demonstration and developer verification
    os.makedirs("data", exist_ok=True)
    otp_log_path = "data/otp_logs.txt"
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(otp_log_path, "a") as f:
        f.write(f"[{timestamp}] Reset OTP for {email}: {otp}\n")
    
    print(f"--- RESET PASSWORD OTP FOR {email}: {otp} ---")
    
    return {"message": "OTP has been generated and logged. (Check data/otp_logs.txt)"}

@router.post("/verify-otp")
def verify_otp(req: VerifyOTPRequest, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.otp_code or user.otp_code != req.otp.strip():
        raise HTTPException(status_code=400, detail="Invalid OTP code.")

    if not user.otp_expiry or datetime.datetime.utcnow() > user.otp_expiry:
        raise HTTPException(status_code=400, detail="OTP code has expired.")

    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    # Reset password
    user.hashed_password = hash_password(req.new_password)
    user.otp_code = None
    user.otp_expiry = None
    db.commit()

    return {"message": "Password reset successful. You can now login with your new password."}

@router.post("/change-password")
def change_password(req: ChangePasswordRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(req.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect old password.")

    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")

    current_user.hashed_password = hash_password(req.new_password)
    db.commit()

    return {"message": "Password changed successfully."}

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email
    }
