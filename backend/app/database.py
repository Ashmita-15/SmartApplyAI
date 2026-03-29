import os
from supabase import create_client, Client
from app.config import get_settings

settings = get_settings()

# Standard client (anon)
supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_KEY
)

# Admin client (service_role) - bypasses RLS
# Use os.getenv as a fallback to ensure we get the actual key if Settings is dummy
supabase_admin: Client = create_client(
    settings.SUPABASE_URL,
    os.getenv("SUPABASE_SERVICE_KEY", settings.SUPABASE_SERVICE_KEY)
)
