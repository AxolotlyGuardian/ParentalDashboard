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
    <header className="bg-white shadow-sm border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => handleNavigation('/')}
          >
            <Image 
              src="/logos/axolotly-icon.png"
              alt="Axolotly Logo" 
              width={45}
              height={45}
              className="object-contain"
            />
            <span className="text-xl font-bold text-gray-800">Axolotly</span>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => handleNavigation('/')}
              className="text-gray-700 hover:text-[#FF6B9D] font-medium transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => handleNavigation('/how-it-works')}
              className="text-gray-700 hover:text-[#688ac6] font-medium transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => handleNavigation('/pricing')}
              className="text-gray-700 hover:text-[#FF6B9D] font-medium transition-colors"
            >
              Pricing
            </button>
          </div>

          {/* Desktop Login Button */}
          <button
            onClick={() => handleNavigation('/mode-select')}
            className="hidden md:block bg-gradient-to-r from-[#FF6B9D] to-[#FF8FB3] hover:shadow-lg text-white font-semibold py-2 px-6 rounded-full transition-all"
          >
            Login
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-700 p-2"
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

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
            <div className="flex flex-col gap-4">
              <button
                onClick={() => handleNavigation('/')}
                className="text-gray-700 hover:text-[#FF6B9D] font-medium text-left transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => handleNavigation('/how-it-works')}
                className="text-gray-700 hover:text-[#688ac6] font-medium text-left transition-colors"
              >
                How It Works
              </button>
              <button
                onClick={() => handleNavigation('/pricing')}
                className="text-gray-700 hover:text-[#FF6B9D] font-medium text-left transition-colors"
              >
                Pricing
              </button>
              <button
                onClick={() => handleNavigation('/mode-select')}
                className="bg-gradient-to-r from-[#FF6B9D] to-[#FF8FB3] hover:shadow-lg text-white font-semibold py-2 px-6 rounded-full transition-all text-center"
              >
                Login
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
