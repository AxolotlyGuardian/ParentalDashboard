"""
Episode Matching Service
Links Fandom wiki episodes to TMDB episodes using fuzzy string matching
"""
import re
from typing import Optional, Tuple, List, Dict
from dataclasses import dataclass
from sqlalchemy.orm import Session
from models import Episode, FandomEpisodeLink, Title


@dataclass
class MatchResult:
    """Result of an episode matching operation"""
    episode_id: Optional[int]
    confidence: float
    matching_method: str
    fandom_page_title: str
    season_number: int
    episode_number: int


class EpisodeMatcher:
    """
    Matches Fandom episode pages to TMDB episodes in the database
    Uses multiple strategies with confidence scoring
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def normalize_episode_name(self, name: str) -> str:
        """
        Normalize episode name for comparison
        - Lowercase
        - Remove punctuation except spaces
        - Remove common prefixes/suffixes
        - Trim whitespace
        """
        if not name:
            return ""
        
        # Lowercase
        normalized = name.lower()
        
        # Remove common prefixes
        prefixes = ['episode ', 'ep ', 'e ', 'part ', 'pt ']
        for prefix in prefixes:
            if normalized.startswith(prefix):
                normalized = normalized[len(prefix):]
        
        # Remove episode number patterns at start (like "5. Title")
        normalized = re.sub(r'^\d+[\.\:\-\s]+', '', normalized)
        
        # Remove punctuation except spaces and alphanumeric
        normalized = re.sub(r'[^\w\s]', ' ', normalized)
        
        # Remove multiple spaces
        normalized = re.sub(r'\s+', ' ', normalized)
        
        # Remove common suffixes
        suffixes = [' part a', ' part b', ' part 1', ' part 2']
        for suffix in suffixes:
            if normalized.endswith(suffix):
                normalized = normalized[:-len(suffix)]
        
        return normalized.strip()
    
    def extract_season_episode(self, text: str) -> Optional[Tuple[int, int]]:
        """
        Extract season and episode numbers from text
        Handles formats like: S01E05, 1x05, Season 1 Episode 5, etc.
        """
        patterns = [
            r'[Ss](\d+)[Ee](\d+)',  # S01E05, s1e5
            r'(\d+)x(\d+)',  # 1x05
            r'[Ss]eason\s*(\d+)\s*[Ee]pisode\s*(\d+)',  # Season 1 Episode 5
            r'[Ss](\d+)\s*[Ee](\d+)',  # S1 E5
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                season = int(match.group(1))
                episode = int(match.group(2))
                return (season, episode)
        
        return None
    
    def fuzzy_match_score(self, str1: str, str2: str) -> float:
        """
        Calculate similarity score between two strings
        Returns: 0.0 to 1.0 (0=no match, 1=perfect match)
        
        Uses a simple token-based approach without external libraries
        """
        if not str1 or not str2:
            return 0.0
        
        # Exact match
        if str1 == str2:
            return 1.0
        
        # Tokenize
        tokens1 = set(str1.lower().split())
        tokens2 = set(str2.lower().split())
        
        if not tokens1 or not tokens2:
            return 0.0
        
        # Jaccard similarity
        intersection = tokens1.intersection(tokens2)
        union = tokens1.union(tokens2)
        
        jaccard = len(intersection) / len(union) if union else 0.0
        
        # Bonus for substring match
        substring_bonus = 0.0
        if str1 in str2 or str2 in str1:
            substring_bonus = 0.2
        
        return min(1.0, jaccard + substring_bonus)
    
    def match_episode(
        self,
        title_id: int,
        fandom_page_title: str,
        fandom_page_id: Optional[int] = None,
        fandom_url: Optional[str] = None,
        season_hint: Optional[int] = None,
        episode_hint: Optional[int] = None
    ) -> MatchResult:
        """
        Match a Fandom episode page to a TMDB episode
        
        Args:
            title_id: The title/show ID
            fandom_page_title: The title of the Fandom wiki page
            fandom_page_id: Optional Fandom page ID
            fandom_url: Optional Fandom URL
            season_hint: Optional season number hint
            episode_hint: Optional episode number hint
        
        Returns:
            MatchResult with confidence score and matched episode
        """
        # Extract season/episode from title
        extracted = self.extract_season_episode(fandom_page_title)
        
        # Use hints or extracted values
        if season_hint and episode_hint:
            season_num = season_hint
            episode_num = episode_hint
            method = "hint_based"
        elif extracted:
            season_num, episode_num = extracted
            method = "pattern_extraction"
        else:
            # Fallback to fuzzy matching only
            return self._fuzzy_match_only(
                title_id,
                fandom_page_title,
                fandom_page_id,
                fandom_url
            )
        
        # Try exact season/episode match first
        episode = self.db.query(Episode).filter(
            Episode.title_id == title_id,
            Episode.season_number == season_num,
            Episode.episode_number == episode_num
        ).first()
        
        if episode:
            # Verify with name similarity if episode name exists
            if episode.episode_name:
                normalized_fandom = self.normalize_episode_name(fandom_page_title)
                normalized_tmdb = self.normalize_episode_name(episode.episode_name)
                name_score = self.fuzzy_match_score(normalized_fandom, normalized_tmdb)
                
                # High confidence if names match well
                confidence = 0.95 if name_score > 0.7 else 0.85
            else:
                # Medium confidence - number match only
                confidence = 0.80
            
            return MatchResult(
                episode_id=episode.id,
                confidence=confidence,
                matching_method=method,
                fandom_page_title=fandom_page_title,
                season_number=season_num,
                episode_number=episode_num
            )
        
        # No exact match found
        return MatchResult(
            episode_id=None,
            confidence=0.0,
            matching_method="no_match",
            fandom_page_title=fandom_page_title,
            season_number=season_num if season_num else 0,
            episode_number=episode_num if episode_num else 0
        )
    
    def _fuzzy_match_only(
        self,
        title_id: int,
        fandom_page_title: str,
        fandom_page_id: Optional[int],
        fandom_url: Optional[str]
    ) -> MatchResult:
        """
        Match episode by name similarity only (when no season/episode number available)
        """
        # Get all episodes for this title
        episodes = self.db.query(Episode).filter(
            Episode.title_id == title_id
        ).all()
        
        if not episodes:
            return MatchResult(
                episode_id=None,
                confidence=0.0,
                matching_method="no_episodes",
                fandom_page_title=fandom_page_title,
                season_number=0,
                episode_number=0
            )
        
        # Find best match by name
        normalized_fandom = self.normalize_episode_name(fandom_page_title)
        best_match = None
        best_score = 0.0
        
        for episode in episodes:
            if not episode.episode_name:
                continue
            
            normalized_tmdb = self.normalize_episode_name(episode.episode_name)
            score = self.fuzzy_match_score(normalized_fandom, normalized_tmdb)
            
            if score > best_score:
                best_score = score
                best_match = episode
        
        # Only accept if score is reasonably high
        if best_match and best_score >= 0.6:
            return MatchResult(
                episode_id=best_match.id,
                confidence=best_score * 0.8,  # Reduce confidence for fuzzy-only match
                matching_method="fuzzy_name_match",
                fandom_page_title=fandom_page_title,
                season_number=best_match.season_number,
                episode_number=best_match.episode_number
            )
        
        return MatchResult(
            episode_id=None,
            confidence=0.0,
            matching_method="low_confidence",
            fandom_page_title=fandom_page_title,
            season_number=0,
            episode_number=0
        )
    
    def store_match(self, title_id: int, match_result: MatchResult, fandom_url: Optional[str] = None, fandom_page_id: Optional[int] = None) -> FandomEpisodeLink:
        """
        Store the match result in the database
        Creates or updates FandomEpisodeLink record
        """
        # Check if link already exists
        existing = self.db.query(FandomEpisodeLink).filter(
            FandomEpisodeLink.title_id == title_id,
            FandomEpisodeLink.season_number == match_result.season_number,
            FandomEpisodeLink.episode_number == match_result.episode_number
        ).first()
        
        if existing:
            # Update existing link
            existing.episode_id = match_result.episode_id
            existing.confidence = match_result.confidence
            existing.matching_method = match_result.matching_method
            existing.fandom_page_title = match_result.fandom_page_title
            if fandom_url:
                existing.fandom_url = fandom_url
            if fandom_page_id:
                existing.fandom_page_id = fandom_page_id
            self.db.commit()
            self.db.refresh(existing)
            return existing
        else:
            # Create new link
            link = FandomEpisodeLink(
                title_id=title_id,
                episode_id=match_result.episode_id,
                season_number=match_result.season_number,
                episode_number=match_result.episode_number,
                fandom_page_id=fandom_page_id,
                fandom_page_title=match_result.fandom_page_title,
                fandom_url=fandom_url,
                confidence=match_result.confidence,
                matching_method=match_result.matching_method
            )
            self.db.add(link)
            self.db.commit()
            self.db.refresh(link)
            return link
    
    def batch_match_episodes(
        self,
        title_id: int,
        fandom_episodes: List[Dict]
    ) -> List[MatchResult]:
        """
        Match a batch of Fandom episodes to TMDB episodes
        
        Args:
            title_id: The title/show ID
            fandom_episodes: List of dicts with keys: page_title, page_id, url, season, episode
        
        Returns:
            List of MatchResult objects
        """
        results = []
        
        for fandom_ep in fandom_episodes:
            result = self.match_episode(
                title_id=title_id,
                fandom_page_title=fandom_ep.get('page_title', ''),
                fandom_page_id=fandom_ep.get('page_id'),
                fandom_url=fandom_ep.get('url'),
                season_hint=fandom_ep.get('season'),
                episode_hint=fandom_ep.get('episode')
            )
            results.append(result)
            
            # Store the match if confidence is reasonable
            if result.confidence >= 0.5:
                self.store_match(
                    title_id=title_id,
                    match_result=result,
                    fandom_url=fandom_ep.get('url'),
                    fandom_page_id=fandom_ep.get('page_id')
                )
        
        return results
