# Axolotly — Product Context for Claude

## What Axolotly Is

Axolotly is a title-level content curation platform with app-level device lockdown. Parents hand-pick the exact TV shows and movies their child can access. Those titles — and only those titles — appear on the child's device. The child never sees a streaming app's interface, never browses a catalog, and never encounters content their parent didn't explicitly choose.

This is not app filtering. This is not age-rating enforcement. This is individual title selection with full device lockdown.

---

## How It Works — The Full Flow

### 1. Parent Curates a Title Library

The parent opens the Axolotly dashboard (web app) and browses a content library powered by TMDB. They search for specific TV shows and movies, review metadata (ratings, tags, episode details), and select the exact titles they want their child to have access to.

**What the parent is choosing:**
- Individual TV series (e.g., Bluey, Paw Patrol, Sesame Street)
- Individual movies (e.g., Frozen, Moana, Toy Story)
- NOT apps. NOT categories. NOT age ratings. Specific titles.

The parent can also fine-tune at the episode level — allowing a series but blocking specific episodes (e.g., Bluey is allowed but S2E14 is blocked because it gives the kid nightmares).

### 2. Selected Titles Appear on the Child's Device

The child's Android device runs the Axolotly Launcher as a home screen replacement. The launcher displays the parent-selected titles as visual tiles (poster images). This is the child's entire media world — a curated grid of shows and movies their parent hand-picked.

**What the child sees:**
- A grid of poster tiles for approved titles
- Nothing else. No app drawer. No browser. No app store. No streaming app interfaces.

**What the child does NOT see:**
- Any content the parent didn't select
- Any streaming app's home screen, search, or browse interface
- Any other apps, settings, or system UI

### 3. Child Taps a Title → Axolotly Launches It Through the Native Streaming App

When the child taps "Bluey," the Axolotly launcher deep-links into the native streaming app (Disney+ in this case) and launches that specific title. The streaming app is used purely as the playback engine.

**Critical detail:** The device controls are locked so the child cannot navigate outside of the show or movie that was launched. They cannot:
- Access the streaming app's home screen
- Browse the streaming app's catalog
- Search within the streaming app
- Navigate to any content other than what was launched

The streaming app is invisible infrastructure. The child doesn't know or care that Disney+ is playing Bluey — they just tapped Bluey and Bluey is playing.

### 4. When the Content Ends → Back to the Launcher

When the show or movie finishes, the child returns to the Axolotly launcher where they can pick another approved title from their curated grid.

The loop is:
```
Launcher (pick a title) → Streaming app plays it (locked down) → Launcher (pick another)
```

The child never leaves this loop. They never see anything their parent didn't choose.

---

## Why This Matters — Competitive Differentiation

No competitor offers this level of control:

| What competitors do | What Axolotly does |
|---|---|
| **Bark / Circle / Qustodio:** Filter by app or category | Curate by individual title |
| **Netflix parental controls:** Set a maturity rating (PG, TV-Y7, etc.) | Parent hand-picks every single title |
| **Google Family Link:** Block/allow entire apps | Launch specific titles through apps while locking the app down |
| **Streaming app kids profiles:** Show age-appropriate catalog | Show ONLY the exact titles the parent selected — nothing else |

Netflix lets you set a maturity rating. Axolotly lets you hand-pick every single title. The streaming app is just the playback engine. The child never sees Netflix's interface.

---

## System Components

### Parental Dashboard (Web App)

The parent's control center. Built with Next.js/React.

**What parents do here:**
- **Browse & search** a content library (TMDB-powered) of TV shows and movies
- **Select specific titles** they want their child to access
- **Fine-tune at the episode level** — block individual episodes within an allowed series
- **Review content tags** — 72+ automated tags (violence, scary themes, monsters, etc.) help parents make informed decisions
- **Manage streaming services** — select which services the family subscribes to so search results only show accessible content
- **Create kid profiles** — each child gets their own profile with their own curated title list and a 4-digit PIN
- **Pair devices** — connect Android devices to kid profiles via 6-digit pairing codes
- **Apply content packages** — admin-curated bundles of pre-vetted titles (e.g., "Tiny Tots" with 25 age-appropriate titles) that parents can apply with one click, with the ability to exclude individual titles

**Dashboard tabs:**
| Tab | Purpose |
|---|---|
| Search | Browse TMDB content library, select titles for child's profile |
| Policies | View/manage all selected titles and episode-level decisions |
| Profiles | Create/manage kid profiles with PINs |
| Devices | Pair and manage Android launcher devices |
| My Services | Select family's streaming subscriptions |
| Packages | Browse and apply admin-curated title bundles |

### Kids Launcher (Android App)

A home screen replacement for the child's Android device.

**What it does:**
- Replaces the Android home screen entirely — cannot be bypassed
- Displays ONLY the titles the parent selected, as visual poster tiles
- When a tile is tapped, deep-links into the native streaming app to play that specific title
- Device controls lock the child into the launched content — they cannot navigate away from the show/movie
- When content ends, child returns to the launcher to pick another title
- PIN-based profile login (4-digit PIN per child)
- Auto-refreshes approved content list from the backend

**What it enforces:**
- No access to other apps, settings, app store, or browser
- No access to streaming app interfaces (home, search, browse)
- No access to any content the parent didn't explicitly select
- Cannot be closed, uninstalled, or bypassed without parent authentication

### Backend API (FastAPI/Python)

Connects the dashboard to the launcher.

**Key functions:**
- Stores parent content selections (policies) per kid profile
- Serves approved title lists to launcher devices
- Resolves deep links for launching titles through native streaming apps
- Manages device pairing (6-digit codes)
- Syncs content metadata from TMDB
- Discovers deep links via Movie of the Night API and crowdsourced device reports
- Manages content packages (admin-curated title bundles)

### Content Intelligence

**TMDB integration:**
- Real-time search across 1M+ titles
- Automatic metadata: posters, synopses, ratings, genres
- Episode-level data for TV shows (thumbnails, air dates, descriptions)
- Genre-to-tag mapping for automated content tagging

**Automated tagging (72+ tags):**
- Content warnings: violence, monsters, scary themes, mild peril, crude humor, etc.
- Age appropriateness: preschool, young kids, older kids, tweens, teens
- Intensity levels: very mild, mild, moderate, strong
- Themes: fantasy, adventure, educational, comedy, etc.

**Deep link resolution:**
- Movie of the Night API for verified streaming URLs
- Crowdsourced URLs reported by launcher devices during playback
- Platform-specific URL formatting (Netflix, Disney+, Hulu, Prime Video, Peacock, YouTube)

---

## The User Stories

### Parent Story
"I open the Axolotly dashboard, search for Bluey, Paw Patrol, Frozen, and Moana, and add them to my daughter's profile. That's it. When she picks up her tablet, she sees four tiles. She taps Bluey, it plays. She can't browse Disney+. She can't search Netflix. She can't do anything except watch the shows I picked. When Bluey ends, she's back at her four tiles."

### Child Story
"I pick up my tablet, type my PIN, and see my shows. I tap Bluey and it plays. When it's done, I go back and pick Moana. That's my tablet."

### The Differentiator
"Netflix lets me set a maturity rating. Circle lets me block apps. Axolotly lets me hand-pick every single show and movie my kid can see, and locks the device so that's ALL they can see. The streaming app is just the player — my kid never touches it."

---

## Technical Architecture Summary

```
┌──────────────────────────────────────────────────────┐
│                  PARENT DASHBOARD                     │
│              (Next.js web app)                        │
│                                                       │
│  Search TMDB → Select titles → Assign to kid profile  │
│  Fine-tune episodes → Manage devices → Apply packages │
└──────────────────────┬───────────────────────────────┘
                       │ REST API
                       ▼
┌──────────────────────────────────────────────────────┐
│                   BACKEND API                         │
│               (FastAPI / Python)                      │
│                                                       │
│  Stores policies │ Resolves deep links │ TMDB sync    │
│  Device pairing  │ Content packages    │ Usage logs   │
└──────────────────────┬───────────────────────────────┘
                       │ REST API
                       ▼
┌──────────────────────────────────────────────────────┐
│                  KIDS LAUNCHER                        │
│            (Android home screen replacement)          │
│                                                       │
│  Shows ONLY parent-selected titles as poster tiles    │
│  Taps deep-link into native streaming apps            │
│  Device locked — child can't navigate away            │
│  Content ends → back to launcher                      │
└──────────────────────────────────────────────────────┘
```

---

## Key Terminology

| Term | Meaning |
|---|---|
| **Title** | A specific TV series or movie (e.g., "Bluey", "Frozen") |
| **Policy** | A parent's decision to include or exclude a title for a kid profile |
| **Content package** | An admin-curated bundle of pre-vetted titles (e.g., "Tiny Tots: 25 titles for ages 2-4") |
| **Deep link** | A URL that launches a specific title directly in a streaming app, bypassing the app's home screen |
| **Launcher** | The Android home screen replacement that displays approved titles and enforces lockdown |
| **Pairing** | The process of connecting an Android device to a parent's account via 6-digit code |
| **Tag** | A content descriptor (e.g., "violence", "scary-themes") automatically or manually applied to titles/episodes |

---

## What This Is NOT

- **Not an app blocker.** Parents don't choose "allow Disney+" — they choose "allow Bluey."
- **Not a content filter.** Parents don't set "block PG-13" — they hand-pick every title.
- **Not a screen time tool** (primarily). Time limits exist but the core value is content curation.
- **Not a monitoring tool.** The goal is proactive curation, not reactive surveillance.
- **Not a recommendation engine.** The parent decides. Axolotly provides metadata and tags to inform the decision, but never dictates what's appropriate.

## What This IS

- **A title-level content curation platform** where parents build their child's entire media library one title at a time.
- **A device lockdown system** where the child can only access what was curated — nothing else.
- **A playback orchestrator** that uses native streaming apps as invisible infrastructure to play parent-selected content.
- **The most granular parental content control available** — down to the individual episode, across every major streaming service, with full device enforcement.
