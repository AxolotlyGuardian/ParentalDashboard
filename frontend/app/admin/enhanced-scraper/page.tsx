'use client';

import { useState, useEffect } from 'react';
import { adminApi, catalogApi, contentTagApi } from '@/lib/api';

interface Title {
  id: number;
  title: string;
  media_type: string;
}

interface ScrapeStats {
  title_name: string;
  total_episodes: number;
  matched_episodes: number;
  tagged_episodes: number;
  total_tags: number;
  match_rate: number;
  tag_rate: number;
}

interface EpisodeLink {
  id: number;
  title_name: string;
  season_number: number;
  episode_number: number;
  episode_name: string | null;
  fandom_page_title: string;
  fandom_url: string | null;
  confidence: number;
  matching_method: string | null;
  created_at: string;
}

interface EpisodeTag {
  id: number;
  episode_id: number;
  episode_name: string | null;
  season_number: number;
  episode_number: number;
  tag_name: string;
  tag_slug: string;
  tag_category: string;
  source: string;
  confidence: number;
  source_url: string | null;
  extraction_method: string | null;
  created_at: string;
}

interface ContentTag {
  id: number;
  display_name: string;
  slug: string;
  category: string;
}

export default function EnhancedScraperPage() {
  const [titles, setTitles] = useState<Title[]>([]);
  const [selectedTitle, setSelectedTitle] = useState<number | null>(null);
  const [tags, setTags] = useState<ContentTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [rateLimit, setRateLimit] = useState(0.5);
  const [loadingTitles, setLoadingTitles] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [stats, setStats] = useState<ScrapeStats | null>(null);
  const [episodeLinks, setEpisodeLinks] = useState<EpisodeLink[]>([]);
  const [episodeTags, setEpisodeTags] = useState<EpisodeTag[]>([]);
  const [activeTab, setActiveTab] = useState<'scrape' | 'stats' | 'links' | 'tags'>('scrape');
  const [scrapeResult, setScrapeResult] = useState<any>(null);

  useEffect(() => {
    loadTitles();
    loadTags();
  }, []);

  useEffect(() => {
    if (selectedTitle) {
      loadStats();
      loadEpisodeLinks();
      loadEpisodeTags();
    }
  }, [selectedTitle]);

  const loadTitles = async () => {
    try {
      setLoadingTitles(true);
      const response = await catalogApi.getAllTitles(0, 1000);
      const tvShows = response.data.titles.filter((t: Title) => t.media_type === 'tv');
      setTitles(tvShows);
    } catch (error) {
      console.error('Failed to load titles:', error);
    } finally {
      setLoadingTitles(false);
    }
  };

  const loadTags = async () => {
    try {
      const response = await contentTagApi.getTags();
      setTags(response.data);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const loadStats = async () => {
    if (!selectedTitle) return;
    try {
      const response = await adminApi.getFandomScrapeStats(selectedTitle);
      setStats(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setStats(null);
      } else {
        console.error('Failed to load stats:', error);
        setStats(null);
      }
    }
  };

  const loadEpisodeLinks = async () => {
    if (!selectedTitle) return;
    try {
      const response = await adminApi.getFandomEpisodeLinks(selectedTitle);
      setEpisodeLinks(response.data);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Failed to load episode links:', error);
      }
      setEpisodeLinks([]);
    }
  };

  const loadEpisodeTags = async () => {
    if (!selectedTitle) return;
    try {
      const response = await adminApi.getFandomEpisodeTags(selectedTitle);
      setEpisodeTags(response.data);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Failed to load episode tags:', error);
      }
      setEpisodeTags([]);
    }
  };

  const refreshData = async () => {
    if (!selectedTitle) return;
    setLoadingData(true);
    try {
      await Promise.allSettled([loadStats(), loadEpisodeLinks(), loadEpisodeTags()]);
    } finally {
      setLoadingData(false);
    }
  };

  const handleScrape = async () => {
    if (!selectedTitle) {
      alert('Please select a show');
      return;
    }

    const validRateLimit = isNaN(rateLimit) || rateLimit <= 0 ? 0.5 : rateLimit;

    try {
      setScraping(true);
      setScrapeResult(null);
      
      const response = await adminApi.enhancedScrape({
        title_id: selectedTitle,
        tag_filter: selectedTags.length > 0 ? selectedTags : undefined,
        rate_limit_delay: validRateLimit
      });
      
      setScrapeResult(response.data);
      
      if (response.data.success) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        try {
          await refreshData();
        } catch (refreshError) {
          console.warn('Data refresh after scrape had errors, but scrape succeeded');
        }
        setActiveTab('stats');
      }
    } catch (error: any) {
      console.error('Scrape failed:', error);
      setScrapeResult({
        success: false,
        error: error.response?.data?.detail || error.message || 'Unknown error'
      });
    } finally {
      setScraping(false);
    }
  };

  const toggleTag = (tagId: number) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const selectedTitleObj = titles.find(t => t.id === selectedTitle);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Enhanced Fandom Scraper</h1>
        <p className="text-gray-600 mt-2">Comprehensive episode-level content tagging from Fandom wikis</p>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('scrape')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'scrape'
                  ? 'border-b-2 border-pink-500 text-pink-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Configure & Scrape
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'stats'
                  ? 'border-b-2 border-pink-500 text-pink-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Statistics
            </button>
            <button
              onClick={() => setActiveTab('links')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'links'
                  ? 'border-b-2 border-pink-500 text-pink-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Episode Links ({episodeLinks.length})
            </button>
            <button
              onClick={() => setActiveTab('tags')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'tags'
                  ? 'border-b-2 border-pink-500 text-pink-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Episode Tags ({episodeTags.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'scrape' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select TV Show
                </label>
                {loadingTitles ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                    Loading TV shows...
                  </div>
                ) : titles.length === 0 ? (
                  <div className="w-full px-3 py-2 border border-yellow-300 rounded-md bg-yellow-50">
                    <p className="text-yellow-800 font-medium">No TV shows found in database</p>
                    <p className="text-yellow-700 text-sm mt-1">
                      Please add TV shows to your catalog first using the TMDB Sync or search feature.
                    </p>
                  </div>
                ) : (
                  <select
                    value={selectedTitle || ''}
                    onChange={(e) => setSelectedTitle(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="">-- Select a show ({titles.length} available) --</option>
                    {titles.map(title => (
                      <option key={title.id} value={title.id}>
                        {title.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedTitle && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Tags (Optional)
                    </label>
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {tags.map(tag => (
                          <label key={tag.id} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedTags.includes(tag.id)}
                              onChange={() => toggleTag(tag.id)}
                              className="rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                            />
                            <span className="text-sm text-gray-700">{tag.display_name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedTags.length > 0 
                        ? `Searching for ${selectedTags.length} tag(s)` 
                        : 'Leave empty to search for all tags'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rate Limit Delay (seconds)
                    </label>
                    <input
                      type="number"
                      value={rateLimit}
                      onChange={(e) => setRateLimit(parseFloat(e.target.value))}
                      min="0.1"
                      max="5"
                      step="0.1"
                      className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Delay between API requests (0.5s recommended)
                    </p>
                  </div>

                  <button
                    onClick={handleScrape}
                    disabled={scraping}
                    className={`px-6 py-3 rounded-md text-white font-medium ${
                      scraping ? 'bg-gray-400 cursor-not-allowed' : 'bg-pink-500 hover:bg-pink-600'
                    }`}
                  >
                    {scraping ? 'Scraping... This may take a while' : 'Start Enhanced Scrape'}
                  </button>
                </>
              )}

              {scrapeResult && (
                <div className={`rounded-lg p-4 ${scrapeResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <h3 className="font-semibold text-lg mb-2">
                    {scrapeResult.success ? '✅ Scrape Complete' : '❌ Scrape Failed'}
                  </h3>
                  
                  {scrapeResult.error && (
                    <p className="text-red-700 mb-2">{scrapeResult.error}</p>
                  )}
                  
                  {scrapeResult.success && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                      <div>
                        <div className="text-sm text-gray-600">Wiki Slug</div>
                        <div className="font-semibold">{scrapeResult.wiki_slug}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Episodes Found</div>
                        <div className="font-semibold text-blue-600">{scrapeResult.episodes_found}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Episodes Matched</div>
                        <div className="font-semibold text-green-600">{scrapeResult.episodes_matched}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Episodes Tagged</div>
                        <div className="font-semibold text-purple-600">{scrapeResult.episodes_tagged}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Tags Added</div>
                        <div className="font-semibold text-pink-600">{scrapeResult.tags_added}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && !selectedTitle && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg font-medium">No show selected</p>
              <p className="text-sm mt-2">Please select a TV show to view scraping statistics</p>
            </div>
          )}

          {activeTab === 'stats' && selectedTitle && !stats && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg font-medium">No statistics available</p>
              <p className="text-sm mt-2">Run an enhanced scrape to generate statistics</p>
            </div>
          )}

          {activeTab === 'stats' && selectedTitle && stats && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">{stats.title_name}</h2>
                <button
                  onClick={refreshData}
                  disabled={loading}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition disabled:opacity-50"
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Total Episodes</div>
                  <div className="text-3xl font-bold text-gray-900">{stats.total_episodes}</div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-600">Matched Episodes</div>
                  <div className="text-3xl font-bold text-blue-700">{stats.matched_episodes}</div>
                  <div className="text-sm text-blue-600 mt-1">{stats.match_rate}% match rate</div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-green-600">Tagged Episodes</div>
                  <div className="text-3xl font-bold text-green-700">{stats.tagged_episodes}</div>
                  <div className="text-sm text-green-600 mt-1">{stats.tag_rate}% tagged</div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-purple-600">Total Tags</div>
                  <div className="text-3xl font-bold text-purple-700">{stats.total_tags}</div>
                </div>
              </div>

              <div className="mt-6">
                <div className="bg-blue-100 border-l-4 border-blue-500 p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Match Rate:</strong> Percentage of episodes successfully linked to Fandom pages
                  </p>
                </div>
                <div className="bg-green-100 border-l-4 border-green-500 p-4 mt-2">
                  <p className="text-sm text-green-800">
                    <strong>Tag Rate:</strong> Percentage of episodes with at least one content tag
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'links' && !selectedTitle && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg font-medium">No show selected</p>
              <p className="text-sm mt-2">Please select a TV show to view episode links</p>
            </div>
          )}

          {activeTab === 'links' && selectedTitle && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Episode Links {selectedTitleObj ? `for ${selectedTitleObj.title}` : ''}
                </h2>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-600">
                    {episodeLinks.length} total links
                  </div>
                  <button
                    onClick={refreshData}
                    disabled={loadingData}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition disabled:opacity-50"
                  >
                    {loadingData ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
              </div>

              {episodeLinks.length === 0 ? (
                <div className="text-center py-12 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-blue-800 font-medium text-lg">No episode links found</p>
                  <p className="text-blue-700 text-sm mt-2">Run an enhanced scrape to match episodes from Fandom wiki</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Episode</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fandom Page</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {episodeLinks.map(link => (
                        <tr key={link.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            <div className="font-medium text-gray-900">
                              S{link.season_number}E{link.episode_number}
                            </div>
                            {link.episode_name && (
                              <div className="text-xs text-gray-500">{link.episode_name}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {link.fandom_url ? (
                              <a 
                                href={link.fandom_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {link.fandom_page_title}
                              </a>
                            ) : (
                              <span className="text-gray-700">{link.fandom_page_title}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              link.confidence >= 0.9 ? 'bg-green-100 text-green-800' :
                              link.confidence >= 0.7 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {(link.confidence * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {link.matching_method || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tags' && !selectedTitle && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg font-medium">No show selected</p>
              <p className="text-sm mt-2">Please select a TV show to view episode tags</p>
            </div>
          )}

          {activeTab === 'tags' && selectedTitle && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Episode Tags {selectedTitleObj ? `for ${selectedTitleObj.title}` : ''}
                </h2>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-600">
                    {episodeTags.length} total tags
                  </div>
                  <button
                    onClick={refreshData}
                    disabled={loadingData}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition disabled:opacity-50"
                  >
                    {loadingData ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
              </div>

              {episodeTags.length === 0 ? (
                <div className="text-center py-12 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-blue-800 font-medium text-lg">No episode tags found</p>
                  <p className="text-blue-700 text-sm mt-2">Run an enhanced scrape to tag episodes with content warnings</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Episode</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tag</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provenance</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {episodeTags.map(tag => (
                        <tr key={tag.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            <div className="font-medium text-gray-900">
                              S{tag.season_number}E{tag.episode_number}
                            </div>
                            {tag.episode_name && (
                              <div className="text-xs text-gray-500">{tag.episode_name}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-pink-100 text-pink-800">
                              {tag.tag_name}
                            </span>
                            <div className="text-xs text-gray-500 mt-1">{tag.tag_category}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {tag.source}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              tag.confidence >= 0.9 ? 'bg-green-100 text-green-800' :
                              tag.confidence >= 0.7 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {(tag.confidence * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {tag.source_url ? (
                              <a 
                                href={tag.source_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-xs"
                              >
                                View Source
                              </a>
                            ) : (
                              <span className="text-gray-400 text-xs">N/A</span>
                            )}
                            {tag.extraction_method && (
                              <div className="text-xs text-gray-500 mt-1">{tag.extraction_method}</div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
