import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LineChart } from 'react-native-gifted-charts';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Activity,
  Calendar,
  Lock,
  ArrowLeft,
} from 'lucide-react-native';
import { colors, radii, spacing, shadows } from '../../../theme';
import { adminService } from '../../../services/api';
import { EmotionBadge } from '../../../components/EmotionBadge';

const screenWidth = Dimensions.get('window').width;

export default function AdminUserReportScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['adminUserReport', userId, period],
    queryFn: () => adminService.getUserReport(userId as string, period),
    enabled: !!userId,
  });

  const targetUser = data?.targetUser;
  const summary = data?.summary;
  const entries = data?.entries || [];
  const dailyAggs = data?.dailyAggregations || [];
  const notesShared = targetUser?.notesSharedWithAdmin ?? true;

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!dailyAggs || dailyAggs.length === 0) {
      return [
        { value: 3, label: 'Start' },
        { value: 3.5, label: 'Mid' },
        { value: 4, label: 'Now' },
      ];
    }

    return dailyAggs.map((item) => {
      const parts = item.date.split('-');
      const monthDay = `${parts[1]}/${parts[2]}`;
      return {
        value: item.avgValence,
        label: monthDay,
        dataPointText: String(item.avgValence),
        textColor: colors.slate600,
        textFontSize: 10,
      };
    });
  }, [dailyAggs]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.sage600} />
        <Text style={styles.loadingText}>Generating Emotional Journey Report...</Text>
      </View>
    );
  }

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
        {/* User Card */}
        <View style={styles.userBanner}>
          <View style={styles.userBannerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {targetUser?.name ? targetUser.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View>
              <Text style={styles.bannerName}>{targetUser?.name}</Text>
              <Text style={styles.bannerEmail}>{targetUser?.email}</Text>
            </View>
          </View>
        </View>

        {/* Privacy Shield Banner */}
        <View
          style={[
            styles.privacyNoticeCard,
            notesShared ? styles.privacySharedBg : styles.privacyMaskedBg,
          ]}
        >
          <View style={styles.privacyNoticeHeader}>
            {notesShared ? (
              <ShieldCheck size={20} color={colors.sage700} style={{ marginRight: 6 }} />
            ) : (
              <ShieldAlert size={20} color={colors.rose700} style={{ marginRight: 6 }} />
            )}
            <Text
              style={[
                styles.privacyNoticeTitle,
                { color: notesShared ? colors.sage900 : colors.rose700 },
              ]}
            >
              {notesShared
                ? 'Clinical Notes Sharing Active'
                : 'User Privacy Protection Active: Raw Notes Redacted'}
            </Text>
          </View>
          <Text style={styles.privacyNoticeDesc}>
            {notesShared
              ? 'This user has consented to sharing raw diary notes with clinical supervisors.'
              : 'The user has elected to keep personal diary entries confidential. Raw text is replaced with [REDACTED], while emotional valence scores, intensity metrics, and triggers remain available for clinical assessment.'}
          </Text>
        </View>

        {/* Period Selector Toggle */}
        <View style={styles.periodPillContainer}>
          {(['day', 'week', 'month'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.periodPill,
                period === p && styles.periodPillActive,
              ]}
              onPress={() => setPeriod(p)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.periodPillText,
                  period === p && styles.periodPillTextActive,
                ]}
              >
                {p === 'day' ? '24 Hours' : p === 'week' ? '7 Days' : '30 Days'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Stats */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryVal}>{summary?.totalEntries || 0}</Text>
            <Text style={styles.summaryLbl}>Total Entries</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryVal}>
              {summary?.overallAvgValence ? `${summary.overallAvgValence}/5` : 'N/A'}
            </Text>
            <Text style={styles.summaryLbl}>Avg Valence</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryVal}>
              {summary?.overallAvgIntensity ? `${summary.overallAvgIntensity}/5` : 'N/A'}
            </Text>
            <Text style={styles.summaryLbl}>Avg Intensity</Text>
          </View>
        </View>

        {/* Emotional Trend Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Valence Trend Curve</Text>
          <Text style={styles.chartSub}>
            Tracking emotional positivity (1: Low to 5: High) across period
          </Text>
          <View style={styles.chartWrap}>
            <LineChart
              data={chartData}
              height={170}
              width={screenWidth - 76}
              curved
              color={colors.sage600}
              thickness={3}
              startFillColor={colors.sage400}
              endFillColor={colors.sage50}
              startOpacity={0.35}
              endOpacity={0.05}
              areaChart
              maxValue={5}
              mostNegativeValue={1}
              noOfSections={4}
              yAxisColor={colors.slate200}
              xAxisColor={colors.slate200}
              yAxisTextStyle={{ color: colors.slate400, fontSize: 11 }}
              xAxisLabelTextStyle={{ color: colors.slate500, fontSize: 10 }}
              dataPointsColor={colors.sage700}
              dataPointsRadius={4}
              rulesColor={colors.slate100}
              isAnimated
            />
          </View>
        </View>

        {/* Chronological Entries Feed */}
        <View style={styles.entriesSection}>
          <Text style={styles.entriesTitle}>Chronological Emotion Log</Text>
          <Text style={styles.entriesSubtitle}>
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'} recorded in selected period
          </Text>

          {entries.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No logs found for this period.</Text>
            </View>
          ) : (
            entries.map((entry) => {
              const date = new Date(entry.loggedAt).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              const isMasked =
                entry.noteMasked ||
                entry.note.includes('[REDACTED') ||
                !notesShared;

              return (
                <View key={entry._id} style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <EmotionBadge emotion={entry.emotion.primary} size="md" />
                    <Text style={styles.entryDate}>{date}</Text>
                  </View>

                  {/* Note representation */}
                  {isMasked ? (
                    <View style={styles.maskedNoteBox}>
                      <Lock size={14} color={colors.rose700} style={{ marginRight: 6 }} />
                      <Text style={styles.maskedNoteText}>
                        [REDACTED - USER PRIVACY ACTIVE]
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.entryNote}>{entry.note || 'No note written.'}</Text>
                  )}

                  <View style={styles.entryScores}>
                    <Text style={styles.entryScoreText}>
                      Valence {entry.emotion.valenceScore}/5 • Intensity{' '}
                      {entry.emotion.intensityScore}/5
                    </Text>

                    {entry.tags && entry.tags.length > 0 ? (
                      <View style={styles.tagWrap}>
                        {entry.tags.map((t, idx) => (
                          <Text key={idx} style={styles.tag}>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.slate500,
  },
  scrollContainer: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  userBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  userBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.sage100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.sage900,
  },
  bannerName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.slate900,
  },
  bannerEmail: {
    fontSize: 13,
    color: colors.slate500,
  },
  privacyNoticeCard: {
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  privacySharedBg: {
    backgroundColor: colors.sage50,
    borderColor: colors.sage200,
  },
  privacyMaskedBg: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  privacyNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  privacyNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  privacyNoticeDesc: {
    fontSize: 12,
    color: colors.slate600,
    lineHeight: 17,
  },
  periodPillContainer: {
    flexDirection: 'row',
    backgroundColor: colors.slate200,
    borderRadius: radii.lg,
    padding: 3,
    marginBottom: spacing.lg,
  },
  periodPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  periodPillActive: {
    backgroundColor: colors.surface,
    ...shadows.subtle,
  },
  periodPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.slate600,
  },
  periodPillTextActive: {
    color: colors.sage700,
    fontWeight: '700',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    ...shadows.subtle,
  },
  summaryVal: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.slate900,
    marginBottom: 2,
  },
  summaryLbl: {
    fontSize: 11,
    color: colors.slate500,
    fontWeight: '500',
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.slate900,
  },
  chartSub: {
    fontSize: 12,
    color: colors.slate400,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  chartWrap: {
    alignItems: 'center',
    overflow: 'hidden',
    paddingRight: 10,
  },
  entriesSection: {
    marginTop: spacing.sm,
  },
  entriesTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.slate900,
  },
  entriesSubtitle: {
    fontSize: 13,
    color: colors.slate500,
    marginBottom: spacing.md,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.slate400,
    fontStyle: 'italic',
  },
  entryCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.subtle,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  entryDate: {
    fontSize: 12,
    color: colors.slate400,
    fontWeight: '500',
  },
  maskedNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginVertical: 4,
  },
  maskedNoteText: {
    fontSize: 12,
    color: colors.rose700,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  entryNote: {
    fontSize: 14,
    color: colors.slate800,
    lineHeight: 20,
    marginVertical: 4,
  },
  entryScores: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
  },
  entryScoreText: {
    fontSize: 11,
    color: colors.slate500,
  },
  tagWrap: {
    flexDirection: 'row',
    gap: 4,
  },
  tag: {
    fontSize: 11,
    color: colors.sage700,
    backgroundColor: colors.sage50,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
    fontWeight: '600',
  },
});
