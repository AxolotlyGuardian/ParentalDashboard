# Content Packages Feature — Implementation Plan

## Overview

Admin-curated bundles of 20-30 pre-vetted titles. Parents select packages for a kid profile, which creates individual policies for each title (using the existing policy system). Parents can exclude titles before or after applying. When an admin adds new titles to a package, parents who applied it get a notification/prompt to opt in.

---

## 1. Database Models (backend/models.py)

### New tables:

**`content_packages`** — The package definition
- `id` (PK)
- `name` (str, e.g. "Tiny Tots", "Educational Adventures")
- `description` (text)
- `age_min` / `age_max` (int) — target age range
- `category` (str — "age_band", "theme", "genre")
- `icon` (str, nullable — emoji or image path)
- `is_active` (bool, default True)
- `created_by` (FK → users, nullable — admin who created it)
- `created_at` / `updated_at`

**`content_package_items`** — Titles in a package
- `id` (PK)
- `package_id` (FK → content_packages)
- `title_id` (FK → titles)
- `added_at` (datetime)
- UniqueConstraint on (package_id, title_id)

**`applied_packages`** — Tracks which packages a kid profile has applied
- `id` (PK)
- `kid_profile_id` (FK → kid_profiles)
- `package_id` (FK → content_packages)
- `applied_at` (datetime)
- UniqueConstraint on (kid_profile_id, package_id)

**Add to `policies` table:**
- `source_package_id` (FK → content_packages, nullable) — tracks which package created this policy (null = manually created)

**`package_updates`** — Queued notifications when new titles are added to packages
- `id` (PK)
- `kid_profile_id` (FK → kid_profiles)
- `package_id` (FK → content_packages)
- `title_id` (FK → titles)
- `status` (str: "pending", "accepted", "dismissed")
- `created_at`

---

## 2. Backend API Routes (new file: backend/routes/packages.py)

### Admin endpoints (require_admin):
- `POST /packages` — Create a new package
- `PUT /packages/{id}` — Update package metadata
- `DELETE /packages/{id}` — Soft-delete (set is_active=False)
- `POST /packages/{id}/items` — Add title(s) to package → also creates package_updates for profiles that applied this package
- `DELETE /packages/{id}/items/{title_id}` — Remove title from package

### Parent endpoints (require_parent):
- `GET /packages` — List all active packages (optionally filtered by kid's age)
- `GET /packages/{id}` — Get package details with all titles
- `POST /packages/{id}/apply` — Apply package to a kid profile:
  1. Accept `kid_profile_id` and optional `excluded_title_ids[]`
  2. Create policies for each title NOT in the exclusion list
  3. Set `source_package_id` on each created policy
  4. Create `applied_packages` record
  5. Return count of policies created
- `DELETE /packages/{id}/unapply` — Remove all policies from this package for a kid profile
- `GET /packages/updates` — Get pending package updates (new titles available)
- `POST /packages/updates/{id}/accept` — Accept a pending update (create policy for the new title)
- `POST /packages/updates/{id}/dismiss` — Dismiss a pending update

---

## 3. Frontend Components

### New: `PackageSelector` component (frontend/components/PackageSelector.tsx)
- Grid of package cards showing: icon, name, age range, title count, description
- Click opens a detail modal showing all titles in the package with poster thumbnails
- Each title has a toggle to exclude it
- "Apply Package" button at the bottom
- Indicator if package is already applied to this profile

### New: `PackageUpdatesBanner` component (frontend/components/PackageUpdatesBanner.tsx)
- Dismissible banner shown at top of parent dashboard when pending updates exist
- Shows: "3 new titles available in 'Tiny Tots'" with Accept All / Review buttons
- Review opens a modal listing the new titles with individual accept/dismiss

### Parent Dashboard changes (frontend/app/parent/page.tsx)
- Add "Packages" as a new tab alongside Search, Policies, Devices, etc.
- When a kid profile is selected, show PackageSelector filtered by kid's age
- Show PackageUpdatesBanner when there are pending updates
- In the Policies tab, show a small badge on titles that came from packages

### Admin Dashboard (new page: frontend/app/admin/packages/page.tsx)
- CRUD interface for packages
- Add titles to packages via search (reuse existing catalog search)
- View which profiles have applied each package
- Preview of package contents

### Frontend API additions (frontend/lib/api.ts)
- `packagesApi` object with all the endpoints above

---

## 4. Alembic Migration

New migration file for all the new tables + the `source_package_id` column on policies.

---

## 5. Seed Data

Create a seed script or migration with starter packages:
- **Tiny Tots (2-4)**: ~25 titles — Bluey, Sesame Street, Daniel Tiger, Peppa Pig, Cocomelon, etc.
- **Little Kids (5-7)**: ~25 titles — Paw Patrol, SpongeBob, Encanto, Lego Movie, etc.
- **Big Kids (8-10)**: ~25 titles — Harry Potter, HTTYD, Avatar TLA, Jumanji, etc.
- **Tweens (11-13)**: ~25 titles — Marvel movies, Star Wars, Percy Jackson, Stranger Things, etc.
- **Educational**: ~20 titles — Magic School Bus, Wild Kratts, Planet Earth, Odd Squad, etc.
- **Family Movie Night**: ~20 titles — Pixar collection, Studio Ghibli, classic Disney, etc.

These would be TMDB IDs that get resolved to full Title records when the seed runs.

---

## Implementation Order

1. Database models + migration
2. Backend API routes (packages.py)
3. Frontend API client additions
4. Admin packages page (CRUD)
5. PackageSelector component + parent dashboard integration
6. PackageUpdatesBanner component
7. Seed data script

---

## Files to create:
- `backend/routes/packages.py`
- `backend/alembic/versions/002_content_packages.py`
- `backend/scripts/seed_packages.py`
- `frontend/app/admin/packages/page.tsx`
- `frontend/components/PackageSelector.tsx`
- `frontend/components/PackageUpdatesBanner.tsx`

## Files to modify:
- `backend/models.py` (new models + source_package_id on Policy)
- `backend/app.py` (register packages router)
- `frontend/lib/api.ts` (add packagesApi)
- `frontend/app/parent/page.tsx` (add Packages tab, updates banner)
- `frontend/app/admin/layout.tsx` (add Packages nav link)
