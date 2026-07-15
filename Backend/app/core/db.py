from supabase import create_client, Client
from app.core.config import settings

# single DB client for the whole app
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
