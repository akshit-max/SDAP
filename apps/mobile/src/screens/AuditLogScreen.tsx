/**
 * WITHUS Mobile — Audit Log Screen
 * Immutable security event timeline for the current organization.
 * Strictly formatted metadata with zero credential disclosure.
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
import { AuditEvent } from '../types/module.types';
import { ApiService, ApiError } from '../services/api.service';
import { AppHeader } from '../components/AppHeader';
import { COLORS, SPACING, RADIUS } from '../theme/theme';

interface AuditLogScreenProps {
  organization: Organization | null;
  onOpenDrawer: () => void;
  onOpenOrgPicker: () => void;
}

interface ActionBadgeConfig {
  label: string;
  icon: string;
  badgeBg: string;
  badgeBorder: string;
  textColor: string;
}

const ACTION_MAP: Record<string, ActionBadgeConfig> = {
  'secret.created': {
    label: 'Secret Created',
    icon: '➕',
    badgeBg: COLORS.emeraldSubtle,
    badgeBorder: COLORS.emeraldBorder,
    textColor: COLORS.textEmerald,
  },
  'secret.revealed': {
    label: 'Secret Revealed',
    icon: '👁️',
    badgeBg: COLORS.purpleSubtle,
    badgeBorder: COLORS.purpleBorder,
    textColor: COLORS.accentBlue,
  },
  'session.created': {
    label: 'Session Granted',
    icon: '🛡️',
    badgeBg: COLORS.cyanSubtle,
    badgeBorder: COLORS.cyanBorder,
    textColor: COLORS.textCyan,
  },
  'session.revoked': {
    label: 'Session Revoked',
    icon: '🚫',
    badgeBg: COLORS.roseSubtle,
    badgeBorder: COLORS.roseBorder,
    textColor: COLORS.textRose,
  },
  'approval.approved': {
    label: 'Approval Granted',
    icon: '✅',
    badgeBg: COLORS.emeraldSubtle,
    badgeBorder: COLORS.emeraldBorder,
    textColor: COLORS.textEmerald,
  },
  'approval.rejected': {
    label: 'Approval Denied',
    icon: '✕',
    badgeBg: COLORS.roseSubtle,
    badgeBorder: COLORS.roseBorder,
    textColor: COLORS.textRose,
  },
  'user.login': {
    label: 'User Login',
    icon: '🔑',
    badgeBg: COLORS.bgTertiary,
    badgeBorder: COLORS.borderMedium,
    textColor: COLORS.textSecondary,
  },
  'user.logout': {
    label: 'User Logout',
    icon: '🚪',
    badgeBg: COLORS.bgTertiary,
    badgeBorder: COLORS.borderMedium,
    textColor: COLORS.textSecondary,
  },
};

const DEFAULT_ACTION: ActionBadgeConfig = {
  label: 'Audit Event',
  icon: '📜',
  badgeBg: COLORS.bgTertiary,
  badgeBorder: COLORS.borderMedium,
  textColor: COLORS.textSecondary,
};

export const AuditLogScreen: React.FC<AuditLogScreenProps> = ({
  organization,
  onOpenDrawer,
  onOpenOrgPicker,
}) => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchAuditEvents = useCallback(async () => {
    if (!organization?.id) {
      setErrorMessage('No organization selected.');
      setIsLoading(false);
      return;
    }

    setErrorMessage(null);
    try {
      const data = await ApiService.getAuditEvents(organization.id, {
        page: 1,
        limit: 50,
      });
      setEvents(data.items || []);
      setTotalCount(data.total || (data.items || []).length);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(err.message || 'Failed to load audit records');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    fetchAuditEvents();
  }, [fetchAuditEvents]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchAuditEvents();
  };

  const timeAgo = (isoDate: string) => {
    try {
      const ms = Date.now() - new Date(isoDate).getTime();
      const s = Math.floor(ms / 1000);
      if (s < 60) return 'just now';
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

  const getActionConfig = (action: string): ActionBadgeConfig => {
    if (ACTION_MAP[action]) return ACTION_MAP[action];
    const cleanLabel = action
      .split('.')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return {
      ...DEFAULT_ACTION,
      label: cleanLabel,
    };
  };

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const q = searchQuery.toLowerCase();
    return events.filter(
      (e) =>
        e.action.toLowerCase().includes(q) ||
        (e.actor?.email && e.actor.email.toLowerCase().includes(q)) ||
        (e.resourceId && e.resourceId.toLowerCase().includes(q)),
    );
  }, [events, searchQuery]);

  const renderEventItem = ({ item }: { item: AuditEvent }) => {
    const actionConfig = getActionConfig(item.action);
    const actorEmail = item.actor?.email || item.actorId || 'System';

    return (
      <View style={styles.eventCard}>
        <View style={styles.eventCardHeader}>
          <View
            style={[
              styles.actionPill,
              {
                backgroundColor: actionConfig.badgeBg,
                borderColor: actionConfig.badgeBorder,
              },
            ]}
          >
            <Text style={styles.actionIcon}>{actionConfig.icon}</Text>
            <Text style={[styles.actionLabel, { color: actionConfig.textColor }]}>
              {actionConfig.label}
            </Text>
          </View>
          <Text style={styles.timeText}>{timeAgo(item.createdAt)}</Text>
        </View>

        {/* Actor Info */}
        <View style={styles.actorRow}>
          <Text style={styles.actorLabel}>ACTOR:</Text>
          <Text style={styles.actorValue} numberOfLines={1}>
            {actorEmail}
          </Text>
        </View>

        {/* Target Resource if any */}
        {item.resourceId ? (
          <View style={styles.resourceRow}>
            <Text style={styles.resourceLabel}>RESOURCE:</Text>
            <Text style={styles.resourceValue} numberOfLines={1}>
              {item.resourceId}
            </Text>
          </View>
        ) : null}

        {/* Action Raw Key */}
        <View style={styles.eventFooter}>
          <Text style={styles.rawActionKey}>{item.action}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Audit Log"
        subtitle="IMMUTABLE TIMELINE"
        organization={organization}
        onOpenDrawer={onOpenDrawer}
        onOpenOrgPicker={onOpenOrgPicker}
      />

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Filter by action or actor..."
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
          <Text style={styles.loadingText}>Fetching Security Ledger...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Error Loading Audit Log</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAuditEvents}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredEvents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📜</Text>
          <Text style={styles.emptyTitle}>No Audit Events</Text>
          <Text style={styles.emptyText}>
            {searchQuery
              ? `No audit events matching "${searchQuery}".`
              : 'No security actions have been logged in this organization yet.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          renderItem={renderEventItem}
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
  eventCard: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  actionIcon: {
    fontSize: 11,
    marginRight: 5,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  actorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  actorLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textTertiary,
    width: 60,
  },
  actorValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textWhite,
    flex: 1,
  },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  resourceLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textTertiary,
    width: 60,
  },
  resourceValue: {
    fontSize: 11,
    color: COLORS.textSecondary,
    flex: 1,
  },
  eventFooter: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  rawActionKey: {
    fontSize: 9,
    color: COLORS.textTertiary,
    fontFamily: 'monospace',
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

