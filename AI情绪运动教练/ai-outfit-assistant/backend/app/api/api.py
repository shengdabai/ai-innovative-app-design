from fastapi import APIRouter
from app.api.endpoints import login, users, tryon

api_router = APIRouter()
api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(tryon.router, prefix="/tryon", tags=["tryon"])
