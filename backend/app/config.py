"""
config.py
Application configuration constants loaded from environment variables.
"""
import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_MODEL = "gpt-4o"
OPENAI_EMBEDDING_MODEL = "text-embedding-3-small"

MAX_PAPER_CHARS = 6000