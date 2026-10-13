export const colors = {
  // Deep slates & neutrals
  slate950: '#0B0F17',
  slate900: '#0F172A',
  slate800: '#1E293B',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748B',
  slate400: '#94A3B8',
  slate300: '#CBD5E1',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  slate50: '#F8FAFC',
  white: '#FFFFFF',

  // Sage Greens (Calm, grounding)
  sage900: '#1B4332',
  sage700: '#2D6A4F',
  sage600: '#40916C',
  sage500: '#52B788',
  sage400: '#74C69D',
  sage200: '#B7E4C7',
  sage100: '#D8F3DC',
  sage50: '#EBF9F1',

  // Warm Ambers (Joy, energy, reflection)
  amber700: '#B45309',
  amber600: '#D97706',
  amber500: '#F59E0B',
  amber400: '#FBBF24',
  amber200: '#FDE68A',
  amber100: '#FEF3C7',
  amber50: '#FFFBEB',

  // Soft Lavenders (Anxious, introspective, spiritual)
  lavender700: '#6D28D9',
  lavender600: '#7C3AED',
  lavender500: '#8B5CF6',
  lavender400: '#A78BFA',
  lavender200: '#DDD6FE',
  lavender100: '#EDE9FE',
  lavender50: '#F5F3FF',

  // Soft Rose / Terracotta (Angry, intense)
  rose700: '#BE123C',
  rose600: '#E11D48',
  rose500: '#F43F5E',
  rose200: '#FECDD3',
  rose100: '#FFE4E6',
  rose50: '#FFF1F2',

  // Soft Ocean Blues (Sad, quiet, reflective)
  ocean700: '#0369A1',
  ocean600: '#0284C7',
  ocean500: '#0EA5E9',
  ocean200: '#BAE6FD',
  ocean100: '#E0F2FE',
  ocean50: '#F0F9FF',

  // Background and UI Surfaces
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceCard: '#FFFFFF',
  border: '#E2E8F0',
  borderSubtle: '#F1F5F9',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',

  // Statuses
  success: '#10B981',
  successBg: '#D1FAE5',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  danger: '#EF4444',
  dangerBg: '#FEE2E2',
  info: '#3B82F6',
  infoBg: '#DBEAFE',
};

export const emotionColors: Record<
  string,
  {
    primary: string;
    background: string;
    border: string;
    text: string;
    emoji: string;
    label: string;
  }
> = {
  joy: {
    primary: colors.amber500,
    background: colors.amber100,
    border: colors.amber400,
    text: colors.amber700,
    emoji: '☀️',
    label: 'Joyful',
  },
  calm: {
    primary: colors.sage600,
    background: colors.sage100,
    border: colors.sage400,
    text: colors.sage900,
    emoji: '🌿',
    label: 'Calm',
  },
  anxious: {
    primary: colors.lavender600,
    background: colors.lavender100,
    border: colors.lavender400,
    text: colors.lavender700,
    emoji: '⚡',
    label: 'Anxious',
  },
  sad: {
    primary: colors.ocean600,
    background: colors.ocean100,
    border: colors.ocean200,
    text: colors.ocean700,
    emoji: '🌧️',
    label: 'Sad',
  },
  angry: {
    primary: colors.rose600,
    background: colors.rose100,
    border: colors.rose200,
    text: colors.rose700,
    emoji: '🔥',
    label: 'Angry',
  },
  exhausted: {
    primary: colors.slate600,
    background: colors.slate100,
    border: colors.slate300,
    text: colors.slate700,
    emoji: '🔋',
    label: 'Exhausted',
  },
  overwhelmed: {
    primary: '#D946EF',
    background: '#FAE8FF',
    border: '#F0ABFC',
    text: '#86198F',
    emoji: '🌊',
    label: 'Overwhelmed',
  },
};
