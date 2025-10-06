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
  const [newKidPin, setNewKidPin] = useState('');
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
      await authApi.createKidProfile(userId, newKidName, parseInt(newKidAge), newKidPin);
      setNewKidName('');
      setNewKidAge('');
      setNewKidPin('');
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

  const handleTogglePolicy = async (titleId: number, currentStatus: boolean) => {
    if (!selectedProfile) return;
    
    try {
      await policyApi.createPolicy(selectedProfile, titleId, !currentStatus);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Parent Dashboard
          </h1>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              {isSignup ? 'Sign Up' : 'Log In'}
            </button>
            
            <button
              type="button"
              onClick={() => setIsSignup(!isSignup)}
              className="w-full text-blue-600 text-sm hover:underline"
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
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Guardian Launcher - Parent Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Kid Profiles</h2>
            <button
              onClick={() => setShowNewKidForm(!showNewKidForm)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              + Add Kid
            </button>
          </div>

          {showNewKidForm && (
            <form onSubmit={handleCreateKidProfile} className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={newKidName}
                  onChange={(e) => setNewKidName(e.target.value)}
                  className="px-4 py-2 border rounded-lg text-gray-800"
                  required
                />
                <input
                  type="number"
                  placeholder="Age"
                  value={newKidAge}
                  onChange={(e) => setNewKidAge(e.target.value)}
                  className="px-4 py-2 border rounded-lg text-gray-800"
                  required
                />
                <input
                  type="password"
                  placeholder="PIN"
                  value={newKidPin}
                  onChange={(e) => setNewKidPin(e.target.value)}
                  className="px-4 py-2 border rounded-lg text-gray-800"
                  required
                />
              </div>
              <button type="submit" className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Create Profile
              </button>
            </form>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kidProfiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => setSelectedProfile(profile.id)}
                className={`p-4 rounded-lg border-2 transition ${
                  selectedProfile === profile.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 bg-white hover:border-blue-300'
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
            <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Search Titles</h2>
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search movies and TV shows..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Search
                </button>
              </form>

              {searchResults.length > 0 && (
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {searchResults.map((title) => (
                    <div key={title.id} className="bg-gray-50 rounded-lg p-3">
                      {title.poster_path && (
                        <img
                          src={title.poster_path}
                          alt={title.title}
                          className="w-full h-40 object-cover rounded-lg mb-2"
                        />
                      )}
                      <div className="text-sm font-semibold mb-2">{title.title}</div>
                      <button
                        onClick={() => handleTogglePolicy(title.id, getTitleStatus(title.id))}
                        className={`w-full py-1 rounded text-xs font-semibold ${
                          getTitleStatus(title.id)
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                      >
                        {getTitleStatus(title.id) ? 'Block' : 'Allow'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Current Policies</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {policies.map((policy) => (
                  <div key={policy.policy_id} className="bg-gray-50 rounded-lg p-3">
                    {policy.poster_path && (
                      <img
                        src={policy.poster_path}
                        alt={policy.title}
                        className="w-full h-40 object-cover rounded-lg mb-2"
                      />
                    )}
                    <div className="text-sm font-semibold mb-2">{policy.title}</div>
                    <div className={`text-xs font-bold ${policy.is_allowed ? 'text-green-600' : 'text-red-600'}`}>
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
