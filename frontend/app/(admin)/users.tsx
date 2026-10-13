import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  ChevronRight,
  Clock,
  BookOpen,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react-native';
import { colors, radii, spacing, shadows } from '../../theme';
import { adminService } from '../../services/api';
import { AdminUserItem } from '../../types';

// Format time ago helper
function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return 'No logs yet';
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now.getTime() - past.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;
  return past.toLocaleDateString();
}

export default function AdminUsersScreen() {
  const router = useRouter();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => adminService.getUsers(),
  });

  const users = data?.users || [];

  const renderUserItem = ({ item }: { item: AdminUserItem }) => {
    const notesShared = item.privacySettings?.shareNotesWithAdmin ?? true;

    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() =>
          router.push({
            pathname: '/(admin)/[userId]/report',
            params: { userId: item.id },
          })
        }
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
          <ChevronRight size={18} color={colors.slate400} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <BookOpen size={13} color={colors.slate500} style={{ marginRight: 4 }} />
            <Text style={styles.statLabel}>
              {item.totalEntries} {item.totalEntries === 1 ? 'Log' : 'Logs'}
            </Text>
          </View>

          <View style={styles.statBox}>
            <Clock size={13} color={colors.slate500} style={{ marginRight: 4 }} />
            <Text style={styles.statLabel}>
              Last: {formatTimeAgo(item.lastCheckIn)}
            </Text>
          </View>

          {/* Privacy Indicator Badge */}
          <View
            style={[
              styles.privacyBadge,
              notesShared ? styles.privacyBadgeShared : styles.privacyBadgeMasked,
            ]}
          >
            {notesShared ? (
              <ShieldCheck size={12} color={colors.sage700} style={{ marginRight: 3 }} />
            ) : (
              <ShieldAlert size={12} color={colors.rose700} style={{ marginRight: 3 }} />
            )}
            <Text
              style={[
                styles.privacyBadgeText,
                notesShared ? styles.privacyTextShared : styles.privacyTextMasked,
              ]}
            >
              {notesShared ? 'Notes Shared' : 'Notes Private'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.summaryBar}>
          <View style={styles.summaryRow}>
            <Users size={18} color={colors.slate700} style={{ marginRight: 6 }} />
            <Text style={styles.summaryTitle}>Member Directory</Text>
          </View>
          <Text style={styles.summaryCount}>
            {users.length} {users.length === 1 ? 'User' : 'Users'} Registered
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.sage600} />
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={renderUserItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={colors.sage600}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>No standard users found</Text>
                <Text style={styles.emptySub}>
                  When users register for the platform, they will appear in this directory.
                </Text>
              </View>
            }
          />
        )}
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
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.slate900,
  },
  summaryCount: {
    fontSize: 13,
    color: colors.slate500,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userCard: {
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
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.sage100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.sage900,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.slate900,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: colors.slate500,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.slate50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  statLabel: {
    fontSize: 11,
    color: colors.slate600,
    fontWeight: '500',
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  privacyBadgeShared: {
    backgroundColor: colors.sage50,
    borderColor: colors.sage200,
  },
  privacyBadgeMasked: {
    backgroundColor: colors.rose50,
    borderColor: colors.rose200,
  },
  privacyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  privacyTextShared: {
    color: colors.sage700,
  },
  privacyTextMasked: {
    color: colors.rose700,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.slate700,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: colors.slate400,
    textAlign: 'center',
    maxWidth: 240,
  },
});
