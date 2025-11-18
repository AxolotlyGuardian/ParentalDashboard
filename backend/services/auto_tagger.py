"""
Automatic Content Tagging System
Assigns appropriate content tags to titles based on TMDB metadata
"""
from sqlalchemy.orm import Session
from models import Title, ContentTag, TitleTag
from typing import List, Set

class AutoTagger:
    """Automatically assign content tags based on title metadata"""
    
    def __init__(self, db: Session):
        self.db = db
        
    def get_tags_for_title(self, title: Title) -> Set[int]:
        """Determine which tags should be applied to a title"""
        tag_ids = set()
        
        # Get all available tags
        all_tags = {tag.slug: tag.id for tag in self.db.query(ContentTag).all()}
        
        # 1. Rating-based tags
        if title.rating:
            rating_slug = self._get_rating_tag_slug(title.rating)
            if rating_slug and rating_slug in all_tags:
                tag_ids.add(all_tags[rating_slug])
        
        # 2. Genre-based tags
        if title.genres:
            genre_tags = self._get_genre_tags(title.genres, all_tags)
            tag_ids.update(genre_tags)
        
        # 3. Age-based tags (derived from rating)
        age_tag = self._get_age_tag(title.rating, all_tags)
        if age_tag:
            tag_ids.add(age_tag)
        
        return tag_ids
    
    def _get_rating_tag_slug(self, rating: str) -> str:
        """Map content rating to tag slug"""
        rating_upper = rating.upper().strip()
        
        rating_map = {
            'G': 'rating_g',
            'PG': 'rating_pg',
            'PG-13': 'rating_pg13',
            'R': 'rating_r',
            'TV-Y': 'rating_tv_y',
            'TV-Y7': 'rating_tv_y7',
            'TV-G': 'rating_tv_g',
            'TV-PG': 'rating_tv_pg',
            'TV-14': 'rating_tv_14',
            'TV-MA': 'rating_tv_ma'
        }
        
        return rating_map.get(rating_upper, '')
    
    def _get_age_tag(self, rating: str, all_tags: dict) -> int:
        """Determine age appropriateness tag from rating"""
        if not rating:
            return None
        
        rating_upper = rating.upper().strip()
        
        # Map ratings to age categories
        age_map = {
            'TV-Y': 'preschool',           # Ages 2-4
            'TV-Y7': 'early_childhood',    # Ages 5-7
            'G': 'family_friendly',
            'TV-G': 'family_friendly',
            'PG': 'kids',                  # Ages 8-12
            'TV-PG': 'kids',
            'PG-13': 'teens',              # Ages 13-17
            'TV-14': 'teens',
            'R': 'adults_only',
            'TV-MA': 'adults_only'
        }
        
        age_slug = age_map.get(rating_upper, '')
        return all_tags.get(age_slug) if age_slug else None
    
    def _get_genre_tags(self, genres: list, all_tags: dict) -> Set[int]:
        """Map genres to content warning tags"""
        from routes.catalog import GENRE_MAP
        tag_ids = set()
        
        # Handle both genre IDs (ints) and genre names (strings/dicts)
        genre_names = []
        for g in genres:
            if isinstance(g, dict):
                genre_names.append(g.get('name', '').lower())
            elif isinstance(g, str):
                genre_names.append(g.lower())
            elif isinstance(g, int):
                # Convert genre ID to name
                genre_name = GENRE_MAP.get(g, '')
                if genre_name:
                    genre_names.append(genre_name.lower())
        
        # Genre to content tag mapping
        genre_tag_map = {
            'horror': ['monsters', 'ghosts', 'darkness', 'psychological_horror', 'moderate_peril'],
            'thriller': ['moderate_peril', 'intense_action'],
            'action': ['violence', 'intense_action', 'moderate_peril'],
            'action & adventure': ['violence', 'intense_action', 'moderate_peril'],
            'sci-fi & fantasy': ['aliens', 'monsters', 'transforming_characters', 'magic'],
            'science fiction': ['aliens', 'robots'],
            'fantasy': ['magic', 'monsters', 'witches', 'transforming_characters'],
            'animation': ['mild_peril'],  # Most animation is mild
            'family': ['family_friendly'],
            'kids': ['family_friendly'],
            'comedy': ['mild_peril'],
            'war': ['violence', 'intense_action'],
            'war & politics': ['violence', 'moderate_peril'],
        }
        
        # Apply genre mappings
        for genre_name in genre_names:
            if genre_name in genre_tag_map:
                for tag_slug in genre_tag_map[genre_name]:
                    if tag_slug in all_tags:
                        tag_ids.add(all_tags[tag_slug])
        
        return tag_ids
    
    def apply_tags_to_title(self, title_id: int) -> int:
        """Apply automatic tags to a title, returns number of tags added"""
        title = self.db.query(Title).filter(Title.id == title_id).first()
        if not title:
            return 0
        
        # Get recommended tags
        tag_ids = self.get_tags_for_title(title)
        
        # Get existing tags
        existing_tag_ids = {
            tt.tag_id for tt in self.db.query(TitleTag)
            .filter(TitleTag.title_id == title_id).all()
        }
        
        # Add new tags (avoid duplicates)
        new_tags_count = 0
        for tag_id in tag_ids:
            if tag_id not in existing_tag_ids:
                title_tag = TitleTag(title_id=title_id, tag_id=tag_id)
                self.db.add(title_tag)
                new_tags_count += 1
        
        if new_tags_count > 0:
            self.db.commit()
            print(f"Auto-tagged '{title.title}' with {new_tags_count} tags")
        
        return new_tags_count
