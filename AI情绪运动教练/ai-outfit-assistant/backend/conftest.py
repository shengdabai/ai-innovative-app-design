import os

# Settings require SECRET_KEY; tests use a throwaway value, never a real key.
os.environ.setdefault("SECRET_KEY", "test-only-not-a-real-secret")
