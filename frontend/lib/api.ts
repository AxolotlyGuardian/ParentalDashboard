import axios from 'axios';
import { getToken } from './auth';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Auth ---

export const authApi = {
  parentSignup: (email: string, password: string) =>
    api.post('/auth/parent/signup', { email, password }),

  parentLogin: (email: string, password: string) =>
    api.post('/auth/parent/login', { email, password }),

  kidLogin: (profile_id: number, pin: string) =>
    api.post('/auth/kid/login', { profile_id, pin }),

  getKidProfiles: (parentId: number) =>
    api.get(`/auth/kid/profiles/${parentId}`),

  getAllKidProfiles: () =>
    api.get('/auth/kid/profiles'),

  createKidProfile: (parent_id: number, name: string, age: number, pin: string) =>
    api.post('/auth/kid/profile', { parent_id, name, age, pin }),

  updateKidProfile: (profileId: number, data: { name?: string; age?: number; pin?: string }) =>
    api.put(`/auth/kid/profile/${profileId}`, data),

  deleteKidProfile: (profileId: number) =>
    api.delete(`/auth/kid/profile/${profileId}`),

  logout: () =>
    api.post('/auth/logout'),
};

// --- Catalog ---

export const catalogApi = {
  search: (query: string) =>
    api.get('/catalog/search', { params: { query } }),

  getAllTitles: (skip: number = 0, limit: number = 100) =>
    api.get('/catalog/titles', { params: { skip, limit } }),

  getTitleDetails: (titleId: number) =>
    api.get(`/catalog/titles/${titleId}`),

  getTitleEpisodes: (titleId: number, policyId?: number) =>
    api.get(`/catalog/titles/${titleId}/episodes`, { params: policyId ? { policy_id: policyId } : {} }),

  getTitleProviders: (titleId: number) =>
    api.get(`/catalog/titles/${titleId}/providers`),
};

// --- Policy ---

export const policyApi = {
  createPolicy: (
    kid_profile_id: number,
    title_id: number,
    is_allowed: boolean,
    title?: string,
    media_type?: string,
    poster_path?: string,
    rating?: string
  ) =>
    api.post('/policy', { kid_profile_id, title_id, is_allowed, title, media_type, poster_path, rating }),

  getProfilePolicies: (kidProfileId: number) =>
    api.get(`/policy/profile/${kidProfileId}`),

  getAllowedTitles: (kidProfileId: number) =>
    api.get(`/policy/allowed/${kidProfileId}`),

  updatePolicy: (policyId: number, is_allowed: boolean) =>
    api.put(`/policy/${policyId}`, { is_allowed }),

  deletePolicy: (policyId: number) =>
    api.delete(`/policy/${policyId}`),

  toggleEpisodePolicy: (policyId: number, episodeId: number, is_blocked: boolean) =>
    api.post(`/policy/${policyId}/episodes/${episodeId}/toggle`, { is_blocked }),

  getEpisodesByTag: (policyId: number, tagId: number) =>
    api.get(`/policy/${policyId}/episodes/by-tag/${tagId}`),

  blockEpisodesByTag: (policyId: number, tagId: number) =>
    api.post(`/policy/${policyId}/episodes/block-by-tag/${tagId}`),
};

// --- Device ---

export const deviceApi = {
  getDevices: () =>
    api.get('/launcher/devices'),

  confirmPairing: (pairing_code: string, kid_profile_id: number) =>
    api.post('/pairing/confirm', { pairing_code, kid_profile_id }),

  updateDeviceName: (deviceId: number, device_name: string) =>
    api.put(`/launcher/device/${deviceId}/name`, { device_name }),

  deleteDevice: (deviceId: number) =>
    api.delete(`/launcher/device/${deviceId}`),

  reassignProfile: (deviceId: number, kid_profile_id: number | null) =>
    api.patch(`/launcher/device/${deviceId}/profile`, { kid_profile_id }),

  generatePairingCode: () =>
    api.post('/pairing-code/generate'),
};

// --- Time Limits (parent-facing) ---

export const timeLimitsApi = {
  get: () =>
    api.get('/parent/time-limits'),

  upsert: (data: {
    dailyLimitMinutes: number | null;
    bedtimeStart: string | null;
    bedtimeEnd: string | null;
    scheduleEnabled: boolean;
  }) =>
    api.put('/parent/time-limits', data),
};

// --- Usage Stats (parent-facing) ---

export const usageStatsApi = {
  get: () =>
    api.get('/parent/usage-stats'),
};

// --- Launch ---

export const launchApi = {
  checkLaunch: (kidProfileId: number, titleId: number, provider: string, seasonNumber?: number, episodeNumber?: number) =>
    api.post('/launch/check', {
      kid_profile_id: kidProfileId,
      title_id: titleId,
      provider,
      ...(seasonNumber != null && { season_number: seasonNumber }),
      ...(episodeNumber != null && { episode_number: episodeNumber }),
    }),
};

// --- Content Tags ---

export const contentTagApi = {
  getTags: () =>
    api.get('/tags'),

  createTag: (category: string, slug: string, display_name: string, description?: string) =>
    api.post('/tags', { category, slug, display_name, description }),

  updateTag: (tagId: number, data: { display_name?: string; description?: string }) =>
    api.put(`/tags/${tagId}`, data),

  deleteTag: (tagId: number) =>
    api.delete(`/tags/${tagId}`),

  getTitleTags: (titleId: number) =>
    api.get(`/titles/${titleId}/tags`),

  getContentReports: () =>
    api.get('/content-reports'),

  createContentReport: (
    title_id: number,
    tag_id: number,
    notes?: string,
    season_number?: number,
    episode_number?: number
  ) =>
    api.post('/content-reports', { title_id, tag_id, notes, season_number, episode_number }),

  approveContentReport: (reportId: number) =>
    api.patch(`/content-reports/${reportId}/approve`),

  rejectContentReport: (reportId: number) =>
    api.patch(`/content-reports/${reportId}/reject`),
};

// --- Streaming Services ---

export const servicesApi = {
  getServices: () =>
    api.get('/services'),

  updateServices: (selectedServices: string[]) =>
    api.post('/services', { selected_services: selectedServices }),
};

// --- Content Packages ---

export const packagesApi = {
  list: (kidAge?: number) =>
    api.get('/packages', { params: kidAge != null ? { kid_age: kidAge } : {} }),

  getDetail: (packageId: number, kidProfileId?: number) =>
    api.get(`/packages/${packageId}`, { params: kidProfileId ? { kid_profile_id: kidProfileId } : {} }),

  apply: (packageId: number, kidProfileId: number, excludedTitleIds: number[] = []) =>
    api.post(`/packages/${packageId}/apply`, { kid_profile_id: kidProfileId, excluded_title_ids: excludedTitleIds }),

  unapply: (packageId: number, kidProfileId: number) =>
    api.post(`/packages/${packageId}/unapply`, { kid_profile_id: kidProfileId }),

  getApplied: (kidProfileId: number) =>
    api.get(`/packages/applied/${kidProfileId}`),

  getPendingUpdates: () =>
    api.get('/packages/updates/pending'),

  handleUpdate: (updateId: number, action: 'accept' | 'dismiss') =>
    api.post(`/packages/updates/${updateId}`, { action }),

  // Admin
  adminGetAll: () =>
    api.get('/packages/admin/all'),

  adminCreate: (data: { name: string; description?: string; age_min?: number; age_max?: number; category: string; icon?: string }) =>
    api.post('/packages/admin', data),

  adminUpdate: (packageId: number, data: { name?: string; description?: string; age_min?: number; age_max?: number; category?: string; icon?: string; is_active?: boolean }) =>
    api.put(`/packages/admin/${packageId}`, data),

  adminDelete: (packageId: number) =>
    api.delete(`/packages/admin/${packageId}`),

  adminAddItems: (packageId: number, titleIds: number[]) =>
    api.post(`/packages/admin/${packageId}/items`, { title_ids: titleIds }),

  adminRemoveItem: (packageId: number, titleId: number) =>
    api.delete(`/packages/admin/${packageId}/items/${titleId}`),
};

// --- Admin ---

export const adminApi = {
  getAllParents: () =>
    api.get('/auth/admin/parents'),

  getAllKidProfiles: () =>
    api.get('/auth/admin/kid-profiles'),

  getAllDevices: () =>
    api.get('/launcher/admin/devices'),

  getAllPolicies: (skip: number = 0, limit: number = 100) =>
    api.get('/policy/admin/all-policies', { params: { skip, limit } }),

  getEpisodeReports: (skip: number = 0, limit: number = 100) =>
    api.get('/launcher/admin/episode-reports', { params: { skip, limit } }),

  getEpisodeLinks: (skip: number = 0, limit: number = 100, provider?: string, verified_only?: boolean) =>
    api.get('/launcher/admin/episode-links', { params: { skip, limit, provider, verified_only } }),

  backfillEpisodeLinks: () =>
    api.post('/launcher/admin/backfill-episode-links'),

  processPendingReports: () =>
    api.post('/launcher/admin/process-pending-reports'),

  scrapeFandomCategory: (data: { title_ids?: number[]; tag_ids?: number[]; force_rescrape?: boolean }) =>
    api.post('/admin/fandom-scrape', data),

  getFandomScrapeStats: (titleId: number) =>
    api.get(`/admin/fandom-scrape/stats/${titleId}`),

  getFandomEpisodeLinks: (titleId: number) =>
    api.get(`/admin/fandom-episodes/${titleId}`),

  getFandomEpisodeTags: (titleId: number) =>
    api.get(`/admin/fandom-episode-tags/${titleId}`),

  enhancedScrape: (data: { title_id: number; tag_ids: number[]; force_rescrape?: boolean }) =>
    api.post('/admin/enhanced-scrape', data),
};
