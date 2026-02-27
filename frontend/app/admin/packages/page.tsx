'use client';

import { useState, useEffect } from 'react';
import { packagesApi, catalogApi } from '@/lib/api';

interface PackageTitle {
  id: number;
  tmdb_id: number;
  title: string;
  media_type: string;
  poster_path: string | null;
  rating: string;
}

interface ContentPackage {
  id: number;
  name: string;
  description: string | null;
  age_min: number | null;
  age_max: number | null;
  category: string;
  icon: string | null;
  is_active: boolean;
  item_count: number;
  applied_count?: number;
  titles?: PackageTitle[];
}

const CATEGORY_OPTIONS = [
  { value: 'age_band', label: 'Age Band' },
  { value: 'theme', label: 'Theme' },
  { value: 'genre', label: 'Genre' },
];

const ICON_OPTIONS = ['🧒', '👦', '🎓', '🎬', '🎭', '🌟', '🦸', '🧸', '📚', '🎵', '🌍', '🚀', '🎮', '🦕', '🐾'];

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<ContentPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<ContentPackage | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PackageTitle[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Create form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAgeMin, setFormAgeMin] = useState('');
  const [formAgeMax, setFormAgeMax] = useState('');
  const [formCategory, setFormCategory] = useState('age_band');
  const [formIcon, setFormIcon] = useState('🧒');

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const res = await packagesApi.adminGetAll();
      setPackages(res.data);
    } catch {
      console.error('Failed to load packages');
    }
  };

  const loadPackageDetail = async (pkgId: number) => {
    try {
      const res = await packagesApi.getDetail(pkgId);
      setSelectedPackage(res.data);
    } catch {
      console.error('Failed to load package detail');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await packagesApi.adminCreate({
        name: formName,
        description: formDescription || undefined,
        age_min: formAgeMin ? parseInt(formAgeMin) : undefined,
        age_max: formAgeMax ? parseInt(formAgeMax) : undefined,
        category: formCategory,
        icon: formIcon,
      });
      setIsCreating(false);
      setFormName('');
      setFormDescription('');
      setFormAgeMin('');
      setFormAgeMax('');
      loadPackages();
    } catch {
      alert('Failed to create package');
    }
  };

  const handleDelete = async (pkgId: number) => {
    if (!confirm('Deactivate this package?')) return;
    try {
      await packagesApi.adminDelete(pkgId);
      setSelectedPackage(null);
      loadPackages();
    } catch {
      alert('Failed to deactivate package');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await catalogApi.search(searchQuery);
      setSearchResults(res.data.results || res.data);
    } catch {
      console.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddTitle = async (titleId: number) => {
    if (!selectedPackage) return;
    try {
      await packagesApi.adminAddItems(selectedPackage.id, [titleId]);
      loadPackageDetail(selectedPackage.id);
      loadPackages();
    } catch {
      alert('Failed to add title');
    }
  };

  const handleRemoveTitle = async (titleId: number) => {
    if (!selectedPackage) return;
    try {
      await packagesApi.adminRemoveItem(selectedPackage.id, titleId);
      loadPackageDetail(selectedPackage.id);
      loadPackages();
    } catch {
      alert('Failed to remove title');
    }
  };

  const categoryBadge = (cat: string) => {
    const styles: Record<string, string> = {
      age_band: 'bg-blue-100 text-blue-700',
      theme: 'bg-purple-100 text-purple-700',
      genre: 'bg-green-100 text-green-700',
    };
    return styles[cat] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Content Packages</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage curated content bundles for parents</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-[#F77B8A] text-white rounded-lg font-medium hover:bg-[#e56b7a] transition"
        >
          + New Package
        </button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Create New Package</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. Tiny Tots"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#F77B8A] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#F77B8A] focus:border-transparent"
                >
                  {CATEGORY_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                placeholder="Brief description of what this package includes..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#F77B8A] focus:border-transparent"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age Min</label>
                <input
                  type="number"
                  value={formAgeMin}
                  onChange={e => setFormAgeMin(e.target.value)}
                  placeholder="2"
                  min={0}
                  max={18}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#F77B8A] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age Max</label>
                <input
                  type="number"
                  value={formAgeMax}
                  onChange={e => setFormAgeMax(e.target.value)}
                  placeholder="4"
                  min={0}
                  max={18}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#F77B8A] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                <div className="flex flex-wrap gap-1">
                  {ICON_OPTIONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormIcon(icon)}
                      className={`w-8 h-8 rounded text-lg flex items-center justify-center transition ${formIcon === icon ? 'bg-[#F77B8A] ring-2 ring-[#F77B8A] ring-offset-1' : 'hover:bg-gray-100'}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" className="px-4 py-2 bg-[#F77B8A] text-white rounded-lg font-medium hover:bg-[#e56b7a] transition">
                Create Package
              </button>
              <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Package List */}
        <div className="col-span-1">
          <div className="space-y-2">
            {packages.map(pkg => (
              <button
                key={pkg.id}
                onClick={() => loadPackageDetail(pkg.id)}
                className={`w-full text-left p-4 rounded-xl border transition ${
                  selectedPackage?.id === pkg.id
                    ? 'border-[#F77B8A] bg-pink-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                } ${!pkg.is_active ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{pkg.icon || '📦'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 text-sm truncate">{pkg.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryBadge(pkg.category)}`}>
                        {pkg.category.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500">{pkg.item_count} titles</span>
                      {pkg.applied_count != null && pkg.applied_count > 0 && (
                        <span className="text-xs text-green-600">{pkg.applied_count} applied</span>
                      )}
                    </div>
                    {pkg.age_min != null && (
                      <div className="text-xs text-gray-400 mt-1">Ages {pkg.age_min}-{pkg.age_max ?? '18'}</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
            {packages.length === 0 && (
              <div className="text-center text-gray-400 py-8">No packages yet. Create one to get started.</div>
            )}
          </div>
        </div>

        {/* Package Detail */}
        <div className="col-span-2">
          {selectedPackage ? (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedPackage.icon || '📦'}</span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{selectedPackage.name}</h2>
                    {selectedPackage.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{selectedPackage.description}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(selectedPackage.id)}
                  className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm transition"
                >
                  Deactivate
                </button>
              </div>

              {/* Add Titles Search */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Add Titles</h3>
                <div className="flex gap-2">
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="Search TMDB for titles..."
                    className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#F77B8A] focus:border-transparent"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-2 max-h-48 overflow-y-auto border rounded-lg divide-y">
                    {searchResults.map(title => {
                      const alreadyAdded = selectedPackage.titles?.some(t => t.id === title.id);
                      return (
                        <div key={title.id} className="flex items-center gap-3 p-2 hover:bg-gray-50">
                          {title.poster_path ? (
                            <img src={`https://image.tmdb.org/t/p/w92${title.poster_path}`} alt="" className="w-8 h-12 rounded object-cover" />
                          ) : (
                            <div className="w-8 h-12 rounded bg-gray-200 flex items-center justify-center text-xs">?</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{title.title}</div>
                            <div className="text-xs text-gray-400">{title.media_type} {title.rating && `| ${title.rating}`}</div>
                          </div>
                          <button
                            onClick={() => handleAddTitle(title.id)}
                            disabled={alreadyAdded}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                              alreadyAdded
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-[#F77B8A] text-white hover:bg-[#e56b7a]'
                            }`}
                          >
                            {alreadyAdded ? 'Added' : 'Add'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Current Titles */}
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Package Titles ({selectedPackage.titles?.length ?? 0})
              </h3>
              {selectedPackage.titles && selectedPackage.titles.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {selectedPackage.titles.map(title => (
                    <div key={title.id} className="group relative rounded-xl overflow-hidden border bg-gray-50 hover:shadow-md transition">
                      {title.poster_path ? (
                        <img src={title.poster_path} alt={title.title} className="w-full aspect-[2/3] object-cover" />
                      ) : (
                        <div className="w-full aspect-[2/3] bg-gray-200 flex items-center justify-center text-gray-400 text-sm p-2 text-center">
                          {title.title}
                        </div>
                      )}
                      <div className="p-2">
                        <div className="text-xs font-medium text-gray-800 truncate">{title.title}</div>
                        <div className="text-xs text-gray-400">{title.media_type} {title.rating && `| ${title.rating}`}</div>
                      </div>
                      <button
                        onClick={() => handleRemoveTitle(title.id)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition flex items-center justify-center hover:bg-red-600"
                        title="Remove from package"
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8 border rounded-lg">
                  No titles in this package yet. Search and add titles above.
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-400">
              Select a package from the list to view and manage its contents.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
