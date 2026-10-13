import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Lock, Mail, User as UserIcon, Shield, AlertCircle } from 'lucide-react-native';
import { colors, radii, spacing, shadows } from '../../theme';
import { authService } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [shareNotesWithAdmin, setShareNotesWithAdmin] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await authService.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        privacySettings: {
          shareNotesWithAdmin,
        },
      });

      if (response.success && response.token && response.user) {
        await login(response.token, response.user);
        router.replace('/(tabs)');
      } else {
        setErrorMessage('Registration failed. Please try again.');
      }
    } catch (err: any) {
      const apiMessage =
        err.response?.data?.message ||
        err.message ||
        'Unable to connect to the server.';
      setErrorMessage(apiMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardView}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Begin Your Journey</Text>
          <Text style={styles.subtitle}>
            Create your private emotional diary and begin mindful wellness tracking.
          </Text>
        </View>

        <View style={styles.card}>
          {errorMessage && (
            <View style={styles.errorBanner}>
              <AlertCircle size={18} color={colors.danger} style={styles.errorIcon} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <Text style={styles.label}>Your Name</Text>
          <View style={styles.inputContainer}>
            <UserIcon size={18} color={colors.slate400} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Alex Rivers"
              placeholderTextColor={colors.slate400}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errorMessage) setErrorMessage(null);
              }}
            />
          </View>

          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputContainer}>
            <Mail size={18} color={colors.slate400} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="alex@example.com"
              placeholderTextColor={colors.slate400}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errorMessage) setErrorMessage(null);
              }}
            />
          </View>

          <Text style={styles.label}>Password (min 6 characters)</Text>
          <View style={styles.inputContainer}>
            <Lock size={18} color={colors.slate400} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.slate400}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errorMessage) setErrorMessage(null);
              }}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
              activeOpacity={0.7}
            >
              {showPassword ? (
                <EyeOff size={18} color={colors.slate500} />
              ) : (
                <Eye size={18} color={colors.slate500} />
              )}
            </TouchableOpacity>
          </View>

          {/* Privacy Preference Toggle */}
          <View style={styles.privacyBox}>
            <View style={styles.privacyHeader}>
              <Shield size={18} color={colors.sage600} style={{ marginRight: 6 }} />
              <Text style={styles.privacyTitle}>Admin Oversight Privacy</Text>
            </View>
            <Text style={styles.privacyDesc}>
              Allow superadmin clinical supervisors to read diary notes. When disabled, your raw journal text is strictly masked/redacted.
            </Text>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                {shareNotesWithAdmin ? 'Notes Shared' : 'Notes Confidential (Redacted)'}
              </Text>
              <Switch
                value={shareNotesWithAdmin}
                onValueChange={setShareNotesWithAdmin}
                trackColor={{ false: colors.slate300, true: colors.sage400 }}
                thumbColor={shareNotesWithAdmin ? colors.sage700 : colors.white}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
            onPress={handleRegister}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Create Free Account</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.signInLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.slate900,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: colors.slate500,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerBg,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.slate700,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 15,
    color: colors.slate900,
  },
  eyeButton: {
    padding: 6,
  },
  privacyBox: {
    backgroundColor: colors.slate50,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  privacyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.slate800,
  },
  privacyDesc: {
    fontSize: 12,
    color: colors.slate500,
    lineHeight: 17,
    marginBottom: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.slate700,
  },
  primaryButton: {
    backgroundColor: colors.sage600,
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    ...shadows.subtle,
  },
  disabledButton: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  footerText: {
    fontSize: 14,
    color: colors.slate500,
  },
  signInLink: {
    fontSize: 14,
    color: colors.sage700,
    fontWeight: '700',
  },
});
