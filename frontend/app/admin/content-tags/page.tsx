'use client';

import { useState, useEffect } from 'react';
import { contentTagApi } from '@/lib/api';

interface Tag {
  id: number;
  category: string;
  slug: string;
  display_name: string;
  description?: string;
}

export default function ContentTagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  
  const [formData, setFormData] = useState({
    category: '',
    slug: '',
    display_name: '',
    description: '',
  });

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const response = await contentTagApi.getTags();
      setTags(response.data);
    } catch (error) {
      console.error('Failed to load tags', error);
      alert('Failed to load tags');
    } finally {
      setLoading(false);
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

  const handleAdd = () => {
    setFormData({ category: '', slug: '', display_name: '', description: '' });
    setEditingTag(null);
    setShowAddModal(true);
  };

  const handleEdit = (tag: Tag) => {
    setFormData({
      category: tag.category,
      slug: tag.slug,
      display_name: tag.display_name,
      description: tag.description || '',
    });
    setEditingTag(tag);
    setShowAddModal(true);
  };

  const handleDelete = async (tag: Tag) => {
    if (!confirm(`Delete tag "${tag.display_name}"? This cannot be undone.`)) {
      return;
    }

    try {
      await contentTagApi.deleteTag(tag.id);
      alert('Tag deleted successfully!');
      await loadTags();
    } catch (error) {
      const message = (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to delete tag';
      alert(message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category || !formData.slug || !formData.display_name) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editingTag) {
        await contentTagApi.updateTag(editingTag.id, formData);
        alert('Tag updated successfully!');
      } else {
        await contentTagApi.createTag(
          formData.category,
          formData.slug,
          formData.display_name,
          formData.description || undefined
        );
        alert('Tag created successfully!');
      }
      setShowAddModal(false);
      await loadTags();
    } catch (error) {
      const message = (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to save tag';
      alert(message);
    }
  };

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
        <div className="text-gray-500">Loading content tags...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Content Tags</h1>
          <p className="text-gray-600 mt-2">
            Manage content tags for community-driven content filtering
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="px-6 py-2 bg-[#F77B8A] text-white rounded-lg hover:bg-[#e66a7a] font-medium"
        >
          + Add New Tag
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="text-sm text-gray-600">
          Total Tags: <span className="font-semibold">{tags.length}</span>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedTags).map(([category, categoryTags]) => (
          <div key={category} className="bg-white rounded-lg shadow overflow-hidden">
            <div className={`px-6 py-4 ${getCategoryColor(category)} border-b`}>
              <h2 className="text-lg font-semibold">
                {categoryLabels[category] || category} ({categoryTags.length})
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryTags.map((tag) => (
                  <div
                    key={tag.id}
                    className="border rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{tag.display_name}</h3>
                        <p className="text-xs text-gray-500 mt-1">slug: {tag.slug}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(tag)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(tag)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    {tag.description && (
                      <p className="text-sm text-gray-600 mt-2">{tag.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">
              {editingTag ? 'Edit Tag' : 'Add New Tag'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Select category...</option>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug * (lowercase, underscores only)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., scary_clowns"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., Scary Clowns"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                    placeholder="Brief description of this tag..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#F77B8A] text-white rounded-lg hover:bg-[#e66a7a]"
                >
                  {editingTag ? 'Update Tag' : 'Create Tag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
