# Parent Dashboard

The Parent Dashboard is the central control interface where parents manage all aspects of their children's media access. Built with Next.js and React, it provides a modern, intuitive experience for content curation and policy management.

## Dashboard Overview

The parent dashboard is organized into multiple tabs, each serving a specific function:

| Tab | Purpose | Key Actions |
|-----|---------|-------------|
| **Search** | Discover and manage content | Search TMDB, allow/deny titles, view details |
| **Policies** | View all approved/denied content | Browse policies, remove content, manage tags |
| **Profiles** | Manage kid profiles | Create profiles, set PINs, assign content |
| **Devices** | Pair and manage launcher devices | Generate pairing codes, rename devices, view status |
| **My Services** | Select streaming subscriptions | Choose services, filter content discovery |

## Content Discovery & Search

### TMDB Real-Time Search

Parents can search The Movie Database (TMDB) for movies and TV shows with real-time results:

**Search Features:**
- **Instant Search:** Results appear as you type
- **Media Type Filter:** Movies only, TV shows only, or both
- **Service Filter:** Show only content from subscribed services
- **Rich Results:** Poster images, titles, release dates, ratings

**Search Flow:**
1. Enter search query (e.g., "Bluey")
2. Filter by media type if desired
3. Browse results with visual cards
4. Click any result to open Content Action Modal

### Content Action Modal

When a title is clicked, a detailed modal appears with comprehensive information:

**Title Information:**
- High-quality poster image
- Full plot synopsis/overview
- Release date or first air date
- TMDB rating (out of 10)
- Media type (Movie or TV Show)

**Episode Browser** (TV Shows Only):
- Season selector dropdown
- Episode grid with thumbnails
- Episode titles, numbers, and air dates
- Individual episode allow/deny controls
- Blocked episode indicators

**Content Tags:**
- All applicable tags displayed as badges
- Clickable tags show which episodes are blocked by that tag
- Visual count indicators (e.g., "Violence (3 episodes blocked)")
- Automated tags from TMDB genres/ratings

**Actions:**
- **Allow Title:** Add to approved content
- **Deny Title:** Block entire title
- **Episode Control:** Allow/deny specific episodes
- **Close:** Return to search

## Policy Management

The Policies tab provides a complete overview of all content decisions:

### Approved Content List
- All allowed titles displayed with posters
- Episode count for TV shows
- Quick deny button
- Service badges showing where content is available

### Denied Content List
- All blocked titles
- Reason for denial (if tagged)
- Quick allow button to reverse decision

### Bulk Actions
- Clear all policies (with confirmation)
- Export policies for backup
- Import policies from file

## Profile Management

Create and manage individual profiles for each child:

### Creating Profiles

**Required Information:**
- Child's name
- 4-digit PIN (for launcher access)
- Optional: age, profile picture

**Profile Settings:**
- Rename profile
- Change PIN
- Delete profile (requires confirmation)
- View assigned content

### Profile-Specific Policies

Each profile has independent content policies:
- Same title can be allowed for one child, denied for another
- Episode-level differences per profile
- Tag-based filtering per child

**Use Case Example:**
- *Emma (age 8)*: Bluey allowed, all episodes
- *Liam (age 5)*: Bluey allowed, S2E14 blocked (nightmares)

## Device Management

Manage all paired Android launcher devices from one interface:

### Pairing New Devices

**3-Step Pairing Flow:**

1. **Generate Pairing Code**
   - Click "Pair New Device" button
   - System generates 6-digit code
   - Code valid for 10 minutes

2. **Enter Code on Device**
   - Open Axolotly Launcher on Android device
   - Enter 6-digit code
   - Select child profile

3. **Confirm Pairing**
   - Device appears in dashboard
   - Assign friendly name (e.g., "Emma's Tablet")
   - Pairing complete

### Managing Paired Devices

**Device List View:**
- Device friendly name
- Paired date
- Last active timestamp
- Rename option
- Unpair option

**Device Actions:**
- **Rename:** Change device friendly name
- **Unpair:** Remove device access (requires confirmation)
- **View Activity:** See recent content accessed (roadmap)

## Streaming Service Selection

### My Services Tab

Parents select which streaming services they subscribe to:

**Available Services:**
- ☑ Netflix
- ☑ Disney+
- ☑ Hulu
- ☑ Prime Video
- ☑ Max
- ☑ Peacock
- ☑ YouTube

**Features:**
- Toggle checkboxes to select/deselect
- Save button to confirm selections
- Persistent storage per family

**Impact of Service Selection:**
- Search results automatically filtered to show only titles on selected services
- No more wasted time searching for unavailable content
- If no services selected, all content shown (backward compatible)

### Service-Based Content Filtering

When services are selected, the search experience changes:

**Before Service Selection:**
- Search "Frozen" → shows Frozen on Disney+, Hulu, other services
- Parent might not have Disney+, sees content they can't access

**After Service Selection (Disney+ only):**
- Search "Frozen" → shows Frozen on Disney+ only
- Parent only sees content they can actually watch
- Streamlined discovery experience

## Content Reporting

Parents can report inappropriate or incorrectly tagged content:

### Report Submission

**Report Form:**
- Select content title
- Choose issue type (incorrect tags, inappropriate content, technical issue)
- Provide description
- Submit to admin queue

**Report Tracking:**
- View submitted reports
- See admin response status
- Receive notifications when resolved

### Admin Review

Reports are reviewed by admin users in the admin dashboard:
- Content tag corrections
- Episode warning updates
- Content removal if necessary

## Dashboard UI/UX

### Design Principles

**Color Scheme:**
- Primary: Coral pink (#F77B8A)
- Accent: Blue (#688AC6)
- Matches kids launcher aesthetic
- Friendly, approachable feel

**Layout:**
- Tab-based navigation
- Card-based content display
- Responsive design (mobile, tablet, desktop)
- Rounded corners throughout

**User Experience:**
- Minimal clicks to accomplish tasks
- Visual feedback for all actions
- Confirmation for destructive actions
- Loading states for async operations

### Mobile Responsiveness

The dashboard is fully responsive:
- **Desktop:** Full tab layout, multi-column grids
- **Tablet:** Adapted grid sizes, touch-optimized
- **Mobile:** Stacked layout, single-column grids, large touch targets

## Security Features

### Authentication

- **JWT-Based Login:** Email and password required
- **Session Management:** Tokens expire after inactivity
- **Role Validation:** Parent role required for dashboard access

### Data Protection

- **HTTPS Only:** All traffic encrypted
- **CORS Protection:** API calls restricted to trusted origins
- **Input Validation:** All user input sanitized

## Performance Optimizations

### Frontend Optimizations

- **React Server Components:** Fast initial page loads
- **Client-Side Caching:** Search results cached locally
- **Lazy Loading:** Images and modals loaded on demand
- **Debounced Search:** Reduces unnecessary API calls

### API Optimizations

- **TMDB Caching:** Content metadata cached in database
- **Batch Operations:** Episode loading happens in background
- **Optimized Queries:** Database indexes for fast lookups

## Keyboard Shortcuts (Roadmap)

Planned keyboard shortcuts for power users:

- `CMD/CTRL + K`: Open search
- `CMD/CTRL + N`: New profile
- `CMD/CTRL + P`: Pair device
- `ESC`: Close modal

## Accessibility Considerations

- **Semantic HTML:** Proper heading hierarchy
- **ARIA Labels:** Screen reader friendly
- **Keyboard Navigation:** All actions accessible via keyboard
- **Color Contrast:** WCAG AA compliant

---

The Parent Dashboard balances power and simplicity, giving parents the tools they need to create personalized digital environments for their children without overwhelming them with complexity.
