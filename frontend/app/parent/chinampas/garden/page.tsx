'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { chinampasApi } from '@/lib/api';

interface PlantedChinampa {
  id: number;
  name: string;
  description: string;
  age_range: string;
  status: string;
  is_staff_pick: boolean;
  adoption_count: number;
  title_count: number;
  poster_previews?: string[];
}

interface Adoption {
  id: number;
  chinampa: {
    id: number;
    name: string;
    creator_display_name: string;
    title_count: number;
    poster_previews?: string[];
  };
  child_profile_name: string;
  child_profile_id: number;
  titles_adopted: number;
  adopted_at: string;
}

const STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: 'bg-[#5a5a6a]/10', text: 'text-[#8a8a9a]', label: 'Draft' },
  in_review: { bg: 'bg-[#fbbf24]/10', text: 'text-[#fbbf24]', label: 'In Review' },
  published: { bg: 'bg-[#4ade80]/10', text: 'text-[#4ade80]', label: 'Published' },
  rejected: { bg: 'bg-[#ef4444]/10', text: 'text-[#ef4444]', label: 'Rejected' },
};

export default function MyGarden() {
  const router = useRouter();
  const [planted, setPlanted] = useState<PlantedChinampa[]>([]);
  const [adopted, setAdopted] = useState<Adoption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [plantedRes, adoptedRes] = await Promise.all([
        chinampasApi.getPlanted(),
        chinampasApi.getAdopted(),
      ]);
      setPlanted(plantedRes.data.chinampas || []);
      setAdopted(adoptedRes.data.adoptions || []);
    } catch {} finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-[#2dd4bf] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">My Garden</h1>

      {/* Adopted Section */}
      <section className="mb-12">
        <h2 className="text-lg font-bold text-white mb-4">Adopted</h2>
        {adopted.length === 0 ? (
          <div className="bg-[#18181f] border border-[#2a2a35] rounded-xl p-6 text-center">
            <p className="text-[#5a5a6a]">You haven&apos;t adopted any chinampas yet.</p>
            <button
              onClick={() => router.push('/parent/chinampas')}
              className="mt-3 text-[#2dd4bf] hover:text-[#26b5a3] text-sm font-medium transition-colors"
            >
              Browse Chinampas
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {adopted.map((a) => (
              <div key={a.id} className="bg-[#18181f] border border-[#2a2a35] rounded-xl p-4 flex items-center gap-4">
                {/* Poster strip */}
                <div className="flex gap-0.5 flex-shrink-0 h-16 overflow-hidden rounded-lg">
                  {(a.chinampa?.poster_previews || []).slice(0, 3).map((url, i) => (
                    <img key={i} src={url} alt="" className="h-full w-auto object-cover" />
                  ))}
                </div>

                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => router.push(`/parent/chinampas/${a.chinampa?.id}`)}
                    className="text-white font-medium hover:text-[#2dd4bf] transition-colors text-sm truncate block"
                  >
                    {a.chinampa?.name}
                  </button>
                  <div className="flex items-center gap-2 text-xs text-[#8a8a9a] mt-1">
                    <span>by {a.chinampa?.creator_display_name}</span>
                    <span className="text-[#5a5a6a]">&#183;</span>
                    <span>{a.titles_adopted} titles</span>
                    <span className="text-[#5a5a6a]">&#183;</span>
                    <span>for {a.child_profile_name}</span>
                  </div>
                </div>

                <span className="text-[#5a5a6a] text-xs flex-shrink-0">
                  {a.adopted_at ? new Date(a.adopted_at).toLocaleDateString() : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Planted Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Planted by You</h2>
          <button
            onClick={() => router.push('/parent/chinampas/plant')}
            className="bg-[#2dd4bf] hover:bg-[#26b5a3] text-[#0f0f13] font-bold py-2 px-4 rounded-lg text-sm transition-all"
          >
            Plant New
          </button>
        </div>

        {planted.length === 0 ? (
          <div className="bg-[#18181f] border border-[#2a2a35] rounded-xl p-6 text-center">
            <p className="text-[#5a5a6a] mb-3">You haven&apos;t planted a chinampa yet.</p>
            <button
              onClick={() => router.push('/parent/chinampas/plant')}
              className="bg-[#2dd4bf] hover:bg-[#26b5a3] text-[#0f0f13] font-bold py-2.5 px-6 rounded-xl transition-all"
            >
              Plant Your First Chinampa
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {planted.map((c) => {
              const badge = STATUS_BADGES[c.status] || STATUS_BADGES.draft;
              return (
                <div key={c.id} className="bg-[#18181f] border border-[#2a2a35] rounded-xl p-4">
                  <div className="flex items-center gap-4">
                    {/* Poster strip */}
                    <div className="flex gap-0.5 flex-shrink-0 h-16 overflow-hidden rounded-lg">
                      {(c.poster_previews || []).slice(0, 3).map((url, i) => (
                        <img key={i} src={url} alt="" className="h-full w-auto object-cover" />
                      ))}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium text-sm truncate">{c.name}</span>
                        <span className={`${badge.bg} ${badge.text} text-[10px] font-medium px-2 py-0.5 rounded-full`}>
                          {badge.label}
                        </span>
                        {c.is_staff_pick && (
                          <span className="bg-[#fbbf24]/10 text-[#fbbf24] text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            Staff Pick
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#8a8a9a]">
                        <span>{c.title_count} titles</span>
                        <span className="text-[#5a5a6a]">&#183;</span>
                        <span>Ages {c.age_range}</span>
                        {c.status === 'published' && (
                          <>
                            <span className="text-[#5a5a6a]">&#183;</span>
                            <span className="text-[#4ade80] font-bold">{c.adoption_count}</span>
                            <span className="text-[#5a5a6a]">families</span>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => router.push(`/parent/chinampas/${c.id}`)}
                      className="text-[#2dd4bf] hover:text-[#26b5a3] text-sm font-medium transition-colors flex-shrink-0"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
