# Database Schema

Axolotly uses PostgreSQL as its primary relational database, managed through SQLAlchemy ORM with optimized schema design for performance and scalability.

## Database Technology

- **RDBMS:** PostgreSQL 14+
- **ORM:** SQLAlchemy 2.0
- **Migrations:** SQLAlchemy (alembic-style)
- **Hosting:** Replit PostgreSQL (development/production)

## Core Tables

### users
Parent accounts with authentication credentials.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Auto-incrementing user ID |
| email | VARCHAR(255) UNIQUE | Parent's email address |
| password_hash | VARCHAR(255) | bcrypt hashed password |
| role | VARCHAR(50) | 'parent' or 'admin' |
| created_at | TIMESTAMP | Account creation timestamp |

**Indexes:**
- `idx_users_email` on `email` (unique)
- `idx_users_role` on `role`

### kid_profiles
Child profiles associated with parent accounts.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Auto-incrementing profile ID |
| family_id | INTEGER FK(users.id) | Parent account ID |
| name | VARCHAR(100) | Child's name |
| pin_hash | VARCHAR(255) | bcrypt hashed 4-digit PIN |
| created_at | TIMESTAMP | Profile creation timestamp |

**Indexes:**
- `idx_kid_profiles_family_id` on `family_id`

**Relationships:**
- Many-to-one with `users` (family)

### titles
Movies and TV shows from TMDB.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Auto-incrementing title ID |
| tmdb_id | INTEGER UNIQUE | TMDB identifier |
| title | VARCHAR(500) | Movie/show name |
| media_type | VARCHAR(20) | 'movie' or 'tv' |
| overview | TEXT | Plot synopsis |
| poster_path | VARCHAR(255) | TMDB poster image URL |
| backdrop_path | VARCHAR(255) | TMDB backdrop image URL |
| release_date | DATE | Release or first air date |
| rating | VARCHAR(10) | TMDB rating (out of 10) |
| genres | JSON | Array of genre objects |
| providers | JSON | Array of streaming services |
| tags | JSON | Array of content tags |
| last_synced | TIMESTAMP | Last TMDB sync timestamp |

**Indexes:**
- `idx_titles_tmdb_id` on `tmdb_id` (unique)
- `idx_titles_media_type` on `media_type`

### episodes
TV show episodes with metadata.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Auto-incrementing episode ID |
| tmdb_episode_id | INTEGER UNIQUE | TMDB episode identifier |
| title_id | INTEGER FK(titles.id) | Parent title ID |
| season_number | INTEGER | Season number |
| episode_number | INTEGER | Episode number |
| name | VARCHAR(500) | Episode title |
| overview | TEXT | Episode plot |
| air_date | DATE | Original air date |
| thumbnail_path | VARCHAR(255) | Episode thumbnail URL |
| tags | JSON | Episode-specific content tags |

**Indexes:**
- `idx_episodes_title_id` on `title_id`
- `idx_episodes_season_episode` on `(title_id, season_number, episode_number)`

**Relationships:**
- Many-to-one with `titles`

### kid_profiles_titles
Junction table for content policies (many-to-many).

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Auto-incrementing ID |
| kid_profile_id | INTEGER FK(kid_profiles.id) | Child profile ID |
| title_id | INTEGER FK(titles.id) | Content title ID |
| policy | VARCHAR(20) | 'allow' or 'deny' |
| blocked_episodes | JSON | Array of blocked episode IDs |
| created_at | TIMESTAMP | Policy creation timestamp |

**Indexes:**
- `idx_kpt_profile_title` on `(kid_profile_id, title_id)` (unique)

**Relationships:**
- Many-to-one with `kid_profiles`
- Many-to-one with `titles`

### devices
Paired Android launcher devices.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Auto-incrementing device ID |
| device_id | VARCHAR(255) UNIQUE | Android device UUID |
| family_id | INTEGER FK(users.id) | Parent account ID |
| kid_profile_id | INTEGER FK(kid_profiles.id) | Associated child profile |
| friendly_name | VARCHAR(100) | User-assigned device name |
| paired_at | TIMESTAMP | Pairing timestamp |
| last_active | TIMESTAMP | Last API request timestamp |

**Indexes:**
- `idx_devices_device_id` on `device_id` (unique)
- `idx_devices_family_id` on `family_id`

**Relationships:**
- Many-to-one with `users` (family)
- Many-to-one with `kid_profiles`

### pairing_codes
Temporary 6-digit codes for device pairing.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Auto-incrementing ID |
| code | VARCHAR(6) UNIQUE | 6-digit numeric code |
| family_id | INTEGER FK(users.id) | Parent account ID |
| created_at | TIMESTAMP | Code generation timestamp |
| expires_at | TIMESTAMP | Code expiration (created_at + 10 min) |
| used | BOOLEAN | Whether code has been used |

**Indexes:**
- `idx_pairing_codes_code` on `code` (unique)
- `idx_pairing_codes_expires_at` on `expires_at`

**Cleanup:**
- Expired codes deleted by background job

### streaming_service_selection
Family's subscribed streaming services.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Auto-incrementing ID |
| family_id | INTEGER FK(users.id) UNIQUE | Parent account ID |
| selected_services | JSON | Array of service names |
| updated_at | TIMESTAMP | Last update timestamp |

**Indexes:**
- `idx_streaming_family_id` on `family_id` (unique)

**Relationships:**
- One-to-one with `users` (family)

### content_tags
Reusable content warning/theme tags.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Auto-incrementing tag ID |
| tag | VARCHAR(100) UNIQUE | Tag identifier (e.g., 'violence') |
| category | VARCHAR(50) | Tag category |
| description | TEXT | Tag description |

**Indexes:**
- `idx_content_tags_tag` on `tag` (unique)

### episode_links
Crowdsourced deep links for episodes.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Auto-incrementing link ID |
| episode_id | INTEGER FK(episodes.id) | Episode ID |
| platform | VARCHAR(50) | Streaming platform |
| url | TEXT | Deep link URL |
| verified | BOOLEAN | Admin verification status |
| reported_count | INTEGER | Number of devices reporting this link |
| created_at | TIMESTAMP | First report timestamp |

**Indexes:**
- `idx_episode_links_episode_platform` on `(episode_id, platform)`

**Relationships:**
- Many-to-one with `episodes`

### content_reports
Parent-submitted content issue reports.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Auto-incrementing report ID |
| family_id | INTEGER FK(users.id) | Reporting parent ID |
| title_id | INTEGER FK(titles.id) | Reported title ID |
| issue_type | VARCHAR(100) | Report category |
| description | TEXT | Issue description |
| status | VARCHAR(50) | 'pending', 'resolved', 'dismissed' |
| created_at | TIMESTAMP | Report timestamp |
| resolved_at | TIMESTAMP | Resolution timestamp |

**Indexes:**
- `idx_content_reports_status` on `status`

## Entity Relationship Diagram

```
users (parents)
  ├── kid_profiles (1:many)
  │     └── kid_profiles_titles (many:many with titles)
  ├── devices (1:many)
  ├── pairing_codes (1:many)
  ├── streaming_service_selection (1:1)
  └── content_reports (1:many)

titles (content)
  ├── episodes (1:many)
  ├── kid_profiles_titles (many:many with kid_profiles)
  └── content_reports (1:many)

episodes
  └── episode_links (1:many)

content_tags (reusable tags)
```

## Database Constraints

### Foreign Keys
- All foreign keys enforced with `ON DELETE CASCADE` where appropriate
- Orphaned records prevented

### Unique Constraints
- `users.email` - Prevent duplicate accounts
- `titles.tmdb_id` - One entry per TMDB title
- `kid_profiles_titles.(kid_profile_id, title_id)` - One policy per profile-title pair
- `devices.device_id` - One device registration
- `pairing_codes.code` - No duplicate codes

### Check Constraints
- `kid_profiles.pin_hash` - Must be bcrypt hash
- `kid_profiles_titles.policy` - Must be 'allow' or 'deny'
- `titles.media_type` - Must be 'movie' or 'tv'

## Performance Optimizations

### Indexes

**Query Optimization:**
- `idx_kid_profiles_family_id` - Fast profile lookup per family
- `idx_titles_tmdb_id` - Quick TMDB ID searches
- `idx_episodes_title_id` - Efficient episode loading
- `idx_kpt_profile_title` - Fast policy checks

### Denormalization

**Strategic Redundancy:**
- `titles.providers` - Cache streaming availability (from TMDB/MOTN)
- `titles.tags` - Store auto-generated tags (from genres)
- `devices.last_active` - Track device status without separate table

### Connection Pooling

```python
engine = create_engine(
    DATABASE_URL,
    pool_size=20,        # Max connections
    max_overflow=10,     # Extra connections during peak
    pool_pre_ping=True   # Verify connection before use
)
```

## Data Integrity

### Transactions

**Critical Operations:**
```python
with db.begin():
    # Create policy
    policy = KidProfilesTitle(...)
    db.add(policy)
    
    # Load episodes in background
    load_episodes_async(title_id)
    
    db.commit()
```

### Cascading Deletes

**When parent deleted:**
- All kid profiles deleted
- All devices unpaired
- All policies removed
- All reports removed

**When title deleted:**
- All episodes deleted
- All episode links deleted
- All policies referencing title removed

## Database Migrations

### Migration Strategy

**SQLAlchemy Alembic-Style:**
```python
# Create tables on first run
Base.metadata.create_all(bind=engine)

# Future migrations
alembic revision --autogenerate -m "Add streaming_service_selection"
alembic upgrade head
```

### Backup & Recovery

**Automated Backups:**
- Daily PostgreSQL dumps
- 30-day retention
- Point-in-time recovery

**Disaster Recovery:**
```bash
# Backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

## Database Monitoring

### Key Metrics

**Performance:**
- Query execution time
- Connection pool usage
- Cache hit ratio
- Table sizes

**Health:**
- Active connections
- Long-running queries
- Lock waits
- Replication lag (if applicable)

### Query Optimization

**Slow Query Analysis:**
```sql
-- Enable slow query log
SET log_min_duration_statement = 1000;  -- Log queries > 1s

-- Analyze query plan
EXPLAIN ANALYZE SELECT * FROM titles WHERE tmdb_id = 123456;
```

## Scaling Considerations

### Horizontal Scaling (Future)

**Read Replicas:**
- Master for writes
- Replicas for reads
- Connection routing based on operation

**Sharding (If Needed):**
- Shard by family_id
- Each shard independent database
- Application-level routing

### Vertical Scaling

**Database Size Projections:**
- 1M families → ~10 GB database
- 100K titles → ~5 GB
- 2M episodes → ~15 GB
- Total: ~30 GB @ 1M families

**Recommended Specs:**
- 4 CPU cores
- 16 GB RAM
- 100 GB SSD storage

---

The Axolotly database schema is designed for performance, scalability, and data integrity, supporting millions of users while maintaining fast query times and reliable data relationships.
