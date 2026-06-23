from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.services.need_analysis import NeedAnalyzer
from app.services.product_service import ProductService

app = FastAPI(
    title="AI Customized Shopping Guide",
    description="Backend for AI Shopping Guide with Need-First approach",
    version="0.1.0"
)

import os

# In production, set ALLOWED_ORIGINS env var to a comma-separated list of domains,
# e.g. "https://your-domain.com,https://www.your-domain.com"
# Defaults to localhost for local development only.
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:8080")
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Initialize services
product_service = ProductService()
need_analyzer = NeedAnalyzer(product_service=product_service)

class UserInput(BaseModel):
    text: str
    user_id: Optional[str] = "guest"

class AnalysisResult(BaseModel):
    symptoms: List[str]
    problem_type: str
    solutions: List[str]
    categories: List[str]
    products: List[Dict[str, Any]]
    original_input: str
    detected_budget: Optional[float] = None

@app.get("/")
async def root():
    return {"message": "Welcome to AI Customized Shopping Guide API"}

@app.post("/api/analyze", response_model=AnalysisResult)
async def analyze_need(input_data: UserInput):
    try:
        result = need_analyzer.analyze_user_need(input_data.text)
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
