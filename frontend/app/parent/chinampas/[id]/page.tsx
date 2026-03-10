'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { chinampasApi, authApi } from '@/lib/api';

interface ChinampaTitle {
  id: number;
  tmdb_id: number;
  title: string;
  media_type: string;
  poster_path?: string;
  rating?: string;
  release_date?: string;
  note?: string;
}

interface ChinampaDetail {
  id: number;
  name: string;
  description: string;
  age_range: string;
  is_staff_pick: boolean;
  adoption_count: number;
  creator_display_name: string;
  title_count: number;
  titles: ChinampaTitle[];
}

interface KidProfile {
  id: number;
  name: string;
  age: number;
}

export default function ChinampaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const chinampaId = Number(params.id);

  const [chinampa, setChinampa] = useState<ChinampaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [excludedIds, setExcludedIds] = useState<Set<number>>(new Set());
  const [kidProfiles, setKidProfiles] = useState<KidProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<number | null>(null);
  const [showProfilePicker, setShowProfilePicker] = useState(false);
  const [adopting, setAdopting] = useState(false);
  const [adopted, setAdopted] = useState(false);
  const [adoptedCount, setAdoptedCount] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');

  useEffect(() => {
    fetchDetail();
    fetchProfiles();
  }, [chinampaId]);

  const fetchDetail = async () => {
    try {
      const res = await chinampasApi.getDetail(chinampaId);
      setChinampa(res.data);
    } catch {
      router.push('/parent/chinampas');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const res = await authApi.getAllKidProfiles();
      setKidProfiles(res.data.profiles || res.data || []);
    } catch {}
  };

  const toggleTitle = (titleId: number) => {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(titleId)) next.delete(titleId);
      else next.add(titleId);
      return next;
    });
  };

  const includedCount = chinampa ? chinampa.titles.length - excludedIds.size : 0;

  const handleAdopt = async () => {
    if (!selectedProfile || !chinampa) return;
    try {
      setAdopting(true);
      const res = await chinampasApi.adopt(chinampaId, {
        child_profile_id: selectedProfile,
        excluded_title_ids: Array.from(excludedIds),
      });
      setAdoptedCount(res.data.titles_adopted);
      setAdopted(true);
      setShowProfilePicker(false);
    } catch {
      alert('Failed to adopt chinampa');
    } finally {
      setAdopting(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    try {
      await chinampasApi.report(chinampaId, { reason: reportReason });
      setReportOpen(false);
      setReportReason('');
      alert('Report submitted. Thank you.');
    } catch {
      alert('Failed to submit report');
    }
  };

  const startAdopt = () => {
    if (kidProfiles.length === 1) {
      setSelectedProfile(kidProfiles[0].id);
      setShowProfilePicker(true);
    } else if (kidProfiles.length > 1) {
      setShowProfilePicker(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-[#2dd4bf] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!chinampa) return null;

  // Success state
  if (adopted) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-20 h-20 bg-[#4ade80]/10 border-2 border-[#4ade80]/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">&#127807;</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Chinampa Adopted</h2>
        <p className="text-[#8a8a9a] mb-2">
          <span className="text-[#4ade80] font-bold">{adoptedCount}</span> titles added from <span className="text-white font-medium">{chinampa.name}</span>
        </p>
        <p className="text-[#5a5a6a] text-sm mb-8">
          Titles are now in your child&apos;s profile. You can add or remove anytime.
        </p>

        {/* Poster strip */}
        <div className="flex justify-center gap-2 mb-8 overflow-hidden">
          {chinampa.titles.slice(0, 6).map((t) => (
            t.poster_path && (
              <img key={t.id} src={t.poster_path} alt={t.title} className="w-16 h-24 object-cover rounded-lg" />
            )
          ))}
        </div>

        <button
          onClick={() => router.push('/parent/chinampas')}
          className="bg-[#1e1e27] hover:bg-[#2a2a35] text-white font-medium py-2.5 px-6 rounded-xl transition-all"
        >
          Browse More Chinampas
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => router.push('/parent/chinampas')}
        className="flex items-center gap-1 text-[#8a8a9a] hover:text-white text-sm mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Back to Browse
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="text-2xl md:text-3xl font-bold text-white">{chinampa.name}</h1>
          {chinampa.is_staff_pick && (
            <span className="flex items-center gap-1 bg-[#fbbf24]/10 text-[#fbbf24] text-xs font-medium px-3 py-1 rounded-full flex-shrink-0">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              Staff Pick
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm mb-4">
          <span className="text-[#F77B8A] font-medium">{chinampa.creator_display_name}</span>
          <span className="text-[#5a5a6a]">&#183;</span>
          <span className="text-[#8a8a9a]">Ages {chinampa.age_range}</span>
          <span className="text-[#5a5a6a]">&#183;</span>
          <span className="text-[#4ade80] font-bold">{chinampa.adoption_count}</span>
          <span className="text-[#5a5a6a] text-xs uppercase tracking-wider">families</span>
        </div>

        {/* Description */}
        <div className="bg-[#18181f] border border-[#2a2a35] rounded-xl p-5">
          <p className="text-[#8a8a9a] italic leading-relaxed">&ldquo;{chinampa.description}&rdquo;</p>
        </div>
      </div>

      {/* Title grid */}
      <h3 className="text-white font-bold mb-4">{chinampa.titles.length} Titles</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-8">
        {chinampa.titles.map((t) => {
          const excluded = excludedIds.has(t.id);
          return (
            <button
              key={t.id}
              onClick={() => toggleTitle(t.id)}
              className={`bg-[#18181f] border rounded-xl overflow-hidden text-left transition-all ${
                excluded
                  ? 'border-[#2a2a35] opacity-45'
                  : 'border-[#2a2a35] hover:border-[#2dd4bf]/30'
              }`}
            >
              {t.poster_path ? (
                <img src={t.poster_path} alt={t.title} className="w-full aspect-[2/3] object-cover" />
              ) : (
                <div className="w-full aspect-[2/3] bg-[#1e1e27] flex items-center justify-center text-[#5a5a6a] text-xs p-2 text-center">
                  {t.title}
                </div>
              )}
              <div className="p-2">
                <p className="text-white text-xs font-medium line-clamp-1">{t.title}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[#5a5a6a] text-[10px]">
                    {t.release_date?.slice(0, 4)} {t.rating && `&#183; ${t.rating}`}
                  </span>
                  <span className={`text-[10px] font-medium ${excluded ? 'text-[#5a5a6a]' : 'text-[#F77B8A]'}`}>
                    {excluded ? 'Removed' : 'Included'}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Adopt CTA */}
      {!showProfilePicker ? (
        <div className="sticky bottom-4">
          <button
            onClick={startAdopt}
            className="w-full bg-[#F77B8A] hover:bg-[#e5697a] text-white font-bold py-4 rounded-xl text-lg transition-all shadow-[0_4px_20px_rgba(247,123,138,0.3)]"
          >
            Adopt {includedCount} Titles to My Child&apos;s Profile
          </button>
          <p className="text-center text-[#5a5a6a] text-xs mt-2">
            Titles are copied to your child&apos;s profile. You can add or remove anytime.
          </p>
        </div>
      ) : (
        <div className="sticky bottom-4 bg-[#18181f] border border-[#2a2a35] rounded-xl p-5">
          <h4 className="text-white font-bold mb-3">Select a child profile</h4>
          <div className="flex flex-wrap gap-2 mb-4">
            {kidProfiles.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProfile(p.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedProfile === p.id
                    ? 'bg-[#F77B8A]/15 text-[#F77B8A] border border-[#F77B8A]/30'
                    : 'bg-[#1e1e27] text-[#8a8a9a] border border-[#2a2a35] hover:text-white'
                }`}
              >
                {p.name} (age {p.age})
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowProfilePicker(false)}
              className="flex-1 bg-[#1e1e27] hover:bg-[#2a2a35] text-[#8a8a9a] font-medium py-3 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleAdopt}
              disabled={!selectedProfile || adopting}
              className="flex-1 bg-[#F77B8A] hover:bg-[#e5697a] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all"
            >
              {adopting ? 'Adopting...' : `Adopt ${includedCount} Titles`}
            </button>
          </div>
        </div>
      )}

      {/* Report button */}
      <div className="mt-6 text-center">
        {!reportOpen ? (
          <button
            onClick={() => setReportOpen(true)}
            className="text-[#5a5a6a] hover:text-[#ef4444] text-xs transition-colors"
          >
            Report this chinampa
          </button>
        ) : (
          <div className="max-w-md mx-auto bg-[#18181f] border border-[#2a2a35] rounded-xl p-4">
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Why are you reporting this chinampa?"
              className="w-full bg-[#1e1e27] border border-[#2a2a35] rounded-lg p-3 text-[#e8e8ed] placeholder-[#5a5a6a] text-sm focus:outline-none focus:border-[#ef4444]/50 resize-none"
              rows={3}
            />
            <div className="flex gap-2 mt-2">
              <button onClick={() => { setReportOpen(false); setReportReason(''); }} className="flex-1 bg-[#1e1e27] text-[#8a8a9a] py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={handleReport} className="flex-1 bg-[#ef4444] text-white py-2 rounded-lg text-sm font-medium">Submit Report</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
