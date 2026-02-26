export interface PairedDevice {
  id: number;
  device_id: string;
  device_name: string;
  kid_profile_name: string;
  kid_profile_id: number | null;
  created_at: string | null;
  last_active: string | null;
}

export interface ApiError {
  response?: {
    data?: {
      detail?: string;
    };
    status?: number;
  };
}

export interface KidProfileSummary {
  id: number;
  name: string;
  age: number;
  parent_email?: string;
  parent_id?: number;
  policies_count?: number;
  devices_count?: number;
  created_at?: string;
}

export interface ParentSummary {
  id: number;
  email: string;
  created_at: string;
  kid_profiles_count: number;
  devices_count: number;
  kid_profiles: { id: number; name: string; age: number }[];
}

export interface PolicySummary {
  id: number;
  kid_profile_id: number;
  title_id: number;
  is_allowed: boolean;
  created_at: string;
  kid_name?: string;
  title_name?: string;
}

export interface TimeLimits {
  id: number | null;
  dailyLimitMinutes: number | null;
  bedtimeStart: string | null;
  bedtimeEnd: string | null;
  scheduleEnabled: boolean;
}

export interface DeviceUsageStat {
  device_id: string;
  device_name: string;
  kid_name: string;
  timeUsedToday: number;
  mostUsedApp: string | null;
  lastActive: string | null;
}

export interface ParentUsageStats {
  totalTimeToday: number;
  dailyLimitMinutes: number | null;
  timeRemainingToday: number | null;
  devices: DeviceUsageStat[];
}
