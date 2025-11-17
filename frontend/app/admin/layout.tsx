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
    if (!user || user.role !== 'parent' || !user.is_admin) {
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

  // Define page groups for smarter navigation
  const pageGroups = {
    content: [
      { href: '/admin/content-reports', label: 'Content Reports' },
      { href: '/admin/content-tags', label: 'Content Tags' },
      { href: '/admin/titles', label: 'Titles' },
      { href: '/admin/episode-links', label: 'Episode Links' },
    ],
    users: [
      { href: '/admin/parents', label: 'Parents' },
      { href: '/admin/kids', label: 'Kid Profiles' },
      { href: '/admin/devices', label: 'Devices' },
    ],
    system: [
      { href: '/admin/policies', label: 'Policies' },
      { href: '/admin/stats', label: 'Usage Stats' },
      { href: '/admin/tmdb-sync', label: 'TMDB Sync' },
      { href: '/admin/settings', label: 'Settings' },
    ]
  };

  // Determine which group the current page belongs to
  const getCurrentGroup = () => {
    for (const [group, items] of Object.entries(pageGroups)) {
      if (items.some(item => pathname === item.href)) {
        return group;
      }
    }
    return 'content'; // default
  };

  const currentGroup = getCurrentGroup();

  // Build dynamic nav items - current group first, then others
  const navItems = [
    ...pageGroups[currentGroup as keyof typeof pageGroups],
    ...(currentGroup !== 'content' ? pageGroups.content : []),
    ...(currentGroup !== 'users' ? pageGroups.users : []),
    ...(currentGroup !== 'system' ? pageGroups.system : []),
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
              ← Back to Parent Dashboard
            </Link>
            
            {/* Current Section */}
            <div className="mb-6">
              <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {currentGroup === 'content' && 'Content Management'}
                {currentGroup === 'users' && 'User Management'}
                {currentGroup === 'system' && 'System'}
              </h3>
              <div className="space-y-1">
                {pageGroups[currentGroup as keyof typeof pageGroups].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-4 py-2 rounded-lg transition ${
                      pathname === item.href
                        ? 'bg-[#F77B8A] text-white font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Other Sections */}
            {currentGroup !== 'content' && (
              <div className="mb-4">
                <h3 className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Content Management
                </h3>
                <div className="space-y-1">
                  {pageGroups.content.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {currentGroup !== 'users' && (
              <div className="mb-4">
                <h3 className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  User Management
                </h3>
                <div className="space-y-1">
                  {pageGroups.users.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {currentGroup !== 'system' && (
              <div className="mb-4">
                <h3 className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  System
                </h3>
                <div className="space-y-1">
                  {pageGroups.system.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </nav>
        </aside>

        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
