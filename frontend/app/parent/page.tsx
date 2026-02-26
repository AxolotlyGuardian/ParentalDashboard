'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, catalogApi, policyApi, deviceApi, timeLimitsApi, usageStatsApi } from '@/lib/api';
import { setToken, getUserFromToken, removeToken } from '@/lib/auth';
import ContentReportModal from '@/components/ContentReportModal';
import ContentActionModal from '@/components/ContentActionModal';
import ConfirmModal from '@/components/ConfirmModal';
import ServiceSelection from '@/components/ServiceSelection';
import { PairedDevice, ApiError, TimeLimits, ParentUsageStats } from '@/lib/types';
import { Policy } from '@/types/policy';

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
  providers?: string[];
}

const getProviderBadge = (provider: string) => {
  const providerStyles: { [key: string]: { bg: string; text: string; label: string } } = {
    'netflix': { bg: 'bg-red-600', text: 'text-white', label: 'Netflix' },
    'disney_plus': { bg: 'bg-blue-600', text: 'text-white', label: 'Disney+' },
    'hulu': { bg: 'bg-green-500', text: 'text-white', label: 'Hulu' },
    'prime_video': { bg: 'bg-cyan-600', text: 'text-white', label: 'Prime' },
    'peacock': { bg: 'bg-yellow-500', text: 'text-black', label: 'Peacock' },
    'youtube': { bg: 'bg-red-500', text: 'text-white', label: 'YouTube' },
    'max': { bg: 'bg-purple-600', text: 'text-white', label: 'Max' },
  };
  return providerStyles[provider.toLowerCase()] || { bg: 'bg-gray-500', text: 'text-white', label: provider };
};

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
  const [policySearchQuery, setPolicySearchQuery] = useState('');
  const [newKidName, setNewKidName] = useState('');
  const [newKidAge, setNewKidAge] = useState('');
  const [showNewKidForm, setShowNewKidForm] = useState(false);
  const [showAddDeviceForm, setShowAddDeviceForm] = useState(false);
  const [pairingCode, setPairingCode] = useState('');
  const [selectedKidForDevice, setSelectedKidForDevice] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'policies' | 'devices' | 'services' | 'timelimits' | 'usage'>('policies');
  const [devices, setDevices] = useState<PairedDevice[]>([]);
  const [editingDeviceId, setEditingDeviceId] = useState<number | null>(null);
  const [editingDeviceName, setEditingDeviceName] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedTitleForReport, setSelectedTitleForReport] = useState<Title | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deviceToRepair, setDeviceToRepair] = useState<{ id: number; name: string } | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedContentForAction, setSelectedContentForAction] = useState<Policy | null>(null);

  // Kid profile edit/delete state
  const [editingProfileId, setEditingProfileId] = useState<number | null>(null);
  const [editingProfileName, setEditingProfileName] = useState('');
  const [editingProfileAge, setEditingProfileAge] = useState('');
  const [profileToDelete, setProfileToDelete] = useState<{ id: number; name: string } | null>(null);
  const [isDeleteProfileModalOpen, setIsDeleteProfileModalOpen] = useState(false);

  // Time limits state
  const [timeLimits, setTimeLimits] = useState<TimeLimits>({ id: null, dailyLimitMinutes: null, bedtimeStart: null, bedtimeEnd: null, scheduleEnabled: false });
  const [editingTimeLimits, setEditingTimeLimits] = useState(false);
  const [tlDailyMinutes, setTlDailyMinutes] = useState('');
  const [tlBedtimeStart, setTlBedtimeStart] = useState('');
  const [tlBedtimeEnd, setTlBedtimeEnd] = useState('');
  const [tlScheduleEnabled, setTlScheduleEnabled] = useState(false);

  // Usage stats state
  const [usageStats, setUsageStats] = useState<ParentUsageStats | null>(null);

  useEffect(() => {
    const user = getUserFromToken();
    if (user && user.role === 'parent') {
      setIsLoggedIn(true);
      setUserId(parseInt(user.sub));
      loadKidProfiles(parseInt(user.sub));
      loadDevices();
      loadTimeLimits();
      loadUsageStats();
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

  const loadTimeLimits = async () => {
    try {
      const response = await timeLimitsApi.get();
      setTimeLimits(response.data);
    } catch (error) {
      console.error('Failed to load time limits', error);
    }
  };

  const loadUsageStats = async () => {
    try {
      const response = await usageStatsApi.get();
      setUsageStats(response.data);
    } catch (error) {
      console.error('Failed to load usage stats', error);
    }
  };

  const handleUpdateProfile = async (profileId: number) => {
    try {
      const data: { name?: string; age?: number } = {};
      if (editingProfileName.trim()) data.name = editingProfileName.trim();
      if (editingProfileAge) data.age = parseInt(editingProfileAge);
      await authApi.updateKidProfile(profileId, data);
      setEditingProfileId(null);
      if (userId) loadKidProfiles(userId);
    } catch (error) {
      const errorMessage = (error as ApiError).response?.data?.detail || 'Failed to update profile';
      alert(errorMessage);
    }
  };

  const handleDeleteProfile = async () => {
    if (!profileToDelete) return;
    setIsDeleteProfileModalOpen(false);
    try {
      await authApi.deleteKidProfile(profileToDelete.id);
      if (selectedProfile === profileToDelete.id) {
        setSelectedProfile(null);
        setPolicies([]);
      }
      if (userId) {
        loadKidProfiles(userId);
        loadDevices();
      }
    } catch (error) {
      const errorMessage = (error as ApiError).response?.data?.detail || 'Failed to delete profile';
      alert(errorMessage);
    } finally {
      setProfileToDelete(null);
    }
  };

  const handleSaveTimeLimits = async () => {
    try {
      const response = await timeLimitsApi.upsert({
        dailyLimitMinutes: tlDailyMinutes ? parseInt(tlDailyMinutes) : null,
        bedtimeStart: tlBedtimeStart || null,
        bedtimeEnd: tlBedtimeEnd || null,
        scheduleEnabled: tlScheduleEnabled,
      });
      setTimeLimits(response.data);
      setEditingTimeLimits(false);
    } catch (error) {
      const errorMessage = (error as ApiError).response?.data?.detail || 'Failed to save time limits';
      alert(errorMessage);
    }
  };

  const handleReassignDevice = async (deviceId: number, kidProfileId: number | null) => {
    try {
      await deviceApi.reassignProfile(deviceId, kidProfileId);
      loadDevices();
    } catch (error) {
      const errorMessage = (error as ApiError).response?.data?.detail || 'Failed to reassign device';
      alert(errorMessage);
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
      
      // Small delay to ensure token is saved to localStorage
      await new Promise(resolve => setTimeout(resolve, 100));
      loadKidProfiles(response.data.user_id);
      loadDevices();
      loadTimeLimits();
      loadUsageStats();
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

  const handleRepairDevice = (deviceId: number, deviceName: string) => {
    setDeviceToRepair({ id: deviceId, name: deviceName });
    setIsConfirmModalOpen(true);
  };

  const confirmRepairDevice = async () => {
    if (!deviceToRepair) return;
    
    setIsConfirmModalOpen(false);
    
    try {
      await deviceApi.deleteDevice(deviceToRepair.id);
      await loadDevices();
      alert('Device removed. It can now be paired again using the "Add Device" button.');
    } catch (error) {
      const errorMessage = (error as ApiError).response?.data?.detail || 'Failed to remove device';
      alert(errorMessage);
    } finally {
      setDeviceToRepair(null);
    }
  };

  const cancelRepairDevice = () => {
    setIsConfirmModalOpen(false);
    setDeviceToRepair(null);
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

  const handleContentClick = (policy: Policy) => {
    setSelectedContentForAction(policy);
    setIsActionModalOpen(true);
  };

  const launchPolicy = (policy: Policy) => {
    if (!policy.deep_links || Object.keys(policy.deep_links).length === 0) {
      alert('No streaming link available for this content');
      return;
    }
    
    const firstLink = Object.values(policy.deep_links)[0];
    window.open(firstLink, '_blank');
  };

  const handleLaunchContent = (policy: Policy) => {
    launchPolicy(policy);
  };

  const handleCloseActionModal = () => {
    setIsActionModalOpen(false);
    setSelectedContentForAction(null);
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
      <div className="min-h-screen bg-gradient-to-br from-[#F77B8A] via-[#f8909e] to-[#e8697a] flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.15)] max-w-md w-full border border-white/50 hover:shadow-[0_24px_68px_rgba(0,0,0,0.2)] transition-shadow duration-500">
          <div className="text-center mb-6">
            <div className="inline-block mb-4">
              <img 
                src="/images/axolotly-logo.png" 
                alt="Axolotly" 
                className="w-24 h-24 mx-auto drop-shadow-xl hover:scale-110 transition-transform duration-300"
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
                className="w-full px-4 py-3.5 border border-gray-200/50 rounded-2xl focus:ring-2 focus:ring-pink-300 focus:border-transparent text-gray-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all"
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
                className="w-full px-4 py-3.5 border border-gray-200/50 rounded-2xl focus:ring-2 focus:ring-pink-300 focus:border-transparent text-gray-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-[#F77B8A] text-white py-3.5 rounded-2xl font-semibold hover:shadow-[0_8px_24px_rgba(247,123,138,0.45)] transition-all duration-200 transform hover:scale-[1.02]"
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
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.06)]
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-200/50 cursor-pointer group" onClick={() => router.push('/')}>
          <img 
            src="/images/axolotly-logo.png" 
            alt="Axolotly" 
            className="w-32 h-32 mx-auto group-hover:scale-105 transition-transform duration-300 drop-shadow-lg"
          />
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4">
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
              My Dashboard
            </h3>
            <button
              onClick={() => {
                setActiveTab('search');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-full mb-2 transition-all duration-200 ${
                activeTab === 'search'
                  ? 'bg-[#F77B8A] text-white shadow-[0_4px_14px_rgba(247,123,138,0.4)] scale-[1.02]'
                  : 'text-gray-700 hover:bg-white hover:shadow-md hover:scale-[1.02]'
              }`}
            >
              <span className="font-medium">Search Content</span>
              <span className="text-sm">{searchResults.length}</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('policies');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-full mb-2 transition-all duration-200 ${
                activeTab === 'policies'
                  ? 'bg-[#F77B8A] text-white shadow-[0_4px_14px_rgba(247,123,138,0.4)] scale-[1.02]'
                  : 'text-gray-700 hover:bg-white hover:shadow-md hover:scale-[1.02]'
              }`}
            >
              <span className="font-medium">Allowed Content</span>
              <span className="text-sm">{allowedPoliciesCount}</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('devices');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-full mb-2 transition-all duration-200 ${
                activeTab === 'devices'
                  ? 'bg-[#F77B8A] text-white shadow-[0_4px_14px_rgba(247,123,138,0.4)] scale-[1.02]'
                  : 'text-gray-700 hover:bg-white hover:shadow-md hover:scale-[1.02]'
              }`}
            >
              <span className="font-medium">Devices</span>
              <span className="text-sm">{selectedProfile ? devices.filter(d => d.kid_profile_id === selectedProfile).length : devices.length}</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('timelimits');
                setIsMobileMenuOpen(false);
                loadTimeLimits();
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-full mb-2 transition-all duration-200 ${
                activeTab === 'timelimits'
                  ? 'bg-[#F77B8A] text-white shadow-[0_4px_14px_rgba(247,123,138,0.4)] scale-[1.02]'
                  : 'text-gray-700 hover:bg-white hover:shadow-md hover:scale-[1.02]'
              }`}
            >
              <span className="font-medium">Time Limits</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('usage');
                setIsMobileMenuOpen(false);
                loadUsageStats();
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-full mb-2 transition-all duration-200 ${
                activeTab === 'usage'
                  ? 'bg-[#F77B8A] text-white shadow-[0_4px_14px_rgba(247,123,138,0.4)] scale-[1.02]'
                  : 'text-gray-700 hover:bg-white hover:shadow-md hover:scale-[1.02]'
              }`}
            >
              <span className="font-medium">Usage Stats</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('services');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-full transition-all duration-200 ${
                activeTab === 'services'
                  ? 'bg-[#F77B8A] text-white shadow-[0_4px_14px_rgba(247,123,138,0.4)] scale-[1.02]'
                  : 'text-gray-700 hover:bg-white hover:shadow-md hover:scale-[1.02]'
              }`}
            >
              <span className="font-medium">My Services</span>
            </button>
          </div>
        </div>

        {/* Stats Footer */}
        <div className="p-4 border-t border-gray-200/50">
          <div className="bg-gradient-to-br from-pink-50 to-white rounded-2xl p-4 mb-3 shadow-[0_2px_8px_rgba(247,123,138,0.12)] border border-pink-100/50">
            <div className="text-xs text-gray-500 mb-1">Kid Profiles</div>
            <div className="text-2xl font-bold text-gray-800">{kidProfiles.length}</div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-white rounded-xl transition-all duration-200"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white/70 backdrop-blur-xl border-b border-gray-200/50 px-4 md:px-8 py-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-xl transition-all"
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
                  className="px-5 py-2.5 bg-[#F77B8A] text-white rounded-full text-sm font-medium hover:shadow-[0_6px_20px_rgba(247,123,138,0.4)] hover:scale-105 transition-all duration-200"
                >
                  + Add Kid
                </button>
              )}
            </div>

            {showNewKidForm && (
              <form onSubmit={handleCreateKidProfile} className="mb-4 p-5 bg-white rounded-2xl border border-gray-200/50 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Name"
                    value={newKidName}
                    onChange={(e) => setNewKidName(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800 flex-1 focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Age"
                    value={newKidAge}
                    onChange={(e) => setNewKidAge(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800 w-20 focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all"
                    required
                  />
                  <button type="submit" className="px-6 py-2.5 bg-[#F77B8A] text-white rounded-xl text-sm font-medium hover:shadow-[0_4px_14px_rgba(247,123,138,0.4)] hover:scale-105 transition-all duration-200">
                    Create
                  </button>
                  <button type="button" onClick={() => setShowNewKidForm(false)} className="px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" style={{ perspective: '800px' }}>
              {kidProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className={`relative p-5 rounded-2xl border-2 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] ${
                    selectedProfile === profile.id
                      ? 'border-[#F77B8A] bg-gradient-to-br from-pink-50 to-white shadow-[0_8px_24px_rgba(247,123,138,0.25)] scale-[1.02]'
                      : 'border-gray-200/50 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:border-[#F77B8A]/40 hover:shadow-[0_8px_24px_rgba(247,123,138,0.2)]'
                  }`}
                >
                  {editingProfileId === profile.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editingProfileName}
                        onChange={(e) => setEditingProfileName(e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                        placeholder="Name"
                        autoFocus
                      />
                      <input
                        type="number"
                        value={editingProfileAge}
                        onChange={(e) => setEditingProfileAge(e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                        placeholder="Age"
                        min={1}
                        max={17}
                      />
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleUpdateProfile(profile.id)}
                          className="flex-1 px-3 py-1.5 bg-[#F77B8A] text-white rounded-lg text-xs font-medium hover:shadow-md transition-all"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingProfileId(null)}
                          className="px-3 py-1.5 text-gray-500 hover:text-gray-700 rounded-lg text-xs transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => setSelectedProfile(profile.id)}
                        className="w-full text-left"
                      >
                        <div className="text-3xl mb-2">👤</div>
                        <div className="font-semibold text-gray-800 text-sm">{profile.name}</div>
                        <div className="text-xs text-gray-600">Age {profile.age}</div>
                      </button>
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 hover:opacity-100"
                        style={{ opacity: selectedProfile === profile.id ? 1 : undefined }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProfileId(profile.id);
                            setEditingProfileName(profile.name);
                            setEditingProfileAge(String(profile.age));
                          }}
                          className="p-1.5 text-gray-400 hover:text-[#F77B8A] hover:bg-pink-50 rounded-lg transition-all text-xs"
                          title="Edit profile"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setProfileToDelete({ id: profile.id, name: profile.name });
                            setIsDeleteProfileModalOpen(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all text-xs"
                          title="Delete profile"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add Device Section - Only show on Devices tab */}
          {kidProfiles.length > 0 && activeTab === 'devices' && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Devices</h2>
                {!showAddDeviceForm && (
                  <button
                    onClick={() => setShowAddDeviceForm(true)}
                    className="px-5 py-2.5 bg-[#F77B8A] text-white rounded-full text-sm font-medium hover:shadow-[0_6px_20px_rgba(247,123,138,0.4)] hover:scale-105 transition-all duration-200"
                  >
                    + Add Device
                  </button>
                )}
              </div>

              {showAddDeviceForm && (
                <form onSubmit={handlePairDevice} className="mb-4 p-6 bg-white rounded-2xl border border-gray-200/50 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
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
                      <option value="">Select a profile...</option>
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
                      Enter the 6-digit code displayed on your Axolotly launcher device
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
                        className="flex-1 px-6 py-3.5 border border-gray-200/50 rounded-2xl focus:ring-2 focus:ring-pink-300 focus:border-transparent text-gray-800 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all"
                      />
                      <button
                        type="submit"
                        className="px-8 py-3.5 bg-[#F77B8A] text-white rounded-2xl hover:shadow-[0_6px_20px_rgba(247,123,138,0.4)] hover:scale-105 transition-all duration-200 font-medium"
                      >
                        Search
                      </button>
                    </div>
                  </form>

                  {searchResults.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4" style={{ perspective: '1200px' }}>
                      {searchResults.map((title) => (
                        <div 
                          key={title.id} 
                          className="group relative"
                          onContextMenu={(e) => handleOpenReportModal(title, e)}
                        >
                          <div className="relative transition-all duration-300 ease-out group-hover:-translate-y-2 group-hover:scale-105" style={{ transformStyle: 'preserve-3d' }}>
                            {title.poster_path && (
                              <img
                                src={title.poster_path}
                                alt={title.title}
                                className="w-full aspect-[2/3] object-cover rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.15)] group-hover:shadow-[0_12px_28px_rgba(247,123,138,0.35)] transition-all duration-300 cursor-pointer ring-1 ring-white/10 group-hover:ring-2 group-hover:ring-[#F77B8A]/40"
                              />
                            )}
                            {title.providers && title.providers.length > 0 && (
                              <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                                {title.providers.slice(0, 2).map((provider, idx) => {
                                  const badge = getProviderBadge(provider);
                                  return (
                                    <span
                                      key={idx}
                                      className={`${badge.bg} ${badge.text} text-[10px] px-1.5 py-0.5 rounded font-medium shadow-sm`}
                                    >
                                      {badge.label}
                                    </span>
                                  );
                                })}
                                {title.providers.length > 2 && (
                                  <span className="bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded font-medium shadow-sm">
                                    +{title.providers.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
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
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4" style={{ perspective: '1200px' }}>
                                {providerGroups[provider].map((policy) => (
                                  <div key={`${provider}-${policy.policy_id}`} className="group relative">
                                    <div className="transition-all duration-300 ease-out group-hover:-translate-y-2 group-hover:scale-105" style={{ transformStyle: 'preserve-3d' }}>
                                    {policy.poster_path && (
                                      <img
                                        src={policy.poster_path}
                                        alt={policy.title}
                                        onClick={() => handleContentClick(policy)}
                                        className="w-full aspect-[2/3] object-cover rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.15)] group-hover:shadow-[0_12px_28px_rgba(247,123,138,0.35)] transition-all duration-300 cursor-pointer ring-1 ring-white/10 group-hover:ring-2 group-hover:ring-[#F77B8A]/40"
                                      />
                                    )}
                                    </div>
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
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4" style={{ perspective: '1200px' }}>
                              {unknownProvider.map((policy) => (
                                <div key={policy.policy_id} className="group relative">
                                  <div className="transition-all duration-300 ease-out group-hover:-translate-y-2 group-hover:scale-105" style={{ transformStyle: 'preserve-3d' }}>
                                  {policy.poster_path && (
                                    <img
                                      src={policy.poster_path}
                                      alt={policy.title}
                                      onClick={() => handleContentClick(policy)}
                                      className="w-full aspect-[2/3] object-cover rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.15)] group-hover:shadow-[0_12px_28px_rgba(247,123,138,0.35)] transition-all duration-300 cursor-pointer ring-1 ring-white/10 group-hover:ring-2 group-hover:ring-[#F77B8A]/40"
                                    />
                                  )}
                                  </div>
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
                        <div className="text-center py-16 bg-white/50 rounded-3xl border border-gray-200/30 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                          <div className="text-gray-400 text-6xl mb-4">📱</div>
                          <h3 className="text-lg font-semibold text-gray-600 mb-2">No devices paired</h3>
                          <p className="text-sm text-gray-500">Add a device using the &quot;Add Device&quot; button above</p>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ perspective: '800px' }}>
                        {profileDevices.map((device) => (
                        <div key={device.id} className="p-6 bg-white rounded-2xl border border-gray-200/50 shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_28px_rgba(247,123,138,0.2)] hover:-translate-y-1 hover:border-[#F77B8A]/30 transition-all duration-300">
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
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-gray-500">Linked to:</span>
                                <select
                                  value={device.kid_profile_id || ''}
                                  onChange={(e) => {
                                    const val = e.target.value ? parseInt(e.target.value) : null;
                                    handleReassignDevice(device.id, val);
                                  }}
                                  className="text-sm text-gray-700 border border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                                >
                                  <option value="">Unassigned</option>
                                  {kidProfiles.map((kp) => (
                                    <option key={kp.id} value={kp.id}>{kp.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingDeviceId(device.id);
                                  setEditingDeviceName(device.device_name);
                                }}
                                className="px-3 py-1 text-sm text-[#F77B8A] hover:bg-pink-50 rounded-lg transition-all"
                              >
                                Rename
                              </button>
                              <button
                                onClick={() => handleRepairDevice(device.id, device.device_name)}
                                className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Remove this device so it can be paired again"
                              >
                                Re-pair
                              </button>
                            </div>
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

          {/* Family-wide tabs (no profile selection needed) */}
          {activeTab === 'timelimits' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Screen Time Limits</h2>
                {!editingTimeLimits && (
                  <button
                    onClick={() => {
                      setTlDailyMinutes(timeLimits.dailyLimitMinutes !== null ? String(timeLimits.dailyLimitMinutes) : '');
                      setTlBedtimeStart(timeLimits.bedtimeStart || '');
                      setTlBedtimeEnd(timeLimits.bedtimeEnd || '');
                      setTlScheduleEnabled(timeLimits.scheduleEnabled);
                      setEditingTimeLimits(true);
                    }}
                    className="px-5 py-2.5 bg-[#F77B8A] text-white rounded-full text-sm font-medium hover:shadow-[0_6px_20px_rgba(247,123,138,0.4)] hover:scale-105 transition-all duration-200"
                  >
                    Edit Limits
                  </button>
                )}
              </div>

              {editingTimeLimits ? (
                <div className="p-6 bg-white rounded-2xl border border-gray-200/50 shadow-[0_4px_16px_rgba(0,0,0,0.06)] space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Daily Screen Time (minutes)</label>
                    <input
                      type="number"
                      value={tlDailyMinutes}
                      onChange={(e) => setTlDailyMinutes(e.target.value)}
                      placeholder="e.g. 120"
                      min={0}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bedtime Start</label>
                      <input
                        type="time"
                        value={tlBedtimeStart}
                        onChange={(e) => setTlBedtimeStart(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bedtime End</label>
                      <input
                        type="time"
                        value={tlBedtimeEnd}
                        onChange={(e) => setTlBedtimeEnd(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setTlScheduleEnabled(!tlScheduleEnabled)}
                      className={`relative w-12 h-6 rounded-full transition-all duration-200 ${tlScheduleEnabled ? 'bg-[#F77B8A]' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${tlScheduleEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                    <span className="text-sm text-gray-700 font-medium">Enforce schedule on devices</span>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSaveTimeLimits}
                      className="px-6 py-2.5 bg-[#F77B8A] text-white rounded-xl text-sm font-medium hover:shadow-[0_4px_14px_rgba(247,123,138,0.4)] hover:scale-105 transition-all duration-200"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingTimeLimits(false)}
                      className="px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-6 bg-white rounded-2xl border border-gray-200/50 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                    <div className="text-sm text-gray-500 mb-1">Daily Limit</div>
                    <div className="text-2xl font-bold text-gray-800">
                      {timeLimits.dailyLimitMinutes !== null ? `${timeLimits.dailyLimitMinutes} min` : 'Unlimited'}
                    </div>
                    {timeLimits.dailyLimitMinutes !== null && (
                      <div className="text-xs text-gray-500 mt-1">
                        {Math.floor(timeLimits.dailyLimitMinutes / 60)}h {timeLimits.dailyLimitMinutes % 60}m per day
                      </div>
                    )}
                  </div>
                  <div className="p-6 bg-white rounded-2xl border border-gray-200/50 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                    <div className="text-sm text-gray-500 mb-1">Bedtime</div>
                    <div className="text-2xl font-bold text-gray-800">
                      {timeLimits.bedtimeStart && timeLimits.bedtimeEnd
                        ? `${timeLimits.bedtimeStart} - ${timeLimits.bedtimeEnd}`
                        : 'Not set'}
                    </div>
                  </div>
                  <div className="p-6 bg-white rounded-2xl border border-gray-200/50 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                    <div className="text-sm text-gray-500 mb-1">Schedule</div>
                    <div className={`text-2xl font-bold ${timeLimits.scheduleEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                      {timeLimits.scheduleEnabled ? 'Active' : 'Off'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {timeLimits.scheduleEnabled ? 'Enforced on all devices' : 'Devices unrestricted'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'usage' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Usage Statistics</h2>
                <button
                  onClick={loadUsageStats}
                  className="px-5 py-2.5 bg-[#F77B8A] text-white rounded-full text-sm font-medium hover:shadow-[0_6px_20px_rgba(247,123,138,0.4)] hover:scale-105 transition-all duration-200"
                >
                  Refresh
                </button>
              </div>

              {usageStats ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-6 bg-white rounded-2xl border border-gray-200/50 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                      <div className="text-sm text-gray-500 mb-1">Time Used Today</div>
                      <div className="text-2xl font-bold text-gray-800">
                        {Math.floor(usageStats.totalTimeToday / 60)}h {usageStats.totalTimeToday % 60}m
                      </div>
                    </div>
                    <div className="p-6 bg-white rounded-2xl border border-gray-200/50 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                      <div className="text-sm text-gray-500 mb-1">Daily Limit</div>
                      <div className="text-2xl font-bold text-gray-800">
                        {usageStats.dailyLimitMinutes !== null
                          ? `${Math.floor(usageStats.dailyLimitMinutes / 60)}h ${usageStats.dailyLimitMinutes % 60}m`
                          : 'Unlimited'}
                      </div>
                    </div>
                    <div className="p-6 bg-white rounded-2xl border border-gray-200/50 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                      <div className="text-sm text-gray-500 mb-1">Time Remaining</div>
                      <div className={`text-2xl font-bold ${
                        usageStats.timeRemainingToday !== null && usageStats.timeRemainingToday <= 15
                          ? 'text-red-500'
                          : usageStats.timeRemainingToday !== null && usageStats.timeRemainingToday <= 30
                          ? 'text-orange-500'
                          : 'text-green-600'
                      }`}>
                        {usageStats.timeRemainingToday !== null
                          ? `${Math.floor(usageStats.timeRemainingToday / 60)}h ${usageStats.timeRemainingToday % 60}m`
                          : 'N/A'}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-700 mb-3">Per-Device Breakdown</h3>
                  {usageStats.devices.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {usageStats.devices.map((dev) => (
                        <div key={dev.device_id} className="p-6 bg-white rounded-2xl border border-gray-200/50 shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_28px_rgba(247,123,138,0.2)] hover:-translate-y-1 transition-all duration-300">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-800">{dev.device_name}</h4>
                              <p className="text-sm text-gray-500">{dev.kid_name}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-800">{dev.timeUsedToday}m</div>
                              <div className="text-xs text-gray-500">today</div>
                            </div>
                          </div>
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Most Used:</span>
                              <span>{dev.mostUsedApp || 'None'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Last Active:</span>
                              <span>{dev.lastActive ? new Date(dev.lastActive).toLocaleString() : 'Never'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white/50 rounded-3xl border border-gray-200/30">
                      <div className="text-gray-400 text-5xl mb-3">📊</div>
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No device usage data</h3>
                      <p className="text-sm text-gray-500">Usage will appear once devices are active</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16 bg-white/50 rounded-3xl border border-gray-200/30">
                  <div className="text-gray-400 text-5xl mb-3">📊</div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Loading usage data...</h3>
                </div>
              )}
            </div>
          )}

          {activeTab === 'services' && (
            <div>
              <ServiceSelection />
            </div>
          )}

          {!selectedProfile && !['timelimits', 'usage', 'services'].includes(activeTab) && (
            <div className="text-center py-16 bg-white/50 rounded-3xl border border-gray-200/30 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <div className="text-gray-400 text-6xl mb-4">👤</div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Select a kid profile</h3>
              <p className="text-sm text-gray-500">Select a profile above to manage their content and devices</p>
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

      <ContentActionModal
        isOpen={isActionModalOpen}
        policy={selectedContentForAction}
        onClose={handleCloseActionModal}
        onPlay={handleLaunchContent}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title={`Re-pair "${deviceToRepair?.name}"?`}
        message={`This will remove the device so it can be paired again. The device will need to enter a new pairing code.`}
        confirmText="Re-pair"
        cancelText="Cancel"
        onConfirm={confirmRepairDevice}
        onCancel={cancelRepairDevice}
      />

      <ConfirmModal
        isOpen={isDeleteProfileModalOpen}
        title={`Delete "${profileToDelete?.name}"?`}
        message="This will remove the profile, unlink all devices, and delete all content policies. This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteProfile}
        onCancel={() => {
          setIsDeleteProfileModalOpen(false);
          setProfileToDelete(null);
        }}
      />
    </div>
  );
}
