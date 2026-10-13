import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme';

export default function AdminLayout() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    // Strict role check: If user is not superadmin, route back to tabs
    if (!isAuthenticated || user?.role !== 'superadmin') {
      router.replace('/(tabs)');
    }
  }, [user, isAuthenticated, isLoading, router]);

  if (!isAuthenticated || user?.role !== 'superadmin') {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.slate900,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: true,
      }}
    >
      <Stack.Screen
        name="users"
        options={{
          title: 'Superadmin Directory',
          headerBackTitle: 'Tabs',
        }}
      />
      <Stack.Screen
        name="[userId]/report"
        options={{
          title: 'Emotional Journey Report',
          headerBackTitle: 'Users',
        }}
      />
    </Stack>
  );
}
