'use client';

import { useState, useEffect } from 'react';
import { catalogApi, contentTagApi, policyApi } from '@/lib/api';
import { Policy } from '@/types/policy';

interface ContentTag {
  id: number;
  category: string;
  slug: string;
  display_name: string;
  description?: string;
}

interface TitleDetails {
  id: number;
  title: string;
  media_type: string;
  overview: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
  content_rating?: string;
  vote_average?: number;
  genres?: string[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  fandom_scraped?: boolean;
}

interface ContentActionModalProps {
  isOpen: boolean;
  policy: Policy | null;
  onClose: () => void;
  onPlay: (policy: Policy) => void;
}

interface Episode {
  id: number;
  season_number: number;
  episode_number: number;
  episode_name: string;
  overview?: string;
  thumbnail_path?: string;
  air_date?: string;
  is_blocked: boolean;
  tags: ContentTag[];
}

export default function ContentActionModal({ isOpen, policy, onClose, onPlay }: ContentActionModalProps) {
  const titleId = policy?.title_id || null;
  const [showingDetail, setShowingDetail] = useState(false);
  const [titleDetails, setTitleDetails] = useState<TitleDetails | null>(null);
  const [tags, setTags] = useState<ContentTag[]>([]);
  const [episodes, setEpisodes] = useState<Record<number, Episode[]>>({});
  const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(new Set());
  const [showSeasonsList, setShowSeasonsList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [selectedTag, setSelectedTag] = useState<ContentTag | null>(null);
  const [tagEpisodes, setTagEpisodes] = useState<any[]>([]);
  const [showTagConfirmDialog, setShowTagConfirmDialog] = useState(false);
  const [isBlockingEpisodes, setIsBlockingEpisodes] = useState(false);

  useEffect(() => {
    if (isOpen && titleId) {
      setLoadError(false);
      setShowingDetail(false);
      setTitleDetails(null);
      setTags([]);
      setEpisodes({});
      setExpandedSeasons(new Set());
      setShowSeasonsList(false);
      setSelectedTag(null);
      setTagEpisodes([]);
      setShowTagConfirmDialog(false);
      loadTitleData();
    } else {
      setShowingDetail(false);
      setLoadError(false);
      setTitleDetails(null);
      setTags([]);
      setEpisodes({});
      setExpandedSeasons(new Set());
      setShowSeasonsList(false);
      setSelectedTag(null);
      setTagEpisodes([]);
      setShowTagConfirmDialog(false);
    }
  }, [isOpen, titleId]);

  const loadTitleData = async () => {
    if (!titleId || !policy) return;
    
    setIsLoading(true);
    setLoadError(false);
    setShowingDetail(false);
    setTitleDetails(null);
    setTags([]);
    setEpisodes({});
    try {
      const [detailsRes, tagsRes, episodesRes] = await Promise.all([
        catalogApi.getTitleDetails(titleId),
        contentTagApi.getTitleTags(titleId),
        catalogApi.getTitleEpisodes(titleId, policy.policy_id).catch(() => ({ data: { seasons: {} } }))
      ]);
      
      setTitleDetails(detailsRes.data);
      setTags(tagsRes.data || []);
      setEpisodes(episodesRes.data?.seasons || {});
    } catch (error) {
      console.error('Failed to load title data', error);
      setLoadError(true);
      setShowingDetail(false);
      setTitleDetails(null);
      setTags([]);
      setEpisodes({});
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSeason = (seasonNumber: number) => {
    setExpandedSeasons(prev => {
      const next = new Set(prev);
      if (next.has(seasonNumber)) {
        next.delete(seasonNumber);
      } else {
        next.add(seasonNumber);
      }
      return next;
    });
  };

  const toggleEpisodeBlock = async (episodeId: number, currentlyBlocked: boolean) => {
    if (!policy) return;
    try {
      await policyApi.toggleEpisodePolicy(policy.policy_id, episodeId, !currentlyBlocked);
      setEpisodes(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(seasonKey => {
          updated[Number(seasonKey)] = updated[Number(seasonKey)].map(ep =>
            ep.id === episodeId ? { ...ep, is_blocked: !currentlyBlocked } : ep
          );
        });
        return updated;
      });
    } catch (error) {
      console.error('Failed to toggle episode', error);
    }
  };

  const handleTagClick = async (tag: ContentTag) => {
    if (!policy) return;
    try {
      const response = await policyApi.getEpisodesByTag(policy.policy_id, tag.id);
      setSelectedTag(tag);
      setTagEpisodes(response.data.episodes || []);
      setShowTagConfirmDialog(true);
    } catch (error) {
      console.error('Failed to fetch episodes by tag', error);
      alert('Failed to load episodes for this tag');
    }
  };

  const handleConfirmBlockByTag = async () => {
    if (!policy || !selectedTag) return;
    setIsBlockingEpisodes(true);
    try {
      const response = await policyApi.blockEpisodesByTag(policy.policy_id, selectedTag.id);
      alert(response.data.message);
      setShowTagConfirmDialog(false);
      setSelectedTag(null);
      setTagEpisodes([]);
      await loadTitleData();
    } catch (error) {
      console.error('Failed to block episodes by tag', error);
      alert('Failed to block episodes');
    } finally {
      setIsBlockingEpisodes(false);
    }
  };

  const handleCancelTagDialog = () => {
    setShowTagConfirmDialog(false);
    setSelectedTag(null);
    setTagEpisodes([]);
  };

  const handlePlayClick = () => {
    if (!policy) return;
    onPlay(policy);
    onClose();
  };

  const handleMoreDetailClick = () => {
    setShowingDetail(true);
  };

  const handleBackToActions = () => {
    setShowingDetail(false);
  };

  const groupedTags = tags.reduce((acc, tag) => {
    if (!acc[tag.category]) {
      acc[tag.category] = [];
    }
    acc[tag.category].push(tag);
    return acc;
  }, {} as Record<string, ContentTag[]>);

  // Determine which tags have been used to block episodes
  const tagsWithBlockedContent = new Set<number>();
  Object.values(episodes).forEach(seasonEpisodes => {
    seasonEpisodes.forEach(episode => {
      if (episode.is_blocked) {
        episode.tags.forEach(tag => {
          tagsWithBlockedContent.add(tag.id);
        });
      }
    });
  });

  const categoryLabels: Record<string, string> = {
    creatures: '🦕 Creatures & Characters',
    situations: '⚠️ Situations & Themes',
    death_loss: '💔 Death & Loss',
    visuals: '👻 Scary Visuals',
    intensity: '⚡ Intensity Levels',
    social: '👥 Social Fears',
    rating: '⭐ Rating',
    age: '🎂 Age',
    content_warning: '🚨 Content Warnings',
  };

  if (!isOpen || !titleId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">⏳</div>
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : showingDetail && titleDetails ? (
          <div>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleBackToActions}
                  className="text-[#F77B8A] hover:text-[#F77B8A]/80 text-sm font-medium flex items-center gap-1"
                >
                  ← Back
                </button>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              {titleDetails.backdrop_path && (
                <img
                  src={titleDetails.backdrop_path}
                  alt={titleDetails.title}
                  className="w-full h-48 object-cover rounded-xl mb-4"
                />
              )}

              <h2 className="text-3xl font-bold text-gray-800 mb-3">{titleDetails.title}</h2>
              
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {titleDetails.vote_average && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#F77B8A]">{titleDetails.vote_average.toFixed(1)}/10</div>
                      <div className="text-xs text-gray-600 mt-1">TMDB Rating</div>
                    </div>
                  )}
                  {titleDetails.content_rating && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-700">{titleDetails.content_rating}</div>
                      <div className="text-xs text-gray-600 mt-1">Content Rating</div>
                    </div>
                  )}
                  {titleDetails.number_of_seasons && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{titleDetails.number_of_seasons}</div>
                      <div className="text-xs text-gray-600 mt-1">Seasons</div>
                    </div>
                  )}
                  {titleDetails.number_of_episodes && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{titleDetails.number_of_episodes}</div>
                      <div className="text-xs text-gray-600 mt-1">Episodes</div>
                    </div>
                  )}
                </div>
              </div>

              {titleDetails.genres && titleDetails.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {titleDetails.genres.map((genre, index) => (
                    <span key={index} className="px-3 py-1 bg-pink-50 text-[#F77B8A] text-sm rounded-full">
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              {titleDetails.overview && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
                  <p className="text-gray-600 leading-relaxed">{titleDetails.overview}</p>
                </div>
              )}

              {tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Content Tags</h3>
                  <div className="space-y-4">
                    {Object.entries(groupedTags).map(([category, categoryTags]) => (
                      <div key={category}>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          {categoryLabels[category] || category}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {categoryTags.map((tag) => {
                            const hasBlockedContent = tagsWithBlockedContent.has(tag.id);
                            return (
                              <button
                                key={tag.id}
                                onClick={() => handleTagClick(tag)}
                                className={`px-3 py-1 text-sm rounded-lg transition-colors cursor-pointer ${
                                  hasBlockedContent
                                    ? 'bg-[#F77B8A] text-white hover:bg-[#F77B8A]/90'
                                    : 'bg-gray-100 hover:bg-[#F77B8A] hover:text-white text-gray-700'
                                }`}
                                title={
                                  hasBlockedContent
                                    ? `✓ Active: ${tag.display_name} has blocked episodes. Click to block more.`
                                    : tag.description || `Click to block episodes with ${tag.display_name}`
                                }
                              >
                                {tag.display_name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tags.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">✅</div>
                  <p className="text-gray-600">No content warnings reported for this title</p>
                </div>
              )}

              {Object.keys(episodes).length > 0 && (
                <div className="mt-6">
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setShowSeasonsList(!showSeasonsList)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 flex items-center justify-between transition-colors"
                    >
                      <span className="font-semibold text-gray-800">
                        {Object.keys(episodes).length} Season{Object.keys(episodes).length !== 1 ? 's' : ''}
                      </span>
                      <span className="text-gray-500">{showSeasonsList ? '▼' : '▶'}</span>
                    </button>

                    {showSeasonsList && (
                      <div className="divide-y divide-gray-200">
                        {Object.keys(episodes).sort((a, b) => Number(a) - Number(b)).map(seasonKey => {
                          const seasonNumber = Number(seasonKey);
                          const seasonEpisodes = episodes[seasonNumber];
                          const isExpanded = expandedSeasons.has(seasonNumber);
                          
                          return (
                            <div key={seasonNumber}>
                              <button
                                onClick={() => toggleSeason(seasonNumber)}
                                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                              >
                                <span className="font-semibold text-gray-800">
                                  Season {seasonNumber} ({seasonEpisodes.length} episode{seasonEpisodes.length !== 1 ? 's' : ''})
                                </span>
                                <span className="text-gray-500">{isExpanded ? '▼' : '▶'}</span>
                              </button>
                              
                              {isExpanded && (
                                <div className="bg-white divide-y divide-gray-100">
                                  {seasonEpisodes.map(episode => (
                                    <div key={episode.id} className="p-4 hover:bg-gray-50">
                                      <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-gray-900">
                                              E{episode.episode_number}
                                            </span>
                                            <span className="text-gray-700">{episode.episode_name}</span>
                                          </div>
                                          {episode.overview && (
                                            <p className="text-sm text-gray-600 mb-2">{episode.overview}</p>
                                          )}
                                      {episode.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {episode.tags.map(tag => (
                                            <span
                                              key={tag.id}
                                              className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded"
                                              title={tag.description}
                                            >
                                              {tag.display_name}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => toggleEpisodeBlock(episode.id, episode.is_blocked)}
                                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                        episode.is_blocked
                                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                                      }`}
                                    >
                                      {episode.is_blocked ? '🚫 Blocked' : '✅ Allowed'}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : loadError ? (
          <div>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Content</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="text-center py-8 mb-4">
                <div className="text-gray-400 text-6xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Unable to load details</h3>
                <p className="text-gray-600 mb-6">We couldn't load the full details for this content, but you can still play it.</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handlePlayClick}
                  className="w-full py-4 bg-[#F77B8A] text-white rounded-xl text-lg font-semibold hover:bg-[#F77B8A]/90 transition-all flex items-center justify-center gap-2"
                >
                  <span className="text-2xl">▶</span>
                  Play Now
                </button>

                <button
                  onClick={loadTitleData}
                  className="w-full py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:border-[#F77B8A] hover:text-[#F77B8A] transition-all"
                >
                  🔄 Try Again
                </button>
              </div>
            </div>
          </div>
        ) : titleDetails ? (
          <div>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">{titleDetails.title}</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              {titleDetails.poster_path && (
                <div className="mb-6 flex justify-center">
                  <img
                    src={titleDetails.poster_path}
                    alt={titleDetails.title}
                    className="w-48 rounded-xl shadow-lg"
                  />
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handlePlayClick}
                  className="w-full py-4 bg-[#F77B8A] text-white rounded-xl text-lg font-semibold hover:bg-[#F77B8A]/90 transition-all flex items-center justify-center gap-2"
                >
                  <span className="text-2xl">▶</span>
                  Play {titleDetails.media_type === 'tv' ? 'Episode 1' : 'Now'}
                </button>

                <button
                  onClick={handleMoreDetailClick}
                  className="w-full py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl text-lg font-semibold hover:border-[#F77B8A] hover:text-[#F77B8A] transition-all flex items-center justify-center gap-2"
                >
                  <span className="text-2xl">ℹ️</span>
                  More Detail
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {showTagConfirmDialog && selectedTag && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={handleCancelTagDialog}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Block Episodes with "{selectedTag.display_name}"?</h3>
              <p className="text-gray-600">
                This will block <span className="font-semibold text-[#F77B8A]">{tagEpisodes.length} episode{tagEpisodes.length !== 1 ? 's' : ''}</span> that contain {selectedTag.display_name.toLowerCase()}.
              </p>
            </div>

            {tagEpisodes.length > 0 && (
              <div className="max-h-48 overflow-y-auto mb-4 bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">Episodes to be blocked:</p>
                <div className="space-y-1">
                  {tagEpisodes.map((ep: any) => (
                    <div key={ep.id} className="text-sm text-gray-700">
                      <span className="font-medium">S{ep.season_number}E{ep.episode_number}</span>
                      {ep.episode_name && <span className="text-gray-600">: {ep.episode_name}</span>}
                      {ep.is_blocked && <span className="text-red-600 ml-2">(already blocked)</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleCancelTagDialog}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                disabled={isBlockingEpisodes}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBlockByTag}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isBlockingEpisodes}
              >
                {isBlockingEpisodes ? 'Blocking...' : 'Block Episodes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
