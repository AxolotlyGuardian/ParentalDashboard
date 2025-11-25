# Feature Overview

Axolotly provides comprehensive parental control capabilities across three primary interfaces: Parent Dashboard, Kids Launcher, and Admin Dashboard. This page provides a high-level overview of all platform features.

## Complete Feature List

### Parent Dashboard Features

✅ **Content Discovery**
- Real-time TMDB search for movies and TV shows
- Filter by media type (movies, TV shows, or both)
- Service-based filtering (show only subscribed services)
- Rich media cards with posters, ratings, and metadata

✅ **Kid Profile Management**
- Create unlimited child profiles
- Assign unique 4-digit PINs for secure access
- Track which content is allowed per child
- Independent policies for each profile

✅ **Content Policy Management**
- Allow or deny entire titles
- Block specific TV episodes while allowing the series
- Automatic episode loading with full metadata
- Season-by-season episode browsing

✅ **Content Tagging System**
- 72+ automated content tags based on TMDB genres
- Manual tag assignment and customization
- Episode-level content warnings
- Visual indicators for blocked content by tag

✅ **Streaming Service Selection**
- Choose from 7 major services (Netflix, Disney+, Hulu, Prime Video, Max, Peacock, YouTube)
- Filter search results to show only available content
- Update service subscriptions anytime
- Service-aware content recommendations

✅ **Device Management**
- 3-step pairing process with 6-digit codes
- View all paired launcher devices
- Rename devices for easy identification
- Track device activity and status

✅ **Content Action Modal**
- Detailed title information (plot, release date, rating)
- Season/episode browser with thumbnails
- Clickable content tags with blocked episode counts
- Quick allow/deny actions

✅ **Content Reporting**
- Report inappropriate content for review
- Community-powered content accuracy
- Admin moderation queue

### Kids Launcher Features

✅ **Secure PIN Login**
- Profile-based access with 4-digit PIN
- No password complexity requirements
- Kid-friendly interface

✅ **Curated Content Grid**
- Visual card layout with poster images
- Tap-to-launch functionality
- Only approved content displayed

✅ **Deep Link Integration**
- Season 1 Episode 1 immediate playback
- Automatic app launching (Netflix, Disney+, etc.)
- Crowdsourced episode URLs

✅ **Blocked Content Handling**
- Blocked content simply doesn't appear
- Safe browsing environment
- No temptation or frustration

✅ **Multi-Profile Support**
- Switch between sibling profiles
- Independent content lists per child
- Profile-specific policies enforced

### Device API Features

✅ **Pairing System**
- 6-digit code generation
- 30-second pairing flow
- Secure device registration

✅ **Approved Content Retrieval**
- Profile-specific content lists
- Season 1 Episode 1 deep links included
- Real-time policy updates

✅ **Usage Logging**
- App usage tracking
- Content access analytics
- Screen time monitoring foundation

✅ **Deep Link Reporting**
- Devices report discovered streaming URLs
- Episode-level link matching
- Community contribution to deep link database

### Admin Dashboard Features

✅ **Content Management**
- View all titles in system
- Manage content tags (72+ tags)
- Review content reports
- Approve/reject reported content

✅ **Episode Link Management**
- View all crowdsourced deep links
- Episode 1 backfill from Movie of the Night API
- Verify and moderate community submissions

✅ **User Management**
- View all parent accounts
- Manage kid profiles
- Track device pairings
- Support and moderation

✅ **Fandom Wiki Integration**
- Scrape episode-level content warnings
- Automated episode tagging via MediaWiki API
- Manual tag verification and adjustment

✅ **Bulk Operations**
- Load all episodes for TV shows from TMDB
- One-click Episode 1 deep link backfill
- Batch content tagging

✅ **Policy Management**
- View all family policies
- Audit content access patterns
- Identify trending content

## Feature Comparison Matrix

| Feature | Free Tier | Premium | Family | Enterprise |
|---------|-----------|---------|--------|------------|
| **Child Profiles** | 1 | 5 | Unlimited | Unlimited |
| **Devices** | 2 | Unlimited | Unlimited | Unlimited |
| **Basic Content Tagging** | ✅ | ✅ | ✅ | ✅ |
| **Episode-Level Blocking** | ✅ | ✅ | ✅ | ✅ |
| **Service Filtering** | ✅ | ✅ | ✅ | ✅ |
| **Community Deep Links** | ✅ | ✅ | ✅ | ✅ |
| **Fandom Wiki Tagging** | ❌ | ✅ | ✅ | ✅ |
| **Multi-Parent Access** | ❌ | ❌ | ✅ | ✅ |
| **Screen Time Analytics** | ❌ | ❌ | ✅ | ✅ |
| **Export/Import Policies** | ❌ | ❌ | ✅ | ✅ |
| **API Access** | ❌ | ❌ | ❌ | ✅ |
| **White-Label Deploy** | ❌ | ❌ | ❌ | ✅ |
| **Dedicated Support** | ❌ | ❌ | ❌ | ✅ |

## Integration Features

### TMDB Integration
- Real-time search across 1M+ titles
- Automatic metadata sync (posters, plots, ratings)
- Genre-based automated tagging
- Nightly popular content sync

### Movie of the Night API
- Season 1 Episode 1 deep link backfill
- Streaming service availability data
- Platform-specific URL generation

### Fandom Wiki Integration
- Episode-level content warning extraction
- MediaWiki API scraping
- Automated tag assignment per episode

### Streaming Platform Integration
- Deep link support for: Netflix, Disney+, Hulu, Prime Video, Max, Peacock, YouTube
- Automatic app launching
- Platform-specific URL formatting

## Security Features

✅ **Authentication**
- JWT-based parent authentication
- bcrypt password hashing (10 rounds)
- Secure PIN storage for kids
- Role-based access control (parent, kid, admin)

✅ **Data Protection**
- HTTPS-only communication
- Encrypted database storage
- Secure session management
- CORS protection

✅ **Device Security**
- 6-digit pairing code verification
- Device ID validation
- Launcher enforcement (cannot bypass)

## Performance Features

✅ **Caching**
- Redis support for API response caching
- TMDB data caching to reduce API calls
- Optimized database queries

✅ **Background Processing**
- Async episode loading for TV shows
- Nightly content sync via APScheduler
- Non-blocking deep link collection

✅ **Scalability**
- Stateless API design
- Horizontal scaling ready
- Database indexing optimized

## Accessibility Features

✅ **Kid-Friendly Design**
- Simple visual interface
- Large touch targets
- Minimal text requirements
- Color-coded categories

✅ **Parent Dashboard UX**
- Responsive design (mobile, tablet, desktop)
- Intuitive navigation
- Search auto-complete
- Quick actions

## Analytics Features (Roadmap)

🔮 **Usage Analytics**
- Content popularity tracking
- Screen time summaries
- Most-watched content reports
- Device activity dashboards

🔮 **Content Insights**
- Tag effectiveness analysis
- Content discovery patterns
- Policy impact metrics

---

For detailed information about specific features, see the feature-specific pages in this section.
