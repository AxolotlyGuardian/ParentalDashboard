'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getUserFromToken } from '@/lib/auth';
import Image from 'next/image';

const tabs = [
  { label: 'Browse', href: '/parent/chinampas' },
  { label: 'Plant', href: '/parent/chinampas/plant' },
  { label: 'My Garden', href: '/parent/chinampas/garden' },
];

export default function ChinampasLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const user = getUserFromToken();
    if (!user || user.role !== 'parent') {
      router.push('/parent');
      return;
    }
    setIsAuthed(true);
  }, [router]);

  if (!isAuthed) return null;

  return (
    <div className="min-h-screen bg-[#0f0f13]">
      {/* Header */}
      <header className="bg-[#18181f] border-b border-[#2a2a35] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/parent')}
                className="text-[#8a8a9a] hover:text-white transition-colors mr-2"
                title="Back to Dashboard"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <Image
                src="/axolotly-logo.svg"
                alt="Axolotly"
                width={32}
                height={36}
                className="object-contain"
                style={{ width: 'auto', height: '32px' }}
              />
              <span className="text-lg font-bold text-[#2dd4bf]">Chinampas</span>
            </div>

            {/* Desktop tabs */}
            <nav className="hidden sm:flex items-center gap-1">
              {tabs.map((tab) => {
                const isActive = pathname === tab.href || (tab.href === '/parent/chinampas' && pathname === '/parent/chinampas');
                return (
                  <button
                    key={tab.href}
                    onClick={() => router.push(tab.href)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#2dd4bf]/10 text-[#2dd4bf]'
                        : 'text-[#8a8a9a] hover:text-white hover:bg-[#1e1e27]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            <button
              onClick={() => router.push('/parent')}
              className="text-[#8a8a9a] hover:text-white text-sm font-medium transition-colors"
            >
              Dashboard
            </button>
          </div>

          {/* Mobile tabs */}
          <div className="sm:hidden flex gap-1 pb-3 -mt-1 overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <button
                  key={tab.href}
                  onClick={() => router.push(tab.href)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-[#2dd4bf]/10 text-[#2dd4bf]'
                      : 'text-[#8a8a9a] hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
}
