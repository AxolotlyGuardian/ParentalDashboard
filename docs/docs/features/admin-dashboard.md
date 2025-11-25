# Admin Dashboard

The Admin Dashboard provides comprehensive backend data management and moderation tools for platform administrators. It offers a centralized interface to manage content, users, devices, and system-wide settings.

## Overview

The admin dashboard is role-restricted and provides tools for:

- Content moderation and tag management
- User account oversight
- Episode link verification
- Fandom Wiki scraping for automated tagging
- Bulk TMDB operations
- System health monitoring

**Access Control:**
- Only users with `admin` role can access
- Separate login from parent dashboard
- Audit logging for all admin actions (roadmap)

## Dashboard Sections

### Content Reports

Parents can report inappropriate or incorrectly tagged content. Admins review and act on these reports:

**Report Queue:**
- All pending reports listed chronologically
- Filter by report type (incorrect tags, inappropriate content, technical issues)
- Priority flagging for urgent reports
- Assignee tracking for multi-admin teams

**Report Details:**
- Reporting parent's information
- Title and episode information
- Issue description
- Screenshots/evidence (if provided)
- Current tag status

**Admin Actions:**
- Update content tags
- Remove title from system
- Add warnings to title
- Mark report as resolved
- Send response to reporting parent (roadmap)

### Content Tags Management

Manage the 72+ content tags used across the platform:

**Tag List View:**
```
┌────────────────────────────────────────┐
│ Tag: violence                          │
│ Category: Content Warnings             │
│ Applied to: 342 titles, 89 episodes    │
│ [Edit] [Delete] [View Titles]          │
└────────────────────────────────────────┘
```

**Tag Operations:**
- **Create New Tag:** Add custom tags to system
- **Edit Tag:** Change tag name, category, description
- **Delete Tag:** Remove unused tags (with warnings)
- **Bulk Apply:** Apply tag to multiple titles at once
- **Tag Analytics:** See most-used tags, trending tags

**Tag Categories:**
- Content Warnings
- Age Appropriateness
- Intensity Levels
- Themes
- Special Categories

### Titles Management

Complete database of all titles in the system:

**Title List:**
- Searchable by TMDB ID, title name, media type
- Filter by: has episodes, has deep links, reported, tagged
- Sort by: date added, popularity, report count
- Bulk selection for batch operations

**Title Details View:**
- Full TMDB metadata
- Applied tags (automated + manual)
- Episode count and status
- Deep link availability
- Report history
- Parent policies using this title

**Title Operations:**
- Edit title metadata
- Add/remove tags
- Load episodes from TMDB
- Delete title (with cascade warnings)
- View associated policies

### Episode Links Management

Monitor and verify crowdsourced deep links:

**Deep Link Database:**
```sql
episode_id | platform | url | verified | reported_count
-----------|----------|-----|----------|---------------
123 | disneyplus | ... | true | 15
456 | netflix | ... | false | 3
```

**Link Verification Workflow:**
1. Device reports new deep link
2. Link appears in admin queue as "unverified"
3. Admin tests link manually or via automation
4. Mark as "verified" or "broken"
5. Verified links become available to all users

**Bulk Operations:**
- **Episode 1 Backfill:** One-click fetch S1E1 links from Movie of the Night API for all TV shows
- **Verify All:** Test batch of links for functionality
- **Purge Broken:** Remove non-working links
- **Export:** Download deep link database for analysis

### Parents Management

Oversight of all parent accounts:

**Parent List:**
- Email addresses
- Account creation dates
- Number of kid profiles
- Number of paired devices
- Last login timestamp
- Subscription tier (roadmap)

**Parent Account Actions:**
- View profile details
- See kid profiles and policies
- Impersonate for support (with consent)
- Disable account (ToS violations)
- Reset password (support requests)
- View activity logs

**Privacy Considerations:**
- No access to passwords (bcrypt hashed)
- Limited access to kid names (only IDs visible)
- Content policies viewable for moderation only
- Audit trail of all admin access

### Kid Profiles Management

View all kid profiles across the system:

**Profile List:**
- Profile names (anonymized for privacy)
- Associated parent account
- Number of allowed titles
- Device count
- Last device activity

**Profile Operations:**
- View allowed content list
- See blocked episodes
- Reset PIN (support requests)
- Remove inappropriate policies (safety)

**Analytics (Aggregated):**
- Most popular content across all kids
- Average number of allowed titles
- Tag usage patterns
- Age group distributions

### Devices Management

Monitor all paired launcher devices:

**Device Fleet View:**
- Total active devices
- Devices by platform (Android versions)
- Last active distribution (24h, 7d, 30d, inactive)
- Geographic distribution (roadmap)

**Device List:**
- Device ID (anonymized)
- Associated profile
- Paired date
- Last active
- Deep links reported count

**Device Operations:**
- Unpair device remotely (support)
- View device activity logs
- Flag suspicious devices
- Export device data for analysis

## Fandom Wiki Scraping

Powerful automation tool for episode-level content tagging:

### How It Works

**Fandom Integration:**
1. Admin enters Fandom wiki URL (e.g., `bluey.fandom.com`)
2. System uses MediaWiki API to fetch episode list
3. Scrapes episode pages for content warnings
4. Parses structured data from wiki templates
5. Matches episodes to TMDB by name/season/episode number
6. Applies tags automatically to matched episodes

**Example Workflow:**
```
Input: https://bluey.fandom.com/wiki/List_of_episodes
↓
Scrape: S2E14 "The Show" - Content Warnings: Scary themes, monsters
↓
Match: TMDB Episode ID 456789
↓
Apply: Tags "scary-themes", "monsters" to episode
↓
Output: Episode auto-tagged, parents can now filter
```

**Supported Wiki Formats:**
- Standard episode list tables
- Episode infobox templates
- Content warning sections
- Parental guidance notes

### Scraping Interface

**Form Fields:**
- Fandom Wiki URL
- Series TMDB ID (for matching)
- Tag mapping rules (customize wiki term → tag)
- Preview before applying

**Tag Mapping:**
```
Wiki Term → Axolotly Tag
"Violence" → violence
"Mild Peril" → mild-peril
"Scary Content" → scary-themes
```

**Results Display:**
- Episodes matched: 45/50 (90%)
- Tags applied: 137 total
- Unmatched episodes: 5 (review needed)
- Confidence scores per match

### Bulk TMDB Operations

**Load Episodes:**
- One-click button: "Load All Episodes for TV Shows"
- Fetches seasons/episodes from TMDB for all TV shows in system
- Background job with progress tracking
- Can run for hours (1,880+ episodes)

**Episode 1 Deep Link Backfill:**
- One-click button: "Backfill Episode 1 Deep Links"
- Calls Movie of the Night API for all TV shows
- Fetches verified streaming URLs for S1E1
- Populates deep link database
- Enables immediate playback on launcher devices

**Progress Tracking:**
```
┌──────────────────────────────────┐
│ Loading Episodes...              │
│ ████████░░░░░░░░░░░░░ 45/120     │
│ Current: "Bluey" (42 episodes)   │
│ Elapsed: 3m 15s                  │
└──────────────────────────────────┘
```

## Dynamic Menu System

The admin dashboard features a modular menu system:

**Menu Items:**
```typescript
{
  label: "Content Reports",
  path: "/admin/reports",
  icon: "flag",
  badge: unreadCount
},
{
  label: "Content Tags",
  path: "/admin/tags",
  icon: "tag"
},
{
  label: "Titles",
  path: "/admin/titles",
  icon: "film"
},
// ... more items
```

**Features:**
- Active route highlighting
- Unread counts as badges
- Collapsible sections
- Keyboard navigation

## Admin Analytics

### Platform Metrics

**User Stats:**
- Total parent accounts
- Active users (last 30 days)
- New signups (daily, weekly, monthly)
- Churn rate

**Content Stats:**
- Total titles in system
- Movies vs TV shows
- Episode count
- Tags applied (total, per title average)

**Device Stats:**
- Total paired devices
- Active devices (last 24h, 7d, 30d)
- Deep links reported (crowdsourced)
- Most popular streaming platforms

**System Health:**
- API response times
- TMDB API quota usage
- Database size
- Error rates

### Content Trends

**Popular Titles:**
- Most allowed by families
- Most searched
- Most reported
- Trending up/down

**Tag Usage:**
- Most frequently used tags
- Tag combinations
- Episode-level tag patterns

## Security & Permissions

### Role-Based Access

**Admin Tiers (Roadmap):**
- **Super Admin:** Full system access
- **Content Moderator:** Content reports, tags, titles only
- **Support Admin:** User management, support tools
- **Read-Only Admin:** Analytics and reporting only

### Audit Logging (Roadmap)

All admin actions logged:
```
timestamp | admin_id | action | resource | details
----------|----------|--------|----------|--------
...       | admin_5  | edit   | title_42 | Added tag "violence"
...       | admin_3  | delete | link_89  | Removed broken deep link
```

**Logged Actions:**
- Tag edits
- Title modifications
- User account changes
- Deep link verifications
- Report resolutions

## Technical Implementation

### Backend API Endpoints

**Admin Routes (all require admin role):**
- `GET /api/admin/reports` - Fetch content reports
- `POST /api/admin/reports/{id}/resolve` - Resolve report
- `GET /api/admin/tags` - List all tags
- `POST /api/admin/tags` - Create new tag
- `PUT /api/admin/tags/{id}` - Update tag
- `DELETE /api/admin/tags/{id}` - Delete tag
- `GET /api/admin/titles` - List titles
- `POST /api/admin/titles/{id}/tags` - Apply tags to title
- `POST /api/admin/scrape-fandom` - Initiate Fandom scraping
- `POST /api/admin/backfill-episodes` - Load TMDB episodes
- `POST /api/admin/backfill-deep-links` - Fetch S1E1 links

### Frontend Implementation

**Tech Stack:**
- Next.js pages for each admin section
- React components for data tables
- TailwindCSS for styling
- React Query for data fetching

**Key Components:**
- `<AdminLayout>` - Sidebar navigation, auth wrapper
- `<DataTable>` - Sortable, filterable tables
- `<TagManager>` - Tag CRUD interface
- `<FandomScraper>` - Wiki scraping UI
- `<BulkOperations>` - Background job tracking

## Best Practices

### Content Moderation

**Review Reports Promptly:**
- Check reports daily
- Respond within 48 hours
- Prioritize safety issues

**Tag Accuracy:**
- Verify automated tags periodically
- Cross-reference Fandom wikis
- Test edge cases

**Deep Link Quality:**
- Verify crowdsourced links before marking as verified
- Test on actual devices when possible
- Remove broken links promptly

### System Maintenance

**Regular Tasks:**
- Weekly: Review new content reports
- Monthly: Audit tag usage, remove unused tags
- Quarterly: Review user accounts, purge inactive

**Monitoring:**
- Watch API quota usage
- Track error rates
- Monitor database performance

---

The Admin Dashboard is the operational backbone of Axolotly, enabling efficient platform management, content quality control, and user support at scale.
