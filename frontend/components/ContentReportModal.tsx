'use client';

import { useState, useEffect } from 'react';
import { contentTagApi } from '@/lib/api';
import { ApiError } from '@/lib/types';

interface Title {
  id: number;
  title: string;
  media_type: string;
}

interface Tag {
  id: number;
  category: string;
  slug: string;
  display_name: string;
  description?: string;
}

interface ContentReportModalProps {
  isOpen: boolean;
  title: Title | null;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export default function ContentReportModal({ isOpen, title, onClose, onSubmitSuccess }: ContentReportModalProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [seasonNumber, setSeasonNumber] = useState('');
  const [episodeNumber, setEpisodeNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadTags();
    }
  }, [isOpen]);

  const loadTags = async () => {
    try {
      const response = await contentTagApi.getTags();
      setTags(response.data);
    } catch (error) {
      console.error('Failed to load tags', error);
      setError('Failed to load content tags');
    }
  };

  const groupedTags = tags.reduce((acc, tag) => {
    if (!acc[tag.category]) {
      acc[tag.category] = [];
    }
    acc[tag.category].push(tag);
    return acc;
  }, {} as Record<string, Tag[]>);

  const categoryLabels: Record<string, string> = {
    creatures: 'Creatures & Characters',
    situations: 'Situations & Themes',
    death_loss: 'Death & Loss',
    visuals: 'Scary Visuals & Atmosphere',
    intensity: 'Intensity Levels',
    social: 'Social Fears',
    rating: 'Content Ratings',
    age: 'Age Appropriateness',
    content_warning: 'Content Warnings',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTagId) {
      setError('Please select a content tag');
      return;
    }

    if (!title) return;

    setIsLoading(true);
    setError('');

    try {
      await contentTagApi.createContentReport(
        title.id,
        selectedTagId,
        notes || undefined,
        seasonNumber ? parseInt(seasonNumber) : undefined,
        episodeNumber ? parseInt(episodeNumber) : undefined
      );
      
      setSelectedTagId(null);
      setSeasonNumber('');
      setEpisodeNumber('');
      setNotes('');
      onSubmitSuccess();
      onClose();
    } catch (error) {
      setError((error as ApiError).response?.data?.detail || 'Failed to submit report');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !title) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Report Content</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Help other parents by reporting scary or concerning content
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6 bg-pink-50 p-4 rounded-lg">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Series</label>
            <p className="text-lg font-bold text-gray-900">{title.title}</p>
            <p className="text-sm text-gray-500 capitalize">{title.media_type}</p>
          </div>

          {title.media_type === 'tv' && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="season" className="block text-sm font-semibold text-gray-700 mb-2">
                  Season Number
                </label>
                <input
                  type="number"
                  id="season"
                  value={seasonNumber}
                  onChange={(e) => setSeasonNumber(e.target.value)}
                  placeholder="e.g., 1"
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>
              <div>
                <label htmlFor="episode" className="block text-sm font-semibold text-gray-700 mb-2">
                  Episode Number
                </label>
                <input
                  type="number"
                  id="episode"
                  value={episodeNumber}
                  onChange={(e) => setEpisodeNumber(e.target.value)}
                  placeholder="e.g., 5"
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>
            </div>
          )}

          <div className="mb-6">
            <label htmlFor="tag" className="block text-sm font-semibold text-gray-700 mb-2">
              Content Tag <span className="text-red-500">*</span>
            </label>
            <select
              id="tag"
              value={selectedTagId || ''}
              onChange={(e) => setSelectedTagId(parseInt(e.target.value))}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
            >
              <option value="">Select a content tag...</option>
              {Object.entries(groupedTags).map(([category, categoryTags]) => (
                <optgroup key={category} label={categoryLabels[category] || category}>
                  {categoryTags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.display_name}
                      {tag.description && ` - ${tag.description}`}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe the specific scene or context..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
            />
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedTagId}
              className="flex-1 px-6 py-3 bg-pink-500 text-white rounded-lg font-semibold hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
