import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Fingerprint, LogOut, ShieldCheck } from 'lucide-react-native';
import { colors, radii, spacing, shadows } from '../theme';
import { useAuthStore } from '../store/authStore';

export const BiometricLockOverlay: React.FC = () => {
  const { unlockApp, logout, user } = useAuthStore();

  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <ShieldCheck size={48} color={colors.sage600} />
        </View>

        <Text style={styles.title}>Mental Wellness App</Text>
        <Text style={styles.subtitle}>
          Welcome back, {user?.name || 'Friend'}. Your emotional diary is encrypted & locked for privacy.
        </Text>

        <TouchableOpacity
          style={styles.unlockButton}
          onPress={unlockApp}
          activeOpacity={0.8}
        >
          <Fingerprint size={24} color={colors.white} style={styles.btnIcon} />
          <Text style={styles.unlockButtonText}>Unlock with Biometrics</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
          activeOpacity={0.7}
        >
          <LogOut size={16} color={colors.slate500} style={styles.btnIcon} />
          <Text style={styles.logoutButtonText}>Sign In as Different User</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.slate900,
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    ...shadows.floating,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.sage50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.slate900,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.slate500,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sage600,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.lg,
    width: '100%',
    marginBottom: spacing.md,
  },
  unlockButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  logoutButtonText: {
    color: colors.slate500,
    fontSize: 14,
    fontWeight: '500',
  },
  btnIcon: {
    marginRight: 8,
  },
});
