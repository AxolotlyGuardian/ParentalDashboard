'use client';

import { useState, useEffect } from 'react';
import { packagesApi } from '@/lib/api';

interface PackageTitle {
  id: number;
  title: string;
  media_type: string;
  poster_path: string | null;
  rating: string;
  has_policy?: boolean;
}

interface ContentPackage {
  id: number;
  name: string;
  description: string | null;
  age_min: number | null;
  age_max: number | null;
  category: string;
  icon: string | null;
  item_count: number;
  is_applied?: boolean;
  titles?: PackageTitle[];
  applied_at?: string;
}

interface Props {
  kidProfileId: number;
  kidAge: number;
  onPackageApplied: () => void;
}

export default function PackageSelector({ kidProfileId, kidAge, onPackageApplied }: Props) {
  const [packages, setPackages] = useState<ContentPackage[]>([]);
  const [appliedPackages, setAppliedPackages] = useState<ContentPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<ContentPackage | null>(null);
  const [excludedIds, setExcludedIds] = useState<Set<number>>(new Set());
  const [isApplying, setIsApplying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [kidProfileId, kidAge]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pkgRes, appliedRes] = await Promise.all([
        packagesApi.list(kidAge),
        packagesApi.getApplied(kidProfileId),
      ]);
      const appliedIds = new Set((appliedRes.data as ContentPackage[]).map((a: ContentPackage) => a.id));
      const available = (pkgRes.data as ContentPackage[]).map((p: ContentPackage) => ({
        ...p,
        is_applied: appliedIds.has(p.id),
      }));
      setPackages(available);
      setAppliedPackages(appliedRes.data);
    } catch {
      console.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPackage = async (pkg: ContentPackage) => {
    if (pkg.is_applied) return;
    try {
      const res = await packagesApi.getDetail(pkg.id, kidProfileId);
      setSelectedPackage(res.data);
      setExcludedIds(new Set());
    } catch {
      console.error('Failed to load package detail');
    }
  };

  const toggleExclude = (titleId: number) => {
    setExcludedIds(prev => {
      const next = new Set(prev);
      if (next.has(titleId)) {
        next.delete(titleId);
      } else {
        next.add(titleId);
      }
      return next;
    });
  };

  const handleApply = async () => {
    if (!selectedPackage) return;
    setIsApplying(true);
    try {
      await packagesApi.apply(selectedPackage.id, kidProfileId, Array.from(excludedIds));
      setSelectedPackage(null);
      setExcludedIds(new Set());
      await loadData();
      onPackageApplied();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to apply package';
      alert(msg);
    } finally {
      setIsApplying(false);
    }
  };

  const handleUnapply = async (pkgId: number) => {
    if (!confirm('Remove this package? All policies from this package will be deleted.')) return;
    try {
      await packagesApi.unapply(pkgId, kidProfileId);
      await loadData();
      onPackageApplied();
    } catch {
      alert('Failed to remove package');
    }
  };

  const categoryLabel = (cat: string) => {
    const labels: Record<string, string> = { age_band: 'Age Band', theme: 'Theme', genre: 'Genre' };
    return labels[cat] || cat;
  };

  const categoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      age_band: 'bg-blue-100 text-blue-700',
      theme: 'bg-purple-100 text-purple-700',
      genre: 'bg-green-100 text-green-700',
    };
    return colors[cat] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return <div className="text-center text-gray-400 py-8">Loading packages...</div>;
  }

  // Detail / customize view
  if (selectedPackage) {
    const titles = selectedPackage.titles || [];
    const includedCount = titles.filter(t => !excludedIds.has(t.id)).length;

    return (
      <div>
        <button
          onClick={() => setSelectedPackage(null)}
          className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
        >
          &larr; Back to packages
        </button>

        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{selectedPackage.icon || '📦'}</span>
            <div>
              <h3 className="text-xl font-bold text-gray-800">{selectedPackage.name}</h3>
              {selectedPackage.description && (
                <p className="text-sm text-gray-500">{selectedPackage.description}</p>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Uncheck any titles you don&apos;t want to include. {includedCount} of {titles.length} titles will be added.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
            {titles.map(title => {
              const isExcluded = excludedIds.has(title.id);
              const alreadyHas = title.has_policy;
              return (
                <button
                  key={title.id}
                  onClick={() => !alreadyHas && toggleExclude(title.id)}
                  className={`relative rounded-xl overflow-hidden border transition text-left ${
                    alreadyHas
                      ? 'border-green-200 bg-green-50 opacity-60 cursor-default'
                      : isExcluded
                        ? 'border-gray-200 opacity-40'
                        : 'border-[#F77B8A] shadow-sm'
                  }`}
                >
                  {title.poster_path ? (
                    <img src={title.poster_path} alt={title.title} className="w-full aspect-[2/3] object-cover" />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-gray-200 flex items-center justify-center text-gray-400 text-xs p-2 text-center">
                      {title.title}
                    </div>
                  )}
                  <div className="p-2">
                    <div className="text-xs font-medium text-gray-800 truncate">{title.title}</div>
                    <div className="text-xs text-gray-400">{title.rating || 'NR'}</div>
                  </div>
                  {/* Checkbox overlay */}
                  {!alreadyHas && (
                    <div className={`absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isExcluded ? 'border-gray-300 bg-white' : 'border-[#F77B8A] bg-[#F77B8A]'
                    }`}>
                      {!isExcluded && <span className="text-white text-xs font-bold">&#10003;</span>}
                    </div>
                  )}
                  {alreadyHas && (
                    <div className="absolute top-2 left-2 text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                      Already added
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {excludedIds.size > 0 && `${excludedIds.size} title(s) excluded`}
            </span>
            <button
              onClick={handleApply}
              disabled={isApplying || includedCount === 0}
              className="px-6 py-3 bg-[#F77B8A] text-white rounded-xl font-semibold hover:bg-[#e56b7a] transition disabled:opacity-50"
            >
              {isApplying ? 'Applying...' : `Apply Package (${includedCount} titles)`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Package list view
  return (
    <div>
      {/* Applied packages */}
      {appliedPackages.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">Active Packages</h3>
          <div className="flex flex-wrap gap-3">
            {appliedPackages.map(pkg => (
              <div key={pkg.id} className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <span className="text-xl">{pkg.icon || '📦'}</span>
                <div>
                  <div className="text-sm font-semibold text-gray-800">{pkg.name}</div>
                  <div className="text-xs text-green-600">{pkg.item_count} titles</div>
                </div>
                <button
                  onClick={() => handleUnapply(pkg.id)}
                  className="ml-2 text-xs text-red-400 hover:text-red-600 transition"
                  title="Remove package"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available packages */}
      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
        Available Packages {kidAge ? `for age ${kidAge}` : ''}
      </h3>
      {packages.length === 0 ? (
        <div className="text-center text-gray-400 py-8 bg-white rounded-xl border">
          No packages available yet. An admin needs to create content packages first.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map(pkg => (
            <button
              key={pkg.id}
              onClick={() => handleSelectPackage(pkg)}
              disabled={pkg.is_applied}
              className={`text-left p-5 rounded-2xl border transition hover:shadow-md ${
                pkg.is_applied
                  ? 'border-green-200 bg-green-50 cursor-default'
                  : 'border-gray-200 bg-white hover:border-[#F77B8A]'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{pkg.icon || '📦'}</span>
                <div className="flex-1">
                  <div className="font-bold text-gray-800">{pkg.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColor(pkg.category)}`}>
                      {categoryLabel(pkg.category)}
                    </span>
                    {pkg.age_min != null && (
                      <span className="text-xs text-gray-400">Ages {pkg.age_min}-{pkg.age_max ?? '18'}</span>
                    )}
                  </div>
                </div>
              </div>
              {pkg.description && (
                <p className="text-sm text-gray-500 mb-2 line-clamp-2">{pkg.description}</p>
              )}
              <div className="text-xs text-gray-400">
                {pkg.item_count} titles
                {pkg.is_applied && <span className="ml-2 text-green-600 font-medium">Applied</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
