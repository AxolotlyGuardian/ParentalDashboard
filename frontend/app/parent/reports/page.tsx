'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { reportsApi } from '@/lib/api';
import { getUserFromToken } from '@/lib/auth';

interface DailyBreakdown {
  date: string;
  day_name: string;
  minutes: number;
}

interface ChildStat {
  name: string;
  total_minutes: number;
  top_apps: { app: string; minutes: number }[];
}

interface WeeklyReport {
  total_minutes: number;
  daily_breakdown: DailyBreakdown[];
  per_child: ChildStat[];
  top_apps: { app: string; minutes: number }[];
}

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

export default function WeeklyReports() {
  const router = useRouter();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [weekStart, setWeekStart] = useState('');
  const [weekEnd, setWeekEnd] = useState('');
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getUserFromToken();
    if (!user || user.role !== 'parent') {
      router.push('/parent');
      return;
    }
    fetchReport(weekOffset);
  }, [weekOffset, router]);

  const fetchReport = async (offset: number) => {
    setLoading(true);
    try {
      const res = await reportsApi.getWeekly(offset);
      setReport(res.data.report);
      setWeekStart(res.data.week_start);
      setWeekEnd(res.data.week_end);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const maxDailyMinutes = report
    ? Math.max(...report.daily_breakdown.map((d) => d.minutes), 1)
    : 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <button
          onClick={() => router.push('/parent')}
          className="text-gray-500 hover:text-gray-700 mb-6 block"
        >
          &larr; Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold text-[#566886] mb-2">Weekly Screen Time Report</h1>

        {/* Week navigator */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="px-3 py-1 rounded bg-gray-200 text-gray-600 hover:bg-gray-300 text-sm"
          >
            &larr; Previous
          </button>
          <span className="text-sm text-gray-600 font-medium">
            {weekStart && weekEnd ? `${formatDate(weekStart)} - ${formatDate(weekEnd)}` : '...'}
          </span>
          <button
            onClick={() => setWeekOffset((o) => Math.max(0, o - 1))}
            disabled={weekOffset === 0}
            className="px-3 py-1 rounded bg-gray-200 text-gray-600 hover:bg-gray-300 text-sm disabled:opacity-40"
          >
            Next &rarr;
          </button>
          {weekOffset === 0 && (
            <span className="text-xs text-gray-400">(This week)</span>
          )}
        </div>

        {loading ? (
          <div className="text-gray-500 py-12 text-center">Loading report...</div>
        ) : !report || report.total_minutes === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <h2 className="text-xl font-semibold text-[#566886] mb-2">No usage data</h2>
            <p className="text-gray-500">
              No screen time was recorded for this week.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Total */}
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-sm text-gray-500 mb-1">Total Screen Time</div>
              <div className="text-4xl font-bold text-[#566886]">
                {formatMinutes(report.total_minutes)}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                avg {formatMinutes(Math.round(report.total_minutes / 7))}/day
              </div>
            </div>

            {/* Daily bar chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-[#566886] mb-4">Daily Breakdown</h2>
              <div className="space-y-2">
                {report.daily_breakdown.map((day) => (
                  <div key={day.date} className="flex items-center gap-3">
                    <span className="w-10 text-sm text-gray-500 font-medium">
                      {day.day_name.slice(0, 3)}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.max(2, (day.minutes / maxDailyMinutes) * 100)}%`,
                          background: 'linear-gradient(to right, #688ac6, #FF6B9D)',
                        }}
                      />
                    </div>
                    <span className="w-16 text-sm text-gray-600 text-right font-medium">
                      {formatMinutes(day.minutes)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Per child */}
            {report.per_child.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-[#566886] mb-4">Per Child</h2>
                <div className="space-y-4">
                  {report.per_child.map((child) => (
                    <div key={child.name} className="border-b last:border-0 pb-3 last:pb-0">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-[#566886]">{child.name}</span>
                        <span className="text-sm text-gray-600">{formatMinutes(child.total_minutes)}</span>
                      </div>
                      {child.top_apps.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {child.top_apps.map((app) => (
                            <span
                              key={app.app}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                            >
                              {app.app}: {formatMinutes(app.minutes)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top apps */}
            {report.top_apps.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-[#566886] mb-4">Most Used Apps</h2>
                <div className="space-y-2">
                  {report.top_apps.map((app, i) => (
                    <div key={app.app} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                          {i + 1}
                        </span>
                        <span className="text-gray-800">{app.app}</span>
                      </div>
                      <span className="text-sm text-gray-600 font-medium">{formatMinutes(app.minutes)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
