from fastapi import APIRouter, HTTPException, Header, UploadFile, File
from app.models import ProfileUpdate, ProfileResponse
from app.database import supabase, supabase_admin
from typing import Optional
import datetime

router = APIRouter(prefix="/profile", tags=["profile"])


def get_user_id(authorization: Optional[str]):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    token = authorization.split(" ")[1]
    try:
        user_result = supabase.auth.get_user(token)
        if not user_result.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return str(user_result.user.id)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


@router.get("", response_model=ProfileResponse)
async def get_profile(authorization: Optional[str] = Header(None)):
    user_id = get_user_id(authorization)
    try:
        # Avoid .single() as it raises exceptions if no row is found
        result = supabase_admin.table("profiles").select("*").eq("id", user_id).execute()
        
        if not result.data:
            # If profile doesn't exist, create an empty one
            token = authorization.split(" ")[1]
            user_res = supabase.auth.get_user(token)
            
            new_profile = {
                "id": user_id,
                "full_name": user_res.user.user_metadata.get("full_name", ""),
                "skills": [],
                "preferences": {"remote_preference": False, "notifications_enabled": True},
                "created_at": datetime.datetime.now().isoformat(),
                "updated_at": datetime.datetime.now().isoformat()
            }
            insert_res = supabase_admin.table("profiles").insert(new_profile).execute()
            if not insert_res.data:
                 raise HTTPException(status_code=500, detail="Failed to create profile record")
            return insert_res.data[0]
            
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("", response_model=ProfileResponse)
async def update_profile(data: ProfileUpdate, authorization: Optional[str] = Header(None)):
    user_id = get_user_id(authorization)
    try:
        update_data = data.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.datetime.now().isoformat()
        result = supabase_admin.table("profiles").update(update_data).eq("id", user_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Profile not found")
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None)
):
    user_id = get_user_id(authorization)
    
    # 1. Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")
    
    try:
        content = await file.read()
        file_extension = file.filename.split(".")[-1]
        file_path = f"{user_id}/avatar_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}.{file_extension}"
        
        # 2. Upload to Supabase Storage ('avatars' bucket)
        storage_res = supabase_admin.storage.from_("avatars").upload(
            file_path, 
            content,
            {"content-type": file.content_type, "upsert": "true"}
        )
        
        # 3. Get Public URL
        avatar_url = supabase_admin.storage.from_("avatars").get_public_url(file_path)
        
        # 4. Update Profile Record
        supabase_admin.table("profiles").update({"avatar_url": avatar_url}).eq("id", user_id).execute()
        
        return {"avatar_url": avatar_url, "message": "Avatar updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.post("/upload-resume")
async def upload_resume_profile(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None)
):
    # This just wraps the resume upload logic but specifically for the profile flow
    # In a real app, you might want to mark this as the "Primary" resume
    from app.routers.resume import upload_resume
    return await upload_resume(file, authorization)


@router.delete("/resume/{resume_id}")
async def delete_resume(resume_id: str, authorization: Optional[str] = Header(None)):
    user_id = get_user_id(authorization)
    try:
        # Verify ownership
        check = supabase_admin.table("resumes").select("id").eq("id", resume_id).eq("user_id", user_id).execute()
        if not check.data:
            raise HTTPException(status_code=404, detail="Resume not found or not owned by user")
        
        supabase_admin.table("resumes").delete().eq("id", resume_id).execute()
        return {"message": "Resume deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
