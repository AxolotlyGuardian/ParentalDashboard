"""
TMDB-Native Content Tagging System

Replaces Fandom wiki scraping with TMDB's own keyword, certification,
and episode overview data to generate content tags. This gives us clean
data provenance using only official TMDB API endpoints:

  - /movie/{id}/keywords
  - /tv/{id}/keywords
  - /movie/{id}/release_dates  (certifications by country)
  - /tv/{id}/content_ratings   (TV ratings by country)
  - Episode overviews (already stored locally from TMDB season fetches)
"""
import re
import logging
from typing import Dict, List, Optional, Set, Tuple
from sqlalchemy.orm import Session
import httpx

from models import (
    Title, Episode, ContentTag, TitleTag, EpisodeTag,
)
from config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# TMDB keyword ID / name → content-tag slug mapping
#
# TMDB keywords are crowd-sourced and numerous.  We map the ones that are
# relevant to our 72-tag taxonomy.  Both keyword IDs (stable) and lowercase
# keyword names (fuzzy fallback) are checked.
# ---------------------------------------------------------------------------

# Map of TMDB keyword *names* (lowercased) to our tag slugs.
# A single TMDB keyword can map to multiple tags.
TMDB_KEYWORD_TO_TAGS: Dict[str, List[str]] = {
    # Creatures & Characters
    "spider": ["spiders"],
    "giant spider": ["spiders"],
    "arachnophobia": ["spiders"],
    "snake": ["snakes"],
    "shark": ["sharks"],
    "shark attack": ["sharks"],
    "dinosaur": ["dinosaurs"],
    "tyrannosaurus rex": ["dinosaurs"],
    "monster": ["monsters"],
    "sea monster": ["monsters"],
    "creature": ["monsters"],
    "ghost": ["ghosts"],
    "haunting": ["ghosts"],
    "haunted house": ["ghosts"],
    "paranormal": ["ghosts"],
    "zombie": ["zombies"],
    "undead": ["zombies"],
    "living dead": ["zombies"],
    "witch": ["witches"],
    "witchcraft": ["witches"],
    "sorcery": ["witches"],
    "skeleton": ["skeletons"],
    "alien": ["aliens"],
    "extraterrestrial": ["aliens"],
    "alien invasion": ["aliens"],
    "ufo": ["aliens"],
    "robot": ["robots"],
    "android": ["robots"],
    "artificial intelligence": ["robots"],
    "clown": ["clowns"],
    "evil clown": ["clowns"],
    "bee": ["bees_wasps"],
    "wasp": ["bees_wasps"],
    "insect": ["bees_wasps"],
    "werewolf": ["monsters", "transforming_characters"],
    "shapeshifter": ["transforming_characters"],
    "transformation": ["transforming_characters"],
    "vampire": ["monsters"],
    "demon": ["monsters"],
    "dragon": ["monsters"],
    "ogre": ["monsters"],
    "troll": ["monsters"],
    "mutant": ["transforming_characters"],

    # Situations & Themes
    "darkness": ["darkness"],
    "dark": ["darkness"],
    "claustrophobia": ["confined_spaces"],
    "trapped": ["confined_spaces"],
    "cave": ["confined_spaces", "darkness"],
    "acrophobia": ["heights"],
    "fear of heights": ["heights"],
    "falling": ["heights"],
    "drowning": ["water_danger"],
    "shipwreck": ["water_danger"],
    "flood": ["water_danger", "natural_disasters"],
    "tsunami": ["water_danger", "natural_disasters"],
    "ocean": ["water_danger"],
    "storm": ["thunderstorms"],
    "thunderstorm": ["thunderstorms"],
    "lightning": ["thunderstorms"],
    "tornado": ["natural_disasters", "thunderstorms"],
    "fire": ["fire"],
    "wildfire": ["fire", "natural_disasters"],
    "arson": ["fire"],
    "earthquake": ["natural_disasters"],
    "volcano": ["natural_disasters"],
    "avalanche": ["natural_disasters"],
    "hurricane": ["natural_disasters", "thunderstorms"],
    "natural disaster": ["natural_disasters"],
    "hospital": ["medical_procedures"],
    "surgery": ["medical_procedures"],
    "doctor": ["medical_procedures"],
    "nurse": ["medical_procedures"],
    "dentist": ["dentist_scenes"],
    "blood": ["blood"],
    "gore": ["blood"],
    "missing child": ["being_lost"],
    "lost child": ["being_lost"],
    "runaway": ["being_lost"],
    "kidnapping": ["kidnapping"],
    "abduction": ["kidnapping"],
    "hostage": ["kidnapping"],
    "home invasion": ["home_invasion"],
    "burglary": ["home_invasion"],
    "break-in": ["home_invasion"],
    "car accident": ["car_accident"],
    "car crash": ["car_accident"],
    "traffic accident": ["car_accident"],
    "plane crash": ["plane_crash"],
    "aviation disaster": ["plane_crash"],

    # Death & Loss
    "death": ["grief_themes"],
    "death of parent": ["parent_death"],
    "death of mother": ["parent_death"],
    "death of father": ["parent_death"],
    "orphan": ["parent_death"],
    "death of child": ["child_death"],
    "death of pet": ["pet_death"],
    "funeral": ["funeral_scenes"],
    "grief": ["grief_themes"],
    "mourning": ["grief_themes"],
    "loss of loved one": ["grief_themes"],
    "bereavement": ["grief_themes"],

    # Scary Visuals & Atmosphere
    "jump scare": ["jump_scares"],
    "suspense": ["suspense_music"],
    "tension": ["suspense_music"],
    "shadow": ["shadows"],
    "nightmare": ["nightmares"],
    "bad dream": ["nightmares"],
    "dream sequence": ["nightmares"],
    "hallucination": ["hallucinations"],
    "chase": ["intense_chases"],
    "pursuit": ["intense_chases"],
    "car chase": ["intense_chases"],

    # Intensity
    "survival": ["moderate_peril"],
    "danger": ["moderate_peril"],
    "peril": ["moderate_peril"],
    "battle": ["intense_action"],
    "war": ["intense_action", "violence"],
    "combat": ["intense_action"],
    "fight": ["intense_action"],
    "martial arts": ["intense_action"],
    "psychological thriller": ["psychological_horror"],
    "psychological horror": ["psychological_horror"],
    "mind games": ["psychological_horror"],

    # Social
    "bullying": ["bullying"],
    "school bully": ["bullying"],
    "cyberbullying": ["bullying"],
    "humiliation": ["public_embarrassment"],
    "embarrassment": ["public_embarrassment"],
    "social outcast": ["social_rejection"],
    "loneliness": ["social_rejection"],
    "rejection": ["social_rejection"],

    # Content Warnings
    "violence": ["violence"],
    "gun violence": ["violence"],
    "domestic violence": ["violence"],
    "profanity": ["language"],
    "swearing": ["language"],
    "nudity": ["sexual_content"],
    "sex": ["sexual_content"],
    "sexual content": ["sexual_content"],
    "drugs": ["drug_use"],
    "drug use": ["drug_use"],
    "substance abuse": ["drug_use"],
    "alcohol": ["drug_use"],
    "smoking": ["drug_use"],
}

# ---------------------------------------------------------------------------
# Episode overview text patterns → tag slugs
#
# These regex patterns are matched against episode overview text (from TMDB)
# to infer episode-level content tags.  Confidence is lower than keyword-based
# title tags since we're doing text matching on synopses.
# ---------------------------------------------------------------------------

OVERVIEW_PATTERNS: List[Tuple[str, str, float]] = [
    # (regex_pattern, tag_slug, confidence)
    # Creatures
    (r"\bspider", "spiders", 0.7),
    (r"\bsnake", "snakes", 0.7),
    (r"\bshark", "sharks", 0.7),
    (r"\bdinosaur", "dinosaurs", 0.7),
    (r"\bmonster", "monsters", 0.7),
    (r"\bghost", "ghosts", 0.7),
    (r"\bhaunt", "ghosts", 0.65),
    (r"\bzombie", "zombies", 0.7),
    (r"\bwitch", "witches", 0.7),
    (r"\bskeleton", "skeletons", 0.7),
    (r"\balien", "aliens", 0.7),
    (r"\brobot", "robots", 0.65),
    (r"\bclown", "clowns", 0.7),

    # Situations
    (r"\bdark(ness)?(\s|,|\.)", "darkness", 0.6),
    (r"\btrapped\b", "confined_spaces", 0.65),
    (r"\bcave\b", "confined_spaces", 0.6),
    (r"\bdrown", "water_danger", 0.7),
    (r"\bflood", "water_danger", 0.65),
    (r"\bstorm", "thunderstorms", 0.6),
    (r"\blightning\b", "thunderstorms", 0.65),
    (r"\btornado", "natural_disasters", 0.7),
    (r"\bearthquake", "natural_disasters", 0.7),
    (r"\bvolcano", "natural_disasters", 0.7),
    (r"\bfire\b", "fire", 0.55),
    (r"\bhospital\b", "medical_procedures", 0.6),
    (r"\bdoctor\b", "medical_procedures", 0.5),
    (r"\bdentist\b", "dentist_scenes", 0.7),
    (r"\bblood\b", "blood", 0.6),
    (r"\blost\b.*\b(child|kid|boy|girl)\b", "being_lost", 0.65),
    (r"\bkidnap", "kidnapping", 0.7),
    (r"\babduct", "kidnapping", 0.7),

    # Death & Loss
    (r"\bdie[sd]?\b", "grief_themes", 0.55),
    (r"\bdeath\b", "grief_themes", 0.6),
    (r"\bfuneral\b", "funeral_scenes", 0.75),
    (r"\bgriev", "grief_themes", 0.65),
    (r"\bmourn", "grief_themes", 0.65),

    # Visuals/Atmosphere
    (r"\bnightmare", "nightmares", 0.7),
    (r"\bbad dream", "nightmares", 0.7),
    (r"\bhallucin", "hallucinations", 0.7),
    (r"\bchase[sd]?\b", "intense_chases", 0.55),

    # Social
    (r"\bbull(y|ied|ies|ying)\b", "bullying", 0.7),
    (r"\bembarrass", "public_embarrassment", 0.6),
    (r"\bhumiliat", "public_embarrassment", 0.65),
    (r"\blonely\b|\bloneliness\b", "social_rejection", 0.55),
    (r"\brejected?\b", "social_rejection", 0.55),
]

# Compile patterns once at module load for performance
_COMPILED_PATTERNS = [
    (re.compile(pat, re.IGNORECASE), slug, conf)
    for pat, slug, conf in OVERVIEW_PATTERNS
]

# ---------------------------------------------------------------------------
# US certification → rating tag + age tag mapping
# ---------------------------------------------------------------------------

CERT_TO_RATING_TAG: Dict[str, str] = {
    "G": "rating_g",
    "PG": "rating_pg",
    "PG-13": "rating_pg13",
    "R": "rating_r",
    "NC-17": "rating_r",  # map to closest
    "NR": "",
    "TV-Y": "rating_tv_y",
    "TV-Y7": "rating_tv_y7",
    "TV-G": "rating_tv_g",
    "TV-PG": "rating_tv_pg",
    "TV-14": "rating_tv_14",
    "TV-MA": "rating_tv_ma",
}

CERT_TO_AGE_TAG: Dict[str, str] = {
    "G": "family_friendly",
    "TV-Y": "preschool",
    "TV-Y7": "early_childhood",
    "TV-G": "family_friendly",
    "PG": "kids",
    "TV-PG": "kids",
    "PG-13": "teens",
    "TV-14": "teens",
    "R": "adults_only",
    "TV-MA": "adults_only",
    "NC-17": "adults_only",
}


class TMDBTagger:
    """
    Tags titles and episodes using only TMDB API data:
    - TMDB keywords for title-level tags
    - TMDB certifications for rating/age tags
    - Episode overview text analysis for episode-level tags
    """

    def __init__(self, db: Session):
        self.db = db
        self._tag_cache: Optional[Dict[str, int]] = None

    @property
    def all_tags(self) -> Dict[str, int]:
        """Slug → ID cache for ContentTag table"""
        if self._tag_cache is None:
            self._tag_cache = {
                tag.slug: tag.id
                for tag in self.db.query(ContentTag).all()
            }
        return self._tag_cache

    # ------------------------------------------------------------------
    # TMDB API helpers
    # ------------------------------------------------------------------

    async def _fetch_tmdb_keywords(self, tmdb_id: int, media_type: str) -> List[Dict]:
        """Fetch keywords from TMDB for a movie or TV show."""
        if not settings.TMDB_API_KEY:
            return []

        endpoint = "movie" if media_type == "movie" else "tv"
        url = f"{settings.TMDB_API_BASE_URL}/{endpoint}/{tmdb_id}/keywords"
        params = {"api_key": settings.TMDB_API_KEY}

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, params=params, timeout=10)
                if resp.status_code != 200:
                    logger.warning("TMDB keywords returned %d for %s/%d", resp.status_code, endpoint, tmdb_id)
                    return []
                data = resp.json()
                # Movies use "keywords", TV uses "results"
                return data.get("keywords") or data.get("results") or []
        except Exception as e:
            logger.error("Error fetching TMDB keywords for %s/%d: %s", endpoint, tmdb_id, e)
            return []

    async def _fetch_tmdb_certification(self, tmdb_id: int, media_type: str) -> Optional[str]:
        """Fetch US certification from TMDB."""
        if not settings.TMDB_API_KEY:
            return None

        if media_type == "movie":
            url = f"{settings.TMDB_API_BASE_URL}/movie/{tmdb_id}/release_dates"
        else:
            url = f"{settings.TMDB_API_BASE_URL}/tv/{tmdb_id}/content_ratings"

        params = {"api_key": settings.TMDB_API_KEY}

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, params=params, timeout=10)
                if resp.status_code != 200:
                    return None
                data = resp.json()

                for entry in data.get("results", []):
                    if entry.get("iso_3166_1") == "US":
                        if media_type == "movie":
                            # Movie: results[].release_dates[].certification
                            for rd in entry.get("release_dates", []):
                                cert = rd.get("certification", "").strip()
                                if cert:
                                    return cert
                        else:
                            # TV: results[].rating
                            return entry.get("rating", "").strip() or None
                return None
        except Exception as e:
            logger.error("Error fetching certification for %s/%d: %s", media_type, tmdb_id, e)
            return None

    # ------------------------------------------------------------------
    # Keyword → Tag resolution
    # ------------------------------------------------------------------

    def _resolve_keyword_tags(self, tmdb_keywords: List[Dict]) -> Set[int]:
        """Map TMDB keywords to our tag IDs."""
        tag_ids: Set[int] = set()
        for kw in tmdb_keywords:
            name = kw.get("name", "").lower().strip()
            if name in TMDB_KEYWORD_TO_TAGS:
                for slug in TMDB_KEYWORD_TO_TAGS[name]:
                    if slug in self.all_tags:
                        tag_ids.add(self.all_tags[slug])
        return tag_ids

    def _resolve_certification_tags(self, certification: Optional[str]) -> Set[int]:
        """Map US certification to rating + age tags."""
        tag_ids: Set[int] = set()
        if not certification:
            return tag_ids

        cert = certification.upper().strip()

        rating_slug = CERT_TO_RATING_TAG.get(cert, "")
        if rating_slug and rating_slug in self.all_tags:
            tag_ids.add(self.all_tags[rating_slug])

        age_slug = CERT_TO_AGE_TAG.get(cert, "")
        if age_slug and age_slug in self.all_tags:
            tag_ids.add(self.all_tags[age_slug])

        return tag_ids

    # ------------------------------------------------------------------
    # Title-level tagging
    # ------------------------------------------------------------------

    async def tag_title(self, title_id: int) -> Dict:
        """
        Fetch TMDB keywords + certification for a title and apply tags.
        Returns a summary dict.
        """
        title = self.db.query(Title).filter(Title.id == title_id).first()
        if not title or not title.tmdb_id:
            return {"success": False, "error": "Title not found or missing TMDB ID"}

        # Fetch TMDB data
        keywords = await self._fetch_tmdb_keywords(title.tmdb_id, title.media_type)
        certification = await self._fetch_tmdb_certification(title.tmdb_id, title.media_type)

        # Resolve to tag IDs
        keyword_tag_ids = self._resolve_keyword_tags(keywords)
        cert_tag_ids = self._resolve_certification_tags(certification)

        # Also apply genre-based tags from existing AutoTagger logic
        genre_tag_ids = self._resolve_genre_tags(title)

        all_tag_ids = keyword_tag_ids | cert_tag_ids | genre_tag_ids

        # Get existing tags to avoid duplicates
        existing_tag_ids = {
            tt.tag_id for tt in
            self.db.query(TitleTag).filter(TitleTag.title_id == title_id).all()
        }

        added = 0
        for tag_id in all_tag_ids:
            if tag_id not in existing_tag_ids:
                self.db.add(TitleTag(
                    title_id=title_id,
                    tag_id=tag_id,
                    source="tmdb_auto",
                    confidence=0.85,
                ))
                added += 1

        if added > 0:
            self.db.commit()

        # Update the title's rating from certification if we got a better one
        if certification and (not title.rating or title.rating == "0" or title.rating == "0.0"):
            title.rating = certification
            self.db.commit()

        return {
            "success": True,
            "title_id": title_id,
            "title_name": title.title,
            "tmdb_keywords_found": len(keywords),
            "certification": certification,
            "keyword_tags": len(keyword_tag_ids),
            "cert_tags": len(cert_tag_ids),
            "genre_tags": len(genre_tag_ids),
            "tags_added": added,
            "tags_skipped_existing": len(all_tag_ids) - added,
        }

    def _resolve_genre_tags(self, title: Title) -> Set[int]:
        """Map TMDB genres to content tags (ported from AutoTagger)."""
        from routes.catalog import GENRE_MAP

        tag_ids: Set[int] = set()
        if not title.genres:
            return tag_ids

        genre_names = []
        for g in title.genres:
            if isinstance(g, dict):
                genre_names.append(g.get("name", "").lower())
            elif isinstance(g, str):
                genre_names.append(g.lower())
            elif isinstance(g, int):
                name = GENRE_MAP.get(g, "")
                if name:
                    genre_names.append(name.lower())

        genre_tag_map = {
            "horror": ["monsters", "ghosts", "darkness", "psychological_horror", "moderate_peril"],
            "thriller": ["moderate_peril", "intense_action", "suspense_music"],
            "action": ["violence", "intense_action", "moderate_peril"],
            "action & adventure": ["violence", "intense_action", "moderate_peril"],
            "sci-fi & fantasy": ["aliens", "monsters", "transforming_characters"],
            "science fiction": ["aliens", "robots"],
            "fantasy": ["monsters", "witches", "transforming_characters"],
            "animation": ["mild_peril"],
            "family": ["family_friendly"],
            "kids": ["family_friendly"],
            "comedy": ["mild_peril"],
            "war": ["violence", "intense_action"],
            "war & politics": ["violence", "moderate_peril"],
            "crime": ["violence", "moderate_peril"],
            "mystery": ["suspense_music", "moderate_peril"],
            "drama": ["moderate_peril"],
        }

        for genre_name in genre_names:
            if genre_name in genre_tag_map:
                for slug in genre_tag_map[genre_name]:
                    if slug in self.all_tags:
                        tag_ids.add(self.all_tags[slug])

        return tag_ids

    # ------------------------------------------------------------------
    # Episode-level tagging (overview text analysis)
    # ------------------------------------------------------------------

    def tag_episodes_for_title(self, title_id: int) -> Dict:
        """
        Scan episode overviews for keyword patterns and apply episode-level tags.
        This uses locally-stored TMDB episode data (no additional API calls).
        """
        title = self.db.query(Title).filter(Title.id == title_id).first()
        if not title:
            return {"success": False, "error": "Title not found"}

        episodes = self.db.query(Episode).filter(
            Episode.title_id == title_id
        ).all()

        if not episodes:
            return {
                "success": True,
                "title_id": title_id,
                "title_name": title.title,
                "episodes_scanned": 0,
                "episodes_tagged": 0,
                "tags_added": 0,
            }

        # Batch-fetch existing episode tags to avoid N+1
        episode_ids = [ep.id for ep in episodes]
        existing_pairs: Set[Tuple[int, int]] = set()
        if episode_ids:
            existing = self.db.query(
                EpisodeTag.episode_id, EpisodeTag.tag_id
            ).filter(EpisodeTag.episode_id.in_(episode_ids)).all()
            existing_pairs = {(et.episode_id, et.tag_id) for et in existing}

        total_added = 0
        episodes_with_tags = 0

        for episode in episodes:
            if not episode.overview:
                continue

            matched_tags = self._scan_overview(episode.overview)
            if not matched_tags:
                continue

            ep_added = 0
            for slug, confidence in matched_tags:
                tag_id = self.all_tags.get(slug)
                if not tag_id:
                    continue
                if (episode.id, tag_id) in existing_pairs:
                    continue

                self.db.add(EpisodeTag(
                    episode_id=episode.id,
                    tag_id=tag_id,
                    source="tmdb_overview",
                    confidence=confidence,
                    source_url=None,
                    source_excerpt=episode.overview[:200] if episode.overview else None,
                    extraction_method="overview_pattern_match",
                ))
                existing_pairs.add((episode.id, tag_id))
                ep_added += 1

            if ep_added > 0:
                episodes_with_tags += 1
                total_added += ep_added

        if total_added > 0:
            self.db.commit()

        return {
            "success": True,
            "title_id": title_id,
            "title_name": title.title,
            "episodes_scanned": len(episodes),
            "episodes_tagged": episodes_with_tags,
            "tags_added": total_added,
        }

    def _scan_overview(self, text: str) -> List[Tuple[str, float]]:
        """Return list of (tag_slug, confidence) matches from overview text."""
        matches: Dict[str, float] = {}
        for pattern, slug, confidence in _COMPILED_PATTERNS:
            if pattern.search(text):
                # Keep highest confidence if multiple patterns match same tag
                if slug not in matches or confidence > matches[slug]:
                    matches[slug] = confidence
        return list(matches.items())

    # ------------------------------------------------------------------
    # Batch operations
    # ------------------------------------------------------------------

    async def tag_all_titles(self, title_ids: Optional[List[int]] = None) -> Dict:
        """
        Batch tag titles using TMDB keywords + certifications.
        If title_ids is None, tags all titles in the database.
        """
        query = self.db.query(Title).filter(Title.tmdb_id.isnot(None))
        if title_ids:
            query = query.filter(Title.id.in_(title_ids))
        titles = query.all()

        results = []
        total_tags_added = 0

        for title in titles:
            result = await self.tag_title(title.id)
            results.append(result)
            total_tags_added += result.get("tags_added", 0)

            # Tag episodes too
            if title.media_type == "tv":
                ep_result = self.tag_episodes_for_title(title.id)
                result["episode_tagging"] = ep_result
                total_tags_added += ep_result.get("tags_added", 0)

        return {
            "success": True,
            "titles_processed": len(titles),
            "total_tags_added": total_tags_added,
            "results": results,
        }
