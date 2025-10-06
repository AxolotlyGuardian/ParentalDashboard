from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from db import Base

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
