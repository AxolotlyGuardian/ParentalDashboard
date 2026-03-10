'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { chinampasApi } from '@/lib/api';

const AGE_RANGES = ['All', '1-3', '2-4', '3-8', '5-12', '6-10', '8-14'];
const SORT_OPTIONS = [
  { value: 'popular', label: 'Popular' },
  { value: 'new', label: 'New' },
];

interface ChinampaCard {
  id: number;
  name: string;
  description: string;
  age_range: string;
  is_staff_pick: boolean;
  adoption_count: number;
  creator_display_name: string;
  title_count: number;
  poster_previews?: string[];
  published_at?: string;
}

export default function BrowseChinampas() {
  const router = useRouter();
  const [chinampas, setChinampas] = useState<ChinampaCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [ageFilter, setAgeFilter] = useState('All');
  const [sort, setSort] = useState('popular');
  const [search, setSearch] = useState('');
  const [staffPicks, setStaffPicks] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    fetchChinampas();
  }, [ageFilter, sort, staffPicks]);

  const fetchChinampas = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { sort };
      if (ageFilter !== 'All') params.age_range = ageFilter;
      if (staffPicks) params.staff_picks = 'true';
      if (search.trim()) params.search = search.trim();

      const res = await chinampasApi.browse(params);
      setChinampas(res.data.chinampas || []);
    } catch {
      setChinampas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchChinampas();
  };

  return (
    <div>
      {/* Intro card */}
      {showIntro && (
        <div className="bg-[#2dd4bf]/5 border border-[#2dd4bf]/20 rounded-2xl p-6 mb-6 relative">
          <button
            onClick={() => setShowIntro(false)}
            className="absolute top-3 right-3 text-[#5a5a6a] hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div className="flex items-start gap-3">
            <span className="text-2xl mt-0.5">&#127807;</span>
            <div>
              <h3 className="text-white font-bold mb-1">What are Chinampas?</h3>
              <p className="text-[#8a8a9a] text-sm leading-relaxed">
                In Xochimilco, where axolotls lived, Aztec families built chinampas &mdash; floating gardens where each family cultivated exactly what they needed. On Axolotly, a chinampa is your curated garden of content &mdash; hand-picked by a parent, shared with others.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5a5a6a]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chinampas..."
            className="w-full bg-[#1e1e27] border border-[#2a2a35] rounded-xl pl-12 pr-4 py-3 text-[#e8e8ed] placeholder-[#5a5a6a] focus:outline-none focus:border-[#2dd4bf]/50 transition-colors"
          />
        </div>
      </form>

      {/* Age filter pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {AGE_RANGES.map((range) => (
          <button
            key={range}
            onClick={() => setAgeFilter(range)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              ageFilter === range
                ? 'bg-[#F77B8A]/15 text-[#F77B8A] border border-[#F77B8A]/30'
                : 'bg-[#1e1e27] text-[#8a8a9a] border border-[#2a2a35] hover:text-white hover:border-[#5a5a6a]'
            }`}
          >
            {range === 'All' ? 'All Ages' : `Ages ${range}`}
          </button>
        ))}
      </div>

      {/* Sort tabs */}
      <div className="flex items-center gap-4 mb-6">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setSort(opt.value); setStaffPicks(false); }}
            className={`text-sm font-medium pb-1 transition-all ${
              sort === opt.value && !staffPicks
                ? 'text-white border-b-2 border-[#2dd4bf]'
                : 'text-[#5a5a6a] hover:text-[#8a8a9a]'
            }`}
          >
            {opt.label}
          </button>
        ))}
        <button
          onClick={() => setStaffPicks(!staffPicks)}
          className={`text-sm font-medium pb-1 transition-all flex items-center gap-1 ${
            staffPicks
              ? 'text-[#fbbf24] border-b-2 border-[#fbbf24]'
              : 'text-[#5a5a6a] hover:text-[#8a8a9a]'
          }`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
          Staff Picks
        </button>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-[#2dd4bf] border-t-transparent rounded-full"></div>
        </div>
      ) : chinampas.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[#5a5a6a] text-lg">No chinampas found.</p>
          <p className="text-[#5a5a6a] text-sm mt-2">Be the first to plant one!</p>
          <button
            onClick={() => router.push('/parent/chinampas/plant')}
            className="mt-4 bg-[#2dd4bf] hover:bg-[#26b5a3] text-[#0f0f13] font-bold py-2.5 px-6 rounded-xl transition-all"
          >
            Plant a Chinampa
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {chinampas.map((c) => (
            <button
              key={c.id}
              onClick={() => router.push(`/parent/chinampas/${c.id}`)}
              className="bg-[#18181f] border border-[#2a2a35] rounded-2xl overflow-hidden text-left hover:border-[#2dd4bf]/30 hover:shadow-[0_4px_20px_rgba(45,212,191,0.08)] transition-all group"
            >
              {/* Poster strip */}
              <div className="flex gap-0.5 h-28 overflow-hidden bg-[#1e1e27]">
                {(c.poster_previews || []).slice(0, 6).map((url, i) => (
                  <img key={i} src={url} alt="" className="h-full w-auto object-cover flex-shrink-0" />
                ))}
                {(!c.poster_previews || c.poster_previews.length === 0) && (
                  <div className="flex-1 flex items-center justify-center text-[#5a5a6a] text-sm">No previews</div>
                )}
                {c.title_count > 6 && (
                  <div className="flex items-center justify-center bg-[#1e1e27] px-3 flex-shrink-0">
                    <span className="text-[#8a8a9a] text-xs font-medium">+{c.title_count - 6}</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-white font-bold text-base group-hover:text-[#2dd4bf] transition-colors line-clamp-1">
                    {c.name}
                  </h3>
                  {c.is_staff_pick && (
                    <span className="flex items-center gap-1 bg-[#fbbf24]/10 text-[#fbbf24] text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      Staff Pick
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs mb-2">
                  <span className="text-[#F77B8A]">{c.creator_display_name}</span>
                  <span className="text-[#5a5a6a]">&#183;</span>
                  <span className="text-[#8a8a9a]">Ages {c.age_range}</span>
                  <span className="text-[#5a5a6a]">&#183;</span>
                  <span className="text-[#8a8a9a]">{c.title_count} titles</span>
                </div>

                <div className="flex items-center gap-1 mb-2">
                  <span className="text-[#4ade80] font-bold text-lg">{c.adoption_count}</span>
                  <span className="text-[#5a5a6a] text-xs uppercase tracking-wider">families</span>
                </div>

                <p className="text-[#8a8a9a] text-sm line-clamp-2">{c.description}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
