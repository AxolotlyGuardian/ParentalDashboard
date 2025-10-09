'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, catalogApi, policyApi } from '@/lib/api';
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
  media_type: string;
  rating: string;
}

interface Policy {
  policy_id: number;
  title_id: number;
  title: string;
  poster_path?: string;
  is_allowed: boolean;
}

export default function ParentDashboard() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [kidProfiles, setKidProfiles] = useState<KidProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Title[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [newKidName, setNewKidName] = useState('');
  const [newKidAge, setNewKidAge] = useState('');
  const [showNewKidForm, setShowNewKidForm] = useState(false);

  useEffect(() => {
    const user = getUserFromToken();
    if (user && user.role === 'parent') {
      setIsLoggedIn(true);
      setUserId(parseInt(user.sub));
      loadKidProfiles(parseInt(user.sub));
    }
  }, []);

  const loadKidProfiles = async (parentId: number) => {
    try {
      const response = await authApi.getKidProfiles(parentId);
      setKidProfiles(response.data);
    } catch (error) {
      console.error('Failed to load kid profiles', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = isSignup
        ? await authApi.parentSignup(email, password)
        : await authApi.parentLogin(email, password);
      
      setToken(response.data.access_token);
      setUserId(response.data.user_id);
      setIsLoggedIn(true);
      loadKidProfiles(response.data.user_id);
    } catch (error) {
      alert('Authentication failed');
    }
  };

  const handleCreateKidProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    
    try {
      await authApi.createKidProfile(userId, newKidName, parseInt(newKidAge), '0000');
      setNewKidName('');
      setNewKidAge('');
      setShowNewKidForm(false);
      loadKidProfiles(userId);
    } catch (error) {
      alert('Failed to create kid profile');
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    try {
      const response = await catalogApi.search(searchQuery);
      setSearchResults(response.data.results);
    } catch (error) {
      alert('Search failed');
    }
  };

  const handleTogglePolicy = async (title: Title, currentStatus: boolean) => {
    if (!selectedProfile) return;
    
    try {
      await policyApi.createPolicy(
        selectedProfile, 
        title.id, 
        !currentStatus,
        title.title,
        title.media_type,
        title.poster_path,
        title.rating
      );
      loadPolicies();
    } catch (error) {
      alert('Failed to update policy');
    }
  };

  const loadPolicies = async () => {
    if (!selectedProfile) return;
    
    try {
      const response = await policyApi.getProfilePolicies(selectedProfile);
      setPolicies(response.data.policies);
    } catch (error) {
      console.error('Failed to load policies', error);
    }
  };

  useEffect(() => {
    if (selectedProfile) {
      loadPolicies();
    }
  }, [selectedProfile]);

  const handleLogout = () => {
    removeToken();
    setIsLoggedIn(false);
    setUserId(null);
    setKidProfiles([]);
    setSelectedProfile(null);
  };

  const getTitleStatus = (titleId: number) => {
    const policy = policies.find(p => p.title_id === titleId);
    return policy ? policy.is_allowed : false;
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FF6B9D] to-[#FF8FB3] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full">
          <div className="text-center mb-6">
            <div className="inline-block bg-pink-50 p-4 rounded-2xl mb-4">
              <span className="text-5xl">🦎</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">
              Parent Dashboard
            </h1>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent text-gray-800"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent text-gray-800"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#FF6B9D] to-[#FF8FB3] text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105"
            >
              {isSignup ? 'Sign Up' : 'Log In'}
            </button>
            
            <button
              type="button"
              onClick={() => setIsSignup(!isSignup)}
              className="w-full text-pink-600 text-sm hover:underline"
            >
              {isSignup ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
            </button>
          </form>
          
          <button
            onClick={() => router.push('/mode-select')}
            className="w-full mt-4 text-gray-600 text-sm hover:underline"
          >
            ← Back to mode select
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-gradient-to-r from-[#FF6B9D] to-[#FF8FB3] shadow-lg p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🦎</span>
            <h1 className="text-2xl font-bold text-white">Axolotly Parent Dashboard</h1>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-all"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-gray-50 rounded-3xl p-8 shadow-sm border border-gray-100 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Kid Profiles</h2>
            <button
              onClick={() => setShowNewKidForm(!showNewKidForm)}
              className="px-6 py-2 bg-gradient-to-r from-[#FF6B9D] to-[#FF8FB3] text-white rounded-full hover:shadow-lg transition-all transform hover:scale-105"
            >
              + Add Kid
            </button>
          </div>

          {showNewKidForm && (
            <form onSubmit={handleCreateKidProfile} className="mb-6 p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={newKidName}
                  onChange={(e) => setNewKidName(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-xl text-gray-800 flex-1 focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                  required
                />
                <input
                  type="number"
                  placeholder="Age"
                  value={newKidAge}
                  onChange={(e) => setNewKidAge(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-xl text-gray-800 w-24 focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                  required
                />
                <button type="submit" className="px-8 py-3 bg-gradient-to-r from-[#FF6B9D] to-[#FF8FB3] text-white rounded-xl hover:shadow-lg transition-all transform hover:scale-105">
                  Create Profile
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kidProfiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => setSelectedProfile(profile.id)}
                className={`p-6 rounded-2xl border-2 transition-all transform hover:scale-105 ${
                  selectedProfile === profile.id
                    ? 'border-pink-400 bg-pink-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-pink-200 hover:shadow-sm'
                }`}
              >
                <div className="text-4xl mb-2">👤</div>
                <div className="font-semibold text-gray-800">{profile.name}</div>
                <div className="text-sm text-gray-600">Age {profile.age}</div>
              </button>
            ))}
          </div>
        </div>

        {selectedProfile && (
          <>
            <div className="bg-gray-50 rounded-3xl p-8 shadow-sm border border-gray-100 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Search Titles</h2>
              <form onSubmit={handleSearch} className="flex gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search movies and TV shows..."
                  className="flex-1 px-6 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent text-gray-800"
                />
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-[#FF6B9D] to-[#FF8FB3] text-white rounded-xl hover:shadow-lg transition-all transform hover:scale-105"
                >
                  Search
                </button>
              </form>

              {searchResults.length > 0 && (
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {searchResults.map((title) => (
                    <div key={title.id} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                      {title.poster_path && (
                        <img
                          src={title.poster_path}
                          alt={title.title}
                          className="w-full h-40 object-cover rounded-xl mb-3"
                        />
                      )}
                      <div className="text-sm font-semibold mb-3 text-gray-800">{title.title}</div>
                      <button
                        onClick={() => handleTogglePolicy(title, getTitleStatus(title.id))}
                        className={`w-full py-2 rounded-lg text-xs font-semibold transition-all ${
                          getTitleStatus(title.id)
                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                            : 'bg-green-100 text-green-600 hover:bg-green-200'
                        }`}
                      >
                        {getTitleStatus(title.id) ? '✗ Allowed' : '✓ Allowed'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-3xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Current Policies</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {policies.map((policy) => (
                  <div key={policy.policy_id} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                    {policy.poster_path && (
                      <img
                        src={policy.poster_path}
                        alt={policy.title}
                        className="w-full h-40 object-cover rounded-xl mb-3"
                      />
                    )}
                    <div className="text-sm font-semibold mb-2 text-gray-800">{policy.title}</div>
                    <div className={`text-xs font-bold px-3 py-1 rounded-full ${policy.is_allowed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {policy.is_allowed ? '✓ Allowed' : '✗ Blocked'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
