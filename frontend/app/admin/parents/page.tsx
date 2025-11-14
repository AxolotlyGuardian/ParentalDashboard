'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { ParentSummary } from '@/lib/types';

export default function ParentsPage() {
  const [parents, setParents] = useState<ParentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParents();
  }, []);

  const loadParents = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAllParents();
      setParents(response.data);
    } catch (error) {
      console.error('Failed to load parents', error);
      alert('Failed to load parents');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading...</div></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Parents</h1>
        <p className="text-gray-600 mt-2">View all parent accounts and activity</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kid Profiles</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Devices</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {parents.map((parent) => (
              <tr key={parent.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{parent.email}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{parent.kid_profiles_count}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{parent.devices_count}</td>
                <td className="px-6 py-4 text-xs text-gray-500">{new Date(parent.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
