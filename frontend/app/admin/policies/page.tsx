'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const ITEMS_PER_PAGE = 100;

  useEffect(() => {
    loadPolicies();
  }, [page]);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAllPolicies(page * ITEMS_PER_PAGE, ITEMS_PER_PAGE);
      setPolicies(response.data);
    } catch (error) {
      console.error('Failed to load policies', error);
      alert('Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading...</div></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Policies</h1>
        <p className="text-gray-600 mt-2">View all allow/deny rules across families</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kid</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {policies.map((policy) => (
              <tr key={policy.policy_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{policy.title_name}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{policy.kid_name}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{policy.parent_email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    policy.is_allowed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {policy.is_allowed ? 'ALLOWED' : 'BLOCKED'}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">{new Date(policy.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-6">
        <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50">Previous</button>
        <div className="text-sm text-gray-600">Page {page + 1}</div>
        <button onClick={() => setPage(page + 1)} disabled={policies.length < ITEMS_PER_PAGE} className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50">Next</button>
      </div>
    </div>
  );
}
