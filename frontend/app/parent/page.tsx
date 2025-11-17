'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, catalogApi, policyApi, deviceApi } from '@/lib/api';
import { setToken, getUserFromToken, removeToken } from '@/lib/auth';
import ContentReportModal from '@/components/ContentReportModal';
import { PairedDevice, ApiError } from '@/lib/types';

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
  providers?: string[];
  deep_links?: { [key: string]: string };
}

export default function ParentDashboard() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [deviceCode, setDeviceCode] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [kidProfiles, setKidProfiles] = useState<KidProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Title[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [policySearchQuery, setPolicySearchQuery] = useState('');
  const [newKidName, setNewKidName] = useState('');
  const [newKidAge, setNewKidAge] = useState('');
  const [showNewKidForm, setShowNewKidForm] = useState(false);
  const [showAddDeviceForm, setShowAddDeviceForm] = useState(false);
  const [pairingCode, setPairingCode] = useState('');
  const [selectedKidForDevice, setSelectedKidForDevice] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'policies' | 'devices'>('policies');
  const [devices, setDevices] = useState<PairedDevice[]>([]);
  const [editingDeviceId, setEditingDeviceId] = useState<number | null>(null);
  const [editingDeviceName, setEditingDeviceName] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedTitleForReport, setSelectedTitleForReport] = useState<Title | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const user = getUserFromToken();
    if (user && user.role === 'parent') {
      setIsLoggedIn(true);
      setUserId(parseInt(user.sub));
      loadKidProfiles(parseInt(user.sub));
      loadDevices();
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

  const loadDevices = async () => {
    try {
      const response = await deviceApi.getDevices();
      setDevices(response.data);
    } catch (error) {
      console.error('Failed to load devices', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = isSignup
        ? await authApi.parentSignup(email, password, deviceCode)
        : await authApi.parentLogin(email, password);
      
      setToken(response.data.access_token);
      setUserId(response.data.user_id);
      setIsLoggedIn(true);
      
      // Small delay to ensure token is saved to localStorage
      await new Promise(resolve => setTimeout(resolve, 100));
      loadKidProfiles(response.data.user_id);
      loadDevices();
    } catch (error) {
      const errorMessage = (error as ApiError).response?.data?.detail || 'Authentication failed';
      alert(errorMessage);
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

  const handlePairDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKidForDevice || !pairingCode.trim()) return;
    
    try {
      const response = await deviceApi.confirmPairing(pairingCode, selectedKidForDevice);
      alert(`Device paired successfully to ${response.data.kid_name}!`);
      setPairingCode('');
      setShowAddDeviceForm(false);
      setSelectedKidForDevice(null);
      loadDevices();
    } catch (error) {
      const errorMessage = (error as ApiError).response?.data?.detail || 'Failed to pair device';
      alert(errorMessage);
    }
  };

  const handleUpdateDeviceName = async (deviceId: number, newName: string) => {
    if (!newName.trim()) {
      alert('Device name cannot be empty');
      setEditingDeviceId(null);
      setEditingDeviceName('');
      return;
    }
    
    try {
      await deviceApi.updateDeviceName(deviceId, newName.trim());
      setEditingDeviceId(null);
      setEditingDeviceName('');
      loadDevices();
    } catch (error) {
      const errorMessage = (error as ApiError).response?.data?.detail || 'Failed to update device name';
      alert(errorMessage);
      setEditingDeviceId(null);
      setEditingDeviceName('');
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
      
      await loadPolicies();
      
      setSearchResults(prev =>
        prev.map(t => t.id === title.id ? title : t)
      );
    } catch (error) {
      console.error('Failed to toggle policy', error);
    }
  };

  const handleLaunchContent = (policy: Policy) => {
    if (!policy.deep_links || Object.keys(policy.deep_links).length === 0) {
      alert('No streaming link available for this content');
      return;
    }
    
    const firstLink = Object.values(policy.deep_links)[0];
    window.open(firstLink, '_blank');
  };

  const loadPolicies = async () => {
    if (!selectedProfile) return;
    
    try {
      const response = await policyApi.getProfilePolicies(selectedProfile);
      console.log('Policies response:', response.data);
      const policiesData = response.data.policies || response.data;
      console.log('Policies count:', policiesData.length);
      setPolicies(policiesData);
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

  const handleOpenReportModal = (title: Title, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedTitleForReport(title);
    setIsReportModalOpen(true);
  };

  const handleCloseReportModal = () => {
    setIsReportModalOpen(false);
    setSelectedTitleForReport(null);
  };

  const handleReportSuccess = () => {
    alert('Content report submitted successfully! Our team will review it.');
  };

  const allowedPoliciesCount = Array.isArray(policies) ? policies.filter(p => p.is_allowed).length : 0;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F77B8A] to-[#F77B8A] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full">
          <div className="text-center mb-6">
            <div className="inline-block mb-4">
              <img 
                src="/images/axolotly-logo.png" 
                alt="Axolotly" 
                className="w-24 h-24 mx-auto"
              />
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
            
            {isSignup && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device Code
                </label>
                <input
                  type="text"
                  value={deviceCode}
                  onChange={(e) => setDeviceCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent text-gray-800 uppercase tracking-wider font-mono text-center text-lg"
                  required={isSignup}
                />
                <p className="mt-2 text-xs text-gray-500">
                  Find the 6-character code on the sticker at the bottom of your Axolotly device
                </p>
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-[#F77B8A] text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105"
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
            onClick={() => router.push('/')}
            className="w-full mt-4 text-gray-600 text-sm hover:underline"
          >
            ← Back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-[#f5f5f5] border-r border-gray-200 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-200 cursor-pointer" onClick={() => router.push('/')}>
          <img 
            src="/images/axolotly-logo.png" 
            alt="Axolotly" 
            className="w-32 h-32 mx-auto hover:opacity-80 transition-opacity"
          />
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4">
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
              My Dashboard
            </h3>
            <button
              onClick={() => setActiveTab('search')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-full mb-2 transition-all ${
                activeTab === 'search'
                  ? 'bg-[#F77B8A] text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="font-medium">Search Content</span>
              <span className="text-sm">{searchResults.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('policies')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-full mb-2 transition-all ${
                activeTab === 'policies'
                  ? 'bg-[#F77B8A] text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="font-medium">Allowed Content</span>
              <span className="text-sm">{allowedPoliciesCount}</span>
            </button>
            <button
              onClick={() => setActiveTab('devices')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-full transition-all ${
                activeTab === 'devices'
                  ? 'bg-[#F77B8A] text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="font-medium">Devices</span>
              <span className="text-sm">{selectedProfile ? devices.filter(d => d.kid_profile_id === selectedProfile).length : devices.length}</span>
            </button>
          </div>
        </div>

        {/* Stats Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="bg-gray-50 rounded-xl p-4 mb-3">
            <div className="text-xs text-gray-500 mb-1">Kid Profiles</div>
            <div className="text-2xl font-bold text-gray-800">{kidProfiles.length}</div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-[#f5f5f5] border-b border-gray-200 px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-800"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">Axolotly Parent Dashboard</h1>
            
            {/* Spacer for mobile to center title */}
            <div className="w-10 md:hidden"></div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* Kid Profiles Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Kid Profiles</h2>
              {!showNewKidForm && (
                <button
                  onClick={() => setShowNewKidForm(true)}
                  className="px-4 py-2 bg-[#F77B8A] text-white rounded-full text-sm font-medium hover:shadow-lg transition-all"
                >
                  + Add Kid
                </button>
              )}
            </div>

            {showNewKidForm && (
              <form onSubmit={handleCreateKidProfile} className="mb-4 p-4 bg-white rounded-xl border border-gray-200">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Name"
                    value={newKidName}
                    onChange={(e) => setNewKidName(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-gray-800 flex-1"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Age"
                    value={newKidAge}
                    onChange={(e) => setNewKidAge(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-gray-800 w-20"
                    required
                  />
                  <button type="submit" className="px-6 py-2 bg-[#F77B8A] text-white rounded-lg text-sm font-medium">
                    Create
                  </button>
                  <button type="button" onClick={() => setShowNewKidForm(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {kidProfiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => setSelectedProfile(profile.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedProfile === profile.id
                      ? 'border-[#F77B8A] bg-pink-50'
                      : 'border-gray-200 bg-white hover:border-[#F77B8A]/30'
                  }`}
                >
                  <div className="text-3xl mb-2">👤</div>
                  <div className="font-semibold text-gray-800 text-sm">{profile.name}</div>
                  <div className="text-xs text-gray-600">Age {profile.age}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Add Device Section */}
          {kidProfiles.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Devices</h2>
                {!showAddDeviceForm && (
                  <button
                    onClick={() => setShowAddDeviceForm(true)}
                    className="px-4 py-2 bg-[#F77B8A] text-white rounded-full text-sm font-medium hover:shadow-lg transition-all"
                  >
                    + Add Device
                  </button>
                )}
              </div>

              {showAddDeviceForm && (
                <form onSubmit={handlePairDevice} className="mb-4 p-6 bg-white rounded-xl border border-gray-200">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Kid Profile
                    </label>
                    <select
                      value={selectedKidForDevice || ''}
                      onChange={(e) => setSelectedKidForDevice(parseInt(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-800"
                      required
                    >
                      <option value="">Choose a kid...</option>
                      {kidProfiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.name} (Age {profile.age})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pairing Code
                    </label>
                    <input
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={pairingCode}
                      onChange={(e) => setPairingCode(e.target.value)}
                      maxLength={6}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-800 font-mono text-center text-2xl tracking-widest"
                      required
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Enter the 6-digit pairing code shown on your Axolotly launcher device
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      type="submit" 
                      className="px-6 py-2 bg-[#F77B8A] text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
                    >
                      Pair Device
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowAddDeviceForm(false);
                        setPairingCode('');
                        setSelectedKidForDevice(null);
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Content Section */}
          {selectedProfile && (
            <div>
              {activeTab === 'search' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Search Titles</h2>
                  <form onSubmit={handleSearch} className="mb-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search movies and TV shows..."
                        className="flex-1 px-6 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent text-gray-800 bg-white"
                      />
                      <button
                        type="submit"
                        className="px-8 py-3 bg-[#F77B8A] text-white rounded-xl hover:shadow-lg transition-all font-medium"
                      >
                        Search
                      </button>
                    </div>
                  </form>

                  {searchResults.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {searchResults.map((title) => (
                        <div 
                          key={title.id} 
                          className="group relative"
                          onContextMenu={(e) => handleOpenReportModal(title, e)}
                        >
                          {title.poster_path && (
                            <img
                              src={title.poster_path}
                              alt={title.title}
                              className="w-full aspect-[2/3] object-cover rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer"
                            />
                          )}
                          <button
                            onClick={() => handleTogglePolicy(title, getTitleStatus(title.id))}
                            className={`mt-2 w-full py-2 rounded-lg text-sm font-semibold transition-all ${
                              getTitleStatus(title.id)
                                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {getTitleStatus(title.id) ? '✓ Allowed' : '+ Allow'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenReportModal(title);
                            }}
                            className="mt-1 w-full py-1 rounded-lg text-xs bg-orange-100 text-orange-600 hover:bg-orange-200 transition-all"
                          >
                            📝 Report Content
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="text-gray-400 text-6xl mb-4">🔍</div>
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No results found</h3>
                      <p className="text-sm text-gray-500">Search for movies and TV shows to add to your kid&apos;s library</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'policies' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Allowed Content ({allowedPoliciesCount})
                  </h2>
                  
                  {allowedPoliciesCount > 0 && (
                    <div className="mb-6">
                      <input
                        type="text"
                        value={policySearchQuery}
                        onChange={(e) => setPolicySearchQuery(e.target.value)}
                        placeholder="Search allowed content..."
                        className="w-full px-6 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent text-gray-800 bg-white"
                      />
                    </div>
                  )}
                  
                  {(() => {
                    const filteredPolicies = policies
                      .filter(p => p.is_allowed)
                      .filter(p => 
                        policySearchQuery.trim() === '' || 
                        p.title.toLowerCase().includes(policySearchQuery.toLowerCase())
                      );
                    
                    if (allowedPoliciesCount === 0) {
                      return (
                        <div className="text-center py-16">
                          <div className="text-gray-400 text-6xl mb-4">📺</div>
                          <h3 className="text-lg font-semibold text-gray-600 mb-2">No allowed content</h3>
                          <p className="text-sm text-gray-500">Search and add content for your kids to watch</p>
                        </div>
                      );
                    }
                    
                    if (filteredPolicies.length === 0) {
                      return (
                        <div className="text-center py-16">
                          <div className="text-gray-400 text-6xl mb-4">🔍</div>
                          <h3 className="text-lg font-semibold text-gray-600 mb-2">No matches found</h3>
                          <p className="text-sm text-gray-500">Try a different search term</p>
                        </div>
                      );
                    }
                    
                    // Group policies by streaming service
                    const providerGroups: { [key: string]: typeof filteredPolicies } = {};
                    const unknownProvider: typeof filteredPolicies = [];
                    
                    filteredPolicies.forEach(policy => {
                      if (policy.providers && policy.providers.length > 0) {
                        policy.providers.forEach(provider => {
                          if (!providerGroups[provider]) {
                            providerGroups[provider] = [];
                          }
                          if (!providerGroups[provider].find(p => p.policy_id === policy.policy_id)) {
                            providerGroups[provider].push(policy);
                          }
                        });
                      } else {
                        unknownProvider.push(policy);
                      }
                    });
                    
                    // Provider display names
                    const providerInfo: { [key: string]: { name: string } } = {
                      'netflix': { name: 'Netflix' },
                      'disney_plus': { name: 'Disney+' },
                      'hulu': { name: 'Hulu' },
                      'prime_video': { name: 'Prime Video' },
                      'peacock': { name: 'Peacock' },
                      'youtube': { name: 'YouTube' }
                    };
                    
                    return (
                      <div className="space-y-8">
                        {Object.keys(providerGroups).sort().map(provider => {
                          const info = providerInfo[provider] || { name: provider };
                          return (
                            <div key={provider}>
                              <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <span>{info.name}</span>
                                <span className="text-sm font-normal text-gray-500">({providerGroups[provider].length})</span>
                              </h3>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {providerGroups[provider].map((policy) => (
                                  <div key={`${provider}-${policy.policy_id}`} className="group relative">
                                    {policy.poster_path && (
                                      <img
                                        src={policy.poster_path}
                                        alt={policy.title}
                                        onClick={() => handleLaunchContent(policy)}
                                        className="w-full aspect-[2/3] object-cover rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer hover:scale-105"
                                      />
                                    )}
                                    <button
                                      onClick={() => handleTogglePolicy(
                                        { id: policy.title_id, title: policy.title, media_type: '', rating: '', poster_path: policy.poster_path },
                                        true
                                      )}
                                      className="mt-2 w-full py-2 rounded-lg text-sm font-semibold transition-all bg-red-100 text-red-600 hover:bg-red-200"
                                    >
                                      ✕ Remove
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                        
                        {unknownProvider.length > 0 && (
                          <div>
                            <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                              <span>Other</span>
                              <span className="text-sm font-normal text-gray-500">({unknownProvider.length})</span>
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                              {unknownProvider.map((policy) => (
                                <div key={policy.policy_id} className="group relative">
                                  {policy.poster_path && (
                                    <img
                                      src={policy.poster_path}
                                      alt={policy.title}
                                      onClick={() => handleLaunchContent(policy)}
                                      className="w-full aspect-[2/3] object-cover rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer hover:scale-105"
                                    />
                                  )}
                                  <button
                                    onClick={() => handleTogglePolicy(
                                      { id: policy.title_id, title: policy.title, media_type: '', rating: '', poster_path: policy.poster_path },
                                      true
                                    )}
                                    className="mt-2 w-full py-2 rounded-lg text-sm font-semibold transition-all bg-red-100 text-red-600 hover:bg-red-200"
                                  >
                                    ✕ Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {activeTab === 'devices' && selectedProfile && (
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Paired Devices ({devices.filter(d => d.kid_profile_id === selectedProfile).length})
                  </h2>
                  
                  {(() => {
                    const profileDevices = devices.filter(d => d.kid_profile_id === selectedProfile);
                    
                    if (profileDevices.length === 0) {
                      return (
                        <div className="text-center py-16">
                          <div className="text-gray-400 text-6xl mb-4">📱</div>
                          <h3 className="text-lg font-semibold text-gray-600 mb-2">No devices paired</h3>
                          <p className="text-sm text-gray-500">Add a device using the &quot;Add Device&quot; button above</p>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profileDevices.map((device) => (
                        <div key={device.id} className="p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-[#F77B8A]/30 transition-all">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              {editingDeviceId === device.id ? (
                                <input
                                  type="text"
                                  value={editingDeviceName}
                                  onChange={(e) => setEditingDeviceName(e.target.value)}
                                  onBlur={() => {
                                    if (editingDeviceName.trim()) {
                                      handleUpdateDeviceName(device.id, editingDeviceName);
                                    } else {
                                      setEditingDeviceId(null);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && editingDeviceName.trim()) {
                                      handleUpdateDeviceName(device.id, editingDeviceName);
                                    } else if (e.key === 'Escape') {
                                      setEditingDeviceId(null);
                                    }
                                  }}
                                  autoFocus
                                  className="text-lg font-semibold text-gray-800 border-b-2 border-[#F77B8A] focus:outline-none w-full"
                                />
                              ) : (
                                <h3 className="text-lg font-semibold text-gray-800">{device.device_name}</h3>
                              )}
                              <p className="text-sm text-gray-600 mt-1">Linked to: {device.kid_profile_name}</p>
                            </div>
                            <button
                              onClick={() => {
                                setEditingDeviceId(device.id);
                                setEditingDeviceName(device.device_name);
                              }}
                              className="ml-4 px-3 py-1 text-sm text-[#F77B8A] hover:bg-pink-50 rounded-lg transition-all"
                            >
                              Rename
                            </button>
                          </div>
                          
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Device ID:</span>
                              <span className="font-mono text-xs">{device.device_id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Paired:</span>
                              <span>{device.created_at ? new Date(device.created_at).toLocaleDateString() : 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Last Active:</span>
                              <span>{device.last_active ? new Date(device.last_active).toLocaleString() : 'Never'}</span>
                            </div>
                          </div>
                        </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {!selectedProfile && (
            <div className="text-center py-16">
              <div className="text-gray-400 text-6xl mb-4">👤</div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Select a kid profile</h3>
              <p className="text-sm text-gray-500">Choose a profile above to manage their content and devices</p>
            </div>
          )}
        </div>
      </div>

      <ContentReportModal
        isOpen={isReportModalOpen}
        title={selectedTitleForReport}
        onClose={handleCloseReportModal}
        onSubmitSuccess={handleReportSuccess}
      />
    </div>
  );
}
