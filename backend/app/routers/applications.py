from fastapi import APIRouter, HTTPException, Header, BackgroundTasks
from app.models import ApplyRequest, ApplicationResponse
from app.database import supabase, supabase_admin
from typing import Optional

router = APIRouter(prefix="/applications", tags=["applications"])


@router.post("/apply")
async def apply(data: ApplyRequest, authorization: Optional[str] = Header(None)):
    try:
        user_id = None
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            user_result = supabase.auth.get_user(token)
            if user_result.user:
                user_id = str(user_result.user.id)

        # Fetch job details
        job_res = supabase_admin.table("jobs").select("*").eq("id", data.job_id).single().execute()
        if not job_res.data:
            raise HTTPException(status_code=404, detail="Job not found")

        job = job_res.data

        # Create application record
        record = {
            "job_id": data.job_id,
            "resume_id": data.resume_id,
            "status": "applied",
            "applied_via": "smart_apply",
            "submitted_data": data.user_details if data.user_details else {}
        }
        if user_id:
            record["user_id"] = user_id

        app_result = supabase_admin.table("applications").insert(record).execute()
        app_id = app_result.data[0]["id"]

        return {
            "id": app_id,
            "status": "applied",
            "job": job,
            "message": "Application submitted successfully."
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/smart-apply")
async def smart_apply(data: ApplyRequest, authorization: Optional[str] = Header(None)):
    """Record a smart-apply attempt (no auto-submission, client copies data to clipboard)"""
    try:
        user_id = None
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            user_result = supabase.auth.get_user(token)
            if user_result.user:
                user_id = str(user_result.user.id)

        # Fetch job details
        job_res = supabase_admin.table("jobs").select("*").eq("id", data.job_id).single().execute()
        if not job_res.data:
            raise HTTPException(status_code=404, detail="Job not found")

        job = job_res.data

        record = {
            "job_id": data.job_id,
            "resume_id": data.resume_id,
            "status": "manual_required",
            "applied_via": "smart_apply",
        }
        if user_id:
            record["user_id"] = user_id

        result = supabase_admin.table("applications").insert(record).execute()

        return {
            "id": result.data[0]["id"],
            "status": "manual_required",
            "job": job,
            "message": "Application recorded. Profile data ready for clipboard."
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
async def get_applications(authorization: Optional[str] = Header(None)):
    try:
        user_id = None
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            user_result = supabase.auth.get_user(token)
            if user_result.user:
                user_id = str(user_result.user.id)

        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication required")

        result = supabase_admin.table("applications").select(
            "*, jobs(title, company, location, platform, apply_link), resumes(filename)"
        ).eq("user_id", user_id).order("applied_at", desc=True).execute()

        return {"applications": result.data or []}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{app_id}/status")
async def update_status(app_id: str, status: str, authorization: Optional[str] = Header(None)):
    try:
        allowed = ["applied", "pending", "interview", "rejected", "offered", "manual_required"]
        if status not in allowed:
            raise HTTPException(status_code=400, detail=f"Status must be one of: {allowed}")

        result = supabase_admin.table("applications").update({"status": status}).eq("id", app_id).execute()
        return {"id": app_id, "status": status, "updated": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
