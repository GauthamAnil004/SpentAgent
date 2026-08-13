from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt, JWTError
import os
import traceback
from datetime import datetime, timedelta, timezone
import random
import string
import aiosmtplib
from email.message import EmailMessage
from db.database import get_connection

router = APIRouter(tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "spendagent_jwt_2026_xK9mP3qR7vL")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 24 * 60

GMAIL_ADDRESS = os.getenv("GMAIL_ADDRESS")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str

class ResetPasswordRequest(BaseModel):
    reset_token: str
    new_password: str

def get_password_hash(password: str) -> str:
    import hashlib, bcrypt
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    hashed = bcrypt.hashpw(password_hash.encode(), bcrypt.gensalt())
    return hashed.decode()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    import hashlib, bcrypt
    password_hash = hashlib.sha256(plain_password.encode()).hexdigest()
    return bcrypt.checkpw(password_hash.encode(), hashed_password.encode())

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)

@router.post("/auth/register")
def register(req: RegisterRequest):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE email = ?", (req.email,))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="Email already registered")
        hashed_password = get_password_hash(req.password)
        cursor.execute(
            "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
            (req.name, req.email, hashed_password)
        )
        conn.commit()
        conn.close()
        return {"message": "Account created successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"{str(e)} | {traceback.format_exc()}")

@router.post("/auth/login")
def login(req: LoginRequest):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT name, email, password_hash FROM users WHERE email = ?", (req.email,))
        user = cursor.fetchone()
        conn.close()
        if not user or not verify_password(req.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        access_token = create_access_token(
            data={"sub": user["email"], "name": user["name"]},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        return {"access_token": access_token, "token_type": "bearer", "name": user["name"]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"{str(e)} | {traceback.format_exc()}")

async def send_otp_email(email: str, otp: str):
    if not GMAIL_ADDRESS or not GMAIL_APP_PASSWORD:
        print("Warning: SMTP credentials not set. OTP:", otp)
        return
    message = EmailMessage()
    message["From"] = GMAIL_ADDRESS
    message["To"] = email
    message["Subject"] = "SpendAgent - Your OTP Code"
    message.set_content(f"Your OTP is: {otp}. Valid for 10 minutes.")
    try:
        await aiosmtplib.send(
            message,
            hostname="smtp.gmail.com",
            port=465,
            use_tls=True,
            username=GMAIL_ADDRESS,
            password=GMAIL_APP_PASSWORD,
        )
    except Exception as e:
        print(f"Failed to send email: {e}")

@router.post("/auth/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (req.email,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    otp = "".join(random.choices(string.digits, k=6))
    expiry = datetime.now() + timedelta(minutes=10)
    cursor.execute(
        "INSERT INTO otps (email, otp_code, expiry) VALUES (?, ?, ?)",
        (req.email, otp, expiry.strftime("%Y-%m-%d %H:%M:%S"))
    )
    conn.commit()
    conn.close()
    await send_otp_email(req.email, otp)
    return {"message": "OTP sent to your email"}

@router.post("/auth/verify-otp")
def verify_otp(req: VerifyOtpRequest):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, expiry FROM otps WHERE email = ? AND otp_code = ? AND used = 0 ORDER BY created_at DESC LIMIT 1",
        (req.email, req.otp)
    )
    otp_record = cursor.fetchone()
    if not otp_record:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid OTP")
    expiry_time = datetime.strptime(otp_record["expiry"], "%Y-%m-%d %H:%M:%S")
    if datetime.now() > expiry_time:
        conn.close()
        raise HTTPException(status_code=400, detail="OTP expired")
    cursor.execute("UPDATE otps SET used = 1 WHERE id = ?", (otp_record["id"],))
    conn.commit()
    conn.close()
    reset_token = create_access_token(
        data={"sub": req.email, "type": "reset"}, expires_delta=timedelta(minutes=15)
    )
    return {"message": "OTP verified", "reset_token": reset_token}

@router.post("/auth/reset-password")
def reset_password(req: ResetPasswordRequest):
    try:
        payload = jwt.decode(req.reset_token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        token_type = payload.get("type")
        if email is None or token_type != "reset":
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    hashed_password = get_password_hash(req.new_password)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET password_hash = ? WHERE email = ?", (hashed_password, email))
    conn.commit()
    conn.close()
    return {"message": "Password reset successfully"}
