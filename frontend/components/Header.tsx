'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface HeaderProps {
  variant?: 'pink' | 'blue';
}

export default function Header({ variant = 'pink' }: HeaderProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavigation = (path: string) => {
    router.push(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white/90 backdrop-blur-lg shadow-[0_2px_16px_rgba(0,0,0,0.06)] border-b border-gray-100 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => handleNavigation('/')}
          >
            <Image 
              src="/axolotly-logo.svg"
              alt="Axolotly Logo" 
              width={45}
              height={50}
              className="object-contain group-hover:scale-110 transition-transform duration-300"
              style={{ width: 'auto', height: '40px' }}
            />
            <span className="text-xl font-bold text-[#F77B8A]">Axolotly</span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => handleNavigation('/')}
              className="text-gray-600 hover:text-[#F77B8A] font-medium transition-all px-4 py-2 rounded-lg hover:bg-pink-50/60"
            >
              Home
            </button>
            <button
              onClick={() => handleNavigation('/how-it-works')}
              className="text-gray-600 hover:text-[#F77B8A] font-medium transition-all px-4 py-2 rounded-lg hover:bg-pink-50/60"
            >
              How It Works
            </button>
            <button
              onClick={() => handleNavigation('/pricing')}
              className="text-gray-600 hover:text-[#F77B8A] font-medium transition-all px-4 py-2 rounded-lg hover:bg-pink-50/60"
            >
              Pricing
            </button>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => handleNavigation('/parent')}
              className="text-gray-700 hover:text-[#F77B8A] font-semibold py-2 px-5 rounded-full transition-all border border-gray-200 hover:border-[#F77B8A]/40 hover:bg-pink-50/40"
            >
              Log In
            </button>
            <button
              onClick={() => handleNavigation('/parent?signup=true')}
              className="bg-[#F77B8A] hover:shadow-[0_6px_20px_rgba(247,123,138,0.4)] hover:scale-105 text-white font-semibold py-2 px-6 rounded-full transition-all duration-200"
            >
              Sign Up Free
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-700 p-2 hover:bg-gray-100 rounded-xl transition-all"
            aria-label="Toggle menu"
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-100 pt-4 animate-in slide-in-from-top">
            <div className="flex flex-col gap-1">
              <button
                onClick={() => handleNavigation('/')}
                className="text-gray-700 hover:text-[#F77B8A] hover:bg-pink-50 font-medium text-left transition-all px-4 py-3 rounded-xl"
              >
                Home
              </button>
              <button
                onClick={() => handleNavigation('/how-it-works')}
                className="text-gray-700 hover:text-[#F77B8A] hover:bg-pink-50 font-medium text-left transition-all px-4 py-3 rounded-xl"
              >
                How It Works
              </button>
              <button
                onClick={() => handleNavigation('/pricing')}
                className="text-gray-700 hover:text-[#F77B8A] hover:bg-pink-50 font-medium text-left transition-all px-4 py-3 rounded-xl"
              >
                Pricing
              </button>
              <div className="flex gap-3 mt-3 px-4">
                <button
                  onClick={() => handleNavigation('/parent')}
                  className="flex-1 text-gray-700 font-semibold py-2.5 rounded-full border border-gray-200 hover:border-[#F77B8A]/40 transition-all text-center"
                >
                  Log In
                </button>
                <button
                  onClick={() => handleNavigation('/parent?signup=true')}
                  className="flex-1 bg-[#F77B8A] text-white font-semibold py-2.5 rounded-full transition-all text-center"
                >
                  Sign Up Free
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
