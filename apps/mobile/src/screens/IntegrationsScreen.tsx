/**
 * WITHUS Mobile — Integrations Screen
 * Displays connected third-party platform integrations (GitHub, Vercel, GoDaddy, Gmail)
 * and their operational health states.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Organization } from '../types/auth.types';
import { IntegrationConnection } from '../types/module.types';
import { ApiService, ApiError } from '../services/api.service';
import { AppHeader } from '../components/AppHeader';
import { PlatformBadge } from '../components/PlatformBadge';
import { COLORS, SPACING, RADIUS } from '../theme/theme';

interface IntegrationsScreenProps {
  organization: Organization | null;
  onOpenDrawer: () => void;
  onOpenOrgPicker: () => void;
}

interface ProviderDefinition {
  id: string;
  name: string;
  description: string;
  authType: 'OAUTH' | 'PAT';
}

const SUPPORTED_PROVIDERS: ProviderDefinition[] = [
  {
    id: 'GMAIL',
    name: 'Google Workspace Gmail',
    description: 'Enables automatic extraction of one-time password (OTP) codes from organization mailbox.',
    authType: 'OAUTH',
  },
  {
    id: 'VERCEL',
    name: 'Vercel Enterprise',
    description: 'Native team access delegation and deployment environment management.',
    authType: 'PAT',
  },
  {
    id: 'GITHUB',
    name: 'GitHub Cloud / Enterprise',
    description: 'Automated repository collaborator and organization team access delegation.',
    authType: 'PAT',
  },
  {
    id: 'GODADDY',
    name: 'GoDaddy Domains & DNS',
    description: 'Delegated domain management and two-step verification access.',
    authType: 'PAT',
  },
];

export const IntegrationsScreen: React.FC<IntegrationsScreenProps> = ({
  organization,
  onOpenDrawer,
  onOpenOrgPicker,
}) => {
  const [connections, setConnections] = useState<IntegrationConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchIntegrations = useCallback(async () => {
    if (!organization?.id) {
      setErrorMessage('No organization selected.');
      setIsLoading(false);
      return;
    }

    setErrorMessage(null);
    try {
      const data = await ApiService.getIntegrations(organization.id);
      setConnections(data || []);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(err.message || 'Failed to load integrations');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchIntegrations();
  };

  const getConnectionForProvider = (providerId: string): IntegrationConnection | undefined => {
    return connections.find(
      (c) => c.provider.toUpperCase() === providerId.toUpperCase(),
    );
  };

  const renderProviderCard = ({ item }: { item: ProviderDefinition }) => {
    const conn = getConnectionForProvider(item.id);
    const isConnected = conn?.status === 'ACTIVE';
    const isError = conn?.status === 'ERROR';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.providerRow}>
            <PlatformBadge platform={item.id} size="medium" />
            <View style={styles.providerMeta}>
              <Text style={styles.providerName}>{item.name}</Text>
              <Text style={styles.authTypeBadge}>
                {item.authType === 'OAUTH' ? 'OAuth 2.0' : 'Personal Access Token'}
              </Text>
            </View>
          </View>

          {/* Status Badge */}
          {isConnected ? (
            <View style={styles.connectedBadge}>
              <View style={styles.connectedDot} />
              <Text style={styles.connectedText}>Connected</Text>
            </View>
          ) : isError ? (
            <View style={styles.errorBadge}>
              <View style={styles.errorDot} />
              <Text style={styles.errorText}>Error</Text>
            </View>
          ) : (
            <View style={styles.notConnectedBadge}>
              <Text style={styles.notConnectedText}>Not Connected</Text>
            </View>
          )}
        </View>

        <Text style={styles.cardDescription}>{item.description}</Text>

        {conn?.lastCheckedAt ? (
          <View style={styles.cardFooter}>
            <Text style={styles.lastCheckedText}>
              Last verified: {new Date(conn.lastCheckedAt).toLocaleDateString()}
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Integrations"
        subtitle="CONNECTED PLATFORMS"
        organization={organization}
        onOpenDrawer={onOpenDrawer}
        onOpenOrgPicker={onOpenOrgPicker}
      />

      {/* Info Notice Banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoIcon}>ℹ️</Text>
        <Text style={styles.infoText}>
          Platform OAuth authorizations and Personal Access Tokens are configured securely through the WITHUS Web Console.
        </Text>
      </View>

      {/* Main List Area */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accentCyan} />
          <Text style={styles.loadingText}>Checking Integration Status...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Error Loading Integrations</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchIntegrations}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={SUPPORTED_PROVIDERS}
          keyExtractor={(item) => item.id}
          renderItem={renderProviderCard}
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  infoText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 16,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  providerMeta: {
    marginLeft: SPACING.sm + 2,
    flex: 1,
  },
  providerName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  authTypeBadge: {
    fontSize: 10,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.emeraldSubtle,
    borderWidth: 1,
    borderColor: COLORS.emeraldBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  connectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentEmerald,
    marginRight: 5,
  },
  connectedText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textEmerald,
  },
  errorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.roseSubtle,
    borderWidth: 1,
    borderColor: COLORS.roseBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  errorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentRose,
    marginRight: 5,
  },
  errorText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textRose,
  },
  notConnectedBadge: {
    backgroundColor: COLORS.bgTertiary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  notConnectedText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textTertiary,
  },
  cardDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginTop: SPACING.xs,
  },
  cardFooter: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  lastCheckedText: {
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
});

