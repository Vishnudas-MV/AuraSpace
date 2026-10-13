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
  Platform,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import {
  TrendingUp,
  Activity,
  Calendar,
  Zap,
  PieChart as PieIcon,
  Tag,
  Smile,
} from 'lucide-react-native';
import { colors, radii, spacing, shadows, emotionColors } from '../../theme';
import { analyticsService, entriesService } from '../../services/api';
import { EmotionBadge } from '../../components/EmotionBadge';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const [period, setPeriod] = useState<'7d' | '30d'>('7d');

  const {
    data: trendsData,
    isLoading: isTrendsLoading,
    refetch: refetchTrends,
    isRefetching: isTrendsRefetching,
  } = useQuery({
    queryKey: ['trends', period],
    queryFn: () => analyticsService.getTrends(period),
  });

  const {
    data: distData,
    isLoading: isDistLoading,
    refetch: refetchDist,
  } = useQuery({
    queryKey: ['distribution'],
    queryFn: () => analyticsService.getDistribution(),
  });

  const { data: entriesData } = useQuery({
    queryKey: ['entries'],
    queryFn: () => entriesService.getEntries({ limit: 100 }),
  });

  const handleRefresh = async () => {
    await Promise.all([refetchTrends(), refetchDist()]);
  };

  // Prepare chart data for Gifted Charts LineChart
  const lineChartData = useMemo(() => {
    if (!trendsData?.trends || trendsData.trends.length === 0) {
      // Mock minimal baseline points to render cleanly if no logs yet
      return [
        { value: 3, label: 'Mon' },
        { value: 3.5, label: 'Tue' },
        { value: 4, label: 'Wed' },
      ];
    }

    return trendsData.trends.map((item) => {
      // Format date e.g. "12 Oct" or "Mon"
      const dateParts = item.date.split('-');
      const monthDay = `${dateParts[1]}/${dateParts[2]}`;

      return {
        value: item.avgValence,
        label: monthDay,
        dataPointText: String(item.avgValence),
        textColor: colors.slate600,
        textFontSize: 10,
      };
    });
  }, [trendsData]);

  // Frequent tags and triggers calculation from recent entries
  const frequentTags = useMemo(() => {
    const entries = entriesData?.entries || [];
    const tagCount: Record<string, { count: number; valenceTotal: number }> = {};

    entries.forEach((entry) => {
      if (entry.tags && Array.isArray(entry.tags)) {
        entry.tags.forEach((tag) => {
          const lower = tag.toLowerCase().trim();
          if (!tagCount[lower]) {
            tagCount[lower] = { count: 0, valenceTotal: 0 };
          }
          tagCount[lower].count += 1;
          tagCount[lower].valenceTotal += entry.emotion.valenceScore;
        });
      }
    });

    return Object.entries(tagCount)
      .map(([tag, stats]) => ({
        tag,
        count: stats.count,
        avgValence: Number((stats.valenceTotal / stats.count).toFixed(1)),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [entriesData]);

  const summary = trendsData?.summary;
  const distributions = distData?.distribution || [];
  const totalLoggedEntries = distData?.totalEntries || 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={isTrendsRefetching}
            onRefresh={handleRefresh}
            tintColor={colors.sage600}
          />
        }
      >
        {/* Screen Header */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Emotional Insights</Text>
          <Text style={styles.pageSubtitle}>
            Track your valence trajectories, patterns, and wellbeing trends
          </Text>
        </View>

        {/* Period Selector Pills */}
        <View style={styles.periodPillContainer}>
          <TouchableOpacity
            style={[
              styles.periodPill,
              period === '7d' && styles.periodPillActive,
            ]}
            onPress={() => setPeriod('7d')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.periodPillText,
                period === '7d' && styles.periodPillTextActive,
              ]}
            >
              Past 7 Days
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodPill,
              period === '30d' && styles.periodPillActive,
            ]}
            onPress={() => setPeriod('30d')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.periodPillText,
                period === '30d' && styles.periodPillTextActive,
              ]}
            >
              Past 30 Days
            </Text>
          </TouchableOpacity>
        </View>

        {/* Metric Summary Cards */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={styles.metricIconBox}>
              <TrendingUp size={18} color={colors.sage600} />
            </View>
            <Text style={styles.metricValue}>
              {summary?.overallAvgValence ? `${summary.overallAvgValence}/5` : 'N/A'}
            </Text>
            <Text style={styles.metricLabel}>Average Valence</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: colors.amber100 }]}>
              <Zap size={18} color={colors.amber700} />
            </View>
            <Text style={styles.metricValue}>
              {summary?.overallAvgIntensity ? `${summary.overallAvgIntensity}/5` : 'N/A'}
            </Text>
            <Text style={styles.metricLabel}>Avg Intensity</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: colors.lavender100 }]}>
              <Activity size={18} color={colors.lavender700} />
            </View>
            <Text style={styles.metricValue}>
              {summary?.totalEntries || 0}
            </Text>
            <Text style={styles.metricLabel}>Total Logs</Text>
          </View>
        </View>

        {/* Bézier Line Chart: Valence Over Time */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Valence Trajectory</Text>
              <Text style={styles.chartSubtitle}>
                Scale 1 (Very Negative) to 5 (Very Positive)
              </Text>
            </View>
            <View style={styles.legendBadge}>
              <View style={styles.legendDot} />
              <Text style={styles.legendText}>Valence (1–5)</Text>
            </View>
          </View>

          <View style={styles.chartWrapper}>
            <LineChart
              data={lineChartData}
              height={190}
              width={screenWidth - 76}
              curved
              color={colors.sage600}
              thickness={3}
              startFillColor={colors.sage400}
              endFillColor={colors.sage50}
              startOpacity={0.4}
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
              hideRules={false}
              rulesColor={colors.slate100}
              rulesType="solid"
              isAnimated
            />
          </View>
        </View>

        {/* Emotion Distribution Breakdown */}
        <View style={styles.cardSection}>
          <View style={styles.sectionTitleRow}>
            <PieIcon size={18} color={colors.slate700} style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Emotion Distribution</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Breakdown of primary emotional states recorded
          </Text>

          {distributions.length === 0 ? (
            <Text style={styles.emptyText}>No distribution data available yet.</Text>
          ) : (
            <View style={styles.distributionList}>
              {distributions.map((item) => {
                const meta = emotionColors[item.emotion] || emotionColors.calm;
                return (
                  <View key={item.emotion} style={styles.distRow}>
                    <View style={styles.distMeta}>
                      <Text style={styles.distEmoji}>{meta.emoji}</Text>
                      <Text style={styles.distLabel}>{meta.label}</Text>
                    </View>

                    <View style={styles.distBarTrack}>
                      <View
                        style={[
                          styles.distBarFill,
                          {
                            width: `${Math.min(item.percentage, 100)}%`,
                            backgroundColor: meta.primary,
                          },
                        ]}
                      />
                    </View>

                    <Text style={styles.distPercent}>{item.percentage}%</Text>
                    <Text style={styles.distCount}>({item.count})</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Frequent Triggers & Tags */}
        <View style={styles.cardSection}>
          <View style={styles.sectionTitleRow}>
            <Tag size={18} color={colors.slate700} style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Frequent Tags & Triggers</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Tags correlated with your diary entries and mood scores
          </Text>

          {frequentTags.length === 0 ? (
            <Text style={styles.emptyText}>
              Add tags like #work, #gym, #sleep to your entries to see patterns.
            </Text>
          ) : (
            <View style={styles.tagGrid}>
              {frequentTags.map((item, idx) => (
                <View key={idx} style={styles.triggerTagCard}>
                  <Text style={styles.triggerTagName}>#{item.tag}</Text>
                  <View style={styles.triggerTagFooter}>
                    <Text style={styles.triggerTagCount}>{item.count} logs</Text>
                    <Text
                      style={[
                        styles.triggerTagValence,
                        {
                          color:
                            item.avgValence >= 3.5
                              ? colors.sage700
                              : item.avgValence <= 2.5
                              ? colors.rose700
                              : colors.slate600,
                        },
                      ]}
                    >
                      ★ {item.avgValence}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
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
    paddingTop: Platform.OS === 'android' ? spacing.xl : spacing.md,
    paddingBottom: 110,
  },
  header: {
    marginBottom: spacing.md,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.slate900,
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 13,
    color: colors.slate500,
    marginTop: 2,
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
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    ...shadows.card,
  },
  metricIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.sage100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.slate900,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: colors.slate500,
    textAlign: 'center',
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
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.slate900,
  },
  chartSubtitle: {
    fontSize: 11,
    color: colors.slate400,
    marginTop: 2,
  },
  legendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.sage50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.sage600,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: colors.sage700,
    fontWeight: '600',
  },
  chartWrapper: {
    alignItems: 'center',
    overflow: 'hidden',
    paddingRight: 10,
  },
  cardSection: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.slate900,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.slate400,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 13,
    color: colors.slate400,
    fontStyle: 'italic',
    paddingVertical: spacing.sm,
  },
  distributionList: {
    gap: 10,
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
  },
  distEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  distLabel: {
    fontSize: 13,
    color: colors.slate700,
    fontWeight: '600',
  },
  distBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.slate100,
    borderRadius: radii.full,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  distBarFill: {
    height: '100%',
    borderRadius: radii.full,
  },
  distPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.slate700,
    width: 42,
    textAlign: 'right',
  },
  distCount: {
    fontSize: 11,
    color: colors.slate400,
    width: 32,
    textAlign: 'right',
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  triggerTagCard: {
    backgroundColor: colors.slate50,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  triggerTagName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.slate800,
    marginBottom: 2,
  },
  triggerTagFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  triggerTagCount: {
    fontSize: 10,
    color: colors.slate400,
  },
  triggerTagValence: {
    fontSize: 10,
    fontWeight: '700',
  },
});
