# Device Pairing Workflow

Complete step-by-step guide to pairing an Android launcher device with the Axolotly parent dashboard.

## Overview

The Axolotly pairing system uses 6-digit temporary codes to securely connect Android launcher devices to family accounts. The process takes less than 30 seconds and requires minimal technical expertise.

## Prerequisites

### Before You Begin

**Required:**
✅ Axolotly parent account created  
✅ At least one kid profile created with PIN  
✅ Android device (Android 8.0+ / Oreo or higher)  
✅ Axolotly Launcher APK installed on Android device  
✅ Active internet connection (both parent device and Android launcher)  

**Recommended:**
- Device fully charged or plugged in
- Parent has smartphone or computer for dashboard access
- Clear which child will use this device

## Complete Pairing Process

### Phase 1: Preparation (Parent)

**Step 1: Install Launcher App**

1. Download Axolotly Launcher APK
2. Transfer to Android device (USB, email, or cloud storage)
3. Enable "Unknown Sources" in Android settings
4. Install APK on device
5. Open app once to verify installation

**Step 2: Set as Default Launcher**

1. Go to Android Settings → Apps → Default Apps → Home App
2. Select "Axolotly Launcher"
3. Or: Launcher will prompt to set as default on first launch
4. Confirm selection
5. Press home button to verify launcher appears

**Time:** 2-3 minutes (one-time setup)

### Phase 2: Code Generation (Parent Dashboard)

**Step 1: Access Dashboard**

1. Open web browser
2. Navigate to Axolotly parent dashboard
3. Log in with email/password
4. Dashboard loads

**Step 2: Navigate to Devices Tab**

1. Click "Devices" in top navigation
2. Device list page appears
3. See any previously paired devices

**Step 3: Generate Pairing Code**

1. Click "Pair New Device" button
2. 6-digit code appears in large text
3. Countdown timer shows 10 minutes remaining
4. Keep this window/tab open

**Example Display:**
```
┌──────────────────────────────┐
│   Device Pairing Code        │
│                              │
│        4  7  2  9  1  6       │
│                              │
│   Valid for: 9:42 minutes    │
│                              │
│ Enter this code on your      │
│ Android launcher device      │
└──────────────────────────────┘
```

**Time:** 10 seconds

### Phase 3: Code Entry (Android Launcher)

**Step 1: Launch Launcher App**

1. Press home button on Android device
2. Axolotly Launcher appears (if set as default)
3. Or: Open app from app drawer

**Step 2: Enter Pairing Code**

1. Launcher shows "Enter Pairing Code" screen
2. Numeric keypad displayed
3. Enter all 6 digits
4. Tap "Pair Device" button

**Example Display:**
```
┌──────────────────────────────┐
│   Enter Pairing Code         │
│                              │
│   [ 4 ] [ 7 ] [ 2 ]          │
│   [ 9 ] [ 1 ] [ 6 ]          │
│                              │
│   [  Pairing Device...  ]    │
└──────────────────────────────┘
```

**Step 3: Select Kid Profile**

1. After code validation, profile selection appears
2. See all kid profiles for family
3. Tap child's profile who will use this device
4. Enter child's 4-digit PIN
5. Pairing confirms

**Time:** 20 seconds

### Phase 4: Confirmation (Parent Dashboard)

**Step 1: Device Appears**

1. Dashboard automatically updates
2. New device appears in device list
3. Shows as "Device #1" or similar default name

**Step 2: Assign Friendly Name**

1. Click "Rename" button next to new device
2. Enter descriptive name (e.g., "Emma's Tablet")
3. Save changes
4. Device now labeled clearly

**Step 3: Verify Pairing**

1. Check "Last Active" timestamp (should be recent)
2. Verify correct profile assigned
3. Note pairing date for records

**Time:** 30 seconds

### Phase 5: Verification (Android Launcher)

**Step 1: Content Syncs**

1. Launcher fetches approved content from API
2. Visual grid populates with poster images
3. All parent-approved titles appear
4. Empty grid if no content approved yet

**Step 2: Test Deep Link**

1. Have parent approve one title (if none approved)
2. Wait 30 seconds for sync
3. Tap content card in launcher
4. Streaming app should launch with deep link

**Success Criteria:**
✅ Content grid displays approved titles  
✅ Tapping card launches streaming app  
✅ Correct child's content shown  
✅ Device appears in parent dashboard  

**Time:** 1-2 minutes

## Total Pairing Time

**First Device (Including Setup):**
- Launcher installation: 2-3 minutes (one-time)
- Dashboard code generation: 10 seconds
- Launcher code entry: 20 seconds
- Profile selection: 10 seconds
- Dashboard confirmation: 30 seconds
- Verification: 1-2 minutes

**Total:** ~5 minutes

**Subsequent Devices (Setup Already Complete):**
- Dashboard code generation: 10 seconds
- Launcher code entry: 20 seconds
- Profile selection: 10 seconds
- Dashboard confirmation: 30 seconds

**Total:** ~70 seconds

## Troubleshooting

### Common Issues & Solutions

#### "Invalid Pairing Code"

**Possible Causes:**
- Code expired (10-minute limit)
- Typo in code entry
- Code already used
- Internet connection issue

**Solutions:**
1. Verify code was entered correctly
2. Check if 10 minutes have passed
3. Generate new code in dashboard
4. Try again with new code
5. Verify internet connection on both devices

#### "Device Not Appearing in Dashboard"

**Possible Causes:**
- Internet connection failed mid-pairing
- Dashboard not refreshed
- Code entry incomplete

**Solutions:**
1. Refresh dashboard page manually
2. Check device internet connection
3. Try complete pairing process again
4. Clear browser cache

#### "Content Not Syncing to Launcher"

**Possible Causes:**
- No content approved yet
- Sync delay (up to 5 minutes)
- Internet connection issue
- Launcher needs restart

**Solutions:**
1. Approve at least one title in dashboard
2. Wait 30-60 seconds
3. Pull down to refresh in launcher (if available)
4. Restart launcher app
5. Check device internet connection

#### "Wrong Profile Selected"

**Possible Causes:**
- Selected incorrect profile during pairing
- Multiple children, chose wrong name

**Solutions:**
1. Unpair device in dashboard
2. Generate new pairing code
3. Re-pair and select correct profile
4. Verify profile name before PIN entry

## Security Considerations

### Code Security

**Why 6 Digits?**
- Balance between security and usability
- 1 million possible combinations
- 10-minute expiration limits brute force attempts
- One-time use prevents replay attacks

**Best Practices:**
- Don't share pairing codes publicly
- Don't reuse codes (system prevents this)
- Complete pairing process immediately
- Keep dashboard secure during code generation

### Device Security

**Launcher Lock:**
- Once paired, device can only be unpaired from dashboard
- Child cannot remove launcher without parent PIN
- Uninstalling requires parent authentication

**PIN Protection:**
- Kid profile requires 4-digit PIN
- Prevents sibling access
- Parent can reset if forgotten

## Advanced Pairing Scenarios

### Multiple Devices, One Profile

**Use Case:** One child uses tablet and parent's phone

**Process:**
1. Generate first pairing code
2. Pair first device to child's profile
3. Rename device "Emma's Tablet"
4. Generate second pairing code
5. Pair second device to same profile
6. Rename "Emma's Access on Mom's Phone"

**Result:**
- Both devices show same approved content
- Policies synced across both devices
- Managed independently in dashboard

### Multiple Profiles, Shared Device

**Use Case:** Siblings sharing family tablet

**Current Limitation:**
- One device can only be paired to one profile at a time

**Workaround:**
- Pair to youngest child's profile (most restrictive content)
- All siblings can use safely
- Older siblings may be bored by limited content

**Future Feature: Profile Switching**
- Device supports multiple profiles
- PIN required to switch
- Content adapts to active profile

### Re-Pairing After Device Reset

**Scenario:** Android device factory reset or launcher reinstalled

**Process:**
1. Device appears as "inactive" in dashboard
2. Unpair old device entry
3. Follow standard pairing process
4. Device will sync all current policies

**Note:** Previous pairing history preserved in database

### Pairing Backup Device

**Use Case:** Emergency device in case primary device breaks

**Strategy:**
1. Pair backup device immediately
2. Rename clearly ("Emma's Backup Tablet")
3. Keep charged and updated
4. Content auto-syncs even if unused
5. Ready to use instantly if needed

## Best Practices

### Before Pairing

✅ **Create Kid Profile First**
- Easier to select during pairing
- Avoids confusion

✅ **Approve Some Content**
- Child sees content immediately after pairing
- Positive first impression
- Verifies pairing success

✅ **Charge Device**
- Pairing process quick, but initial content sync may take time
- Avoid interruption mid-setup

### During Pairing

✅ **Double-Check Code**
- Verify each digit before submitting
- Avoid typos causing delays

✅ **Select Correct Profile**
- Read profile names carefully
- Verify child's name before entering PIN

✅ **Name Device Immediately**
- Clear naming prevents future confusion
- Easier device management

### After Pairing

✅ **Test Immediately**
- Tap one content card
- Verify deep link works
- Confirm correct content displayed

✅ **Educate Child**
- Show how to use launcher
- Explain PIN importance
- Demonstrate tap-to-launch

✅ **Monitor First Day**
- Check device "Last Active" timestamp
- Verify content syncing
- Address any issues quickly

## Pairing Limits

### By Subscription Tier

| Tier | Max Devices | Notes |
|------|-------------|-------|
| **Free** | 2 devices | Good for single child |
| **Premium** | Unlimited | Family-friendly |
| **Family** | Unlimited | Advanced features |
| **Enterprise** | Unlimited | Bulk deployment |

### Technical Limits

**Code Generation:**
- No limit on codes generated per day
- Old codes expire after 10 minutes
- System handles thousands of concurrent pairings

**Device Re-Pairing:**
- Can unpair and re-pair unlimited times
- No penalty or delay
- Fresh sync with each pairing

## Pairing API Reference

### POST /api/launcher/pair

**Request:**
```json
{
  "pairing_code": "472916",
  "device_id": "android_unique_device_id",
  "kid_profile_id": 42
}
```

**Success Response (200):**
```json
{
  "success": true,
  "auth_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "device_name": "Device #3",
  "kid_profile": {
    "id": 42,
    "name": "Emma"
  }
}
```

**Error Responses:**
```json
// Invalid code
{
  "detail": "Invalid or expired pairing code"
}

// Profile not found
{
  "detail": "Kid profile not found"
}

// Device already paired
{
  "detail": "This device is already paired"
}
```

---

The Axolotly device pairing system prioritizes simplicity and security, enabling parents to connect devices in seconds while maintaining robust authentication and device management.
