# Movie of the Night API Integration

Movie of the Night (Streaming Availability API) provides verified deep links for Season 1 Episode 1 of TV shows, enabling immediate playback on launcher devices.

## Overview

**Movie of the Night API** delivers:
- Episode 1 deep links for all TV shows
- Streaming platform availability
- Geographic-specific URLs
- Verified, working links

## Use Case

**Immediate Playback:**
When a child taps a TV show in the launcher:
1. Launcher reads S1E1 deep link from cache
2. Constructs platform-specific URL
3. Launches streaming app with deep link
4. Episode begins playing instantly

## Integration Method

### One-Time Backfill

**Admin Dashboard Feature:**
- "Backfill Episode 1 Deep Links" button
- Fetches S1E1 links for all TV shows
- Stores in `episode_links` table
- Makes available to all users

### API Endpoint

```
GET https://streaming-availability.p.rapidapi.com/get
```

**Parameters:**
- `tmdb_id` - TMDB identifier
- `country` - "us" (United States)
- `output_language` - "en"

**Response:**
Contains streaming platform URLs for S1E1

## Rate Limits

**Free Tier:**
- 100 requests/day

**Basic Tier:**
- 1000 requests/day

**Strategy:**
- One-time backfill (not recurring)
- Cache results permanently
- Supplement with crowdsourced links

## Crowdsourced Fallback

If MOTN link unavailable:
- Use community-reported deep links
- Devices submit discovered URLs
- Verified by admin
- Shared across all users

---

Movie of the Night integration enables the "tap-to-launch" experience that makes Axolotly's kids launcher magical and effortless.
