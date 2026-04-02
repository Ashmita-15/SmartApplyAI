from fastapi import APIRouter, UploadFile, File, HTTPException, Header
from app.database import supabase, supabase_admin
from app.services.resume_parser import parse_resume_pdf
import uuid
from typing import Optional

router = APIRouter(prefix="/resume", tags=["resume"])


@router.post("/upload-resume")
async def upload_resume(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        # Get user from token
        user_id = None
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            user_result = supabase.auth.get_user(token)
            if user_result.user:
                user_id = str(user_result.user.id)

        # Read file content
        content = await file.read()

        # Parse the resume
        parsed = parse_resume_pdf(content)
        skills = parsed.get("skills", [])
        raw_text = parsed.get("raw_text", "")

        # Upload to Supabase Storage
        file_path = f"resumes/{uuid.uuid4()}/{file.filename}"
        storage_result = supabase_admin.storage.from_("resumes").upload(
            file_path,
            content,
            {"content-type": "application/pdf"}
        )

        file_url = supabase_admin.storage.from_("resumes").get_public_url(file_path)

        # Save to DB
        record = {
            "filename": file.filename,
            "file_url": file_url,
            "skills": skills,
            "raw_text": raw_text[:5000],  # Limit stored text
        }
        if user_id:
            record["user_id"] = user_id

        db_result = supabase_admin.table("resumes").insert(record).execute()

        # Auto-sync: merge resume skills into user's profile
        if user_id and skills:
            try:
                profile_res = supabase_admin.table("profiles").select("skills").eq("id", user_id).execute()
                if profile_res.data:
                    existing_skills = profile_res.data[0].get("skills") or []
                    existing_lower = [s.lower() for s in existing_skills]
                    new_skills = [s for s in skills if s.lower() not in existing_lower]
                    if new_skills:
                        merged = existing_skills + new_skills
                        supabase_admin.table("profiles").update({"skills": merged}).eq("id", user_id).execute()
            except Exception as sync_err:
                print(f"Skill sync to profile failed (non-critical): {sync_err}")

        return {
            "id": db_result.data[0]["id"],
            "filename": file.filename,
            "file_url": file_url,
            "skills": skills,
            "skill_count": len(skills),
            "message": "Resume uploaded and parsed successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/resumes")
async def get_resumes(authorization: Optional[str] = Header(None)):
    try:
        user_id = None
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            user_result = supabase.auth.get_user(token)
            if user_result.user:
                user_id = str(user_result.user.id)

        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication required")

        result = supabase_admin.table("resumes").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return {"resumes": result.data or []}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
