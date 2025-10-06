'use client';

import { useRouter } from 'next/navigation';

export default function ModeSelect() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <h1 className="text-6xl font-bold text-white text-center mb-12">
          Guardian Launcher
        </h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          <button
            onClick={() => router.push('/parent')}
            className="bg-white rounded-2xl p-12 shadow-2xl hover:scale-105 transition-transform"
          >
            <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Parent</h2>
            <p className="text-gray-600">
              Manage profiles and content policies
            </p>
          </button>

          <button
            onClick={() => router.push('/kids')}
            className="bg-white rounded-2xl p-12 shadow-2xl hover:scale-105 transition-transform"
          >
            <div className="text-6xl mb-4">🎮</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Kids</h2>
            <p className="text-gray-600">
              Launch your approved content
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
