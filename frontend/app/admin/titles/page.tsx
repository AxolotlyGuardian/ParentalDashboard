'use client';

import { useState, useEffect } from 'react';
import { catalogApi, contentTagApi, policyApi } from '@/lib/api';

interface Title {
  id: number;
  tmdb_id: number;
  title: string;
  media_type: string;
  poster_path?: string;
  rating: string;
}

interface TitleDetail extends Title {
  overview?: string;
  backdrop_path?: string;
  release_date?: string;
  genres?: number[];
}

interface Tag {
  id: number;
  category: string;
  slug: string;
  display_name: string;
}

export default function TitlesPage() {
  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTitle, setSelectedTitle] = useState<TitleDetail | null>(null);
  const [titleTags, setTitleTags] = useState<Tag[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  const ITEMS_PER_PAGE = 50;

  useEffect(() => {
    loadTitles();
  }, [page]);

  const loadTitles = async () => {
    try {
      setLoading(true);
      const response = await catalogApi.getAllTitles(page * ITEMS_PER_PAGE, ITEMS_PER_PAGE);
      setTitles(response.data);
    } catch (error) {
      console.error('Failed to load titles', error);
      alert('Failed to load titles');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (title: Title) => {
    try {
      const [detailsResponse, tagsResponse] = await Promise.all([
        catalogApi.getTitleDetails(title.id),
        contentTagApi.getTitleTags(title.id)
      ]);
      
      setSelectedTitle(detailsResponse.data);
      setTitleTags(tagsResponse.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Failed to load title details', error);
      alert('Failed to load title details');
    }
  };

  const filteredTitles = titles.filter(title =>
    title.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      creatures: 'bg-purple-100 text-purple-800',
      situations: 'bg-orange-100 text-orange-800',
      death_loss: 'bg-gray-100 text-gray-800',
      visuals: 'bg-red-100 text-red-800',
      intensity: 'bg-yellow-100 text-yellow-800',
      social: 'bg-blue-100 text-blue-800',
      rating: 'bg-green-100 text-green-800',
      age: 'bg-indigo-100 text-indigo-800',
      content_warning: 'bg-pink-100 text-pink-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading titles...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Titles</h1>
        <p className="text-gray-600 mt-2">
          View all movies and TV shows in the database
        </p>
      </div>

      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex gap-4 items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search titles..."
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <div className="text-sm text-gray-600">
            Showing {filteredTitles.length} of {titles.length} titles
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Poster</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">TMDB ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredTitles.map((title) => (
              <tr key={title.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  {title.poster_path ? (
                    <img
                      src={title.poster_path}
                      alt={title.title}
                      className="w-12 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                      No image
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{title.title}</div>
                  <div className="text-xs text-gray-500">ID: {title.id}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    title.media_type === 'movie' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {title.media_type === 'movie' ? 'Movie' : 'TV Show'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  ⭐ {title.rating || 'N/A'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {title.tmdb_id}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleViewDetails(title)}
                    className="text-[#F77B8A] hover:text-[#e66a7a] font-medium text-sm"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <div className="text-sm text-gray-600">
          Page {page + 1}
        </div>
        <button
          onClick={() => setPage(page + 1)}
          disabled={titles.length < ITEMS_PER_PAGE}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>

      {showDetailModal && selectedTitle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">{selectedTitle.title}</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {selectedTitle.poster_path ? (
                    <img
                      src={selectedTitle.poster_path}
                      alt={selectedTitle.title}
                      className="w-full rounded-lg shadow-lg"
                    />
                  ) : (
                    <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                      No poster available
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-1">Type</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      selectedTitle.media_type === 'movie' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {selectedTitle.media_type === 'movie' ? 'Movie' : 'TV Show'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-1">Rating</h3>
                    <p className="text-gray-800">⭐ {selectedTitle.rating || 'N/A'}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-1">Release Date</h3>
                    <p className="text-gray-800">{selectedTitle.release_date || 'N/A'}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-1">TMDB ID</h3>
                    <p className="text-gray-800">{selectedTitle.tmdb_id}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-1">Internal ID</h3>
                    <p className="text-gray-800">{selectedTitle.id}</p>
                  </div>
                </div>
              </div>

              {selectedTitle.overview && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">Overview</h3>
                  <p className="text-gray-700 leading-relaxed">{selectedTitle.overview}</p>
                </div>
              )}

              {titleTags.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">Content Tags ({titleTags.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {titleTags.map((tag) => (
                      <span
                        key={tag.id}
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${getCategoryColor(tag.category)}`}
                      >
                        {tag.display_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
