/**
 * WITHUS Mobile — Team Members Screen
 * Lists organization members and their role assignments (OWNER, ADMIN, MEMBER).
 * Respects role-based access control policies.
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
import { OrganizationMember } from '../types/module.types';
import { ApiService, ApiError } from '../services/api.service';
import { AppHeader } from '../components/AppHeader';
import { COLORS, SPACING, RADIUS } from '../theme/theme';

interface TeamScreenProps {
  organization: Organization | null;
  onOpenDrawer: () => void;
  onOpenOrgPicker: () => void;
}

export const TeamScreen: React.FC<TeamScreenProps> = ({
  organization,
  onOpenDrawer,
  onOpenOrgPicker,
}) => {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!organization?.id) {
      setErrorMessage('No organization selected.');
      setIsLoading(false);
      return;
    }

    setErrorMessage(null);
    try {
      const data = await ApiService.getMembers(organization.id);
      setMembers(data || []);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(err.message || 'Failed to load team members');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchMembers();
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  const getRoleStyle = (role: string) => {
    switch (role.toUpperCase()) {
      case 'OWNER':
        return {
          bg: COLORS.amberSubtle,
          border: COLORS.amberBorder,
          text: COLORS.textAmber,
          icon: '👑',
        };
      case 'ADMIN':
        return {
          bg: COLORS.cyanSubtle,
          border: COLORS.cyanBorder,
          text: COLORS.textCyan,
          icon: '🛡️',
        };
      default:
        return {
          bg: COLORS.bgTertiary,
          border: COLORS.borderMedium,
          text: COLORS.textSecondary,
          icon: '👤',
        };
    }
  };

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase();
    return members.filter(
      (m) =>
        (m.user?.fullName && m.user.fullName.toLowerCase().includes(q)) ||
        (m.user?.email && m.user.email.toLowerCase().includes(q)) ||
        m.role.toLowerCase().includes(q),
    );
  }, [members, searchQuery]);

  const renderMemberItem = ({ item }: { item: OrganizationMember }) => {
    const roleStyle = getRoleStyle(item.role);
    const displayName = item.user?.fullName || item.user?.email?.split('@')[0] || 'Member';
    const email = item.user?.email || 'Unknown User';

    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          {/* Avatar */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {email}
            </Text>
          </View>

          {/* Role Badge */}
          <View
            style={[
              styles.roleBadge,
              { backgroundColor: roleStyle.bg, borderColor: roleStyle.border },
            ]}
          >
            <Text style={styles.roleIcon}>{roleStyle.icon}</Text>
            <Text style={[styles.roleText, { color: roleStyle.text }]}>
              {item.role.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.joinedText}>Joined {formatDate(item.joinedAt)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Team"
        subtitle="ORGANIZATION ROSTER"
        organization={organization}
        onOpenDrawer={onOpenDrawer}
        onOpenOrgPicker={onOpenOrgPicker}
      />

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search team members..."
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
          <Text style={styles.loadingText}>Loading Member Roster...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Error Loading Team</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchMembers}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredMembers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyTitle}>No Members Found</Text>
          <Text style={styles.emptyText}>
            {searchQuery
              ? `No members matching "${searchQuery}".`
              : 'No members in this organization yet.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredMembers}
          keyExtractor={(item) => item.id || item.userId}
          renderItem={renderMemberItem}
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
  card: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accentNavy,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textWhite,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  userEmail: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 1,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  roleIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardFooter: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  joinedText: {
    fontSize: 10,
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

