# Child Workflow

This page describes the user experience from a child's perspective when using the Axolotly Kids Launcher.

## First-Time Setup

### Step 1: Device Pairing

**Context:** Parent has already generated pairing code in dashboard

**Child's Actions:**
1. Parent hands child the Android device
2. Axolotly Launcher is already installed and set as default home screen
3. Launcher prompts for 6-digit pairing code
4. Child (or parent) enters the code
5. Launcher connects to parent's account

**User Experience:**
- Simple numeric keypad interface
- Large, colorful buttons
- Friendly welcome message
- No complex setup required

**Time:** ~15 seconds

### Step 2: Profile Selection

**After Pairing:**
1. Launcher shows available profiles (if multiple kids in family)
2. Child sees their name with avatar/icon
3. Child taps their profile card
4. Prompted for 4-digit PIN

**User Experience:**
- Visual profile cards with names
- Simple number pad for PIN entry
- No typing required
- Encourages independence

**Time:** ~10 seconds

### Step 3: First Launch

**Upon Successful Login:**
1. Launcher displays grid of approved content
2. Colorful poster images fill screen
3. Simple, uncluttered interface
4. No confusing menus or navigation

**Child's Reaction:**
- "Wow, I can watch these shows!"
- Immediate visual appeal
- Sense of ownership and choice within boundaries

## Daily Usage

### Browsing Content

**Typical Scenario:** Child wants to watch something

**Visual Experience:**
```
┌─────────────────────────────────────────┐
│  [Bluey]  [Frozen]  [Moana]             │
│                                         │
│  [Toy Story]  [Encanto]  [WALL-E]       │
│                                         │
│  [Inside Out]  [Coco]  [Soul]           │
└─────────────────────────────────────────┘
```

**Child's Actions:**
1. Scroll through visual grid
2. See familiar posters and titles
3. Tap any content card
4. Content launches immediately

**What They See:**
- Only approved content (blocked content invisible)
- High-quality poster images
- Title text in readable font
- Media type badges (Movie/TV Show)

**What They Don't See:**
- Blocked content
- Adult content
- Inappropriate suggestions
- Confusing navigation

### Launching Content

**Simple Tap-to-Launch:**

**Step 1: Selection**
- Child taps "Bluey" card

**Step 2: Deep Link Magic**
- Launcher finds Season 1 Episode 1 deep link
- Constructs Disney+ URL
- Launches Disney+ app automatically

**Step 3: Immediate Playback**
- Disney+ opens directly to Bluey S1E1
- Episode begins playing
- No searching, no menus

**Child's Experience:**
- "I tapped Bluey and it started playing!"
- One action → immediate result
- No friction or frustration

### Switching Between Content

**Scenario:** Child wants to watch different show

**Actions:**
1. Tap home button (or swipe up, depending on Android version)
2. Launcher reappears with content grid
3. Tap new content card
4. New streaming app launches

**Experience:**
- Easy to switch between shows/movies
- Launcher always accessible
- Cannot get "lost" in other apps

## Content Discovery

### Limited Discovery (By Design)

**Child's Perspective:**
- Sees grid of approved content
- Can scroll to see all available titles
- No search function (prevents discovering blocked content)
- No recommendations from streaming apps

**Benefits:**
- Reduces decision fatigue
- Prevents exposure to inappropriate content
- Encourages watching parent-approved content
- Creates sense of curated library

### When New Content is Added

**Scenario:** Parent adds "Frozen 2" to approved list

**Child's Experience:**
1. Launcher auto-refreshes every 5 minutes
2. "Frozen 2" appears in grid automatically
3. No notification needed
4. Child discovers organically during browsing

**Emotional Response:**
- Pleasant surprise
- Sense of growing library
- Positive reinforcement

## Blocked Content Handling

### Invisible Blocking

**What Happens:**
- Blocked content simply doesn't appear in launcher
- Child has no idea it exists
- No "blocked" messages or warnings

**Why This Approach:**
- No temptation
- No arguments ("Why can't I watch X?")
- Creates positive environment
- Reduces parent-child conflict

### Episode-Level Blocking (Current Limitation)

**Current Behavior:**
- Show appears in launcher (e.g., "Bluey")
- Tap launches S1E1 (always allowed)
- Child can navigate within app to other episodes
- If they access blocked episode → depends on streaming app's parental controls

**Future Enhancement:**
- Episode-specific deep links
- In-launcher episode selection
- Blocked episodes grayed out
- "Ask parent" button for blocked episodes

## PIN-Based Access

### Profile Login

**Secure but Simple:**
- 4-digit PIN (easy to remember)
- Number pad interface
- No password complexity requirements
- Parents can reset if forgotten

**Use Cases:**
- Daily login after device restart
- Switching between sibling profiles
- After inactivity timeout

**Child's Perspective:**
- "My special code to watch my shows"
- Sense of ownership
- Simple enough for young kids (4+)

### Profile Switching (Roadmap)

**Future Scenario:** Siblings sharing tablet

**Planned Flow:**
1. Emma finishes watching, taps "Switch Profile"
2. Launcher shows profile selection screen
3. Liam taps his profile, enters his PIN
4. Launcher reloads with Liam's approved content

**Benefits:**
- One device, multiple children
- Each sees their own content
- No manual parent intervention

## Errors & Edge Cases

### No Internet Connection

**Current Behavior:**
- Launcher shows last cached content list
- Tapping content attempts to launch app
- Streaming app handles offline status

**Future Enhancement:**
- Offline indicator
- "No Internet" friendly message
- Downloaded content support

### Streaming App Not Installed

**Current Behavior:**
- Deep link fails silently
- Android may prompt to install app
- Depends on device configuration

**Future Enhancement:**
- Check for app installation before showing content
- "Ask parent to install app" message
- Only show content for installed apps

### Device Unpaired

**Behavior:**
- Launcher shows "Not Paired" screen
- No content accessible
- Prompts for new pairing code

**Child's Action:**
- Ask parent to re-pair device

## Child's Emotional Journey

### Positive Experiences

**Empowerment:**
- "I can choose what to watch"
- Independence within safe boundaries
- Sense of trust from parents

**Simplicity:**
- "It just works"
- No confusion or frustration
- Immediate gratification

**Discovery:**
- New content appearing over time
- Pleasant surprises
- Growing library

### Potential Frustrations

**Limited Choice (By Design):**
- May see friends watching content they can't
- "Why can't I watch X?" conversations with parents

**Mitigation Strategies:**
- Parent communication: Explain age-appropriateness
- Gradual expansion: Unlock content as child matures
- Alternative suggestions: Offer similar approved content

## Age-Appropriate Usage

### Preschoolers (Ages 3-5)

**Capabilities:**
- Can navigate visual grid
- Can enter simple 4-digit PIN (with practice)
- May need parent help launching first few times

**Typical Behavior:**
- Re-watch favorite shows repeatedly
- Limited exploration
- Quick to learn tap-to-launch

### Young Kids (Ages 6-8)

**Capabilities:**
- Independent navigation
- Remembers PIN easily
- Explores full content library

**Typical Behavior:**
- Cycles through favorites
- Watches new content when added
- May request specific titles

### Older Kids (Ages 9-12)

**Capabilities:**
- Fully independent usage
- May understand system limitations
- Could potentially attempt bypass (hence launcher enforcement)

**Typical Behavior:**
- More diverse content consumption
- May negotiate for specific content
- Respects boundaries (if well communicated)

## Safety Features (From Child's Perspective)

### Cannot Bypass

**Launcher as Home Screen:**
- Pressing home button → back to launcher
- Cannot access Android settings easily
- Cannot uninstall launcher without parent PIN

**Child's Perspective:**
- Launcher is "the device"
- No awareness of broader Android system
- Clear boundaries

### No External Access

**Isolation:**
- No web browser in launcher
- No app store access
- No messaging or social media
- Only approved streaming content

**Result:**
- Safe, controlled environment
- Parents confident in device safety
- Child enjoys media without risks

## Educational Opportunities

### Media Literacy (Parental Guidance)

**Teachable Moments:**
- Discuss why certain content is blocked
- Explain age-appropriateness
- Build critical thinking about media

**Parent-Child Conversation:**
```
Child: "Why can't I watch that scary movie?"
Parent: "That movie has monsters that might give you nightmares. 
         When you're older and not as scared, we can watch it together."
Child: "Oh, okay. Can I watch Moana instead?"
Parent: "Yes, Moana is perfect for you!" (adds to approved list)
```

### Gradual Independence

**Growing with Child:**
- Start restrictive (ages 3-5)
- Gradually expand library (ages 6-8)
- Involve child in decisions (ages 9-12)
- Build trust and responsibility

## Comparison to Traditional TV

### Traditional Cable TV

**Old Model:**
- 100s of channels
- No curation
- Channel surfing
- Accidental exposure to inappropriate content

### Axolotly Launcher

**New Model:**
- Curated grid of approved content
- Intentional selection
- No surfing or accidental discovery
- Safe browsing experience

**Child's Benefit:**
- Better content quality
- Less decision fatigue
- More engaged viewing
- Safer media environment

---

The child's experience with Axolotly is designed to be simple, safe, and empowering, providing independence within carefully controlled boundaries set by parents.
