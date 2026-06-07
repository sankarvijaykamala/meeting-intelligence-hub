import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SUPABASE_DB_URL = os.getenv('SUPABASE_DB_URL')
    GROQ_API_KEY = os.getenv('GROQ_API_KEY')