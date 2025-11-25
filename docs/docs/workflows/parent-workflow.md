# Parent Workflow

This page walks through the complete parent user journey from account creation to daily content management.

## Initial Setup

### Step 1: Create Account

**Action:** Visit Axolotly homepage, click "Sign Up"

**Required Information:**
- Email address
- Password (min. 8 characters)
- Confirm password

**Process:**
1. Submit registration form
2. Password hashed with bcrypt
3. JWT token generated
4. Automatic login to parent dashboard

**Time:** ~1 minute

### Step 2: Select Streaming Services

**Action:** Navigate to "My Services" tab

**Task:** Select which streaming services your family subscribes to

**Available Options:**
- ☑ Netflix
- ☑ Disney+
- ☑ Hulu
- ☑ Prime Video
- ☑ Max
- ☑ Peacock
- ☑ YouTube

**Impact:** Search results will only show content available on selected services

**Time:** ~30 seconds

### Step 3: Create Kid Profile(s)

**Action:** Navigate to "Profiles" tab, click "Create Profile"

**Required Information:**
- Child's name
- 4-digit PIN (for launcher login)

**Optional Information:**
- Child's age
- Profile avatar/color

**Tips:**
- Use simple PINs kids can remember (1234, 2468, etc.)
- Create separate profiles for each child
- Different ages → different content preferences

**Time:** ~1 minute per profile

## Content Curation

### Search & Discover Content

**Scenario:** Finding age-appropriate content for your child

**Step 1: Search**
1. Navigate to "Search" tab
2. Enter search term (e.g., "Bluey")
3. Results appear in real-time
4. Only content from selected services shown

**Step 2: Review Content**
1. Click any title to open detailed modal
2. Read plot synopsis
3. Check TMDB rating
4. Review automatically applied content tags
5. For TV shows: browse episodes by season

**Step 3: Make Decision**
1. Click "Allow Title" to approve
2. Or click "Deny Title" to block
3. For TV shows: optionally block specific episodes

**Example Use Cases:**

**Allow Entire Series:**
```
Search: "Bluey"
Review: G-rated, family-friendly, preschool content
Decision: Allow all episodes
Action: Click "Allow Title"
Time: 30 seconds
```

**Allow Series, Block Specific Episode:**
```
Search: "Bluey"
Review: Mostly appropriate, but S2E14 "The Show" scary for 5-year-old
Decision: Allow series, block S2E14
Action: Click "Allow Title", then navigate to S2E14, click "Block Episode"
Time: 2 minutes
```

**Block by Content Tag:**
```
Search: "Avatar The Last Airbender"
Review: Excellent show, but contains violence
Decision: Check "Violence" tag → see 12 episodes affected
Action: Block all episodes tagged with "Violence"
Time: 1 minute
```

### Tag-Based Blocking Strategy

**Recommended Workflow:**

**Step 1: Identify Sensitive Tags**
- Review tag list
- Select tags concerning for your child
- Common examples: `monsters`, `scary-themes`, `violence`, `mild-language`

**Step 2: Apply Tag Filters**
- When allowing titles, click tags to see affected episodes
- Block all episodes with sensitive tags
- New episodes automatically inherit tag-based blocking

**Step 3: Adjust Over Time**
- As child matures, remove tag restrictions
- Add new restrictions if needed
- Tags persist across all content

**Example Tag Strategy by Age:**

**Ages 3-5:**
- Block: `monsters`, `scary-themes`, `moderate-peril`, `death-references`
- Allow: `preschool`, `very-mild`, `animals`, `friendship`

**Ages 6-8:**
- Block: `violence`, `scary-themes`, `strong-language`
- Allow: `young-kids`, `mild`, `adventure`, `fantasy`

**Ages 9-12:**
- Block: `strong-language`, `romance` (optional)
- Allow: `older-kids`, `tweens`, `moderate`, `science-fiction`

## Device Pairing

### Pair Android Launcher Device

**Scenario:** Setting up tablet for child to access approved content

**Step 1: Generate Pairing Code (Dashboard)**
1. Navigate to "Devices" tab
2. Click "Pair New Device"
3. 6-digit code appears (valid 10 minutes)
4. Keep dashboard open

**Step 2: Enter Code (Android Device)**
1. Install Axolotly Launcher APK on Android device
2. Set as default launcher (Android settings)
3. Open launcher
4. Enter 6-digit code when prompted
5. Select kid profile to pair

**Step 3: Confirm Pairing (Dashboard)**
1. New device appears in device list
2. Click "Rename" to give friendly name (e.g., "Emma's Tablet")
3. Device now syncs approved content automatically

**Total Time:** < 30 seconds  
**Complexity:** Very Low

**Troubleshooting:**
- Code expired? Generate new code
- Device not appearing? Check internet connection
- Wrong profile selected? Unpair and re-pair

## Daily Management

### Quick Allow Workflow

**Scenario:** Child asks "Can I watch X?"

**Fast Path:**
1. Open dashboard on phone
2. Search for title
3. Review tags and rating
4. Allow or deny with single click
5. Content syncs to launcher within 5 minutes

**Time:** ~30 seconds

### Episode-by-Episode Review

**Scenario:** Show has mixed content quality

**Detailed Review Workflow:**
1. Search and allow title
2. Open content modal
3. Browse episodes season-by-season
4. Read episode overviews
5. Check episode-specific tags
6. Block concerning episodes individually
7. Save changes

**Time:** 5-10 minutes for full series review

### Removing Content

**Scenario:** Child has outgrown content or parents change mind

**Actions:**
1. Navigate to "Policies" tab
2. Find title in approved list
3. Click "Deny" button
4. Confirm removal
5. Content removed from launcher immediately

### Device Management Tasks

**Weekly Tasks:**
- Check device last active timestamps
- Verify content syncing properly
- Review any reported issues

**Monthly Tasks:**
- Unpair lost/replaced devices
- Update device names if needed
- Review device usage patterns

## Advanced Workflows

### Multi-Child Families

**Scenario:** Different content for different ages

**Strategy:**
1. Create profile for each child
2. Search content once
3. Allow for older child, deny for younger
4. Or allow for both, but block episodes for younger child using tags
5. Each launcher device paired to specific profile

**Example:**
- Emma (8) - allowed "Avatar: The Last Airbender" (all episodes)
- Liam (5) - allowed "Avatar: The Last Airbender" (violence episodes blocked)

### Shared Devices

**Scenario:** Family tablet used by multiple children

**Options:**

**Option 1: Pair to Youngest Child**
- Most restrictive content
- All children can use safely
- Older children may be bored

**Option 2: Profile Switching (Roadmap)**
- Device supports multiple profiles
- PIN required to switch
- Content adapts to active profile

### Content Discovery Strategies

**Trusted Source Method:**
- Find recommendations from parenting blogs
- Common Sense Media ratings
- Search for specific recommended titles
- Pre-approve before child requests

**Child-Requested Method:**
- Wait for child to ask
- Research on-demand
- Make decision quickly
- Explain reasoning to child

**Batch Approval Method:**
- Set aside time weekly
- Browse popular content
- Pre-approve multiple titles
- Build content library proactively

## Reporting Issues

### Content Reporting Workflow

**When to Report:**
- Tags incorrect or missing
- Episode-level tags wrong
- Content inappropriately rated
- Technical issues with deep links

**How to Report:**
1. Open content modal
2. Click "Report Content"
3. Select issue type
4. Describe problem
5. Submit to admin queue

**Admin Review:**
- Reports reviewed within 48 hours
- Tags updated if needed
- Notification sent when resolved

## Time Investment

### Initial Setup Time

- Account creation: 1 minute
- Service selection: 30 seconds
- First kid profile: 1 minute
- Additional profiles: 1 minute each
- First device pairing: 2 minutes
- Initial content curation (10-20 titles): 30-60 minutes

**Total Initial Time:** ~1 hour

### Ongoing Time Investment

**Weekly:**
- New content requests: 2-5 minutes
- Policy adjustments: 5 minutes
- Device monitoring: 1 minute

**Monthly:**
- Batch content review: 15-30 minutes
- Tag strategy adjustments: 10 minutes
- Device maintenance: 5 minutes

**Total Ongoing Time:** ~30 minutes/month

## Decision-Making Framework

### Should I Allow This Content?

**Factors to Consider:**
1. **TMDB Rating:** Is it age-appropriate?
2. **Content Tags:** Any concerning themes?
3. **Your Values:** Aligns with family beliefs?
4. **Child Maturity:** Can they handle this content?
5. **Context:** Watching alone vs with family?

**Trust Your Instincts:**
- You know your child best
- Axolotly provides data, you make decision
- Can always reverse decisions
- Tags help but aren't perfect

### When in Doubt

**Conservative Approach:**
- Start with "Deny"
- Research more thoroughly
- Watch first episode yourself
- Allow if comfortable

**Progressive Approach:**
- Allow with episode-level blocks
- Monitor child's reactions
- Adjust based on feedback
- Use tags liberally

## Best Practices

### Content Curation Tips

✅ **Start Conservative**
- Easier to expand than restrict
- Builds trust with child
- Prevents overexposure

✅ **Use Tags Effectively**
- Identify your child's specific sensitivities
- Block tags instead of individual episodes
- Review tag effectiveness regularly

✅ **Communication with Child**
- Explain why content is blocked
- Involve older children in decisions
- Teach media literacy

✅ **Regular Reviews**
- Children mature, so revisit policies
- Remove restrictions as appropriate
- Add content proactively

### Device Management Tips

✅ **Clear Naming**
- Name devices by owner or location
- Makes management easier
- Reduces confusion

✅ **Periodic Audits**
- Check device list monthly
- Unpair unused devices
- Verify last active timestamps

✅ **Security Practices**
- Use unique PINs per child
- Never share pairing codes
- Unpair before selling devices

---

The parent workflow is designed to be efficient and flexible, allowing you to invest time upfront in curation while minimizing daily management overhead.
