from typing import Optional
from pydantic import BaseModel, EmailStr

# Shared properties
class UserBase(BaseModel):
    phone: str
    nickname: Optional[str] = None
    email: Optional[EmailStr] = None

# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str
    nickname: str

# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = None

# Properties shared by models stored in DB
class UserInDBBase(UserBase):
    user_id: int
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True

# Properties to return to client
class User(UserInDBBase):
    pass

# Properties stored in DB
class UserInDB(UserInDBBase):
    hashed_password: str
