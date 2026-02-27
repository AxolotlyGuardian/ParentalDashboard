'use client';

import { useState, useEffect } from 'react';
import { packagesApi } from '@/lib/api';

interface PackageUpdate {
  id: number;
  kid_profile_id: number;
  package_id: number;
  package_name: string;
  title: {
    id: number;
    title: string;
    media_type: string;
    poster_path: string | null;
    rating: string;
  };
  created_at: string;
}

interface Props {
  onUpdatesHandled: () => void;
}

export default function PackageUpdatesBanner({ onUpdatesHandled }: Props) {
  const [updates, setUpdates] = useState<PackageUpdate[]>([]);
  const [showDetail, setShowDetail] = useState(false);
  const [processing, setProcessing] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadUpdates();
  }, []);

  const loadUpdates = async () => {
    try {
      const res = await packagesApi.getPendingUpdates();
      setUpdates(res.data);
    } catch {
      // Silently fail — banner just won't show
    }
  };

  const handleAction = async (updateId: number, action: 'accept' | 'dismiss') => {
    setProcessing(prev => new Set(prev).add(updateId));
    try {
      await packagesApi.handleUpdate(updateId, action);
      setUpdates(prev => prev.filter(u => u.id !== updateId));
      if (action === 'accept') {
        onUpdatesHandled();
      }
    } catch {
      alert(`Failed to ${action} update`);
    } finally {
      setProcessing(prev => {
        const next = new Set(prev);
        next.delete(updateId);
        return next;
      });
    }
  };

  const handleAcceptAll = async () => {
    for (const upd of updates) {
      await handleAction(upd.id, 'accept');
    }
    onUpdatesHandled();
  };

  const handleDismissAll = async () => {
    for (const upd of updates) {
      await handleAction(upd.id, 'dismiss');
    }
  };

  if (updates.length === 0) return null;

  // Group by package name
  const byPackage: Record<string, PackageUpdate[]> = {};
  for (const u of updates) {
    if (!byPackage[u.package_name]) byPackage[u.package_name] = [];
    byPackage[u.package_name].push(u);
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">&#x1F4E6;</span>
          <span className="text-sm font-semibold text-blue-800">
            {updates.length} new title{updates.length > 1 ? 's' : ''} available
          </span>
          <span className="text-sm text-blue-600">
            in {Object.keys(byPackage).map(name => `"${name}"`).join(', ')}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDetail(!showDetail)}
            className="px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100 rounded-lg transition"
          >
            {showDetail ? 'Hide' : 'Review'}
          </button>
          <button
            onClick={handleAcceptAll}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Accept All
          </button>
          <button
            onClick={handleDismissAll}
            className="px-3 py-1.5 text-sm text-blue-500 hover:bg-blue-100 rounded-lg transition"
          >
            Dismiss All
          </button>
        </div>
      </div>

      {showDetail && (
        <div className="mt-3 space-y-2">
          {updates.map(upd => (
            <div key={upd.id} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-blue-100">
              {upd.title.poster_path ? (
                <img src={upd.title.poster_path} alt="" className="w-10 h-14 rounded object-cover" />
              ) : (
                <div className="w-10 h-14 rounded bg-gray-200 flex items-center justify-center text-xs text-gray-400">?</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{upd.title.title}</div>
                <div className="text-xs text-gray-400">
                  {upd.title.media_type} | from &ldquo;{upd.package_name}&rdquo;
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleAction(upd.id, 'accept')}
                  disabled={processing.has(upd.id)}
                  className="px-3 py-1 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                >
                  Add
                </button>
                <button
                  onClick={() => handleAction(upd.id, 'dismiss')}
                  disabled={processing.has(upd.id)}
                  className="px-3 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
                >
                  Skip
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
