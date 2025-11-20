'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';

interface EpisodeReport {
  id: number;
  device_name?: string;
  kid_name?: string;
  reported_title?: string;
  provider: string;
  season?: number;
  episode?: number;
  raw_url: string;
  tmdb_title_id?: number;
  processing_status: string;
  confidence_score?: number;
  reported_at: string;
  processed_at?: string;
}

interface EpisodeLink {
  id: number;
  title_name?: string;
  season?: number;
  episode?: number;
  episode_title?: string;
  provider: string;
  deep_link_url: string;
  source: string;
  confidence_score: number;
  confirmed_count: number;
  motn_verified: boolean;
  motn_quality_score?: number;
  custom_tags?: string;
  first_seen_at: string;
  last_confirmed_at: string;
  last_enriched_at?: string;
}

export default function EpisodeLinksPage() {
  const [activeTab, setActiveTab] = useState<'reports' | 'links'>('links');
  const [reports, setReports] = useState<EpisodeReport[]>([]);
  const [links, setLinks] = useState<EpisodeLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  
  const ITEMS_PER_PAGE = 50;

  useEffect(() => {
    loadData();
  }, [activeTab, page, verifiedOnly]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'reports') {
        const response = await adminApi.getEpisodeReports(page * ITEMS_PER_PAGE, ITEMS_PER_PAGE);
        setReports(response.data);
      } else {
        const response = await adminApi.getEpisodeLinks(page * ITEMS_PER_PAGE, ITEMS_PER_PAGE, undefined, verifiedOnly);
        const normalizedLinks = response.data.map((link: any) => ({
          ...link,
          title_name: typeof link.title_name === 'string' ? link.title_name : (link.title_name?.title || link.title?.title || 'Unknown')
        }));
        setLinks(normalizedLinks);
      }
    } catch (error) {
      console.error('Failed to load data', error);
      alert('Failed to load episode data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      matched: 'bg-green-100 text-green-800',
      matched_new: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleBackfill = async () => {
    if (!confirm('This will fetch episode 1 deep links for all TV shows from the Movie of the Night API. This may take a few minutes. Continue?')) {
      return;
    }
    
    try {
      setBackfilling(true);
      const response = await adminApi.backfillEpisodeLinks();
      alert(`Backfill complete!\n\nProcessed: ${response.data.processed} titles\nAdded: ${response.data.added} links\nSkipped: ${response.data.skipped} titles\nFailed: ${response.data.failed} titles`);
      await loadData();
    } catch (error) {
      console.error('Backfill failed:', error);
      alert('Failed to run backfill. Check console for details.');
    } finally {
      setBackfilling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading episode data...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Episode Deep Links</h1>
        <p className="text-gray-600 mt-2">
          View crowdsourced episode URLs and verified deep links
        </p>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b flex">
          <button
            onClick={() => { setActiveTab('links'); setPage(0); }}
            className={`flex-1 px-6 py-4 font-medium transition ${
              activeTab === 'links'
                ? 'border-b-2 border-[#F77B8A] text-[#F77B8A]'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Episode Links ({links.length})
          </button>
          <button
            onClick={() => { setActiveTab('reports'); setPage(0); }}
            className={`flex-1 px-6 py-4 font-medium transition ${
              activeTab === 'reports'
                ? 'border-b-2 border-[#F77B8A] text-[#F77B8A]'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Device Reports ({reports.length})
          </button>
        </div>
      </div>

      {activeTab === 'links' && (
        <>
          <div className="bg-white rounded-lg shadow mb-6 p-4">
            <div className="flex gap-4 items-center">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => { setVerifiedOnly(e.target.checked); setPage(0); }}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Movie of the Night verified only</span>
              </label>
              <button
                onClick={handleBackfill}
                disabled={backfilling}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {backfilling ? 'Backfilling...' : '🔄 Backfill Episode 1 Links'}
              </button>
              <div className="ml-auto text-sm text-gray-600">
                Showing {links.length} links
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Episode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verification</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stats</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {links.map((link) => (
                  <tr key={link.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{link.title_name || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        S{link.season}E{link.episode}
                      </div>
                      {link.episode_title && (
                        <div className="text-xs text-gray-500">{link.episode_title}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                        {link.provider}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {link.motn_verified ? (
                        <div className="flex flex-col gap-1">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold inline-block">
                            ✓ Verified
                          </span>
                          {link.motn_quality_score && (
                            <span className="text-xs text-gray-500">
                              Quality: {link.motn_quality_score.toFixed(2)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div>Confidence: {link.confidence_score.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">Confirmed {link.confirmed_count}x</div>
                      <div className="text-xs text-gray-500">Source: {link.source}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate text-xs text-blue-600" title={link.deep_link_url}>
                        {link.deep_link_url}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        First: {formatDate(link.first_seen_at)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'reports' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device/Kid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Episode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reported</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{report.device_name || 'Unknown'}</div>
                    {report.kid_name && (
                      <div className="text-xs text-gray-500">{report.kid_name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{report.reported_title || 'Unknown'}</div>
                    {report.tmdb_title_id && (
                      <div className="text-xs text-gray-500">TMDB: {report.tmdb_title_id}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {report.season && report.episode ? (
                      <span>S{report.season}E{report.episode}</span>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                      {report.provider}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(report.processing_status)}`}>
                      {report.processing_status}
                    </span>
                    {report.confidence_score && (
                      <div className="text-xs text-gray-500 mt-1">
                        Score: {report.confidence_score.toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {formatDate(report.reported_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-between items-center mt-6">
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
          disabled={(activeTab === 'links' ? links.length : reports.length) < ITEMS_PER_PAGE}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
