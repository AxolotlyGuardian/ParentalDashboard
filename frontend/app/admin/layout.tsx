'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getUserFromToken } from '@/lib/auth';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const user = getUserFromToken();
    if (!user || user.role !== 'parent') {
      router.push('/parent');
      return;
    }
    setIsAuthorized(true);
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const navItems = [
    { href: '/admin/content-reports', label: 'Content Reports', icon: '📋' },
    { href: '/admin/content-tags', label: 'Content Tags', icon: '🏷️' },
    { href: '/admin/titles', label: 'Titles', icon: '🎬' },
    { href: '/admin/episode-links', label: 'Episode Links', icon: '🔗' },
    { href: '/admin/parents', label: 'Parents', icon: '👤' },
    { href: '/admin/kids', label: 'Kid Profiles', icon: '👶' },
    { href: '/admin/devices', label: 'Devices', icon: '📱' },
    { href: '/admin/policies', label: 'Policies', icon: '✅' },
    { href: '/admin/stats', label: 'Usage Stats', icon: '📊' },
    { href: '/admin/tmdb-sync', label: 'TMDB Sync', icon: '🔄' },
    { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <aside className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-[#F77B8A]">Axolotly Admin</h1>
            <p className="text-sm text-gray-500 mt-1">Dashboard</p>
          </div>
          
          <nav className="p-4">
            <Link
              href="/parent"
              className="flex items-center gap-3 px-4 py-2 mb-4 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              <span>←</span>
              <span>Back to Parent Dashboard</span>
            </Link>
            
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                    pathname === item.href
                      ? 'bg-[#F77B8A] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>
        </aside>

        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
