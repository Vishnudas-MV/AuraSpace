import { create } from 'zustand';
import * as LocalAuthentication from 'expo-local-authentication';
import { User, IPrivacySettings } from '../types';
import {
  secureStorage,
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
  BIOMETRIC_SETTING_KEY,
  authService,
} from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isBiometricEnabled: boolean;
  isBiometricLocked: boolean;

  // Actions
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  updatePrivacySettings: (privacySettings: IPrivacySettings) => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<boolean>;
  unlockApp: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  isBiometricEnabled: false,
  isBiometricLocked: false,

  login: async (token: string, user: User) => {
    await secureStorage.setItem(TOKEN_STORAGE_KEY, token);
    await secureStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

    const biometricSaved = await secureStorage.getItem(BIOMETRIC_SETTING_KEY);
    const isBiometricEnabled = biometricSaved === 'true';

    set({
      token,
      user,
      isAuthenticated: true,
      isLoading: false,
      isBiometricEnabled,
      isBiometricLocked: false,
    });
  },

  logout: async () => {
    await secureStorage.deleteItem(TOKEN_STORAGE_KEY);
    await secureStorage.deleteItem(USER_STORAGE_KEY);
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isBiometricLocked: false,
    });
  },

  restoreSession: async () => {
    set({ isLoading: true });
    try {
      const [token, userJson, biometricSaved] = await Promise.all([
        secureStorage.getItem(TOKEN_STORAGE_KEY),
        secureStorage.getItem(USER_STORAGE_KEY),
        secureStorage.getItem(BIOMETRIC_SETTING_KEY),
      ]);

      const isBiometricEnabled = biometricSaved === 'true';

      if (token && userJson) {
        const cachedUser: User = JSON.parse(userJson);

        // If biometric is enabled, start app locked until unlocked
        const shouldLock = isBiometricEnabled;

        set({
          token,
          user: cachedUser,
          isAuthenticated: true,
          isLoading: false,
          isBiometricEnabled,
          isBiometricLocked: shouldLock,
        });

        // Silently fetch fresh user profile in background
        authService
          .getMe()
          .then(async (res) => {
            if (res.success && res.user) {
              set({ user: res.user });
              await secureStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.user));
            }
          })
          .catch((err) => {
            console.warn('[AuthStore] Background session validation skipped/failed:', err?.message);
          });
      } else {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isBiometricLocked: false,
        });
      }
    } catch (error) {
      console.error('[AuthStore] Error restoring session:', error);
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isBiometricLocked: false,
      });
    }
  },

  updatePrivacySettings: async (privacySettings: IPrivacySettings) => {
    const currentUser = get().user;
    if (!currentUser) return;

    try {
      const res = await authService.updatePrivacy(privacySettings.shareNotesWithAdmin);
      const updatedUser: User = {
        ...currentUser,
        privacySettings: res.privacySettings,
      };

      set({ user: updatedUser });
      await secureStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    } catch (error) {
      console.error('[AuthStore] Failed to sync privacy settings:', error);
      throw error;
    }
  },

  setBiometricEnabled: async (enabled: boolean): Promise<boolean> => {
    try {
      if (enabled) {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) {
          return false;
        }

        // Test authentication before enabling
        const authResult = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Confirm biometric identity to enable app lock',
          cancelLabel: 'Cancel',
          fallbackLabel: 'Use Passcode',
        });

        if (!authResult.success) {
          return false;
        }
      }

      await secureStorage.setItem(BIOMETRIC_SETTING_KEY, enabled ? 'true' : 'false');
      set({ isBiometricEnabled: enabled });
      return true;
    } catch (error) {
      console.error('[AuthStore] Biometric toggle error:', error);
      return false;
    }
  },

  unlockApp: async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Mental Wellness App',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Enter Passcode',
      });

      if (result.success) {
        set({ isBiometricLocked: false });
        return true;
      }
      return false;
    } catch (error) {
      console.error('[AuthStore] Biometric unlock error:', error);
      return false;
    }
  },
}));
