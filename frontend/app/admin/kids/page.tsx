'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { KidProfileSummary } from '@/lib/types';

export default function KidsPage() {
  const [kids, setKids] = useState<KidProfileSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKids();
  }, []);

  const loadKids = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAllKidProfiles();
      setKids(response.data);
    } catch (error) {
      console.error('Failed to load kid profiles', error);
      alert('Failed to load kid profiles');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading...</div></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Kid Profiles</h1>
        <p className="text-gray-600 mt-2">View all kid profiles across families</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Policies</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Devices</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {kids.map((kid) => (
              <tr key={kid.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{kid.name}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{kid.age}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{kid.parent_email}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{kid.policies_count}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{kid.devices_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
