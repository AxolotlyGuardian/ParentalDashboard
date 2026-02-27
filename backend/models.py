from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, DateTime, JSON, Float, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from db import Base
import secrets

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    kid_profiles = relationship("KidProfile", back_populates="parent")

class StreamingServiceSelection(Base):
    __tablename__ = "streaming_service_selections"
    
    id = Column(Integer, primary_key=True, index=True)
    family_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    selected_services = Column(JSON, nullable=False, default=list)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    family = relationship("User")

class KidProfile(Base):
    __tablename__ = "kid_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
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
    number_of_seasons = Column(Integer, nullable=True)
    number_of_episodes = Column(Integer, nullable=True)
    vote_average = Column(Float, nullable=True)
    wiki_slug = Column(String, nullable=True, index=True)
    fandom_scraped = Column(Boolean, default=False)
    fandom_scrape_date = Column(DateTime, nullable=True)
    last_synced = Column(DateTime, default=datetime.utcnow)
    
    policies = relationship("Policy", back_populates="title")

# Content Package System

class ContentPackage(Base):
    __tablename__ = "content_packages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    age_min = Column(Integer, nullable=True)
    age_max = Column(Integer, nullable=True)
    category = Column(String, nullable=False, index=True)  # age_band, theme, genre
    icon = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator = relationship("User")
    items = relationship("ContentPackageItem", back_populates="package", cascade="all, delete-orphan")


class ContentPackageItem(Base):
    __tablename__ = "content_package_items"
    __table_args__ = (
        UniqueConstraint('package_id', 'title_id', name='_package_title_uc'),
    )

    id = Column(Integer, primary_key=True, index=True)
    package_id = Column(Integer, ForeignKey("content_packages.id", ondelete="CASCADE"), nullable=False, index=True)
    title_id = Column(Integer, ForeignKey("titles.id"), nullable=False, index=True)
    added_at = Column(DateTime, default=datetime.utcnow)

    package = relationship("ContentPackage", back_populates="items")
    title = relationship("Title")


class AppliedPackage(Base):
    __tablename__ = "applied_packages"
    __table_args__ = (
        UniqueConstraint('kid_profile_id', 'package_id', name='_kid_package_uc'),
    )

    id = Column(Integer, primary_key=True, index=True)
    kid_profile_id = Column(Integer, ForeignKey("kid_profiles.id"), nullable=False, index=True)
    package_id = Column(Integer, ForeignKey("content_packages.id"), nullable=False, index=True)
    applied_at = Column(DateTime, default=datetime.utcnow)

    kid_profile = relationship("KidProfile")
    package = relationship("ContentPackage")


class PackageUpdate(Base):
    __tablename__ = "package_updates"

    id = Column(Integer, primary_key=True, index=True)
    kid_profile_id = Column(Integer, ForeignKey("kid_profiles.id"), nullable=False, index=True)
    package_id = Column(Integer, ForeignKey("content_packages.id"), nullable=False, index=True)
    title_id = Column(Integer, ForeignKey("titles.id"), nullable=False, index=True)
    status = Column(String, default="pending", index=True)  # pending, accepted, dismissed
    created_at = Column(DateTime, default=datetime.utcnow)

    kid_profile = relationship("KidProfile")
    package = relationship("ContentPackage")
    title = relationship("Title")


class Policy(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True)
    kid_profile_id = Column(Integer, ForeignKey("kid_profiles.id"), nullable=False, index=True)
    title_id = Column(Integer, ForeignKey("titles.id"), nullable=False, index=True)
    is_allowed = Column(Boolean, nullable=False, default=True)
    source_package_id = Column(Integer, ForeignKey("content_packages.id"), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    kid_profile = relationship("KidProfile", back_populates="policies")
    title = relationship("Title", back_populates="policies")
    source_package = relationship("ContentPackage")

class EpisodePolicy(Base):
    __tablename__ = "episode_policies"
    __table_args__ = (
        UniqueConstraint('policy_id', 'episode_id', name='_policy_episode_uc'),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    policy_id = Column(Integer, ForeignKey("policies.id", ondelete="CASCADE"), nullable=False, index=True)
    episode_id = Column(Integer, ForeignKey("episodes.id", ondelete="CASCADE"), nullable=False, index=True)
    is_allowed = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    policy = relationship("Policy")
    episode = relationship("Episode")

# Launcher System Models

class Device(Base):
    __tablename__ = "devices"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, unique=True, nullable=False, index=True)
    api_key = Column(String, nullable=False)
    family_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    kid_profile_id = Column(Integer, ForeignKey("kid_profiles.id"), nullable=True, index=True)
    device_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow)
    
    family = relationship("User")
    kid_profile = relationship("KidProfile")
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

class PendingDevice(Base):
    __tablename__ = "pending_devices"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, unique=True, nullable=False, index=True)
    pairing_code = Column(String(6), unique=True, nullable=False, index=True)
    api_key_plaintext = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)

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

# Episode Deep Linking System

class Episode(Base):
    __tablename__ = "episodes"
    
    id = Column(Integer, primary_key=True, index=True)
    title_id = Column(Integer, ForeignKey("titles.id"), nullable=False, index=True)
    tmdb_episode_id = Column(Integer, unique=True, nullable=True, index=True)
    season_number = Column(Integer, nullable=False)
    episode_number = Column(Integer, nullable=False)
    episode_name = Column(String, nullable=True)
    overview = Column(Text, nullable=True)
    runtime = Column(Integer, nullable=True)
    thumbnail_path = Column(String, nullable=True)
    air_date = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    title = relationship("Title")
    episode_links = relationship("EpisodeLink", back_populates="episode")

class EpisodeLink(Base):
    __tablename__ = "episode_links"
    
    id = Column(Integer, primary_key=True, index=True)
    episode_id = Column(Integer, ForeignKey("episodes.id"), nullable=False, index=True)
    raw_provider = Column(String, nullable=False)
    provider = Column(String, nullable=False, index=True)
    deep_link_url = Column(String, nullable=False)
    source = Column(String, default="device_report")
    confidence_score = Column(Float, default=0.0)
    first_seen_at = Column(DateTime, default=datetime.utcnow)
    last_confirmed_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    confirmed_count = Column(Integer, default=1)
    
    # Movie of the Night API enrichment fields
    motn_verified = Column(Boolean, default=False)
    motn_quality_score = Column(Float, nullable=True)
    custom_tags = Column(String, nullable=True)
    enrichment_data = Column(Text, nullable=True)
    last_enriched_at = Column(DateTime, nullable=True)
    
    episode = relationship("Episode", back_populates="episode_links")

class DeviceEpisodeReport(Base):
    __tablename__ = "device_episode_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=False, index=True)
    raw_url = Column(String, nullable=False)
    provider = Column(String, nullable=False, index=True)
    normalized_provider = Column(String, nullable=False, index=True)
    reported_title = Column(String, nullable=True)
    season_hint = Column(Integer, nullable=True)
    episode_hint = Column(Integer, nullable=True)
    tmdb_title_id = Column(Integer, nullable=True)
    kid_profile_id = Column(Integer, ForeignKey("kid_profiles.id"), nullable=True, index=True)
    playback_position = Column(Integer, nullable=True)
    processing_status = Column(String, default="pending", index=True)
    matched_episode_id = Column(Integer, ForeignKey("episodes.id"), nullable=True)
    confidence_score = Column(Float, nullable=True)
    reported_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    
    device = relationship("Device")
    kid_profile = relationship("KidProfile")
    matched_episode = relationship("Episode")

# Content Tagging System

class ContentTag(Base):
    __tablename__ = "content_tags"
    
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, nullable=False, index=True)
    slug = Column(String, unique=True, nullable=False, index=True)
    display_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    title_tags = relationship("TitleTag", back_populates="tag")

class TitleTag(Base):
    __tablename__ = "title_tags"

    id = Column(Integer, primary_key=True, index=True)
    title_id = Column(Integer, ForeignKey("titles.id"), nullable=False, index=True)
    tag_id = Column(Integer, ForeignKey("content_tags.id"), nullable=False, index=True)
    source = Column(String, default="manual")
    confidence = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    title = relationship("Title")
    tag = relationship("ContentTag", back_populates="title_tags")

class EpisodeTag(Base):
    __tablename__ = "episode_tags"

    id = Column(Integer, primary_key=True, index=True)
    episode_id = Column(Integer, ForeignKey("episodes.id"), nullable=False, index=True)
    tag_id = Column(Integer, ForeignKey("content_tags.id"), nullable=False, index=True)
    source = Column(String, default="fandom_scrape")
    confidence = Column(Float, default=1.0)
    source_url = Column(String, nullable=True)
    source_excerpt = Column(Text, nullable=True)
    extraction_method = Column(String, nullable=True)
    extra_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    episode = relationship("Episode")
    tag = relationship("ContentTag")

class ContentReport(Base):
    __tablename__ = "content_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    title_id = Column(Integer, ForeignKey("titles.id"), nullable=False, index=True)
    reported_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    tag_id = Column(Integer, ForeignKey("content_tags.id"), nullable=False, index=True)
    season_number = Column(Integer, nullable=True)
    episode_number = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String, default="pending", index=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    title = relationship("Title")
    reporter = relationship("User", foreign_keys=[reported_by])
    reviewer = relationship("User", foreign_keys=[reviewed_by])

class FandomTagSource(Base):
    __tablename__ = "fandom_tag_sources"
    
    id = Column(Integer, primary_key=True, index=True)
    tag_id = Column(Integer, ForeignKey("content_tags.id"), nullable=False, index=True)
    wiki_name = Column(String, nullable=False)
    category_name = Column(String, nullable=False)
    priority = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    tag = relationship("ContentTag")

class FandomScrapeJob(Base):
    __tablename__ = "fandom_scrape_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="pending", index=True)
    title_filter = Column(JSON, nullable=True)
    tag_filter = Column(JSON, nullable=True)
    force_rescrape = Column(Boolean, default=False)
    total_titles = Column(Integer, default=0)
    total_tags = Column(Integer, default=0)
    processed_count = Column(Integer, default=0)
    success_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    episodes_tagged = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    creator = relationship("User")
    scrape_runs = relationship("FandomScrapeRun", back_populates="job")

class FandomScrapeRun(Base):
    __tablename__ = "fandom_scrape_runs"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("fandom_scrape_jobs.id"), nullable=False, index=True)
    title_id = Column(Integer, ForeignKey("titles.id"), nullable=False, index=True)
    tag_id = Column(Integer, ForeignKey("content_tags.id"), nullable=False, index=True)
    status = Column(String, default="pending", index=True)
    episodes_found = Column(Integer, default=0)
    episodes_tagged = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    job = relationship("FandomScrapeJob", back_populates="scrape_runs")
    title = relationship("Title")
    tag = relationship("ContentTag")

class TitleTagScrapeState(Base):
    __tablename__ = "title_tag_scrape_state"
    __table_args__ = (
        UniqueConstraint('title_id', 'tag_id', name='_title_tag_uc'),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    title_id = Column(Integer, ForeignKey("titles.id"), nullable=False, index=True)
    tag_id = Column(Integer, ForeignKey("content_tags.id"), nullable=False, index=True)
    last_scraped_at = Column(DateTime, nullable=True)
    last_status = Column(String, nullable=True)
    episodes_found = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    title = relationship("Title")
    tag = relationship("ContentTag")

class FandomShowConfig(Base):
    __tablename__ = "fandom_show_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    title_id = Column(Integer, ForeignKey("titles.id"), unique=True, nullable=False, index=True)
    wiki_slug = Column(String, nullable=False)
    wiki_base_url = Column(String, nullable=True)
    episode_list_page = Column(String, nullable=True)
    episode_list_selectors = Column(JSON, nullable=True)
    season_page_pattern = Column(String, nullable=True)
    tag_overrides = Column(JSON, nullable=True)
    search_config = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)
    last_updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    title = relationship("Title")

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    stripe_customer_id = Column(String, nullable=True, unique=True, index=True)
    stripe_subscription_id = Column(String, nullable=True, unique=True, index=True)
    plan = Column(String, nullable=False)  # starter, family, educator
    status = Column(String, default="pending")  # pending, active, canceled, past_due
    device_limit = Column(Integer, nullable=False, default=1)
    hardware_units = Column(Integer, default=1)
    current_period_start = Column(DateTime, nullable=True)
    current_period_end = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")


class RevokedToken(Base):
    __tablename__ = "revoked_tokens"

    id = Column(Integer, primary_key=True, index=True)
    jti = Column(String, unique=True, nullable=False, index=True)
    revoked_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)


class FandomEpisodeLink(Base):
    __tablename__ = "fandom_episode_links"
    __table_args__ = (
        UniqueConstraint('title_id', 'season_number', 'episode_number', name='_fandom_episode_uc'),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    title_id = Column(Integer, ForeignKey("titles.id"), nullable=False, index=True)
    episode_id = Column(Integer, ForeignKey("episodes.id"), nullable=True, index=True)
    season_number = Column(Integer, nullable=False)
    episode_number = Column(Integer, nullable=False)
    fandom_page_id = Column(Integer, nullable=True)
    fandom_page_title = Column(String, nullable=False)
    fandom_url = Column(String, nullable=True)
    confidence = Column(Float, default=0.0)
    matching_method = Column(String, nullable=True)
    last_checked_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    title = relationship("Title")
    episode = relationship("Episode")
