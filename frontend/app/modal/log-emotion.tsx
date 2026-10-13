import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Check, Plus, Tag as TagIcon, Sparkles } from 'lucide-react-native';
import { colors, radii, spacing, shadows, emotionColors } from '../../theme';
import { entriesService } from '../../services/api';
import { PrimaryEmotion } from '../../types';

const EMOTION_OPTIONS: {
  key: PrimaryEmotion;
  label: string;
  emoji: string;
  defaultValence: number;
}[] = [
  { key: 'joy', label: 'Joy', emoji: '☀️', defaultValence: 5 },
  { key: 'calm', label: 'Calm', emoji: '🌿', defaultValence: 4 },
  { key: 'anxious', label: 'Anxious', emoji: '⚡', defaultValence: 2 },
  { key: 'sad', label: 'Sad', emoji: '🌧️', defaultValence: 1 },
  { key: 'angry', label: 'Angry', emoji: '🔥', defaultValence: 1 },
  { key: 'exhausted', label: 'Exhausted', emoji: '🔋', defaultValence: 2 },
  { key: 'overwhelmed', label: 'Overwhelmed', emoji: '🌊', defaultValence: 1 },
];

const QUICK_TAGS = [
  'work',
  'gym',
  'sleep',
  'social',
  'health',
  'family',
  'commute',
  'meditation',
];

const VALENCE_LABELS: Record<number, { text: string; color: string }> = {
  1: { text: '1: Very Negative', color: colors.rose600 },
  2: { text: '2: Somewhat Low', color: colors.rose500 },
  3: { text: '3: Neutral / Balanced', color: colors.slate600 },
  4: { text: '4: Pleasant / Good', color: colors.sage600 },
  5: { text: '5: Very Positive', color: colors.amber600 },
};

const INTENSITY_LABELS: Record<number, string> = {
  1: '1 - Subtle / Gentle',
  2: '2 - Mild',
  3: '3 - Moderate',
  4: '4 - Strong',
  5: '5 - Overpowering',
};

export default function LogEmotionModal() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const queryClient = useQueryClient();

  // Initial primary emotion from navigation params if provided
  const initialEmotion = (params.defaultEmotion as PrimaryEmotion) || 'calm';

  const [primaryEmotion, setPrimaryEmotion] = useState<PrimaryEmotion>(initialEmotion);
  const [valenceScore, setValenceScore] = useState<number>(
    EMOTION_OPTIONS.find((e) => e.key === initialEmotion)?.defaultValence || 4
  );
  const [intensityScore, setIntensityScore] = useState<number>(3);
  const [note, setNote] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState<string>('');

  const createMutation = useMutation({
    mutationFn: entriesService.create,
    onSuccess: () => {
      // Invalidate relevant React Query caches
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      queryClient.invalidateQueries({ queryKey: ['trends'] });
      queryClient.invalidateQueries({ queryKey: ['distribution'] });
      router.back();
    },
    onError: (err: any) => {
      const message =
        err.response?.data?.message || err.message || 'Failed to save entry.';
      Alert.alert('Error', message);
    },
  });

  const handleSelectEmotion = (option: typeof EMOTION_OPTIONS[0]) => {
    setPrimaryEmotion(option.key);
    setValenceScore(option.defaultValence);
  };

  const toggleTag = (tag: string) => {
    const cleanTag = tag.toLowerCase().trim();
    if (selectedTags.includes(cleanTag)) {
      setSelectedTags(selectedTags.filter((t) => t !== cleanTag));
    } else {
      setSelectedTags([...selectedTags, cleanTag]);
    }
  };

  const addCustomTag = () => {
    const clean = customTagInput.trim().toLowerCase().replace(/^#/, '');
    if (clean && !selectedTags.includes(clean)) {
      setSelectedTags([...selectedTags, clean]);
      setCustomTagInput('');
    }
  };

  const handleSave = () => {
    createMutation.mutate({
      emotion: {
        primary: primaryEmotion,
        valenceScore,
        intensityScore,
      },
      note: note.trim(),
      tags: selectedTags,
      loggedAt: new Date().toISOString(),
    });
  };

  const currentEmotionMeta = emotionColors[primaryEmotion] || emotionColors.calm;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <X size={22} color={colors.slate600} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Record Emotion</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* STEP 1: Select Primary Emotion */}
          <View style={styles.stepBox}>
            <Text style={styles.stepTitle}>1. Select Primary Feeling</Text>
            <Text style={styles.stepSubtitle}>
              Which emotional state best represents you right now?
            </Text>

            <View style={styles.emotionGrid}>
              {EMOTION_OPTIONS.map((item) => {
                const isSelected = primaryEmotion === item.key;
                const meta = emotionColors[item.key] || emotionColors.calm;

                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.emotionCard,
                      {
                        backgroundColor: isSelected ? meta.background : colors.surface,
                        borderColor: isSelected ? meta.primary : colors.border,
                      },
                    ]}
                    onPress={() => handleSelectEmotion(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.emotionEmoji}>{item.emoji}</Text>
                    <Text
                      style={[
                        styles.emotionLabel,
                        { color: isSelected ? meta.text : colors.slate700 },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* STEP 2: Valence & Intensity */}
          <View style={styles.stepBox}>
            <Text style={styles.stepTitle}>2. Score Valence & Intensity</Text>

            {/* Valence selector */}
            <View style={styles.sliderGroup}>
              <View style={styles.scoreRowHeader}>
                <Text style={styles.scoreTitle}>Valence (Mood Quality)</Text>
                <Text
                  style={[
                    styles.scoreCurrentLabel,
                    { color: VALENCE_LABELS[valenceScore]?.color || colors.slate700 },
                  ]}
                >
                  {VALENCE_LABELS[valenceScore]?.text}
                </Text>
              </View>

              <View style={styles.scoreButtonsRow}>
                {[1, 2, 3, 4, 5].map((score) => (
                  <TouchableOpacity
                    key={score}
                    style={[
                      styles.scoreBtn,
                      valenceScore === score && {
                        backgroundColor: currentEmotionMeta.primary,
                        borderColor: currentEmotionMeta.primary,
                      },
                    ]}
                    onPress={() => setValenceScore(score)}
                  >
                    <Text
                      style={[
                        styles.scoreBtnText,
                        valenceScore === score && { color: colors.white },
                      ]}
                    >
                      {score}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Intensity selector */}
            <View style={styles.sliderGroup}>
              <View style={styles.scoreRowHeader}>
                <Text style={styles.scoreTitle}>Intensity</Text>
                <Text style={styles.scoreCurrentLabel}>
                  {INTENSITY_LABELS[intensityScore]}
                </Text>
              </View>

              <View style={styles.scoreButtonsRow}>
                {[1, 2, 3, 4, 5].map((score) => (
                  <TouchableOpacity
                    key={score}
                    style={[
                      styles.scoreBtn,
                      intensityScore === score && {
                        backgroundColor: colors.slate800,
                        borderColor: colors.slate800,
                      },
                    ]}
                    onPress={() => setIntensityScore(score)}
                  >
                    <Text
                      style={[
                        styles.scoreBtnText,
                        intensityScore === score && { color: colors.white },
                      ]}
                    >
                      {score}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* STEP 3: Journal Reflection Note */}
          <View style={styles.stepBox}>
            <Text style={styles.stepTitle}>3. What's on your mind?</Text>
            <Text style={styles.stepSubtitle}>
              Capture your thoughts or what brought about this feeling.
            </Text>

            <TextInput
              style={styles.textArea}
              placeholder="Write your mindful journal entry here..."
              placeholderTextColor={colors.slate400}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={note}
              onChangeText={setNote}
            />
          </View>

          {/* STEP 4: Tags & Context */}
          <View style={styles.stepBox}>
            <Text style={styles.stepTitle}>4. Context & Triggers</Text>
            <Text style={styles.stepSubtitle}>
              Tap tags that describe your surrounding environment.
            </Text>

            <View style={styles.quickTagsWrap}>
              {QUICK_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tagChip,
                      isSelected && styles.tagChipSelected,
                    ]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text
                      style={[
                        styles.tagChipText,
                        isSelected && styles.tagChipTextSelected,
                      ]}
                    >
                      #{tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Tag Input */}
            <View style={styles.customTagRow}>
              <TagIcon size={16} color={colors.slate400} style={{ marginRight: 6 }} />
              <TextInput
                style={styles.customTagInput}
                placeholder="Add custom tag (e.g. coffee, walk)"
                placeholderTextColor={colors.slate400}
                value={customTagInput}
                onChangeText={setCustomTagInput}
                onSubmitEditing={addCustomTag}
              />
              <TouchableOpacity
                onPress={addCustomTag}
                style={styles.addTagBtn}
                disabled={!customTagInput.trim()}
              >
                <Plus size={16} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Save Action Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              createMutation.isPending && styles.disabledButton,
            ]}
            onPress={handleSave}
            disabled={createMutation.isPending}
            activeOpacity={0.85}
          >
            {createMutation.isPending ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.saveButtonText}>Save Emotion Entry</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  closeBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.slate900,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  stepBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.slate900,
    marginBottom: 2,
  },
  stepSubtitle: {
    fontSize: 12,
    color: colors.slate500,
    marginBottom: spacing.md,
  },
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emotionCard: {
    width: '31%',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    ...shadows.subtle,
  },
  emotionEmoji: {
    fontSize: 26,
    marginBottom: 4,
  },
  emotionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  sliderGroup: {
    marginBottom: spacing.md,
  },
  scoreRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.slate700,
  },
  scoreCurrentLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.slate600,
  },
  scoreButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  scoreBtn: {
    flex: 1,
    height: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.slate50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.slate700,
  },
  textArea: {
    backgroundColor: colors.slate50,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: 14,
    color: colors.slate900,
    minHeight: 100,
    lineHeight: 20,
  },
  quickTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.md,
  },
  tagChip: {
    backgroundColor: colors.slate100,
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagChipSelected: {
    backgroundColor: colors.sage700,
    borderColor: colors.sage700,
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate600,
  },
  tagChipTextSelected: {
    color: colors.white,
  },
  customTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.slate50,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  customTagInput: {
    flex: 1,
    fontSize: 13,
    color: colors.slate900,
    paddingVertical: 8,
  },
  addTagBtn: {
    backgroundColor: colors.sage600,
    borderRadius: radii.full,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: colors.sage600,
    borderRadius: radii.xl,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    ...shadows.card,
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
