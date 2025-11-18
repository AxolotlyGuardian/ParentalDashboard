import requests
import re
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from models import ContentTag, Episode, EpisodeTag, Title
import time

class FandomScraper:
    
    TAG_MAPPING = {
        'spiders': 'spiders',
        'snakes': 'snakes',
        'sharks': 'sharks',
        'dinosaurs': 'dinosaurs',
        'monsters': 'monsters',
        'ghosts': 'ghosts',
        'zombies': 'zombies',
        'witches': 'witches',
        'skeletons': 'skeletons',
        'aliens': 'aliens',
        'space': 'aliens',
        'clowns': 'clowns',
        'bees': 'bees_wasps',
        'wasps': 'bees_wasps',
        'dogs': 'large_dogs',
        'robots': 'robots',
        'darkness': 'darkness',
        'confined spaces': 'confined_spaces',
        'claustrophobia': 'confined_spaces',
        'heights': 'heights',
        'water': 'water_danger',
        'drowning': 'water_danger',
        'storms': 'thunderstorms',
        'lightning': 'thunderstorms',
        'fire': 'fire',
        'earthquakes': 'natural_disasters',
        'tornadoes': 'natural_disasters',
        'medical': 'medical_procedures',
        'needles': 'medical_procedures',
        'hospital': 'medical_procedures',
        'dentist': 'dentist_scenes',
        'blood': 'blood',
        'lost': 'being_lost',
        'kidnapping': 'kidnapping',
        'abduction': 'kidnapping',
        'invasion': 'home_invasion',
        'burglary': 'home_invasion',
        'car crash': 'car_accident',
        'accident': 'car_accident',
        'plane crash': 'plane_crash',
        'death': 'grief_themes',
        'parent death': 'parent_death',
        'funeral': 'funeral_scenes',
        'jump scares': 'jump_scares',
        'suspense': 'suspense_music',
        'shadows': 'shadows',
        'nightmares': 'nightmares',
        'chase': 'intense_chases',
        'bullying': 'bullying',
        'embarrassment': 'public_embarrassment',
        'rejection': 'social_rejection',
        'violence': 'violence',
        'language': 'language',
        'profanity': 'language',
        'halloween': 'halloween',
    }
    
    def __init__(self, db: Session):
        self.db = db
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Axolotly/1.0 (Parental Control App; Educational Use)'
        })
    
    def get_category_members(self, wiki_name: str, category: str) -> List[Dict]:
        api_url = f"https://{wiki_name}.fandom.com/api.php"
        
        params = {
            'action': 'query',
            'list': 'categorymembers',
            'cmtitle': f'Category:{category}',
            'cmlimit': 500,
            'format': 'json'
        }
        
        try:
            response = self.session.get(api_url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if 'query' in data and 'categorymembers' in data['query']:
                return data['query']['categorymembers']
            return []
        except Exception as e:
            print(f"Error fetching category members: {e}")
            return []
    
    def clean_episode_name(self, name: str) -> str:
        name = name.strip()
        name = re.sub(r'\([^)]*\)', '', name)
        name = re.sub(r'\s+', ' ', name)
        return name.strip()
    
    def find_matching_episodes_by_name(self, wiki_name: str, episode_name: str) -> List[Episode]:
        cleaned_name = self.clean_episode_name(episode_name)
        
        show_keywords = {
            'pawpatrol': ['PAW Patrol', 'Paw Patrol'],
            'peppa-pig': ['Peppa Pig'],
            'bluey': ['Bluey'],
            'daniel-tiger': ['Daniel Tiger'],
        }
        
        show_names = show_keywords.get(wiki_name.lower(), [wiki_name.replace('-', ' ').title()])
        
        matching_episodes_dict = {}
        
        for show_name in show_names:
            titles = self.db.query(Title).filter(
                Title.title.ilike(f'%{show_name}%'),
                Title.media_type == 'tv'
            ).all()
            
            for title in titles:
                episodes = self.db.query(Episode).filter(
                    Episode.title_id == title.id
                ).all()
                
                for episode in episodes:
                    if not episode.episode_name:
                        continue
                    
                    if episode.id in matching_episodes_dict:
                        continue
                    
                    episode_name_clean = self.clean_episode_name(episode.episode_name)
                    
                    if cleaned_name.lower() in episode_name_clean.lower() or episode_name_clean.lower() in cleaned_name.lower():
                        matching_episodes_dict[episode.id] = episode
                        continue
                    
                    parts = episode_name_clean.split('/')
                    for part in parts:
                        part = part.strip()
                        if part and (cleaned_name.lower() in part.lower() or part.lower() in cleaned_name.lower()):
                            matching_episodes_dict[episode.id] = episode
                            break
        
        return list(matching_episodes_dict.values())
    
    def map_category_to_tag(self, category_name: str) -> Optional[str]:
        category_lower = category_name.lower()
        
        for keyword, tag_slug in self.TAG_MAPPING.items():
            if keyword in category_lower:
                return tag_slug
        
        return None
    
    def scrape_and_tag_episodes(self, wiki_name: str, category: str, confidence: float = 0.8) -> Dict:
        tag_slug = self.map_category_to_tag(category)
        
        if not tag_slug:
            return {
                'success': False,
                'error': f'No matching tag found for category: {category}'
            }
        
        tag = self.db.query(ContentTag).filter(ContentTag.slug == tag_slug).first()
        
        if not tag:
            return {
                'success': False,
                'error': f'Tag not found in database: {tag_slug}'
            }
        
        members = self.get_category_members(wiki_name, category)
        
        if not members:
            return {
                'success': False,
                'error': 'No category members found'
            }
        
        results = {
            'success': True,
            'tag': tag_slug,
            'category': category,
            'total_pages': len(members),
            'episodes_found': 0,
            'episodes_tagged': 0,
            'episodes_already_tagged': 0,
            'episodes_not_in_db': 0,
            'failed_parses': 0
        }
        
        for member in members:
            page_title = member.get('title', '')
            
            matching_episodes = self.find_matching_episodes_by_name(wiki_name, page_title)
            
            if not matching_episodes:
                results['episodes_not_in_db'] += 1
                continue
            
            for episode in matching_episodes:
                results['episodes_found'] += 1
                
                existing_tag = self.db.query(EpisodeTag).filter(
                    EpisodeTag.episode_id == episode.id,
                    EpisodeTag.tag_id == tag.id
                ).first()
                
                if existing_tag:
                    results['episodes_already_tagged'] += 1
                    continue
                
                episode_tag = EpisodeTag(
                    episode_id=episode.id,
                    tag_id=tag.id,
                    source='fandom_scrape',
                    confidence=confidence
                )
                self.db.add(episode_tag)
                results['episodes_tagged'] += 1
            
            time.sleep(0.1)
        
        try:
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            return {
                'success': False,
                'error': f'Database error: {str(e)}'
            }
        
        return results

def trigger_show_scrape(title_id: int, title_name: str):
    """
    Automatic background task to scrape episode-level content tags
    when a parent adds a new TV show to their dashboard.
    Uses the enhanced Fandom scraper for comprehensive multi-strategy scraping.
    """
    from db import SessionLocal
    from models import Title
    from datetime import datetime
    from services.enhanced_fandom_scraper import EnhancedFandomScraper
    
    db = SessionLocal()
    try:
        title = db.query(Title).filter(Title.id == title_id).first()
        if not title or title.media_type != 'tv':
            print(f"Skipping scrape for {title_name}: not a TV show or not found")
            return
        
        print(f"Starting enhanced Fandom scrape for: {title_name}")
        
        # Use enhanced scraper with all tags (no filter = searches all 72+ tags)
        scraper = EnhancedFandomScraper(db, rate_limit_delay=1.0)
        result = scraper.scrape_show_episodes(
            title_id=title_id,
            tag_filter=None  # Search for all content tags
        )
        
        if result.get('success'):
            episodes_found = result.get('episodes_found', 0)
            episodes_matched = result.get('episodes_matched', 0)
            episodes_tagged = result.get('episodes_tagged', 0)
            tags_added = result.get('tags_added', 0)
            
            print(f"✅ Enhanced scrape complete for {title_name}:")
            print(f"   - Episodes found: {episodes_found}")
            print(f"   - Episodes matched: {episodes_matched}")
            print(f"   - Episodes tagged: {episodes_tagged}")
            print(f"   - Unique tags added: {tags_added}")
            
            # Mark as scraped
            try:
                title.fandom_scraped = True
                title.fandom_scrape_date = datetime.utcnow()
                if result.get('wiki_slug'):
                    title.wiki_slug = result['wiki_slug']
                db.commit()
                print(f"   - Marked {title_name} as scraped")
            except Exception as commit_error:
                db.rollback()
                print(f"   - Failed to mark {title_name} as scraped: {str(commit_error)}")
        else:
            error_msg = result.get('error', 'Unknown error')
            print(f"❌ Enhanced scrape failed for {title_name}: {error_msg}")
            print(f"   Will retry on next policy creation or manual scrape")
            
    except Exception as e:
        print(f"❌ Critical error in automatic scrape for {title_name}: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()
