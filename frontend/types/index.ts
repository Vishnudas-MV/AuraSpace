export type UserRole = 'user' | 'superadmin';

export type PrimaryEmotion =
  | 'joy'
  | 'calm'
  | 'anxious'
  | 'sad'
  | 'angry'
  | 'exhausted'
  | 'overwhelmed';

export interface IPrivacySettings {
  shareNotesWithAdmin: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  privacySettings: IPrivacySettings;
  createdAt?: string;
}

export interface EmotionPayload {
  primary: PrimaryEmotion;
  valenceScore: number; // 1 to 5
  intensityScore: number; // 1 to 5
  subEmotions?: string[];
}

export interface Entry {
  _id: string;
  userId: string;
  emotion: EmotionPayload;
  note: string;
  noteMasked?: boolean;
  tags: string[];
  triggers: string[];
  loggedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEntryInput {
  emotion: EmotionPayload;
  note?: string;
  tags?: string[];
  triggers?: string[];
  loggedAt?: string;
}

export interface EntriesResponse {
  success: boolean;
  entries: Entry[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface TrendDayItem {
  date: string;
  entryCount: number;
  avgValence: number;
  avgIntensity: number;
  dominantEmotion: PrimaryEmotion;
  dominantEmotionCount: number;
  emotionsRecorded: PrimaryEmotion[];
}

export interface TrendsResponse {
  success: boolean;
  period: '7d' | '30d';
  startDate: string;
  summary: {
    totalEntries: number;
    overallAvgValence: number;
    overallAvgIntensity: number;
    activeDays: number;
  };
  trends: TrendDayItem[];
}

export interface EmotionDistributionItem {
  emotion: PrimaryEmotion;
  count: number;
  percentage: number;
  avgValence: number;
  avgIntensity: number;
}

export interface DistributionResponse {
  success: boolean;
  totalEntries: number;
  distribution: EmotionDistributionItem[];
}

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  privacySettings: IPrivacySettings;
  totalEntries: number;
  lastCheckIn: string | null;
  createdAt: string;
}

export interface AdminUsersResponse {
  success: boolean;
  count: number;
  users: AdminUserItem[];
}

export interface AdminUserReportResponse {
  success: boolean;
  targetUser: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    privacySettings: IPrivacySettings;
    notesSharedWithAdmin: boolean;
  };
  period: 'day' | 'week' | 'month';
  dateRange: {
    from: string;
    to: string;
  };
  summary: {
    totalEntries: number;
    overallAvgValence: number;
    overallAvgIntensity: number;
    activeDays: number;
  };
  dailyAggregations: {
    date: string;
    entryCount: number;
    avgValence: number;
    avgIntensity: number;
    dominantEmotion: PrimaryEmotion;
    dominantEmotionCount: number;
  }[];
  entries: Entry[];
}
