# AI Outfit Assistant

AI-powered virtual try-on concept prototype. Upload a photo and browse clothing options to see how outfits look on you.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: FastAPI, SQLAlchemy, Redis, Diffusers (virtual try-on model)

## Quick Start

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in DATABASE_URL, REDIS_URL, SECRET_KEY
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
cp .env.local.example .env.local   # fill in NEXT_PUBLIC_API_URL
npm run dev
```

## Status

Concept-stage prototype. Core API routes and UI skeleton are in place; virtual try-on model integration is partially wired. Not production-ready.
