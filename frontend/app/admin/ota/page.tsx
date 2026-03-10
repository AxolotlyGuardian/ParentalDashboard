'use client';

import { useState, useEffect } from 'react';
import { otaApi } from '@/lib/api';

interface OTARelease {
  id: number;
  version_name: string;
  version_code: number;
  channel: string;
  apk_url: string;
  sha256: string;
  min_version_code: number;
  release_notes: string | null;
  rollout_percentage: number;
  is_active: boolean;
  created_at: string | null;
}

export default function OTAAdmin() {
  const [releases, setReleases] = useState<OTARelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingRollout, setEditingRollout] = useState<number | null>(null);
  const [rolloutValue, setRolloutValue] = useState(100);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    version_name: '',
    version_code: 0,
    channel: 'production',
    apk_url: '',
    sha256: '',
    min_version_code: 0,
    release_notes: '',
    rollout_percentage: 100,
  });

  const fetchReleases = async () => {
    try {
      const res = await otaApi.listReleases(channelFilter || undefined);
      setReleases(res.data);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load releases.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReleases();
  }, [channelFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await otaApi.createRelease({
        ...form,
        release_notes: form.release_notes || undefined,
      });
      setMessage({ type: 'success', text: 'Release created!' });
      setShowForm(false);
      setForm({
        version_name: '',
        version_code: 0,
        channel: 'production',
        apk_url: '',
        sha256: '',
        min_version_code: 0,
        release_notes: '',
        rollout_percentage: 100,
      });
      await fetchReleases();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to create release.' });
    }
  };

  const handleUpdateRollout = async (releaseId: number) => {
    try {
      await otaApi.updateRelease(releaseId, { rollout_percentage: rolloutValue });
      setEditingRollout(null);
      setMessage({ type: 'success', text: 'Rollout updated.' });
      await fetchReleases();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to update.' });
    }
  };

  const handleDeactivate = async (releaseId: number) => {
    if (!confirm('Deactivate this release? Devices will not see it anymore.')) return;
    try {
      await otaApi.deleteRelease(releaseId);
      setMessage({ type: 'success', text: 'Release deactivated.' });
      await fetchReleases();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to deactivate.' });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">OTA Updates</h1>
          <p className="text-sm text-gray-500">Manage launcher APK releases and staged rollouts</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#F77B8A] text-white rounded-lg font-semibold hover:bg-[#e56a79] transition"
        >
          {showForm ? 'Cancel' : '+ New Release'}
        </button>
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow p-6 mb-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Create OTA Release</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Version Name</label>
              <input
                type="text"
                placeholder="1.2.0"
                value={form.version_name}
                onChange={(e) => setForm({ ...form, version_name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Version Code</label>
              <input
                type="number"
                placeholder="120"
                value={form.version_code || ''}
                onChange={(e) => setForm({ ...form, version_code: parseInt(e.target.value) || 0 })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
              <select
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="production">Production</option>
                <option value="beta">Beta</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rollout %</label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.rollout_percentage}
                onChange={(e) => setForm({ ...form, rollout_percentage: parseInt(e.target.value) || 0 })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">APK URL</label>
            <input
              type="url"
              placeholder="https://storage.example.com/axolotly-1.2.0.apk"
              value={form.apk_url}
              onChange={(e) => setForm({ ...form, apk_url: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SHA-256 Hash</label>
            <input
              type="text"
              placeholder="e3b0c44298fc1c149afbf4c8..."
              value={form.sha256}
              onChange={(e) => setForm({ ...form, sha256: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Version Code</label>
            <input
              type="number"
              value={form.min_version_code || ''}
              onChange={(e) => setForm({ ...form, min_version_code: parseInt(e.target.value) || 0 })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Release Notes</label>
            <textarea
              placeholder="What changed in this release..."
              value={form.release_notes}
              onChange={(e) => setForm({ ...form, release_notes: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              rows={3}
            />
          </div>

          <button
            type="submit"
            className="px-6 py-2 bg-[#F77B8A] text-white rounded-lg font-semibold hover:bg-[#e56a79] transition"
          >
            Create Release
          </button>
        </form>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['', 'production', 'beta'].map((ch) => (
          <button
            key={ch}
            onClick={() => setChannelFilter(ch)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
              channelFilter === ch
                ? 'bg-[#F77B8A] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {ch === '' ? 'All' : ch.charAt(0).toUpperCase() + ch.slice(1)}
          </button>
        ))}
      </div>

      {/* Releases list */}
      {loading ? (
        <div className="text-gray-500 py-8 text-center">Loading...</div>
      ) : releases.length === 0 ? (
        <div className="text-gray-500 py-8 text-center bg-white rounded-xl shadow">
          No releases found. Create your first OTA release above.
        </div>
      ) : (
        <div className="space-y-3">
          {releases.map((r) => (
            <div
              key={r.id}
              className={`bg-white rounded-xl shadow p-5 ${!r.is_active ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-900">v{r.version_name}</span>
                  <span className="text-sm text-gray-500">({r.version_code})</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.channel === 'production'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {r.channel}
                  </span>
                  {!r.is_active && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  {r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}
                </div>
              </div>

              {r.release_notes && (
                <p className="text-sm text-gray-600 mb-3">{r.release_notes}</p>
              )}

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4 text-gray-500">
                  <span>Min: v{r.min_version_code}</span>
                  {editingRollout === r.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={rolloutValue}
                        onChange={(e) => setRolloutValue(parseInt(e.target.value) || 0)}
                        className="w-20 border rounded px-2 py-1 text-sm"
                      />
                      <span>%</span>
                      <button
                        onClick={() => handleUpdateRollout(r.id)}
                        className="text-green-600 font-medium hover:underline"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingRollout(null)}
                        className="text-gray-400 hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingRollout(r.id);
                        setRolloutValue(r.rollout_percentage);
                      }}
                      className="text-blue-600 hover:underline"
                    >
                      Rollout: {r.rollout_percentage}%
                    </button>
                  )}
                </div>

                {r.is_active && (
                  <button
                    onClick={() => handleDeactivate(r.id)}
                    className="text-red-500 hover:underline text-sm"
                  >
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
