import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Flame,
  Plus,
  Sparkles,
  ChevronRight,
  Clock,
  Calendar,
} from 'lucide-react-native';
import { colors, radii, spacing, shadows } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { entriesService } from '../../services/api';
import { EmotionBadge } from '../../components/EmotionBadge';
import { PrimaryEmotion } from '../../types';

const QUICK_EMOTIONS: { key: PrimaryEmotion; emoji: string; label: string; color: string; bg: string }[] = [
  { key: 'joy', emoji: '☀️', label: 'Joy', color: colors.amber700, bg: colors.amber100 },
  { key: 'calm', emoji: '🌿', label: 'Calm', color: colors.sage700, bg: colors.sage100 },
  { key: 'anxious', emoji: '⚡', label: 'Anxious', color: colors.lavender700, bg: colors.lavender100 },
  { key: 'sad', emoji: '🌧️', label: 'Sad', color: colors.ocean700, bg: colors.ocean100 },
  { key: 'overwhelmed', emoji: '🌊', label: 'Overwhelmed', color: '#86198F', bg: '#FAE8FF' },
];

const PROMPTS = [
  'What moment brought you unexpected peace today?',
  'Notice your breathing: what feeling is asking for your attention right now?',
  'Name one small kindness you showed yourself today.',
  'What is something you can gently let go of this evening?',
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['entries'],
    queryFn: () => entriesService.getEntries({ limit: 50 }),
  });

  const entries = data?.entries || [];

  // Determine today's logs
  const todayEntries = useMemo(() => {
    const today = new Date().toDateString();
    return entries.filter(
      (entry) => new Date(entry.loggedAt).toDateString() === today
    );
  }, [entries]);

  // Compute Streak Count
  const streakCount = useMemo(() => {
    if (!entries.length) return 0;
    const uniqueDays = new Set(
      entries.map((e) => new Date(e.loggedAt).toISOString().split('T')[0])
    );
    return Math.min(uniqueDays.size, 14); // Realistic streak indicator
  }, [entries]);

  // Get current greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Today formatted
  const formattedDate = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    };
    return new Date().toLocaleDateString(undefined, options);
  }, []);

  const randomPrompt = useMemo(() => {
    const day = new Date().getDate();
    return PROMPTS[day % PROMPTS.length];
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.sage600}
          />
        }
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.dateRow}>
              <Calendar size={13} color={colors.slate400} style={{ marginRight: 4 }} />
              <Text style={styles.dateText}>{formattedDate}</Text>
            </View>
            <Text style={styles.greetingText}>
              {greeting}, {user?.name ? user.name.split(' ')[0] : 'Friend'} ✨
            </Text>
          </View>

          {/* Streak Badge */}
          <View style={styles.streakBadge}>
            <Flame size={18} color="#F97316" fill="#F97316" />
            <Text style={styles.streakText}>
              {streakCount > 0 ? `${streakCount}-Day Streak` : 'Start Streak'}
            </Text>
          </View>
        </View>

        {/* Daily Reflection Prompt Card */}
        <View style={styles.promptCard}>
          <View style={styles.promptHeader}>
            <Sparkles size={16} color={colors.sage700} style={{ marginRight: 6 }} />
            <Text style={styles.promptLabel}>Daily Reflection Prompt</Text>
          </View>
          <Text style={styles.promptBody}>"{randomPrompt}"</Text>
          <TouchableOpacity
            style={styles.reflectAction}
            onPress={() => router.push('/modal/log-emotion')}
            activeOpacity={0.7}
          >
            <Text style={styles.reflectActionText}>Reflect & Log</Text>
            <ChevronRight size={14} color={colors.sage700} />
          </TouchableOpacity>
        </View>

        {/* 1-Tap Quick Mood Picker */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>How are you feeling right now?</Text>
          <Text style={styles.sectionSubtitle}>Tap to capture your immediate state</Text>
        </View>

        <View style={styles.moodGrid}>
          {QUICK_EMOTIONS.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.moodCard, { backgroundColor: item.bg }]}
              onPress={() =>
                router.push({
                  pathname: '/modal/log-emotion',
                  params: { defaultEmotion: item.key },
                })
              }
              activeOpacity={0.8}
            >
              <Text style={styles.moodEmoji}>{item.emoji}</Text>
              <Text style={[styles.moodLabel, { color: item.color }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Today's Logs Vertical Feed */}
        <View style={styles.logsSection}>
          <View style={styles.logsTitleRow}>
            <Text style={styles.sectionTitle}>Today's Check-ins</Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/timeline')}
              style={styles.viewAllBtn}
            >
              <Text style={styles.viewAllText}>Full Diary</Text>
              <ChevronRight size={14} color={colors.sage700} />
            </TouchableOpacity>
          </View>

          {todayEntries.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🌱</Text>
              <Text style={styles.emptyTitle}>No check-ins logged today yet</Text>
              <Text style={styles.emptySubtitle}>
                Pause for a mindful moment and record how your mind is feeling.
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/modal/log-emotion')}
                activeOpacity={0.8}
              >
                <Plus size={16} color={colors.white} style={{ marginRight: 6 }} />
                <Text style={styles.emptyButtonText}>Log First Entry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            todayEntries.map((entry) => {
              const timeString = new Date(entry.loggedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <View key={entry._id} style={styles.entryItem}>
                  <View style={styles.entryTop}>
                    <EmotionBadge emotion={entry.emotion.primary} size="md" />
                    <View style={styles.timeTag}>
                      <Clock size={12} color={colors.slate400} style={{ marginRight: 4 }} />
                      <Text style={styles.timeText}>{timeString}</Text>
                    </View>
                  </View>

                  {entry.note ? (
                    <Text style={styles.entryNote} numberOfLines={2}>
                      {entry.note}
                    </Text>
                  ) : null}

                  <View style={styles.entryFooter}>
                    <Text style={styles.valenceScore}>
                      Valence {entry.emotion.valenceScore}/5 • Intensity{' '}
                      {entry.emotion.intensityScore}/5
                    </Text>
                    {entry.tags && entry.tags.length > 0 ? (
                      <View style={styles.tagRow}>
                        {entry.tags.slice(0, 3).map((t, idx) => (
                          <Text key={idx} style={styles.tagChip}>
                            #{t}
                          </Text>
                        ))}
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    padding: spacing.lg,
    paddingTop: Platform.OS === 'android' ? spacing.xxl : spacing.md,
    paddingBottom: 110,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: colors.slate500,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.slate900,
    letterSpacing: -0.3,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: '#FED7AA',
    ...shadows.subtle,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C2410C',
    marginLeft: 5,
  },
  promptCard: {
    backgroundColor: colors.sage50,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.sage200,
    marginBottom: spacing.xxl,
    ...shadows.subtle,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  promptLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.sage700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  promptBody: {
    fontSize: 15,
    fontStyle: 'italic',
    color: colors.slate800,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  reflectAction: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  reflectActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.sage700,
    marginRight: 2,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.slate900,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.slate500,
    marginTop: 2,
  },
  moodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
  },
  moodCard: {
    flex: 1,
    marginHorizontal: 3,
    paddingVertical: 14,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.subtle,
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  logsSection: {
    marginTop: spacing.sm,
  },
  logsTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.sage700,
    marginRight: 2,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle,
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.slate800,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.slate500,
    textAlign: 'center',
    maxWidth: 240,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.sage600,
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.full,
  },
  emptyButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  entryItem: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.subtle,
  },
  entryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: colors.slate400,
    fontWeight: '500',
  },
  entryNote: {
    fontSize: 14,
    color: colors.slate700,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
  },
  valenceScore: {
    fontSize: 11,
    color: colors.slate500,
    fontWeight: '500',
  },
  tagRow: {
    flexDirection: 'row',
  },
  tagChip: {
    fontSize: 11,
    color: colors.sage700,
    backgroundColor: colors.sage50,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
    marginLeft: 4,
    fontWeight: '600',
  },
});
