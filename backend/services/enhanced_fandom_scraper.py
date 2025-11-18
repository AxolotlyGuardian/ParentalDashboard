"""
Enhanced Fandom Scraper
Implements comprehensive episode discovery and tag extraction using multiple strategies
"""
import requests
import re
import time
from typing import List, Dict, Optional, Set, Tuple
from sqlalchemy.orm import Session
from models import ContentTag, Episode, EpisodeTag, Title, FandomEpisodeLink, FandomShowConfig
from services.episode_matcher import EpisodeMatcher

try:
    from bs4 import BeautifulSoup
    HAS_BS4 = True
except ImportError:
    HAS_BS4 = False


class EnhancedFandomScraper:
    """
    Advanced Fandom wiki scraper with multiple search strategies:
    1. Category enumeration - Find episodes in categories
    2. Search API - Search for episodes by keywords
    3. Backlinks - Find episodes linking to tag pages
    4. HTML parsing - Extract episodes from list pages
    5. Tag extraction - Extract tags from episode page content
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.matcher = EpisodeMatcher(db)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Axolotly/1.0 (Parental Control App; Educational Use)'
        })
    
    def get_wiki_url(self, wiki_slug: str) -> str:
        """Get the base API URL for a Fandom wiki"""
        return f"https://{wiki_slug}.fandom.com/api.php"
    
    # Strategy 1: Category Enumeration
    def get_category_members(self, wiki_slug: str, category: str, limit: int = 500) -> List[Dict]:
        """
        Get all pages in a category using MediaWiki API
        """
        api_url = self.get_wiki_url(wiki_slug)
        members = []
        cmcontinue = None
        
        while True:
            params = {
                'action': 'query',
                'list': 'categorymembers',
                'cmtitle': f'Category:{category}',
                'cmlimit': min(limit, 500),
                'format': 'json'
            }
            
            if cmcontinue:
                params['cmcontinue'] = cmcontinue
            
            try:
                response = self.session.get(api_url, params=params, timeout=15)
                response.raise_for_status()
                data = response.json()
                
                if 'query' in data and 'categorymembers' in data['query']:
                    members.extend(data['query']['categorymembers'])
                
                # Check for continuation
                if 'continue' in data and 'cmcontinue' in data['continue']:
                    cmcontinue = data['continue']['cmcontinue']
                else:
                    break
                
                # Respect rate limits
                time.sleep(0.2)
                
            except Exception as e:
                print(f"Error fetching category members: {e}")
                break
        
        return members[:limit]
    
    # Strategy 2: Search API
    def search_wiki(self, wiki_slug: str, query: str, limit: int = 50) -> List[Dict]:
        """
        Search wiki for pages matching query using MediaWiki search API
        """
        api_url = self.get_wiki_url(wiki_slug)
        
        params = {
            'action': 'query',
            'list': 'search',
            'srsearch': query,
            'srnamespace': '0',  # Main namespace only
            'srwhat': 'text',  # Search in page text
            'srlimit': min(limit, 50),
            'format': 'json'
        }
        
        try:
            response = self.session.get(api_url, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()
            
            if 'query' in data and 'search' in data['query']:
                return data['query']['search']
            return []
            
        except Exception as e:
            print(f"Error searching wiki: {e}")
            return []
    
    # Strategy 3: Backlinks
    def get_backlinks(self, wiki_slug: str, page_title: str, limit: int = 100) -> List[Dict]:
        """
        Get pages that link to a specific page (useful for finding episodes linking to tag pages)
        """
        api_url = self.get_wiki_url(wiki_slug)
        
        params = {
            'action': 'query',
            'list': 'backlinks',
            'bltitle': page_title,
            'blnamespace': '0',  # Main namespace
            'bllimit': min(limit, 500),
            'format': 'json'
        }
        
        try:
            response = self.session.get(api_url, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()
            
            if 'query' in data and 'backlinks' in data['query']:
                return data['query']['backlinks']
            return []
            
        except Exception as e:
            print(f"Error fetching backlinks: {e}")
            return []
    
    # Strategy 4: HTML Parsing
    def parse_episode_list_html(self, wiki_slug: str, page_title: str) -> List[Dict]:
        """
        Parse episode list from a wiki page (e.g., "List of Episodes" page)
        Extracts episode information from tables and lists
        """
        if not HAS_BS4:
            print("  ⚠️  BeautifulSoup not available, skipping HTML parsing")
            return []
        
        url = f"https://{wiki_slug}.fandom.com/wiki/{page_title.replace(' ', '_')}"
        
        try:
            response = self.session.get(url, timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            episodes = []
            
            # Look for episode tables
            tables = soup.find_all('table', class_=['wikitable', 'episode-table', 'episodes'])
            
            for table in tables:
                rows = table.find_all('tr')[1:]  # Skip header row
                
                for row in rows:
                    cells = row.find_all(['td', 'th'])
                    if len(cells) < 2:
                        continue
                    
                    # Try to extract episode number and title
                    episode_data = {}
                    
                    # Common patterns: first cell is number, second is title with link
                    for i, cell in enumerate(cells):
                        text = cell.get_text(strip=True)
                        link = cell.find('a')
                        
                        # Check for season/episode number
                        match = re.search(r'(\d+)[x\-](\d+)', text)
                        if match:
                            episode_data['season'] = int(match.group(1))
                            episode_data['episode'] = int(match.group(2))
                        
                        # Check for episode title link
                        if link and 'href' in link.attrs:
                            episode_data['page_title'] = link.get('title', link.get_text(strip=True))
                            episode_data['url'] = f"https://{wiki_slug}.fandom.com{link['href']}"
                    
                    if episode_data.get('page_title'):
                        episodes.append(episode_data)
            
            return episodes
            
        except Exception as e:
            print(f"Error parsing episode list HTML: {e}")
            return []
    
    # Episode Catalog Builder
    def build_episode_catalog(self, title_id: int, wiki_slug: str) -> List[Dict]:
        """
        Build comprehensive episode catalog using all strategies
        Returns list of episode info dicts with: page_title, page_id, url, season, episode
        """
        title = self.db.query(Title).filter(Title.id == title_id).first()
        if not title:
            return []
        
        # Check if we have a config
        config = self.db.query(FandomShowConfig).filter(
            FandomShowConfig.title_id == title_id
        ).first()
        
        all_episodes = {}  # Use dict to deduplicate by page_title
        
        # Strategy 1: Episode list page (if configured)
        if config and config.episode_list_page:
            print(f"  📄 Parsing episode list page: {config.episode_list_page}")
            episodes = self.parse_episode_list_html(wiki_slug, config.episode_list_page)
            for ep in episodes:
                all_episodes[ep['page_title']] = ep
        
        # Strategy 2: Category enumeration for common episode categories
        episode_categories = [
            'Episodes',
            f'{title.title} episodes',
            'Season 1',
            'Season 2',
            'Season 3',
        ]
        
        for category in episode_categories:
            print(f"  📂 Searching category: {category}")
            members = self.get_category_members(wiki_slug, category, limit=200)
            
            for member in members:
                page_title = member.get('title', '')
                if page_title and page_title not in all_episodes:
                    all_episodes[page_title] = {
                        'page_title': page_title,
                        'page_id': member.get('pageid'),
                        'url': f"https://{wiki_slug}.fandom.com/wiki/{page_title.replace(' ', '_')}"
                    }
            
            time.sleep(0.2)
        
        # Strategy 3: Search for episodes
        search_terms = [
            f'"{title.title}" episode',
            'season episode',
        ]
        
        for term in search_terms:
            print(f"  🔍 Searching: {term}")
            results = self.search_wiki(wiki_slug, term, limit=50)
            
            for result in results:
                page_title = result.get('title', '')
                if page_title and 'episode' in page_title.lower() and page_title not in all_episodes:
                    all_episodes[page_title] = {
                        'page_title': page_title,
                        'page_id': result.get('pageid'),
                        'url': f"https://{wiki_slug}.fandom.com/wiki/{page_title.replace(' ', '_')}"
                    }
            
            time.sleep(0.2)
        
        print(f"  ✅ Found {len(all_episodes)} unique episodes")
        return list(all_episodes.values())
    
    # Tag Extraction from Episode Pages
    def extract_tags_from_episode(self, wiki_slug: str, page_title: str, tag_keywords: Dict[str, int]) -> Set[int]:
        """
        Extract tags from an episode page by searching for tag keywords
        
        Args:
            wiki_slug: Wiki slug
            page_title: Episode page title
            tag_keywords: Dict mapping tag keyword to tag_id
        
        Returns:
            Set of tag IDs found in the episode
        """
        api_url = self.get_wiki_url(wiki_slug)
        
        # Get page content
        params = {
            'action': 'parse',
            'page': page_title,
            'prop': 'text|sections|categories',
            'format': 'json'
        }
        
        try:
            response = self.session.get(api_url, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()
            
            if 'parse' not in data:
                return set()
            
            found_tags = set()
            
            # Get HTML content
            html_content = data['parse'].get('text', {}).get('*', '')
            
            # Get categories
            categories = data['parse'].get('categories', [])
            category_text = ' '.join([cat.get('*', '') for cat in categories])
            
            # Combine content
            combined_text = (html_content + ' ' + category_text).lower()
            
            # Search for tag keywords
            for keyword, tag_id in tag_keywords.items():
                if keyword.lower() in combined_text:
                    found_tags.add(tag_id)
            
            return found_tags
            
        except Exception as e:
            print(f"Error extracting tags from {page_title}: {e}")
            return set()
    
    # Main Scraping Orchestration
    def scrape_show_episodes(self, title_id: int, tag_filter: Optional[List[int]] = None) -> Dict:
        """
        Comprehensive scraping of a TV show:
        1. Build episode catalog from Fandom
        2. Match episodes to TMDB episodes
        3. Extract tags from episode pages
        4. Associate tags with episodes
        
        Args:
            title_id: The title/show ID
            tag_filter: Optional list of tag IDs to search for (if None, searches all)
        
        Returns:
            Dict with scraping statistics
        """
        title = self.db.query(Title).filter(Title.id == title_id).first()
        if not title or title.media_type != 'tv':
            return {'success': False, 'error': 'Title not found or not a TV show'}
        
        # Determine wiki slug
        wiki_slug = title.wiki_slug if title.wiki_slug else title.title.lower().replace(' ', '').replace("'", "")
        
        print(f"\n🎬 Scraping: {title.title}")
        print(f"   Wiki: {wiki_slug}.fandom.com\n")
        
        # Step 1: Build episode catalog
        print("📚 Building episode catalog...")
        fandom_episodes = self.build_episode_catalog(title_id, wiki_slug)
        
        if not fandom_episodes:
            return {
                'success': False,
                'error': 'No episodes found in Fandom wiki',
                'wiki_slug': wiki_slug
            }
        
        # Step 2: Match episodes to TMDB
        print(f"\n🔗 Matching {len(fandom_episodes)} episodes to TMDB...")
        match_results = self.matcher.batch_match_episodes(title_id, fandom_episodes)
        
        matched_count = sum(1 for r in match_results if r.episode_id is not None)
        print(f"   ✅ Matched {matched_count}/{len(match_results)} episodes")
        
        # Step 3: Prepare tag keywords
        if tag_filter:
            tags = self.db.query(ContentTag).filter(ContentTag.id.in_(tag_filter)).all()
        else:
            tags = self.db.query(ContentTag).all()
        
        # Build keyword mapping: keyword -> tag_id
        tag_keywords = {}
        for tag in tags:
            # Add tag slug and display name as keywords
            tag_keywords[tag.slug.replace('_', ' ')] = tag.id
            tag_keywords[tag.display_name.lower()] = tag.id
            
            # Add common variations
            variations = {
                'spiders': ['spider', 'arachnid'],
                'snakes': ['snake', 'serpent'],
                'monsters': ['monster', 'creature'],
                'ghosts': ['ghost', 'phantom', 'spirit'],
                'darkness': ['dark', 'shadow'],
                'heights': ['height', 'high', 'fall'],
            }
            
            for slug_key, variants in variations.items():
                if slug_key in tag.slug:
                    for variant in variants:
                        tag_keywords[variant] = tag.id
        
        # Step 4: Extract tags from matched episodes
        print(f"\n🏷️  Extracting tags from episodes...")
        tags_added = 0
        episodes_tagged = 0
        
        for match_result in match_results:
            if not match_result.episode_id or match_result.confidence < 0.6:
                continue
            
            # Extract tags from this episode page
            found_tag_ids = self.extract_tags_from_episode(
                wiki_slug,
                match_result.fandom_page_title,
                tag_keywords
            )
            
            if found_tag_ids:
                episodes_tagged += 1
                
                # Add tags to episode
                for tag_id in found_tag_ids:
                    # Check if tag already exists
                    existing = self.db.query(EpisodeTag).filter(
                        EpisodeTag.episode_id == match_result.episode_id,
                        EpisodeTag.tag_id == tag_id
                    ).first()
                    
                    if not existing:
                        episode_tag = EpisodeTag(
                            episode_id=match_result.episode_id,
                            tag_id=tag_id,
                            source='fandom_enhanced_scrape',
                            confidence=match_result.confidence * 0.9,  # Slight confidence reduction
                            source_url=f"https://{wiki_slug}.fandom.com/wiki/{match_result.fandom_page_title.replace(' ', '_')}",
                            extraction_method='keyword_match'
                        )
                        self.db.add(episode_tag)
                        tags_added += 1
            
            time.sleep(0.3)  # Respect rate limits
        
        try:
            self.db.commit()
            print(f"\n✅ Scraping complete!")
            print(f"   - Episodes matched: {matched_count}")
            print(f"   - Episodes tagged: {episodes_tagged}")
            print(f"   - Tags added: {tags_added}")
            
            return {
                'success': True,
                'wiki_slug': wiki_slug,
                'episodes_found': len(fandom_episodes),
                'episodes_matched': matched_count,
                'episodes_tagged': episodes_tagged,
                'tags_added': tags_added
            }
            
        except Exception as e:
            self.db.rollback()
            return {
                'success': False,
                'error': f'Database error: {str(e)}'
            }
