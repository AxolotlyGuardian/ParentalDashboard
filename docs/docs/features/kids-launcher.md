# Kids Launcher

The Kids Launcher is an Android application that serves as a replacement home screen for children's devices. It enforces parental controls by only displaying approved content and launching streaming apps via deep links.

## Overview

The Kids Launcher transforms a standard Android device into a safe, curated media center for children:

**Key Benefits:**
- ✅ Only approved content is visible
- ✅ Blocked content is completely hidden
- ✅ Tap-to-launch streaming apps automatically
- ✅ No complex navigation for kids
- ✅ Impossible to bypass (launcher replacement)

## Architecture

### Home Screen Replacement

The launcher operates as an Android home screen replacement:

**Installation:**
1. Download Axolotly Launcher APK
2. Install on Android device
3. Set as default launcher
4. Pair with parent dashboard

**Why Launcher Replacement?**
- Cannot be closed or bypassed
- Always active when device is unlocked
- OS-level enforcement
- No background processes needed

## User Interface

### Login Screen

Children are greeted with a profile selection screen:

**Profile Login:**
- Visual profile cards with names
- Tap profile → enter 4-digit PIN
- Kid-friendly number pad
- No complex passwords

**Security:**
- PINs stored with bcrypt hashing
- Failed attempts logged
- No password recovery (parents reset)

### Content Grid

After login, children see a grid of approved content:

**Grid Layout:**
- Large poster images (family-friendly)
- Title text below each poster
- 2-3 columns depending on device size
- Scroll to browse more content

**Content Cards:**
- High-quality TMDB poster images
- Title text in clear, readable font
- Media type badge (Movie / TV Show)
- Tap anywhere on card to launch

### Empty State

If no content is approved:
- Friendly message: "Ask your parents to add some shows!"
- Visual illustration
- No frustration or negative messaging

## Deep Linking

The launcher's most powerful feature is seamless deep linking:

### How Deep Links Work

**Season 1 Episode 1 Playback:**

1. Child taps content card (e.g., "Bluey")
2. Launcher checks for S1E1 deep link in database
3. Constructs platform-specific URL:
   - Netflix: `nflx://...`
   - Disney+: `disneyplus://...`
   - Hulu: `hulu://...`
   - Prime Video: `aiv://...`
   - YouTube: `vnd.youtube://...`
4. Launches streaming app with deep link
5. Content begins playing immediately

**User Experience:**
- No searching within streaming apps
- No navigation through menus
- Instant playback
- Child never sees unapproved content in app

### Deep Link Sources

**Episode 1 Backfill:**
- Movie of the Night API provides verified S1E1 links
- Automatically fetched for all TV shows
- One-click admin backfill feature

**Crowdsourced Links:**
- Devices report discovered streaming URLs
- Episodes matched to TMDB data
- Community contribution grows database

### Fallback Behavior

If no deep link is available:
- Launcher opens streaming app (without deep link)
- Child searches manually
- Parent notified to add deep link

## Device API Integration

The launcher communicates with the backend API:

### Pairing Endpoint

**POST /api/launcher/pair**

Child enters 6-digit pairing code from parent dashboard:

```json
{
  "pairing_code": "123456",
  "device_id": "android_device_uuid",
  "kid_profile_id": 42
}
```

Response includes authentication token for future requests.

### Approved Content Endpoint

**GET /api/launcher/approved-content**

Launcher fetches approved content for logged-in profile:

**Request:**
- Authorization header with device token
- kid_profile_id parameter

**Response:**
```json
{
  "titles": [
    {
      "tmdb_id": 123456,
      "title": "Bluey",
      "media_type": "tv",
      "poster_url": "https://...",
      "season_1_episode_1_deep_link": "disneyplus://..."
    },
    ...
  ]
}
```

**Refresh Frequency:**
- On app launch
- Every 5 minutes while active
- After returning from background

### Deep Link Reporting Endpoint

**POST /api/launcher/report-deep-link**

Devices report discovered streaming URLs:

```json
{
  "tmdb_id": 123456,
  "url": "disneyplus://show/bluey/s1/e1",
  "platform": "disneyplus",
  "device_id": "android_device_uuid"
}
```

Backend matches URLs to episodes and stores for community benefit.

## Blocked Content Handling

The launcher handles blocked content gracefully:

### Invisible Blocking

**What Children See:**
- Only approved content appears in grid
- Blocked content is completely hidden
- No "blocked" messages or warnings

**Why This Approach:**
- No temptation to access blocked content
- No frustration from seeing unavailable content
- Creates illusion of curated content library
- Reduces conflict between parents and children

### Episode-Level Blocking

For TV shows with some blocked episodes:

**Scenario:** Bluey approved, but S2E14 blocked

**Launcher Behavior:**
- Show appears in grid
- Tap launches Disney+ app
- S1E1 deep link used (always allowed)
- Child can navigate to other episodes within app
- If they access S2E14, parent receives notification (roadmap)

**Future Enhancement:**
- Episode-level deep links (play only allowed episodes)
- In-launcher episode selection
- Blocked episode notifications

## Technical Implementation

### Android Specifics

**Minimum Requirements:**
- Android 8.0 (Oreo) or higher
- 50 MB storage space
- Internet connection

**Permissions:**
- Internet (for API communication)
- No camera, microphone, or location access needed

**Development Stack:**
- Kotlin/Java (Android native)
- Retrofit for API calls
- Glide for image loading
- RecyclerView for content grid

### Offline Support (Roadmap)

Planned offline capabilities:
- Cache approved content list locally
- Sync when internet available
- Deep links work offline if app installed
- Graceful degradation without connection

## Customization Features

### Profile Themes (Roadmap)

Planned customization options:
- Color schemes per profile
- Background images
- Avatar selection
- Favorite content pinning

### Launcher Settings

**Parent-Controlled Settings:**
- Show/hide media type badges
- Grid size (2 vs 3 columns)
- Sort order (alphabetical, recently added, most watched)

**Access Method:**
- Parent PIN required to access settings
- Prevents children from changing configuration

## Safety & Security

### Launcher Lock

Once set as default launcher:
- Cannot be changed without parent PIN
- Settings app access restricted
- Uninstall requires parent authentication

### Network Security

- All API calls use HTTPS
- Certificate pinning (roadmap)
- Token-based authentication
- Auto-logout after inactivity

### Data Privacy

- No personal information collected from children
- Only content access logged
- COPPA compliant
- Parent dashboard shows all data collected

## Performance Considerations

### Image Loading

- Poster images cached on device
- Progressive loading with placeholders
- Low-resolution placeholders first
- Lazy loading for off-screen content

### Battery Optimization

- Background refresh limited
- No constant polling
- Efficient API calls
- Sleep mode support

## Future Enhancements

### Planned Features

🔮 **Enhanced Deep Linking**
- Episode-level deep links (not just S1E1)
- Multi-episode playlist support
- Resume playback from last position

🔮 **Usage Analytics**
- Screen time tracking
- Most-watched content
- Daily usage summaries for parents

🔮 **Offline Mode**
- Download content for offline viewing
- Cached content list
- Sync when connected

🔮 **Gamification**
- Reward badges for reading time
- Educational content bonuses
- Progress tracking

🔮 **Multi-Language Support**
- Launcher UI in multiple languages
- Content filtering by language
- Accessibility improvements

---

The Kids Launcher provides a simple, safe, and enjoyable way for children to access their approved media content while giving parents confidence that the enforcement is bulletproof.
