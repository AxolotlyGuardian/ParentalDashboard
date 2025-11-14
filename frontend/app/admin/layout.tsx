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
    { href: '/admin/content-reports', label: 'Content Reports' },
    { href: '/admin/content-tags', label: 'Content Tags' },
    { href: '/admin/titles', label: 'Titles' },
    { href: '/admin/episode-links', label: 'Episode Links' },
    { href: '/admin/parents', label: 'Parents' },
    { href: '/admin/kids', label: 'Kid Profiles' },
    { href: '/admin/devices', label: 'Devices' },
    { href: '/admin/policies', label: 'Policies' },
    { href: '/admin/stats', label: 'Usage Stats' },
    { href: '/admin/tmdb-sync', label: 'TMDB Sync' },
    { href: '/admin/settings', label: 'Settings' },
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
              className="px-4 py-2 mb-4 text-gray-700 hover:bg-gray-100 rounded-lg transition block"
            >
              Back to Parent Dashboard
            </Link>
            
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-2 rounded-lg transition ${
                    pathname === item.href
                      ? 'bg-[#F77B8A] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
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
