from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt, JWTError
import os
import traceback
from datetime import datetime, timedelta, timezone
import random
import string
from db.database import get_connection

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
router = APIRouter(tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "spendagent_jwt_2026_xK9mP3qR7vL")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 24 * 60

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
        cursor.execute("SELECT id FROM users WHERE email = %s", (req.email,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            raise HTTPException(status_code=400, detail="Email already registered")
        hashed_password = get_password_hash(req.password)
        cursor.execute(
            "INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s)",
            (req.name, req.email, hashed_password)
        )
        conn.commit()
        cursor.close()
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
        cursor.execute("SELECT name, email, password_hash FROM users WHERE email = %s", (req.email,))
        user = cursor.fetchone()
        cursor.close()
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
    api_key = os.getenv("RESEND_API_KEY") or RESEND_API_KEY
    print(f"DEBUG: RESEND_API_KEY is set: {bool(api_key)}, length: {len(api_key) if api_key else 0}")
    if not api_key:
        print("Warning: RESEND_API_KEY not set. OTP:", otp)
        return
    import httpx
    try:
        print(f"DEBUG: Attempting to send email to {email} via Resend")
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": "SpendAgent <onboarding@resend.dev>",
                    "to": [email],
                    "subject": "SpendAgent - Your OTP Code",
                    "text": f"Your OTP is: {otp}. Valid for 10 minutes.",
                },
            )
            print(f"DEBUG: Resend response status: {response.status_code}, body: {response.text}")
            if response.status_code >= 400:
                print(f"Failed to send email: {response.status_code} {response.text}")
    except Exception as e:
        print(f"Failed to send email: {e} | {traceback.format_exc()}")

@router.post("/auth/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = %s", (req.email,))
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    otp = "".join(random.choices(string.digits, k=6))
    expiry = datetime.now() + timedelta(minutes=10)
    cursor.execute(
        "INSERT INTO otps (email, otp_code, expiry) VALUES (%s, %s, %s)",
        (req.email, otp, expiry)
    )
    conn.commit()
    cursor.close()
    conn.close()
    await send_otp_email(req.email, otp)
    return {"message": "OTP sent to your email"}

@router.post("/auth/verify-otp")
def verify_otp(req: VerifyOtpRequest):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, expiry FROM otps WHERE email = %s AND otp_code = %s AND used = 0 ORDER BY created_at DESC LIMIT 1",
        (req.email, req.otp)
    )
    otp_record = cursor.fetchone()
    if not otp_record:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    expiry_val = otp_record["expiry"]
    if isinstance(expiry_val, str):
        expiry_time = datetime.strptime(expiry_val, "%Y-%m-%d %H:%M:%S")
    else:
        expiry_time = expiry_val

    current_time = datetime.now(expiry_time.tzinfo) if getattr(expiry_time, "tzinfo", None) else datetime.now()
    if current_time > expiry_time:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="OTP expired")
    
    cursor.execute("UPDATE otps SET used = 1 WHERE id = %s", (otp_record["id"],))
    conn.commit()
    cursor.close()
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
    cursor.execute("UPDATE users SET password_hash = %s WHERE email = %s", (hashed_password, email))
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "Password reset successfully"}
