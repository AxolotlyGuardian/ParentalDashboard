'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, policyApi, launchApi } from '@/lib/api';
import { setToken, getUserFromToken, removeToken } from '@/lib/auth';

interface KidProfile {
  id: number;
  name: string;
  age: number;
}

interface Title {
  id: number;
  title: string;
  poster_path?: string;
  overview?: string;
  rating: string;
  providers?: string[];
}

interface BlockMessage {
  show: boolean;
  message: string;
  title: string;
}

const PROVIDERS = ['Netflix', 'Disney', 'Prime', 'Hulu', 'Peacock', 'YouTube'];

export default function KidsLauncher() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [availableProfiles, setAvailableProfiles] = useState<KidProfile[]>([]);
  const [allowedTitles, setAllowedTitles] = useState<Title[]>([]);
  const [selectedTitle, setSelectedTitle] = useState<Title | null>(null);
  const [blockMessage, setBlockMessage] = useState<BlockMessage>({ show: false, message: '', title: '' });

  useEffect(() => {
    const user = getUserFromToken();
    if (user && user.role === 'kid') {
      setIsLoggedIn(true);
      setProfileId(parseInt(user.sub));
      loadAllowedTitles(parseInt(user.sub));
    } else {
      loadAvailableProfiles();
    }
  }, []);

  const loadAvailableProfiles = async () => {
    try {
      const response = await authApi.getAllKidProfiles();
      setAvailableProfiles(response.data);
    } catch (error) {
      console.error('Failed to load profiles', error);
    }
  };

  const handleProfileClick = async (profileId: number) => {
    try {
      const response = await authApi.kidLogin(profileId, '0000');
      setToken(response.data.access_token);
      setProfileId(response.data.profile_id);
      setIsLoggedIn(true);
      loadAllowedTitles(response.data.profile_id);
    } catch (error) {
      alert('Failed to login');
    }
  };

  const loadAllowedTitles = async (kidProfileId: number) => {
    try {
      const response = await policyApi.getAllowedTitles(kidProfileId);
      setAllowedTitles(response.data.allowed_titles);
    } catch (error) {
      console.error('Failed to load allowed titles', error);
    }
  };

  const handleTitleClick = async (title: Title) => {
    if (!title.providers || title.providers.length === 0) {
      try {
        const response = await catalogApi.getTitleProviders(title.id);
        title.providers = response.data.providers;
      } catch (error) {
        console.error('Failed to fetch providers', error);
        title.providers = [];
      }
    }
    setSelectedTitle(title);
  };

  const handleLaunch = async (provider: string) => {
    if (!profileId || !selectedTitle) return;

    try {
      const response = await launchApi.checkLaunch(profileId, selectedTitle.id, provider);
      
      if (response.data.allowed) {
        window.open(response.data.deep_link || response.data.fallback_url, '_blank');
        setSelectedTitle(null);
      } else {
        setBlockMessage({
          show: true,
          message: response.data.message || 'This content is blocked.',
          title: selectedTitle.title
        });
        setSelectedTitle(null);
      }
    } catch (error) {
      alert('Failed to launch content');
    }
  };

  const handleLogout = () => {
    removeToken();
    setIsLoggedIn(false);
    setProfileId(null);
    setAllowedTitles([]);
  };

  if (blockMessage.show) {
    return (
      <div className="min-h-screen bg-red-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-12 shadow-2xl max-w-2xl text-center">
          <div className="text-8xl mb-6">🚫</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Content Blocked</h1>
          <p className="text-2xl text-gray-600 mb-6">{blockMessage.message}</p>
          <button
            onClick={() => setBlockMessage({ show: false, message: '', title: '' })}
            className="px-8 py-4 bg-blue-500 text-white text-xl rounded-full font-semibold hover:bg-blue-600 transition"
          >
            OK, Got It!
          </button>
        </div>
      </div>
    );
  }

  if (selectedTitle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-4xl w-full">
          <button
            onClick={() => setSelectedTitle(null)}
            className="mb-6 px-6 py-2 bg-gray-200 rounded-full hover:bg-gray-300 text-gray-800 font-semibold"
          >
            ← Back
          </button>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              {selectedTitle.poster_path && (
                <img
                  src={selectedTitle.poster_path}
                  alt={selectedTitle.title}
                  className="w-full rounded-2xl shadow-lg"
                />
              )}
            </div>

            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">{selectedTitle.title}</h2>
              <p className="text-gray-600 mb-6">{selectedTitle.overview}</p>
              <div className="mb-6">
                <span className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-sm font-semibold">
                  ⭐ {selectedTitle.rating}
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-4">Choose a platform to watch:</h3>
              <div className="grid grid-cols-2 gap-3">
                {(selectedTitle.providers && selectedTitle.providers.length > 0 
                  ? selectedTitle.providers 
                  : PROVIDERS
                ).map((provider) => (
                  <button
                    key={provider}
                    onClick={() => handleLaunch(provider)}
                    className="px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:scale-105 transition-transform"
                  >
                    {provider}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-2xl w-full">
          <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
            Kids Launcher
          </h1>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Select Your Profile</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {availableProfiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => handleProfileClick(profile.id)}
                  className="p-6 rounded-2xl border-4 border-gray-300 bg-white hover:border-blue-500 hover:bg-blue-50 hover:scale-105 transition-all"
                >
                  <div className="text-5xl mb-2">👤</div>
                  <div className="font-bold text-lg text-gray-800">{profile.name}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => router.push('/mode-select')}
            className="w-full mt-4 text-gray-600 hover:underline"
          >
            ← Back to mode select
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      <nav className="bg-white/90 backdrop-blur shadow-md p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Your Videos 🎬</h1>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 font-semibold"
          >
            Exit
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        {allowedTitles.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-8xl mb-4">📺</div>
            <h2 className="text-4xl font-bold text-white mb-4">No videos yet!</h2>
            <p className="text-2xl text-white/80">Ask your parent to add some videos for you.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {allowedTitles.map((title) => (
              <button
                key={title.id}
                onClick={() => handleTitleClick(title)}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:scale-105 transition-transform"
              >
                {title.poster_path ? (
                  <img
                    src={title.poster_path}
                    alt={title.title}
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-200 flex items-center justify-center text-6xl">
                    🎬
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-800">{title.title}</h3>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
