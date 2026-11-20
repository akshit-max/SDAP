/**
 * WITHUS Mobile — Secure Vaults Screen
 * Lists encrypted credential vaults for the current organization.
 * Strictly adheres to security rules: metadata only, zero raw disclosure.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Organization } from '../types/auth.types';
import { VaultResponse, SecretMetadata } from '../types/module.types';
import { ApiService, ApiError } from '../services/api.service';
import { AppHeader } from '../components/AppHeader';
import { COLORS, SPACING, RADIUS } from '../theme/theme';

interface VaultsScreenProps {
  organization: Organization | null;
  onOpenDrawer: () => void;
  onOpenOrgPicker: () => void;
}

export const VaultsScreen: React.FC<VaultsScreenProps> = ({
  organization,
  onOpenDrawer,
  onOpenOrgPicker,
}) => {
  const [vaults, setVaults] = useState<VaultResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal state for viewing secrets metadata inside a vault
  const [selectedVault, setSelectedVault] = useState<VaultResponse | null>(null);
  const [vaultSecrets, setVaultSecrets] = useState<SecretMetadata[]>([]);
  const [isLoadingSecrets, setIsLoadingSecrets] = useState(false);
  const [secretsError, setSecretsError] = useState<string | null>(null);

  const fetchVaults = useCallback(async () => {
    if (!organization?.id) {
      setErrorMessage('No organization selected.');
      setIsLoading(false);
      return;
    }

    setErrorMessage(null);
    try {
      const data = await ApiService.getVaults(organization.id, 1, 50);
      setVaults(data.items || []);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(err.message || 'Failed to load organization vaults');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    fetchVaults();
  }, [fetchVaults]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchVaults();
  };

  const handleOpenVault = async (vault: VaultResponse) => {
    if (!organization?.id) return;
    setSelectedVault(vault);
    setIsLoadingSecrets(true);
    setSecretsError(null);
    setVaultSecrets([]);

    try {
      const secrets = await ApiService.getVaultSecrets(organization.id, vault.id);
      setVaultSecrets(secrets);
    } catch (err: any) {
      setSecretsError(err.message || 'Failed to load vault credentials metadata');
    } finally {
      setIsLoadingSecrets(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedVault(null);
    setVaultSecrets([]);
    setSecretsError(null);
  };

  const filteredVaults = useMemo(() => {
    if (!searchQuery.trim()) return vaults;
    const q = searchQuery.toLowerCase();
    return vaults.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        (v.description && v.description.toLowerCase().includes(q)),
    );
  }, [vaults, searchQuery]);

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

  const renderVaultItem = ({ item }: { item: VaultResponse }) => {
    const secretCount =
      typeof item.secretsCount === 'number'
        ? item.secretsCount
        : item._count?.secrets ?? 0;

    return (
      <TouchableOpacity
        style={styles.vaultCard}
        onPress={() => handleOpenVault(item)}
        activeOpacity={0.8}
      >
        <View style={styles.vaultCardHeader}>
          <View style={styles.vaultTitleGroup}>
            <View style={styles.vaultIconBox}>
              <Text style={styles.vaultEmoji}>🔐</Text>
            </View>
            <View style={styles.vaultHeaderText}>
              <Text style={styles.vaultName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.cryptoBadge}>
                <View style={styles.cryptoDot} />
                <Text style={styles.cryptoText}>AES-256 ENCRYPTED</Text>
              </View>
            </View>
          </View>
          <Text style={styles.chevronIcon}>›</Text>
        </View>

        <Text style={styles.vaultDescription} numberOfLines={2}>
          {item.description || 'Secure credential storage for workspace secrets and delegated login access.'}
        </Text>

        <View style={styles.vaultFooter}>
          <View style={styles.metaPill}>
            <Text style={styles.metaIcon}>🔑</Text>
            <Text style={styles.metaText}>
              {secretCount} {secretCount === 1 ? 'Credential' : 'Credentials'}
            </Text>
          </View>
          <Text style={styles.vaultDateText}>{formatDate(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Vaults"
        subtitle="CREDENTIAL STORAGE"
        organization={organization}
        onOpenDrawer={onOpenDrawer}
        onOpenOrgPicker={onOpenOrgPicker}
      />

      {/* Search Input Bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search vaults..."
          placeholderTextColor={COLORS.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.clearSearchIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main List Area */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accentCyan} />
          <Text style={styles.loadingText}>Decrypting Vault Registry...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Error Loading Vaults</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchVaults}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredVaults.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔐</Text>
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No Matching Vaults' : 'No Vaults Found'}
          </Text>
          <Text style={styles.emptyText}>
            {searchQuery
              ? `No vaults matching "${searchQuery}" in this workspace.`
              : 'No vaults have been created in this organization yet. Vaults are provisioned via the WITHUS Web Console.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredVaults}
          keyExtractor={(item) => item.id}
          renderItem={renderVaultItem}
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

      {/* Secrets Metadata Inspection Modal */}
      <Modal
        visible={selectedVault !== null}
        animationType="slide"
        transparent
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleGroup}>
                <Text style={styles.modalLabel}>CREDENTIAL METADATA</Text>
                <Text style={styles.modalVaultName} numberOfLines={1}>
                  {selectedVault?.name}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={handleCloseModal}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Zero Disclosure Notice */}
            <View style={styles.securityNotice}>
              <Text style={styles.securityNoticeIcon}>🛡️</Text>
              <Text style={styles.securityNoticeText}>
                Secret values remain encrypted in the backend HSM. Zero plaintext exposure to mobile client.
              </Text>
            </View>

            {/* Secrets List inside Modal */}
            {isLoadingSecrets ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="small" color={COLORS.accentCyan} />
                <Text style={styles.modalLoadingText}>Loading credentials metadata...</Text>
              </View>
            ) : secretsError ? (
              <View style={styles.modalError}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorMessage}>{secretsError}</Text>
              </View>
            ) : vaultSecrets.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Text style={styles.emptyIcon}>🗝️</Text>
                <Text style={styles.emptyTitle}>No Credentials in Vault</Text>
                <Text style={styles.emptyText}>This vault does not contain any secret entries yet.</Text>
              </View>
            ) : (
              <FlatList
                data={vaultSecrets}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.secretsList}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={styles.secretCard}>
                    <View style={styles.secretCardHeader}>
                      <View style={styles.secretIconBox}>
                        <Text style={styles.secretKeyEmoji}>🔑</Text>
                      </View>
                      <View style={styles.secretMetaGroup}>
                        <Text style={styles.secretName}>{item.name}</Text>
                        <Text style={styles.secretType}>
                          {item.type ? item.type.toUpperCase() : 'PASSWORD / SECRET'}
                        </Text>
                      </View>
                      <View style={styles.secretEncryptedPill}>
                        <Text style={styles.secretEncryptedText}>ENCRYPTED</Text>
                      </View>
                    </View>
                    {item.description ? (
                      <Text style={styles.secretDescription}>{item.description}</Text>
                    ) : null}
                    <Text style={styles.secretDate}>
                      Added {formatDate(item.createdAt)}
                    </Text>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
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
  vaultCard: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
  },
  vaultCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  vaultTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vaultIconBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.cyanSubtle,
    borderWidth: 1,
    borderColor: COLORS.cyanBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  vaultEmoji: {
    fontSize: 18,
  },
  vaultHeaderText: {
    flex: 1,
  },
  vaultName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  cryptoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  cryptoDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.accentEmerald,
    marginRight: 5,
  },
  cryptoText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textEmerald,
    letterSpacing: 0.5,
  },
  chevronIcon: {
    fontSize: 22,
    color: COLORS.textTertiary,
    marginLeft: SPACING.sm,
  },
  vaultDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginVertical: SPACING.xs,
  },
  vaultFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingTop: SPACING.sm + 2,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgTertiary,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  metaIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  vaultDateText: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
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
    padding: SPACING.xxl,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: SPACING.md,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textWhite,
    marginBottom: SPACING.xs,
  },
  errorMessage: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: 'center',
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
    padding: SPACING.xxl,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textWhite,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.bgPrimary,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '85%',
    paddingBottom: SPACING.xxxl,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderMedium,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  modalTitleGroup: {
    flex: 1,
  },
  modalLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1,
  },
  modalVaultName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textWhite,
    marginTop: 2,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseIcon: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cyanSubtle,
    borderWidth: 1,
    borderColor: COLORS.cyanBorder,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  securityNoticeIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  securityNoticeText: {
    fontSize: 11,
    color: COLORS.textCyan,
    flex: 1,
    lineHeight: 15,
  },
  modalLoading: {
    padding: SPACING.xxxl,
    alignItems: 'center',
  },
  modalLoadingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  modalError: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  modalEmpty: {
    padding: SPACING.xxxl,
    alignItems: 'center',
  },
  secretsList: {
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  secretCard: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
  },
  secretCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  secretIconBox: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  secretKeyEmoji: {
    fontSize: 14,
  },
  secretMetaGroup: {
    flex: 1,
  },
  secretName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  secretType: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textTertiary,
    letterSpacing: 0.5,
    marginTop: 1,
  },
  secretEncryptedPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.emeraldSubtle,
    borderWidth: 1,
    borderColor: COLORS.emeraldBorder,
  },
  secretEncryptedText: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.textEmerald,
    letterSpacing: 0.5,
  },
  secretDescription: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    lineHeight: 16,
  },
  secretDate: {
    fontSize: 10,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
  },
});

