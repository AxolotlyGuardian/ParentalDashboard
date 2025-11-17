'use client';

import { useState, useEffect } from 'react';
import { catalogApi, contentTagApi } from '@/lib/api';

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
  rating?: string;
  genres?: string[];
}

interface Policy {
  id: number;
  title_id: number;
  deep_links?: Record<string, string>;
}

interface ContentActionModalProps {
  isOpen: boolean;
  policy: Policy | null;
  onClose: () => void;
  onPlay: (policy: Policy) => void;
}

export default function ContentActionModal({ isOpen, policy, onClose, onPlay }: ContentActionModalProps) {
  const titleId = policy?.title_id || null;
  const [showingDetail, setShowingDetail] = useState(false);
  const [titleDetails, setTitleDetails] = useState<TitleDetails | null>(null);
  const [tags, setTags] = useState<ContentTag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (isOpen && titleId) {
      setLoadError(false);
      setShowingDetail(false);
      setTitleDetails(null);
      setTags([]);
      loadTitleData();
    } else {
      setShowingDetail(false);
      setLoadError(false);
      setTitleDetails(null);
      setTags([]);
    }
  }, [isOpen, titleId]);

  const loadTitleData = async () => {
    if (!titleId) return;
    
    setIsLoading(true);
    setLoadError(false);
    setShowingDetail(false);
    setTitleDetails(null);
    setTags([]);
    try {
      const [detailsRes, tagsRes] = await Promise.all([
        catalogApi.getTitleDetails(titleId),
        contentTagApi.getTitleTags(titleId)
      ]);
      
      setTitleDetails(detailsRes.data);
      setTags(tagsRes.data || []);
    } catch (error) {
      console.error('Failed to load title data', error);
      setLoadError(true);
      setShowingDetail(false);
      setTitleDetails(null);
      setTags([]);
    } finally {
      setIsLoading(false);
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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

              <h2 className="text-3xl font-bold text-gray-800 mb-2">{titleDetails.title}</h2>
              
              {titleDetails.rating && (
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full mb-3">
                  {titleDetails.rating}
                </span>
              )}

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
                          {categoryTags.map((tag) => (
                            <span
                              key={tag.id}
                              className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg"
                              title={tag.description}
                            >
                              {tag.display_name}
                            </span>
                          ))}
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
    </div>
  );
}
