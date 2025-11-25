# Content Management

Axolotly's content management system provides granular control over media access, from show-level to episode-level blocking, powered by TMDB integration and intelligent automation.

## Content Sources

### TMDB Integration

**The Movie Database (TMDB)** is the primary source for all content metadata:

**What TMDB Provides:**
- 1M+ movie and TV show titles
- High-quality poster and backdrop images
- Plot synopses and overviews
- Release dates and ratings
- Genre classifications
- Season and episode data
- Cast and crew information

**How Axolotly Uses TMDB:**
- Real-time search for content discovery
- Automatic metadata sync for approved titles
- Genre-to-tag mapping for automated tagging
- Episode loading with full metadata (thumbnails, air dates, descriptions)
- Nightly sync of popular titles

### Streaming Service Data

**Movie of the Night API** provides streaming availability:

**Data Provided:**
- Which services have each title (Netflix, Disney+, etc.)
- Season 1 Episode 1 deep links
- Platform-specific streaming URLs
- Geographic availability (US focus)

**Integration Points:**
- Episode 1 backfill for immediate playback
- Service-based content filtering
- Deep link generation for launcher devices

## Content Tagging System

### Automated Tag Generation

When a title is added to the system, 72+ content tags are automatically applied based on TMDB data:

**Source Data:**
- **Genres:** TMDB genre classifications
- **Ratings:** MPAA/TV ratings (G, PG, PG-13, R)
- **Metadata:** Keywords, themes, content descriptors

**Tag Categories:**

#### Content Warnings (24 tags)
- `violence` - Depictions of physical conflict
- `mild-violence` - Cartoon or minimal violence
- `intense-action` - High-intensity action sequences
- `monsters` - Scary creatures or monsters
- `scary-themes` - Frightening or suspenseful content
- `mild-peril` - Low-stakes danger
- `moderate-peril` - Medium-stakes danger
- `death-references` - References to death
- `injury-depiction` - Characters getting hurt
- `crude-humor` - Bathroom or bodily humor
- `mild-language` - Mild profanity
- `strong-language` - Explicit language
- `romance` - Romantic themes
- `kissing` - Romantic physical affection
- `supernatural` - Ghosts, spirits, magic
- `weapon-use` - Guns, swords, weapons shown

#### Age Appropriateness (5 tags)
- `preschool` - Ages 2-4
- `young-kids` - Ages 5-7
- `older-kids` - Ages 8-10
- `tweens` - Ages 11-12
- `teens` - Ages 13+

#### Intensity Levels (4 tags)
- `very-mild` - G-rated content
- `mild` - PG-rated content
- `moderate` - PG-13 content
- `strong` - R-rated content

#### Themes (20+ tags)
- `fantasy` - Fantasy worlds, magic
- `science-fiction` - Sci-fi themes
- `adventure` - Adventure stories
- `comedy` - Humorous content
- `educational` - Learning content
- `historical` - Historical settings
- `documentary` - Documentary format
- `musical` - Music-focused content
- `sports` - Sports themes
- `animals` - Animal characters or focus
- `friendship` - Friendship themes
- `family` - Family-oriented content
- `coming-of-age` - Growing up stories
- `mystery` - Mystery/detective stories

#### Additional Categories
- Specific phobia tags (spiders, heights, water, etc.)
- Cultural content (religious themes, cultural references)
- Environmental themes (nature, conservation)
- Social-emotional learning tags

### Manual Tag Assignment

Parents and admins can manually add or remove tags:

**Use Cases:**
- Correction of automated tags
- Adding nuanced tags not detected automatically
- Episode-specific tagging
- Custom family-specific tags (future roadmap)

**Manual Tagging Flow:**
1. Navigate to title in dashboard
2. Open content action modal
3. Click "Edit Tags" button
4. Select/deselect tags from full list
5. Save changes

### Episode-Level Tagging

TV shows support episode-specific content tagging:

**Fandom Wiki Integration:**
- Scrapes episode-level content warnings from Fandom wikis
- MediaWiki API extracts structured data
- Automated tag assignment per episode
- Manual verification by admins

**Episode Tag Display:**
- Episode browser shows tags per episode
- Clickable tags in title view show affected episodes
- Visual indicators (e.g., "Violence - 3 episodes")
- Filter episodes by tag presence

**Example Use Case:**
- *Bluey* generally safe for all ages
- *S2E14 "The Show"* contains nightmare-inducing content
- Admin tags this episode with `scary-themes`, `monsters`
- Parent blocks episodes with `monsters` tag
- S2E14 automatically blocked, rest of series allowed

## Policy Management

### Title-Level Policies

Parents can allow or deny entire titles:

**Allow Title:**
- Adds title to approved content list
- Appears in kids launcher
- All episodes accessible (unless specifically blocked)
- Deep link to S1E1 provided

**Deny Title:**
- Removes from approved content
- Hidden from kids launcher
- Optionally log reason for denial
- Can be reversed anytime

### Episode-Level Policies

For TV shows, parents can control individual episodes:

**Episode Blocking Methods:**

1. **Manual Episode Selection**
   - Browse episodes in content action modal
   - Toggle allow/deny for each episode
   - Visual indicators show status

2. **Tag-Based Blocking**
   - Click tag in content view
   - See all episodes with that tag
   - Block all episodes with specific tag
   - Automatically applies to new episodes

**Example Workflow:**
1. Parent allows "Bluey" (all episodes)
2. Clicks "Monsters" tag in content modal
3. Sees "3 episodes have this tag"
4. Chooses to block all "Monsters" episodes
5. S2E14 and 2 others automatically blocked

### Policy Inheritance

Policies are profile-specific but can be templated:

**Per-Profile Policies:**
- Each child can have different allowed content
- Same title can be allowed for one child, denied for another
- Episode blocks can vary per profile

**Future: Policy Templates**
- Save policy sets as templates
- Apply template to new profiles
- Share templates with community
- Age-based recommended templates

## Automated Content Discovery

### Nightly Sync

APScheduler runs background tasks to discover and cache content:

**Popular Title Sync:**
- Runs daily at midnight
- Fetches TMDB "popular" movies and TV shows
- Caches metadata in database
- Applies automated tags
- Loads episode data for TV shows

**Benefits:**
- Faster search (cached data)
- Reduced TMDB API calls
- Pre-tagged content ready to use
- Better user experience

### Episode Loading

When a TV show is added to a policy, episodes load automatically:

**Background Process:**
1. Title added to policy
2. Async task fetches all seasons/episodes from TMDB
3. Episode metadata loaded (titles, air dates, overviews, thumbnails)
4. Episodes stored in database
5. Parent notified when complete (roadmap)

**Current Scale:**
- 1,880+ episodes loaded across all TV shows
- Full metadata for each episode
- Thumbnail images for visual episode browser

## Content Reporting

Parents can report content issues to improve system accuracy:

### Report Types

**Incorrect Tags:**
- Tags incorrectly applied or missing
- Episode-level tag errors
- Fandom data inaccuracies

**Inappropriate Content:**
- Content that shouldn't be in system
- Mislabeled ratings or metadata
- Age-inappropriate material

**Technical Issues:**
- Broken deep links
- Missing posters or images
- Metadata errors

### Report Workflow

1. Parent clicks "Report Content" in title modal
2. Selects issue type from dropdown
3. Provides description
4. Submits report to admin queue
5. Admin reviews and takes action
6. Parent receives status update (roadmap)

## Content Curation Strategies

### Recommended Approaches

**Conservative Approach:**
- Start with nothing allowed
- Manually approve each title
- Use tag-based blocking extensively
- Review new content weekly

**Liberal Approach:**
- Allow most content by default
- Block specific problematic titles
- Trust automated tagging
- Adjust based on child's reactions

**Tag-First Approach:**
- Identify sensitive tags for your child (e.g., `monsters`, `scary-themes`)
- Block those tags across all content
- Allow titles freely, knowing tag filters protect
- Adjust tags as child matures

**Service-Based Approach:**
- Select subscribed services only
- Allow all content on trusted services (e.g., Disney+)
- Manually review other services
- Use service quality as proxy for appropriateness

## Data Management

### Title Metadata

Stored in PostgreSQL `titles` table:

```
- tmdb_id (unique identifier)
- title (name of movie/show)
- media_type (movie or tv)
- overview (plot synopsis)
- poster_path (TMDB image URL)
- backdrop_path (TMDB image URL)
- release_date (or first_air_date)
- rating (TMDB score out of 10)
- genres (array of genre objects)
- providers (array of streaming services)
- tags (array of applied tags)
- last_synced (timestamp)
```

### Episode Metadata

Stored in `episodes` table:

```
- tmdb_episode_id (unique identifier)
- title_id (foreign key to titles)
- season_number
- episode_number
- name (episode title)
- overview (episode plot)
- air_date
- thumbnail_path (TMDB image)
- tags (array of episode-specific tags)
```

### Policy Storage

Stored in `kid_profiles_titles` junction table:

```
- kid_profile_id
- title_id
- policy (allow/deny)
- blocked_episodes (array of episode IDs)
```

## Performance Optimizations

### Caching Strategy

- **TMDB Results:** Cached in database on first search
- **Episode Data:** Loaded once, stored permanently
- **Tag Assignments:** Computed once, stored with title
- **Deep Links:** Crowdsourced, cached indefinitely

### API Rate Limiting

- **TMDB API Limit:** 40 requests/10 seconds
- **Axolotly Approach:** Cache aggressively, batch requests
- **Nightly Sync:** Spreads load across 24 hours
- **User Impact:** Zero (always hits cache)

## Future Enhancements

🔮 **AI-Powered Tagging**
- Machine learning to analyze plot summaries
- Automated detection of nuanced themes
- Improved tag accuracy over time

🔮 **Community Tag Voting**
- Parents vote on tag accuracy
- Crowdsourced tag refinement
- Trust scores for tagging contributors

🔮 **Custom Tags**
- Family-specific tags
- Personal content descriptors
- Share custom tags with community

🔮 **Content Recommendations**
- "Similar to..." suggestions
- Age-appropriate recommendations
- Based on allowed content patterns

---

Axolotly's content management system balances automation with parental control, providing intelligent defaults while always allowing manual override for family-specific needs.
