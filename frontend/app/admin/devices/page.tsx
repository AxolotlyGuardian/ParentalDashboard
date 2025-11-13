'use client';

import { useState, useEffect } from 'react';
import { deviceApi } from '@/lib/api';

export default function DevicesPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const response = await deviceApi.getDevices();
      setDevices(response.data);
    } catch (error) {
      console.error('Failed to load devices', error);
      alert('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading...</div></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Devices</h1>
        <p className="text-gray-600 mt-2">View all paired devices and activity</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paired</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {devices.map((device) => (
              <tr key={device.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{device.device_name}</td>
                <td className="px-6 py-4 text-xs text-gray-500 font-mono">{device.device_id}</td>
                <td className="px-6 py-4 text-xs text-gray-500">
                  {device.created_at ? new Date(device.created_at).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">{device.last_active ? new Date(device.last_active).toLocaleString() : 'Never'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
