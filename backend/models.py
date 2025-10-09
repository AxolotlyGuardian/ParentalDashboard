from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, DateTime, JSON, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from db import Base
import secrets

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    kid_profiles = relationship("KidProfile", back_populates="parent")

class KidProfile(Base):
    __tablename__ = "kid_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    pin = Column(String, nullable=False)
    avatar = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    parent = relationship("User", back_populates="kid_profiles")
    policies = relationship("Policy", back_populates="kid_profile")

class Title(Base):
    __tablename__ = "titles"
    
    id = Column(Integer, primary_key=True, index=True)
    tmdb_id = Column(Integer, unique=True, nullable=False, index=True)
    title = Column(String, nullable=False)
    media_type = Column(String, nullable=False)
    overview = Column(Text, nullable=True)
    poster_path = Column(String, nullable=True)
    backdrop_path = Column(String, nullable=True)
    release_date = Column(String, nullable=True)
    rating = Column(String, nullable=True)
    genres = Column(JSON, nullable=True)
    providers = Column(JSON, nullable=True)
    deep_links = Column(JSON, nullable=True)
    last_synced = Column(DateTime, default=datetime.utcnow)
    
    policies = relationship("Policy", back_populates="title")

class Policy(Base):
    __tablename__ = "policies"
    
    id = Column(Integer, primary_key=True, index=True)
    kid_profile_id = Column(Integer, ForeignKey("kid_profiles.id"), nullable=False)
    title_id = Column(Integer, ForeignKey("titles.id"), nullable=False)
    is_allowed = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    kid_profile = relationship("KidProfile", back_populates="policies")
    title = relationship("Title", back_populates="policies")

# Launcher System Models

class Device(Base):
    __tablename__ = "devices"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, unique=True, nullable=False, index=True)
    api_key = Column(String, nullable=False)
    family_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    device_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow)
    
    family = relationship("User")
    usage_logs = relationship("UsageLog", back_populates="device")

class PairingCode(Base):
    __tablename__ = "pairing_codes"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(6), unique=True, nullable=False, index=True)
    family_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    expires_at = Column(DateTime, nullable=True)
    is_used = Column(Boolean, default=False)
    pre_generated = Column(Boolean, default=False)
    device_serial = Column(String, nullable=True, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    family = relationship("User")

class App(Base):
    __tablename__ = "apps"
    
    id = Column(Integer, primary_key=True, index=True)
    app_name = Column(String, nullable=False)
    package_name = Column(String, unique=True, nullable=False, index=True)
    icon_url = Column(String, nullable=True)
    cover_art = Column(String, nullable=True)
    age_rating = Column(String, nullable=True)
    category = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    family_apps = relationship("FamilyApp", back_populates="app")

class FamilyApp(Base):
    __tablename__ = "family_apps"
    
    id = Column(Integer, primary_key=True, index=True)
    family_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    app_id = Column(Integer, ForeignKey("apps.id"), nullable=False)
    is_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    family = relationship("User")
    app = relationship("App", back_populates="family_apps")

class TimeLimit(Base):
    __tablename__ = "time_limits"
    
    id = Column(Integer, primary_key=True, index=True)
    family_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    daily_limit_minutes = Column(Integer, nullable=True)
    bedtime_start = Column(String, nullable=True)  # Format: "HH:MM"
    bedtime_end = Column(String, nullable=True)    # Format: "HH:MM"
    schedule_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    family = relationship("User")

class UsageLog(Base):
    __tablename__ = "usage_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=False)
    app_id = Column(Integer, ForeignKey("apps.id"), nullable=True)
    app_name = Column(String, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    device = relationship("Device", back_populates="usage_logs")
    app = relationship("App")
