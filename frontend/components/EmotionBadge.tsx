import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PrimaryEmotion } from '../types';
import { emotionColors, radii, spacing } from '../theme';

interface Props {
  emotion: PrimaryEmotion | string;
  size?: 'sm' | 'md' | 'lg';
  showEmoji?: boolean;
}

export const EmotionBadge: React.FC<Props> = ({
  emotion,
  size = 'md',
  showEmoji = true,
}) => {
  const meta = emotionColors[emotion.toLowerCase()] || emotionColors.calm;

  const sizeStyles = {
    sm: {
      paddingVertical: 2,
      paddingHorizontal: 8,
      fontSize: 11,
      emojiSize: 11,
    },
    md: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      fontSize: 13,
      emojiSize: 13,
    },
    lg: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      fontSize: 15,
      emojiSize: 16,
    },
  }[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: meta.background,
          borderColor: meta.border,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
        },
      ]}
    >
      {showEmoji && (
        <Text style={[styles.emoji, { fontSize: sizeStyles.emojiSize }]}>
          {meta.emoji}
        </Text>
      )}
      <Text
        style={[
          styles.text,
          {
            color: meta.text,
            fontSize: sizeStyles.fontSize,
          },
        ]}
      >
        {meta.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  emoji: {
    marginRight: 4,
  },
  text: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
