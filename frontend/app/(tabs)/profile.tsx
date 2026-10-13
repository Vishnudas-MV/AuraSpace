import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  User as UserIcon,
  Shield,
  Fingerprint,
  Sparkles,
  LogOut,
  ChevronRight,
  ShieldAlert,
  Info,
  CheckCircle2,
} from 'lucide-react-native';
import { colors, radii, spacing, shadows } from '../../theme';
import { useAuthStore } from '../../store/authStore';

export default function ProfileScreen() {
  const router = useRouter();
  const {
    user,
    logout,
    isBiometricEnabled,
    setBiometricEnabled,
    updatePrivacySettings,
  } = useAuthStore();

  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);

  const isSuperadmin = user?.role === 'superadmin';
  const shareNotes = user?.privacySettings?.shareNotesWithAdmin ?? true;

  const handleBiometricToggle = async (val: boolean) => {
    const success = await setBiometricEnabled(val);
    if (!success && val) {
      Alert.alert(
        'Biometrics Not Available',
        'Please ensure biometric security (Face ID or Touch ID) is enrolled in device settings.'
      );
    }
  };

  const handlePrivacyToggle = async (val: boolean) => {
    try {
      setIsUpdatingPrivacy(true);
      await updatePrivacySettings({ shareNotesWithAdmin: val });
    } catch (err) {
      Alert.alert(
        'Update Failed',
        'Could not update privacy setting. Please check your internet connection.'
      );
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of your diary?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'ME';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Profile Card */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'User Profile'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          <View style={styles.roleBadgeContainer}>
            <View
              style={[
                styles.roleBadge,
                isSuperadmin && { backgroundColor: '#FDF2F8', borderColor: '#F472B6' },
              ]}
            >
              <Text
                style={[
                  styles.roleText,
                  isSuperadmin && { color: '#BE185D' },
                ]}
              >
                {isSuperadmin ? '👑 Superadmin' : '🌱 Mindful Member'}
              </Text>
            </View>
          </View>
        </View>

        {/* Superadmin Quick Access Portal */}
        {isSuperadmin && (
          <TouchableOpacity
            style={styles.adminPortalCard}
            onPress={() => router.push('/(admin)/users')}
            activeOpacity={0.8}
          >
            <View style={styles.adminIconBox}>
              <ShieldAlert size={22} color={colors.lavender700} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.adminPortalTitle}>Superadmin Control Center</Text>
              <Text style={styles.adminPortalSubtitle}>
                Review users directory & privacy-protected emotional journey reports
              </Text>
            </View>
            <ChevronRight size={18} color={colors.lavender700} />
          </TouchableOpacity>
        )}

        {/* AI Weekly Reflection Preview */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Sparkles size={18} color={colors.amber600} style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>AI Weekly Reflection</Text>
            <View style={styles.previewTag}>
              <Text style={styles.previewTagText}>PREVIEW</Text>
            </View>
          </View>

          <View style={styles.aiReflectionBox}>
            <Text style={styles.aiReflectionText}>
              "Over the past 7 days, your calmness peaked during morning hours, while anxious moments were tied to work deadlines on Wednesday. Overall, your emotional valence averaged an encouraging 3.8/5. Practicing 5 minutes of mindful breathwork noticeably softened evening stress."
            </Text>
            <View style={styles.aiFooter}>
              <CheckCircle2 size={14} color={colors.sage600} style={{ marginRight: 4 }} />
              <Text style={styles.aiFooterText}>Generated with therapeutic sentiment models</Text>
            </View>
          </View>
        </View>

        {/* Security & Privacy Settings */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Shield size={18} color={colors.slate700} style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Security & Privacy</Text>
          </View>

          {/* Biometric Lock Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingIconBox}>
              <Fingerprint size={20} color={colors.sage700} />
            </View>
            <View style={styles.settingMeta}>
              <Text style={styles.settingLabel}>Biometric App Lock</Text>
              <Text style={styles.settingSub}>
                Require Face ID / Touch ID when returning to app
              </Text>
            </View>
            <Switch
              value={isBiometricEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: colors.slate300, true: colors.sage400 }}
              thumbColor={isBiometricEnabled ? colors.sage700 : colors.white}
            />
          </View>

          <View style={styles.divider} />

          {/* Share Notes with Admin Toggle */}
          <View style={styles.settingRow}>
            <View style={[styles.settingIconBox, { backgroundColor: colors.lavender100 }]}>
              <Info size={20} color={colors.lavender700} />
            </View>
            <View style={styles.settingMeta}>
              <Text style={styles.settingLabel}>Share Notes with Superadmin</Text>
              <Text style={styles.settingSub}>
                {shareNotes
                  ? 'Raw journal reflections are visible to clinical supervisors.'
                  : 'Privacy enabled: Text is redacted as [REDACTED]. Only numerical scores & tags are shared.'}
              </Text>
            </View>
            <Switch
              value={shareNotes}
              onValueChange={handlePrivacyToggle}
              disabled={isUpdatingPrivacy}
              trackColor={{ false: colors.slate300, true: colors.sage400 }}
              thumbColor={shareNotes ? colors.sage700 : colors.white}
            />
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={confirmLogout}
          activeOpacity={0.8}
        >
          <LogOut size={18} color={colors.danger} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>
          Mental Wellness App v1.0.0 • Confidential & Protected
        </Text>
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
  profileHeaderCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.sage100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.sage400,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.sage900,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.slate900,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: colors.slate500,
    marginBottom: spacing.md,
  },
  roleBadgeContainer: {
    flexDirection: 'row',
  },
  roleBadge: {
    backgroundColor: colors.sage50,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.sage200,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.sage700,
  },
  adminPortalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lavender50,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.lavender200,
    marginBottom: spacing.lg,
    ...shadows.subtle,
  },
  adminIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.lavender100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  adminPortalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.lavender700,
    marginBottom: 2,
  },
  adminPortalSubtitle: {
    fontSize: 12,
    color: colors.slate600,
    lineHeight: 16,
  },
  sectionCard: {
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
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.slate900,
    flex: 1,
  },
  previewTag: {
    backgroundColor: colors.amber100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  previewTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.amber700,
  },
  aiReflectionBox: {
    backgroundColor: colors.slate50,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aiReflectionText: {
    fontSize: 13,
    color: colors.slate700,
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  aiFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiFooterText: {
    fontSize: 11,
    color: colors.sage700,
    fontWeight: '500',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  settingIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.sage100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingMeta: {
    flex: 1,
    marginRight: 8,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.slate800,
    marginBottom: 2,
  },
  settingSub: {
    fontSize: 12,
    color: colors.slate500,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.slate100,
    marginVertical: spacing.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radii.lg,
    paddingVertical: 14,
    marginBottom: spacing.xl,
  },
  logoutText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.slate400,
  },
});
