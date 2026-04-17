from typing import Optional
from sqlalchemy import String, Boolean, DECIMAL, Text, JSON, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from datetime import datetime
import enum

class BodyType(str, enum.Enum):
    pear = "pear"
    apple = "apple"
    hourglass = "hourglass"
    rectangle = "rectangle"
    inverted_triangle = "inverted_triangle"

class User(Base):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    nickname: Mapped[str] = mapped_column(String(50))
    email: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Profile Data (Simplified merged into User or separate? Plan said separate table but simplified here for MVP or mapped relation)
    # Let's keep it clean and maybe separate if strictly following schema, but for MVP UserProfile is often 1:1.
    # The schema provided in prompt has `user_profiles` table. I should probably stick to that.
    
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)

class UserProfile(Base):
    __tablename__ = "user_profiles"

    profile_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(unique=True) # Foreign key relation to be added
    
    height: Mapped[float] = mapped_column(DECIMAL(5,2))
    weight: Mapped[float] = mapped_column(DECIMAL(5,2))
    body_type: Mapped[Optional[BodyType]] = mapped_column(SAEnum(BodyType), nullable=True)
    skin_tone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    face_image_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    style_preferences: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)
