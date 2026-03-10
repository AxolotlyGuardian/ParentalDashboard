'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { deviceStatusApi, notificationsApi } from '@/lib/api';
import { getUserFromToken } from '@/lib/auth';

interface DeviceStatus {
  id: number;
  device_id: string;
  device_name: string;
  kid_name: string;
  kid_profile_id: number | null;
  is_online: boolean;
  last_active: string | null;
  device_model: string | null;
  device_manufacturer: string | null;
  app_version: string | null;
  app_version_code: number | null;
  latest_version: string | null;
  needs_update: boolean;
  created_at: string | null;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function DeviceStatusPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<DeviceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const user = getUserFromToken();
    if (!user || user.role !== 'parent') {
      router.push('/parent');
      return;
    }
    fetchDevices();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDevices, 30000);
    return () => clearInterval(interval);
  }, [router]);

  const fetchDevices = async () => {
    try {
      const res = await deviceStatusApi.getStatus();
      setDevices(res.data.devices);
    } catch {
      // silent refresh failure
    } finally {
      setLoading(false);
    }
  };

  const sendNotification = async (deviceId: number, deviceName: string) => {
    const msg = prompt(`Send a message to "${deviceName}":`);
    if (!msg) return;

    setSending(deviceId);
    try {
      await notificationsApi.send('Message from Parent', msg, deviceId);
      setMessage({ type: 'success', text: `Notification sent to ${deviceName}` });
    } catch {
      setMessage({ type: 'error', text: 'Failed to send notification.' });
    } finally {
      setSending(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading devices...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <button
          onClick={() => router.push('/parent')}
          className="text-gray-500 hover:text-gray-700 mb-6 block"
        >
          &larr; Back to Dashboard
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#566886]">Device Status</h1>
            <p className="text-sm text-gray-500 mt-1">
              Live status of your Axolotly devices (refreshes every 30s)
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live
          </div>
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

        {devices.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <h2 className="text-xl font-semibold text-[#566886] mb-2">No devices paired</h2>
            <p className="text-gray-500">
              Pair an Axolotly device from the Dashboard to see its status here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {devices.map((d) => (
              <div key={d.id} className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        d.is_online ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                    <div>
                      <h3 className="font-semibold text-[#566886] text-lg">{d.device_name}</h3>
                      <p className="text-sm text-gray-500">{d.kid_name}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        d.is_online
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {d.is_online ? 'Online' : 'Offline'}
                    </span>
                    <div className="text-xs text-gray-400 mt-1">
                      Last seen: {timeAgo(d.last_active)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-0.5">Model</div>
                    <div className="font-medium text-gray-800">
                      {d.device_manufacturer && d.device_model
                        ? `${d.device_manufacturer} ${d.device_model}`
                        : 'Unknown'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-0.5">App Version</div>
                    <div className="font-medium text-gray-800">
                      {d.app_version || 'Unknown'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-0.5">Latest Available</div>
                    <div className="font-medium text-gray-800">
                      {d.latest_version || 'N/A'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-0.5">Update Status</div>
                    <div className={`font-medium ${d.needs_update ? 'text-orange-600' : 'text-green-700'}`}>
                      {d.needs_update ? 'Update Available' : 'Up to Date'}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => sendNotification(d.id, d.device_name)}
                    disabled={sending === d.id || !d.is_online}
                    className="text-sm px-4 py-1.5 rounded-lg bg-[#688ac6] text-white hover:bg-[#5276b3] disabled:opacity-50 transition"
                  >
                    {sending === d.id ? 'Sending...' : 'Send Notification'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
