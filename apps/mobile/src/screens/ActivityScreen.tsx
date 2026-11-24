/**
 * WITHUS Mobile — Live Activity Screen
 * Displays real-time presence telemetry and session activity across organization members.
 * Strictly reflects actual backend state from GET /organizations/:orgId/presence.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Organization } from '../types/auth.types';
import { PresenceRecord } from '../types/module.types';
import { ApiService, ApiError } from '../services/api.service';
import { AppHeader } from '../components/AppHeader';
import { PlatformBadge } from '../components/PlatformBadge';
import { COLORS, SPACING, RADIUS } from '../theme/theme';

interface ActivityScreenProps {
  organization: Organization | null;
  onOpenDrawer: () => void;
  onOpenOrgPicker: () => void;
}

export const ActivityScreen: React.FC<ActivityScreenProps> = ({
  organization,
  onOpenDrawer,
  onOpenOrgPicker,
}) => {
  const [presenceList, setPresenceList] = useState<PresenceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchPresence = useCallback(async () => {
    if (!organization?.id) {
      setErrorMessage('No organization selected.');
      setIsLoading(false);
      return;
    }

    setErrorMessage(null);
    try {
      const data = await ApiService.getPresence(organization.id);
      setPresenceList(data || []);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(err.message || 'Failed to fetch presence telemetry');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    fetchPresence();
  }, [fetchPresence]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchPresence();
  };

  const timeAgo = (isoDate: string) => {
    try {
      const ms = Date.now() - new Date(isoDate).getTime();
      const s = Math.floor(ms / 1000);
      if (s < 60) return `${Math.max(1, s)}s ago`;
      const m = Math.floor(s / 60);
      if (m < 60) return `${m}m ago`;
      const h = Math.floor(m / 60);
      if (h < 24) return `${h}h ago`;
      const d = Math.floor(h / 24);
      return `${d}d ago`;
    } catch {
      return isoDate;
    }
  };

  const filteredPresence = useMemo(() => {
    if (!searchQuery.trim()) return presenceList;
    const q = searchQuery.toLowerCase();
    return presenceList.filter(
      (p) =>
        (p.user?.fullName && p.user.fullName.toLowerCase().includes(q)) ||
        (p.user?.email && p.user.email.toLowerCase().includes(q)) ||
        p.platform.toLowerCase().includes(q),
    );
  }, [presenceList, searchQuery]);

  const activeCount = presenceList.filter((p) => p.isActive).length;

  const renderPresenceItem = ({ item }: { item: PresenceRecord }) => {
    const platformKey = item.platform.toUpperCase();
    const displayName = item.user?.fullName || item.user?.email?.split('@')[0] || 'Member';
    const email = item.user?.email || 'Unknown User';

    return (
      <View style={styles.activityCard}>
        <View style={styles.cardHeader}>
          <View style={styles.userRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.userMeta}>
              <Text style={styles.userName} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {email}
              </Text>
            </View>
          </View>

          {/* Active Status Badge */}
          {item.isActive ? (
            <View style={styles.activeBadge}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>ACTIVE</Text>
            </View>
          ) : (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveText}>OFFLINE</Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.platformRow}>
            <PlatformBadge platform={platformKey} size="small" />
            <Text style={styles.platformLabel}>{platformKey}</Text>
          </View>

          <View style={styles.timeRow}>
            <Text style={styles.timeIcon}>⏱️</Text>
            <Text style={styles.timeText}>{timeAgo(item.lastSeenAt)}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Activity"
        subtitle="PRESENCE & TELEMETRY"
        organization={organization}
        onOpenDrawer={onOpenDrawer}
        onOpenOrgPicker={onOpenOrgPicker}
      />

      {/* Telemetry Summary Banner */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{activeCount}</Text>
          <Text style={styles.summaryLabel}>Active Users</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{presenceList.length}</Text>
          <Text style={styles.summaryLabel}>Total Tracked</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>90s</Text>
          <Text style={styles.summaryLabel}>Window</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Filter by user or platform..."
          placeholderTextColor={COLORS.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearSearchIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main List Area */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accentCyan} />
          <Text style={styles.loadingText}>Fetching Live Telemetry...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Presence Unavailable</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchPresence}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredPresence.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>⚡</Text>
          <Text style={styles.emptyTitle}>No Activity Recorded</Text>
          <Text style={styles.emptyText}>
            {searchQuery
              ? `No presence records matching "${searchQuery}".`
              : 'No active session heartbeats reported by organization members in the current window.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredPresence}
          keyExtractor={(item, index) => `${item.userId}-${item.platform}-${index}`}
          renderItem={renderPresenceItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.accentCyan}
              colors={[COLORS.accentCyan]}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDarkest,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textWhite,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textTertiary,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.borderSubtle,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
    borderRadius: RADIUS.md,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    height: 44,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: SPACING.sm,
    color: COLORS.textTertiary,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textWhite,
    paddingVertical: 0,
  },
  clearSearchIcon: {
    fontSize: 14,
    color: COLORS.textSecondary,
    padding: SPACING.xs,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md,
  },
  activityCard: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accentNavy,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm + 2,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textWhite,
  },
  userMeta: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  userEmail: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 1,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.emeraldSubtle,
    borderWidth: 1,
    borderColor: COLORS.emeraldBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentEmerald,
    marginRight: 5,
  },
  activeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textEmerald,
    letterSpacing: 0.5,
  },
  inactiveBadge: {
    backgroundColor: COLORS.bgTertiary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  inactiveText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 0.5,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  timeText: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: SPACING.md,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  errorMessage: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  retryButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accentCyan,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.bgDarkest,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.xs,
    lineHeight: 18,
    maxWidth: 280,
  },
});

