'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { chinampasApi } from '@/lib/api';

const AGE_RANGES = ['1-3', '2-4', '3-8', '5-12', '6-10', '8-14'];

interface ApprovedTitle {
  id: number;
  tmdb_id: number;
  title: string;
  media_type: string;
  poster_path?: string;
  rating?: string;
}

export default function PlantChinampa() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [approvedTitles, setApprovedTitles] = useState<ApprovedTitle[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [titleSearch, setTitleSearch] = useState('');

  useEffect(() => {
    fetchApprovedTitles();
  }, []);

  const fetchApprovedTitles = async () => {
    try {
      const res = await chinampasApi.getApprovedTitles();
      setApprovedTitles(res.data.titles || []);
    } catch (err) {
      console.error('Failed to load approved titles:', err);
    } finally { setLoading(false); }
  };

  const toggleTitle = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredTitles = approvedTitles.filter((t) =>
    t.title.toLowerCase().includes(titleSearch.toLowerCase())
  );

  const handleSubmit = async (publish: boolean) => {
    if (!name.trim() || !description.trim() || !ageRange || selectedIds.size < 3) return;

    try {
      setSubmitting(true);
      await chinampasApi.create({
        name: name.trim(),
        description: description.trim(),
        age_range: ageRange,
        title_ids: Array.from(selectedIds),
        publish,
      });
      router.push('/parent/chinampas/garden');
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to create chinampa');
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = name.trim().length > 0 && description.trim().length > 0 && ageRange && selectedIds.size >= 3;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Plant a Chinampa</h1>
      <p className="text-[#8a8a9a] text-sm mb-8">
        Create a curated collection of shows and movies from your approved titles, then share it with other parents.
      </p>

      {/* Name */}
      <div className="mb-6">
        <label className="block text-white text-sm font-medium mb-2">Chinampa Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 60))}
          placeholder="e.g. Calm Bedtime Shows for Toddlers"
          className="w-full bg-[#1e1e27] border border-[#2a2a35] rounded-xl px-4 py-3 text-[#e8e8ed] placeholder-[#5a5a6a] focus:outline-none focus:border-[#2dd4bf]/50 transition-colors"
        />
        <p className="text-[#5a5a6a] text-xs mt-1">{name.length}/60</p>
      </div>

      {/* Description */}
      <div className="mb-6">
        <label className="block text-white text-sm font-medium mb-2">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 500))}
          placeholder="Tell other parents why you chose these shows and what makes this collection special..."
          rows={4}
          className="w-full bg-[#1e1e27] border border-[#2a2a35] rounded-xl px-4 py-3 text-[#e8e8ed] placeholder-[#5a5a6a] focus:outline-none focus:border-[#2dd4bf]/50 transition-colors resize-none"
        />
        <p className="text-[#5a5a6a] text-xs mt-1">{description.length}/500</p>
      </div>

      {/* Age Range */}
      <div className="mb-8">
        <label className="block text-white text-sm font-medium mb-2">Age Range</label>
        <div className="flex flex-wrap gap-2">
          {AGE_RANGES.map((range) => (
            <button
              key={range}
              onClick={() => setAgeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                ageRange === range
                  ? 'bg-[#F77B8A]/15 text-[#F77B8A] border border-[#F77B8A]/30'
                  : 'bg-[#1e1e27] text-[#8a8a9a] border border-[#2a2a35] hover:text-white hover:border-[#5a5a6a]'
              }`}
            >
              Ages {range}
            </button>
          ))}
        </div>
      </div>

      {/* Title Selector */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-white text-sm font-medium">
            Select Titles <span className="text-[#8a8a9a] font-normal">({selectedIds.size} selected, min 3)</span>
          </label>
        </div>

        <input
          type="text"
          value={titleSearch}
          onChange={(e) => setTitleSearch(e.target.value)}
          placeholder="Filter titles..."
          className="w-full bg-[#1e1e27] border border-[#2a2a35] rounded-xl px-4 py-2.5 text-[#e8e8ed] placeholder-[#5a5a6a] focus:outline-none focus:border-[#2dd4bf]/50 transition-colors mb-3 text-sm"
        />

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin w-6 h-6 border-2 border-[#2dd4bf] border-t-transparent rounded-full"></div>
          </div>
        ) : approvedTitles.length === 0 ? (
          <div className="bg-[#18181f] border border-[#2a2a35] rounded-xl p-6 text-center">
            <p className="text-[#5a5a6a]">No approved titles found.</p>
            <p className="text-[#5a5a6a] text-sm mt-1">Add some titles to a child&apos;s profile first, then come back to plant a chinampa.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[400px] overflow-y-auto rounded-xl border border-[#2a2a35] p-3 bg-[#18181f]">
            {filteredTitles.map((t) => {
              const isSelected = selectedIds.has(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => toggleTitle(t.id)}
                  className={`relative rounded-lg overflow-hidden transition-all ${
                    isSelected
                      ? 'ring-2 ring-[#4ade80] ring-offset-2 ring-offset-[#18181f]'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  {t.poster_path ? (
                    <img src={t.poster_path} alt={t.title} className="w-full aspect-[2/3] object-cover" />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-[#1e1e27] flex items-center justify-center text-[#5a5a6a] text-[10px] p-1 text-center">
                      {t.title}
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-[#4ade80] rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pb-8">
        <button
          onClick={() => handleSubmit(false)}
          disabled={!isValid || submitting}
          className="flex-1 bg-[#1e1e27] hover:bg-[#2a2a35] disabled:opacity-40 disabled:cursor-not-allowed text-[#8a8a9a] font-medium py-3.5 rounded-xl transition-all border border-[#2a2a35]"
        >
          Save Draft
        </button>
        <button
          onClick={() => handleSubmit(true)}
          disabled={!isValid || submitting}
          className="flex-1 bg-[#F77B8A] hover:bg-[#e5697a] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all"
        >
          {submitting ? 'Publishing...' : 'Publish Chinampa'}
        </button>
      </div>
      <p className="text-[#5a5a6a] text-xs text-center pb-4">
        Published chinampas are reviewed before going live.
      </p>
    </div>
  );
}
