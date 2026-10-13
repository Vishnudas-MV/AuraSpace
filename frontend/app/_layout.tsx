import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme';
import { BiometricLockOverlay } from '../components/BiometricLockOverlay';
import { HeartHandshake } from 'lucide-react-native';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
    },
  },
});

function RootNavigationLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading, isBiometricLocked, restoreSession } =
    useAuthStore();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if unauthenticated
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to tabs if already authenticated
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.brandBadge}>
          <HeartHandshake size={44} color={colors.sage600} />
        </View>
        <Text style={styles.brandTitle}>Mental Wellness</Text>
        <Text style={styles.brandSubtitle}>Your Emotion Diary & Insights</Text>
        <ActivityIndicator
          size="large"
          color={colors.sage600}
          style={styles.spinner}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal/log-emotion"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>

      {/* Biometric Lock Overlay */}
      {isBiometricLocked && <BiometricLockOverlay />}
    </View>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootNavigationLayout />
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  brandBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.sage50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.slate900,
    marginBottom: 6,
  },
  brandSubtitle: {
    fontSize: 14,
    color: colors.slate500,
    marginBottom: 28,
  },
  spinner: {
    marginTop: 12,
  },
});
