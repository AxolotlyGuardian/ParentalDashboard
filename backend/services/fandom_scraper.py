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
    from db import SessionLocal
    from models import Title
    from datetime import datetime
    
    db = SessionLocal()
    try:
        scraper = FandomScraper(db)
        wiki_name = title_name.lower().replace(" ", "").replace("'", "")
        
        common_categories = [
            "Spiders", "Snakes", "Sharks", "Monsters", "Ghosts", 
            "Darkness", "Heights", "Fire", "Death", "Kidnapping"
        ]
        
        any_success = False
        for category in common_categories:
            try:
                result = scraper.scrape_and_tag_episodes(wiki_name, category, confidence=0.7)
                if result.get('success') and result.get('episodes_found', 0) > 0:
                    any_success = True
                    print(f"Scraped {title_name} - {category}: {result.get('episodes_tagged', 0)} episodes tagged")
            except Exception as e:
                print(f"Error scraping {title_name} - {category}: {str(e)}")
                continue
        
        if any_success:
            title = db.query(Title).filter(Title.id == title_id).first()
            if title:
                try:
                    title.fandom_scraped = True
                    title.fandom_scrape_date = datetime.utcnow()
                    db.commit()
                    print(f"Successfully marked {title_name} as scraped")
                except Exception as commit_error:
                    db.rollback()
                    print(f"Failed to mark {title_name} as scraped: {str(commit_error)}")
        else:
            print(f"No episodes found for {title_name}, will retry on next policy creation")
    except Exception as e:
        print(f"Critical error in trigger_show_scrape for {title_name}: {str(e)}")
    finally:
        db.close()
