import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  SafeAreaView,
  RefreshControl,
  Platform,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Trash2,
  Calendar,
  X,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
} from 'lucide-react-native';
import { colors, radii, spacing, shadows } from '../../theme';
import { entriesService } from '../../services/api';
import { EmotionBadge } from '../../components/EmotionBadge';
import { Entry, PrimaryEmotion } from '../../types';

const EMOTION_FILTERS = [
  'All',
  'joy',
  'calm',
  'anxious',
  'sad',
  'angry',
  'exhausted',
  'overwhelmed',
];

export default function TimelineScreen() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState('All');
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['entries'],
    queryFn: () => entriesService.getEntries({ limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => entriesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      queryClient.invalidateQueries({ queryKey: ['trends'] });
      queryClient.invalidateQueries({ queryKey: ['distribution'] });
      setSelectedEntry(null);
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Could not delete entry.');
    },
  });

  const entries = data?.entries || [];

  // Filter entries based on search and selected emotion
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Emotion Filter
      if (
        selectedEmotion !== 'All' &&
        entry.emotion.primary.toLowerCase() !== selectedEmotion.toLowerCase()
      ) {
        return false;
      }

      // Search Query (in notes, tags, triggers)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesNote = entry.note?.toLowerCase().includes(query);
        const matchesTags = entry.tags?.some((t) => t.toLowerCase().includes(query));
        const matchesTriggers = entry.triggers?.some((tr) =>
          tr.toLowerCase().includes(query)
        );
        const matchesEmotion = entry.emotion.primary.toLowerCase().includes(query);
        return matchesNote || matchesTags || matchesTriggers || matchesEmotion;
      }

      return true;
    });
  }, [entries, selectedEmotion, searchQuery]);

  const confirmDelete = (id: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to permanently delete this mood log?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(id),
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Entry }) => {
    const date = new Date(item.loggedAt);
    const dateFormatted = date.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const timeFormatted = date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => setSelectedEntry(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <EmotionBadge emotion={item.emotion.primary} size="md" />
            <Text style={styles.cardDateTime}>
              {dateFormatted} • {timeFormatted}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => confirmDelete(item._id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Trash2 size={16} color={colors.slate400} />
          </TouchableOpacity>
        </View>

        {item.note ? (
          <Text style={styles.cardNote} numberOfLines={3}>
            {item.note}
          </Text>
        ) : (
          <Text style={styles.cardEmptyNote}>No journal note written.</Text>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.scoresRow}>
            <View style={styles.scorePill}>
              <Text style={styles.scorePillLabel}>Valence</Text>
              <Text style={styles.scorePillVal}>{item.emotion.valenceScore}/5</Text>
            </View>
            <View style={styles.scorePill}>
              <Text style={styles.scorePillLabel}>Intensity</Text>
              <Text style={styles.scorePillVal}>{item.emotion.intensityScore}/5</Text>
            </View>
          </View>

          {item.tags && item.tags.length > 0 ? (
            <View style={styles.tagWrap}>
              {item.tags.map((tag, i) => (
                <Text key={i} style={styles.tag}>
                  #{tag}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.topHeader}>
          <Text style={styles.pageTitle}>Diary Feed</Text>
          <Text style={styles.pageSubtitle}>
            Your chronological journey & moments of awareness
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={18} color={colors.slate400} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes, triggers, or #tags..."
            placeholderTextColor={colors.slate400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={colors.slate400} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Horizontal Emotion Filter Chips */}
        <View style={styles.filtersWrapper}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={EMOTION_FILTERS}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.filterList}
            renderItem={({ item }) => {
              const isSelected = selectedEmotion === item;
              return (
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    isSelected && styles.filterChipSelected,
                  ]}
                  onPress={() => setSelectedEmotion(item)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isSelected && styles.filterChipTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Feed List */}
        <FlatList
          data={filteredEntries}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.sage600}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Sparkles size={36} color={colors.slate300} style={{ marginBottom: 10 }} />
              <Text style={styles.emptyTitle}>No matching logs found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || selectedEmotion !== 'All'
                  ? 'Try adjusting your search filters.'
                  : 'Start by writing your first emotion entry.'}
              </Text>
            </View>
          }
        />

        {/* Detailed Entry Modal */}
        <Modal
          visible={!!selectedEntry}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedEntry(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {selectedEntry && (
                    <EmotionBadge
                      emotion={selectedEntry.emotion.primary}
                      size="lg"
                    />
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedEntry(null)}
                  style={styles.closeBtn}
                >
                  <X size={20} color={colors.slate600} />
                </TouchableOpacity>
              </View>

              {selectedEntry && (
                <>
                  <Text style={styles.modalTimestamp}>
                    Logged on{' '}
                    {new Date(selectedEntry.loggedAt).toLocaleString([], {
                      dateStyle: 'full',
                      timeStyle: 'short',
                    })}
                  </Text>

                  <View style={styles.modalMetricBox}>
                    <View style={styles.modalMetricItem}>
                      <Text style={styles.modalMetricLabel}>Valence Score</Text>
                      <Text style={styles.modalMetricValue}>
                        {selectedEntry.emotion.valenceScore}/5
                      </Text>
                    </View>
                    <View style={styles.modalMetricItem}>
                      <Text style={styles.modalMetricLabel}>Intensity Score</Text>
                      <Text style={styles.modalMetricValue}>
                        {selectedEntry.emotion.intensityScore}/5
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.modalSectionLabel}>Journal Reflection</Text>
                  <View style={styles.modalNoteContainer}>
                    <Text style={styles.modalNoteText}>
                      {selectedEntry.note || 'No notes were recorded for this check-in.'}
                    </Text>
                  </View>

                  {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                    <View style={{ marginBottom: spacing.md }}>
                      <Text style={styles.modalSectionLabel}>Associated Tags</Text>
                      <View style={styles.tagWrap}>
                        {selectedEntry.tags.map((t, idx) => (
                          <Text key={idx} style={styles.tag}>
                            #{t}
                          </Text>
                        ))}
                      </View>
                    </View>
                  )}

                  {selectedEntry.triggers && selectedEntry.triggers.length > 0 && (
                    <View style={{ marginBottom: spacing.lg }}>
                      <Text style={styles.modalSectionLabel}>Triggers Identified</Text>
                      <View style={styles.tagWrap}>
                        {selectedEntry.triggers.map((tr, idx) => (
                          <Text key={idx} style={styles.triggerChip}>
                            • {tr}
                          </Text>
                        ))}
                      </View>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.modalDeleteBtn}
                    onPress={() => confirmDelete(selectedEntry._id)}
                  >
                    <Trash2 size={16} color={colors.danger} style={{ marginRight: 6 }} />
                    <Text style={styles.modalDeleteText}>Delete Entry</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  topHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'android' ? spacing.xl : spacing.md,
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    marginBottom: spacing.md,
    ...shadows.subtle,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.slate900,
  },
  filtersWrapper: {
    marginBottom: spacing.md,
  },
  filterList: {
    paddingHorizontal: spacing.lg,
  },
  filterChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.full,
    marginRight: 8,
  },
  filterChipSelected: {
    backgroundColor: colors.sage700,
    borderColor: colors.sage700,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate600,
    textTransform: 'capitalize',
  },
  filterChipTextSelected: {
    color: colors.white,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 110,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardDateTime: {
    fontSize: 12,
    color: colors.slate400,
    marginLeft: 10,
    fontWeight: '500',
  },
  cardNote: {
    fontSize: 14,
    color: colors.slate800,
    lineHeight: 21,
    marginBottom: spacing.md,
  },
  cardEmptyNote: {
    fontSize: 13,
    color: colors.slate400,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  scoresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.slate100,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radii.sm,
  },
  scorePillLabel: {
    fontSize: 10,
    color: colors.slate500,
    marginRight: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  scorePillVal: {
    fontSize: 11,
    color: colors.slate800,
    fontWeight: '700',
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    fontSize: 11,
    color: colors.sage700,
    backgroundColor: colors.sage50,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.sm,
    fontWeight: '600',
  },
  triggerChip: {
    fontSize: 11,
    color: colors.slate600,
    backgroundColor: colors.slate100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.slate700,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.slate400,
    textAlign: 'center',
    maxWidth: 240,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 440,
    ...shadows.floating,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  closeBtn: {
    padding: 6,
  },
  modalTimestamp: {
    fontSize: 12,
    color: colors.slate400,
    marginBottom: spacing.lg,
  },
  modalMetricBox: {
    flexDirection: 'row',
    backgroundColor: colors.slate50,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  modalMetricLabel: {
    fontSize: 11,
    color: colors.slate500,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 2,
  },
  modalMetricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.slate800,
  },
  modalSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.slate600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalNoteContainer: {
    backgroundColor: colors.slate50,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  modalNoteText: {
    fontSize: 14,
    color: colors.slate800,
    lineHeight: 22,
  },
  modalDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.dangerBg,
    backgroundColor: '#FEF2F2',
    paddingVertical: 10,
    borderRadius: radii.lg,
    marginTop: spacing.sm,
  },
  modalDeleteText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
});
