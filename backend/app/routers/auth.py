from fastapi import APIRouter, HTTPException
from app.models import SignUpRequest, LoginRequest, AuthResponse
from app.database import supabase

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup")
async def signup(data: SignUpRequest):
    try:
        result = supabase.auth.sign_up({
            "email": data.email,
            "password": data.password,
            "options": {
                "data": {"full_name": data.full_name or ""}
            }
        })
        if result.user is None:
            raise HTTPException(status_code=400, detail="Signup failed")
        return {
            "message": "Signup successful. Please check your email to confirm.",
            "user_id": str(result.user.id),
            "email": result.user.email
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
async def login(data: LoginRequest):
    try:
        result = supabase.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password
        })
        if result.user is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        return {
            "access_token": result.session.access_token,
            "user_id": str(result.user.id),
            "email": result.user.email,
            "full_name": result.user.user_metadata.get("full_name", "")
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/logout")
async def logout():
    try:
        supabase.auth.sign_out()
        return {"message": "Logged out successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
