'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { subscriptionsApi } from '@/lib/api';
import { getUserFromToken } from '@/lib/auth';

interface SubStatus {
  plan: string | null;
  status: string | null;
  device_limit: number | null;
  hardware_units: number | null;
  current_period_end: string | null;
  has_subscription: boolean;
  cancel_at_period_end: boolean;
}

export default function SubscriptionManagement() {
  const router = useRouter();
  const [sub, setSub] = useState<SubStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const user = getUserFromToken();
    if (!user || user.role !== 'parent') {
      router.push('/parent');
      return;
    }
    fetchStatus();
  }, [router]);

  const fetchStatus = async () => {
    try {
      const res = await subscriptionsApi.getStatus();
      setSub(res.data);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load subscription status.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePlan = async (newPlan: string) => {
    setActionLoading('change');
    setMessage(null);
    try {
      const res = await subscriptionsApi.changePlan(newPlan);
      setMessage({ type: 'success', text: res.data.message });
      await fetchStatus();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to change plan.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? It will remain active until the end of your billing period.')) return;
    setActionLoading('cancel');
    setMessage(null);
    try {
      const res = await subscriptionsApi.cancel();
      setMessage({ type: 'success', text: res.data.message });
      await fetchStatus();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to cancel.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async () => {
    setActionLoading('reactivate');
    setMessage(null);
    try {
      const res = await subscriptionsApi.reactivate();
      setMessage({ type: 'success', text: res.data.message });
      await fetchStatus();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to reactivate.' });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const planLabels: Record<string, string> = {
    monthly: 'Monthly ($14.99/mo)',
    annual: 'Annual ($194.90/yr)',
  };

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    past_due: 'bg-yellow-100 text-yellow-800',
    canceled: 'bg-red-100 text-red-800',
    pending: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <button
          onClick={() => router.push('/parent')}
          className="text-gray-500 hover:text-gray-700 mb-6 block"
        >
          &larr; Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold text-[#566886] mb-8">Subscription</h1>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {!sub?.has_subscription ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-xl font-semibold text-[#566886] mb-4">No active subscription</h2>
            <p className="text-gray-600 mb-6">
              Get started with an Axolotly subscription to protect your family&apos;s screen time.
            </p>
            <button
              onClick={() => router.push('/pricing')}
              className="px-6 py-3 rounded-lg text-white font-bold"
              style={{ background: 'linear-gradient(to right, #FF6B9D, #FF8FB3)' }}
            >
              View Plans
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Plan */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-[#566886] mb-4">Current Plan</h2>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xl font-bold text-[#566886]">
                    {planLabels[sub.plan || ''] || sub.plan}
                  </div>
                  <span
                    className={`inline-block mt-1 px-3 py-0.5 rounded-full text-sm font-medium ${
                      statusColors[sub.status || 'pending'] || statusColors.pending
                    }`}
                  >
                    {sub.status === 'active' ? 'Active' : sub.status === 'past_due' ? 'Past Due' : sub.status === 'canceled' ? 'Canceled' : sub.status}
                  </span>
                </div>
                <div className="text-right text-sm text-gray-500">
                  {sub.hardware_units && (
                    <div>{sub.hardware_units} device{sub.hardware_units > 1 ? 's' : ''}</div>
                  )}
                  {sub.current_period_end && (
                    <div>
                      {sub.status === 'canceled' ? 'Ends' : 'Renews'}{' '}
                      {new Date(sub.current_period_end).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Switch plan */}
              {sub.status === 'active' && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">Switch Plan</h3>
                  {sub.plan === 'monthly' ? (
                    <button
                      onClick={() => handleChangePlan('annual')}
                      disabled={actionLoading === 'change'}
                      className="w-full py-2.5 rounded-lg text-white font-semibold disabled:opacity-50"
                      style={{ background: 'linear-gradient(to right, #FF6B9D, #FF8FB3)' }}
                    >
                      {actionLoading === 'change'
                        ? 'Switching...'
                        : 'Upgrade to Annual — Save $15/year'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleChangePlan('monthly')}
                      disabled={actionLoading === 'change'}
                      className="w-full py-2.5 rounded-lg border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 disabled:opacity-50"
                    >
                      {actionLoading === 'change'
                        ? 'Switching...'
                        : 'Switch to Monthly ($14.99/mo)'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-[#566886] mb-4">Manage</h2>

              {sub.status === 'canceled' ? (
                <button
                  onClick={handleReactivate}
                  disabled={actionLoading === 'reactivate'}
                  className="w-full py-2.5 rounded-lg text-white font-semibold disabled:opacity-50"
                  style={{ background: 'linear-gradient(to right, #688ac6, #5276b3)' }}
                >
                  {actionLoading === 'reactivate' ? 'Reactivating...' : 'Reactivate Subscription'}
                </button>
              ) : sub.status === 'active' || sub.status === 'past_due' ? (
                <button
                  onClick={handleCancel}
                  disabled={actionLoading === 'cancel'}
                  className="w-full py-2.5 rounded-lg border border-red-300 text-red-600 font-semibold hover:bg-red-50 disabled:opacity-50"
                >
                  {actionLoading === 'cancel' ? 'Canceling...' : 'Cancel Subscription'}
                </button>
              ) : null}

              {sub.status === 'past_due' && (
                <p className="text-sm text-yellow-700 mt-3">
                  Your payment failed. Please update your payment method to avoid service interruption.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
