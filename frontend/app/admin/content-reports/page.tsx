'use client';

import { useState, useEffect } from 'react';
import { contentTagApi } from '@/lib/api';

interface ContentReport {
  id: number;
  title_id: number;
  title_name: string;
  tag_id: number;
  tag_name: string;
  tag_category: string;
  season_number?: number;
  episode_number?: number;
  notes?: string;
  status: string;
  reported_by: number;
  reporter_email: string;
  reviewed_by?: number;
  reviewer_email?: string;
  created_at: string;
  reviewed_at?: string;
}

export default function ContentReportsPage() {
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, statusFilter]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await contentTagApi.getContentReports();
      setReports(response.data);
    } catch (error) {
      console.error('Failed to load content reports', error);
      alert('Failed to load content reports');
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    if (statusFilter === 'all') {
      setFilteredReports(reports);
    } else {
      setFilteredReports(reports.filter(r => r.status === statusFilter));
    }
  };

  const handleApprove = async (reportId: number) => {
    if (!confirm('Approve this content report? This will apply the tag to the title.')) {
      return;
    }

    try {
      setProcessingId(reportId);
      await contentTagApi.approveContentReport(reportId);
      alert('Report approved successfully!');
      await loadReports();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to approve report';
      alert(message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (reportId: number) => {
    if (!confirm('Reject this content report? The tag will NOT be applied.')) {
      return;
    }

    try {
      setProcessingId(reportId);
      await contentTagApi.rejectContentReport(reportId);
      alert('Report rejected successfully.');
      await loadReports();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to reject report';
      alert(message);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      creatures: 'bg-purple-100 text-purple-800',
      situations: 'bg-orange-100 text-orange-800',
      death_loss: 'bg-gray-100 text-gray-800',
      visuals: 'bg-red-100 text-red-800',
      intensity: 'bg-yellow-100 text-yellow-800',
      social: 'bg-blue-100 text-blue-800',
      rating: 'bg-green-100 text-green-800',
      age: 'bg-indigo-100 text-indigo-800',
      content_warning: 'bg-pink-100 text-pink-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading content reports...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Content Reports</h1>
        <p className="text-gray-600 mt-2">
          Review and manage parent-submitted content reports
        </p>
      </div>

      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex gap-4 items-center">
          <label className="text-sm font-medium text-gray-700">Filter by status:</label>
          <div className="flex gap-2">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  statusFilter === status
                    ? 'bg-[#F77B8A] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          <div className="ml-auto text-sm text-gray-600">
            Showing {filteredReports.length} of {reports.length} reports
          </div>
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-400 text-lg">
            No {statusFilter !== 'all' ? statusFilter : ''} reports found
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tag</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Episode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reported By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">#{report.id}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{report.title_name}</div>
                    <div className="text-xs text-gray-500">Title ID: {report.title_id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-1 rounded text-xs font-semibold inline-block ${getCategoryColor(report.tag_category)}`}>
                        {report.tag_category}
                      </span>
                      <span className="text-sm text-gray-700">{report.tag_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {report.season_number && report.episode_number ? (
                      <span>S{report.season_number}E{report.episode_number}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                    {report.notes && (
                      <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={report.notes}>
                        {report.notes}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{report.reporter_email}</div>
                    <div className="text-xs text-gray-500">{formatDate(report.created_at)}</div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(report.status)}
                    {report.reviewer_email && (
                      <div className="text-xs text-gray-500 mt-1">
                        by {report.reviewer_email}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {report.status === 'pending' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(report.id)}
                          disabled={processingId === report.id}
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 text-sm"
                        >
                          {processingId === report.id ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(report.id)}
                          disabled={processingId === report.id}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {formatDate(report.reviewed_at || report.created_at)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
