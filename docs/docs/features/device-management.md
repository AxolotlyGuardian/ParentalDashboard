# Device Management

Axolotly's device management system enables parents to pair, configure, and monitor Android launcher devices through a simple 3-step pairing flow and centralized dashboard control.

## Device Pairing System

### 6-Digit Pairing Codes

The pairing system uses temporary 6-digit codes for secure device registration:

**Code Generation:**
- Random 6-digit numeric code
- Valid for 10 minutes after generation
- One-time use only
- Cryptographically secure random generation

**Security Features:**
- Codes expire automatically
- Cannot be reused after successful pairing
- Limited attempts to prevent brute force
- Invalid codes logged for security monitoring

### 3-Step Pairing Flow

**Step 1: Generate Code (Parent Dashboard)**
1. Parent logs into dashboard
2. Navigates to "Devices" tab
3. Clicks "Pair New Device" button
4. System generates 6-digit code
5. Code displayed prominently with 10-minute countdown

**Step 2: Enter Code (Android Launcher)**
1. Child opens Axolotly Launcher on Android device
2. Launcher prompts for pairing code
3. Child (or parent) enters 6-digit code
4. Launcher sends pairing request to backend API
5. Code validated, device registered

**Step 3: Confirm & Name (Parent Dashboard)**
1. New device appears in device list
2. Parent assigns friendly name (e.g., "Emma's Tablet")
3. Device linked to family account
4. Pairing complete - content syncs immediately

**Total Time:** < 30 seconds

## Device Management Interface

### Device List View

The Devices tab displays all paired devices with key information:

**Device Card Display:**
```
┌─────────────────────────────────┐
│  📱 Emma's Tablet               │
│                                 │
│  Paired: Nov 15, 2025           │
│  Last Active: 2 minutes ago     │
│                                 │
│  [Rename]  [Unpair]             │
└─────────────────────────────────┘
```

**Information Shown:**
- Device friendly name (customizable)
- Pairing date
- Last active timestamp
- Device status (active/inactive)

### Device Actions

**Rename Device:**
1. Click "Rename" button
2. Enter new friendly name
3. Save changes
4. Name updates across all interfaces

**Unpair Device:**
1. Click "Unpair" button
2. Confirmation dialog appears
3. Confirm unpairing
4. Device access revoked immediately
5. Launcher requires re-pairing

**View Activity (Roadmap):**
- See recently accessed content
- Screen time summaries
- Usage patterns
- Last login timestamp

## Device API Endpoints

### POST /api/launcher/pair

Pairs a new device to a family account:

**Request:**
```json
{
  "pairing_code": "123456",
  "device_id": "android_unique_device_id",
  "kid_profile_id": 42
}
```

**Response (Success):**
```json
{
  "success": true,
  "auth_token": "jwt_token_here",
  "device_name": "Device #1",
  "message": "Device paired successfully"
}
```

**Error Responses:**
- `400 Invalid or expired pairing code`
- `404 Profile not found`
- `409 Device already paired`

### GET /api/launcher/approved-content

Retrieves approved content for device's associated profile:

**Request Headers:**
```
Authorization: Bearer {device_auth_token}
```

**Query Parameters:**
```
kid_profile_id: 42
```

**Response:**
```json
{
  "titles": [
    {
      "id": 101,
      "tmdb_id": 123456,
      "title": "Bluey",
      "media_type": "tv",
      "poster_url": "https://image.tmdb.org/t/p/w500/...",
      "season_1_episode_1_deep_link": "disneyplus://...",
      "providers": ["disneyplus"]
    },
    ...
  ]
}
```

**Refresh Frequency:**
- On launcher startup
- Every 5 minutes while active
- Manual refresh available in launcher

### POST /api/launcher/report-deep-link

Devices report discovered streaming URLs:

**Request:**
```json
{
  "tmdb_id": 123456,
  "url": "disneyplus://show/bluey/s1/e5",
  "platform": "disneyplus",
  "device_id": "android_unique_device_id",
  "season_number": 1,
  "episode_number": 5
}
```

**Backend Processing:**
1. Validates URL format
2. Matches to TMDB episode
3. Stores in deep link database
4. Makes available to all users
5. Returns success confirmation

## Device Security

### Authentication

**JWT Token System:**
- Device receives JWT token on successful pairing
- Token includes device_id and kid_profile_id claims
- Token used for all subsequent API requests
- Tokens expire after 90 days

**Token Refresh:**
- Automatic refresh before expiration
- New token issued seamlessly
- No user interruption

### Authorization

**Profile-Level Access:**
- Each device paired to specific kid profile
- Can only access content approved for that profile
- Cannot view other profiles' content
- Cannot modify policies

**Parent Override:**
- Parent PIN required for device settings
- Prevents children from changing configuration
- Allows temporary profile switching (roadmap)

### Device Revocation

When a device is unpaired:
1. Device's auth token immediately invalidated
2. All API requests rejected
3. Launcher shows "Re-pair Required" message
4. No content accessible until re-paired

## Multi-Device Management

### Unlimited Devices (Premium/Family Tiers)

Parents can pair unlimited devices:

**Use Cases:**
- Multiple children, each with tablet
- Shared family tablet
- Bedroom TV + living room TV
- School-provided devices

**Device-Profile Relationship:**
- One device ↔ one profile (default)
- Profile switching on device (roadmap)
- Multiple devices ↔ same profile (supported)

### Device Naming Conventions

Recommended naming patterns:

**By Owner:**
- "Emma's Tablet"
- "Liam's Phone"
- "Family iPad"

**By Location:**
- "Living Room TV"
- "Bedroom Tablet"
- "Car Entertainment System"

**By Device Type:**
- "Samsung Galaxy Tab"
- "Fire HD 10"
- "Old Android Phone"

## Device Monitoring (Current & Roadmap)

### Currently Available

✅ **Pairing Status**
- View all paired devices
- See last active timestamp
- Device online/offline status

### Planned Features

🔮 **Activity Tracking**
- Content access history
- Most-watched content per device
- Usage time summaries
- Daily/weekly reports

🔮 **Screen Time Management**
- Daily time limits per device
- Scheduled bedtimes
- Device-specific restrictions
- Temporary time extensions

🔮 **Location-Based Rules**
- Geofencing for content access
- Home vs. away policies
- School mode (educational content only)

🔮 **Remote Actions**
- Pause device remotely
- Lock screen from dashboard
- Send messages to device
- Emergency unpair

## Technical Implementation

### Device Identification

**Device ID:**
- Android's unique device identifier
- Persists across app restarts
- Used for authentication
- Linked to pairing code

**Device Fingerprinting (Future):**
- Hardware model
- OS version
- Screen resolution
- Installation timestamp

### Data Synchronization

**Pull-Based Sync:**
- Launcher polls API every 5 minutes
- Receives updated content list
- No push notifications required
- Efficient bandwidth usage

**Future: Push Notifications**
- Real-time policy updates
- Instant content additions
- Parent messages to device

### Offline Support (Roadmap)

**Planned Capabilities:**
- Cache approved content list locally
- 24-hour offline window
- Re-sync when internet available
- Offline deep link usage

## Device Compatibility

### Supported Devices

**Android Version:**
- Minimum: Android 8.0 (Oreo)
- Recommended: Android 10+ (Q)
- Tested: Up to Android 14

**Device Types:**
- Smartphones (5" to 7" screens)
- Tablets (7" to 13" screens)
- Android TV boxes
- Amazon Fire devices (HD 8, HD 10)

**Minimum Specs:**
- 2 GB RAM
- 50 MB free storage
- Internet connection (Wi-Fi or cellular)

### Unsupported Platforms

❌ **Not Currently Supported:**
- iOS (iPhone/iPad) - under consideration
- Web-based launcher - roadmap
- Smart TVs (native apps) - future
- Gaming consoles - future

## Device Limits by Subscription Tier

| Tier | Max Devices | Notes |
|------|-------------|-------|
| **Free** | 2 devices | Perfect for single child |
| **Premium** | Unlimited | Family-friendly |
| **Family** | Unlimited | Advanced features |
| **Enterprise** | Unlimited | Bulk deployment |

## Best Practices

### Device Management Tips

**Organization:**
- Name devices clearly and consistently
- Unpair lost or replaced devices promptly
- Review device list quarterly
- Monitor last active timestamps

**Security:**
- Use unique PINs for each child
- Never share pairing codes publicly
- Unpair devices before selling/donating
- Enable device lock screens

**Maintenance:**
- Keep launcher app updated
- Check for policy sync issues
- Clear launcher cache if issues occur
- Re-pair devices after major updates

### Troubleshooting

**Device Not Appearing After Pairing:**
- Verify pairing code hasn't expired
- Check internet connection on device
- Restart launcher app
- Try re-entering pairing code

**Content Not Syncing:**
- Check last active timestamp
- Verify internet connection
- Force refresh in launcher settings
- Unpair and re-pair device

**Deep Links Not Working:**
- Ensure streaming app installed
- Update streaming apps to latest version
- Check app permissions
- Try alternative deep link formats

---

Axolotly's device management makes it simple to extend parental controls to all family devices while maintaining security and ease of use.
