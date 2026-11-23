/**
 * WITHUS Mobile — Secure Vaults Screen
 * Full parity with WITHUS Web Vaults:
 * - Create new encrypted vaults
 * - Add new credentials (username + password) directly to vaults
 * - Inspect credential metadata with AES-256 HSM encryption guarantees
 * - Delete vault & credentials with confirmation
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
  Alert,
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
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Create Vault Modal
  const [showCreateVaultModal, setShowCreateVaultModal] = useState(false);
  const [newVaultName, setNewVaultName] = useState('');
  const [newVaultDesc, setNewVaultDesc] = useState('');
  const [isSubmittingVault, setIsSubmittingVault] = useState(false);

  // Vault Detail & Secrets Modal
  const [selectedVault, setSelectedVault] = useState<VaultResponse | null>(null);
  const [vaultSecrets, setVaultSecrets] = useState<SecretMetadata[]>([]);
  const [isLoadingSecrets, setIsLoadingSecrets] = useState(false);
  const [secretsError, setSecretsError] = useState<string | null>(null);

  // Add Credential Modal
  const [showAddSecretModal, setShowAddSecretModal] = useState(false);
  const [newSecretName, setNewSecretName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newSecretDesc, setNewSecretDesc] = useState('');
  const [isSubmittingSecret, setIsSubmittingSecret] = useState(false);

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

  const handleCreateVault = async () => {
    if (!organization?.id || !newVaultName.trim() || isSubmittingVault) return;
    setIsSubmittingVault(true);
    setErrorMessage(null);

    try {
      const created = await ApiService.createVault(organization.id, {
        name: newVaultName.trim(),
        description: newVaultDesc.trim() || undefined,
      });
      setShowCreateVaultModal(false);
      setNewVaultName('');
      setNewVaultDesc('');
      setSuccessBanner(`Vault "${created.name}" created successfully.`);
      fetchVaults();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create vault.');
    } finally {
      setIsSubmittingVault(false);
    }
  };

  const handleDeleteVault = async (vaultId: string) => {
    if (!organization?.id) return;
    Alert.alert(
      'Delete Vault',
      'Are you sure you want to delete this vault? All contained credentials will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.deleteVault(organization.id, vaultId);
              if (selectedVault?.id === vaultId) {
                setSelectedVault(null);
              }
              setSuccessBanner('Vault deleted.');
              fetchVaults();
            } catch (err: any) {
              setErrorMessage(err.message || 'Failed to delete vault.');
            }
          },
        },
      ],
    );
  };

  const handleCreateSecret = async () => {
    if (!organization?.id || !selectedVault || !newSecretName.trim() || !newPassword || isSubmittingSecret) return;
    setIsSubmittingSecret(true);

    try {
      const plaintext = newUsername.trim()
        ? `${newUsername.trim()}\n${newPassword}`
        : newPassword;

      await ApiService.createSecret(organization.id, selectedVault.id, {
        name: newSecretName.trim(),
        plaintext,
        description: newSecretDesc.trim() || undefined,
        type: 'PASSWORD',
      });

      setShowAddSecretModal(false);
      setNewSecretName('');
      setNewUsername('');
      setNewPassword('');
      setNewSecretDesc('');
      setSuccessBanner('Credential added to vault.');
      handleOpenVault(selectedVault);
      fetchVaults();
    } catch (err: any) {
      setSecretsError(err.message || 'Failed to add credential.');
    } finally {
      setIsSubmittingSecret(false);
    }
  };

  const handleDeleteSecret = async (secretId: string) => {
    if (!organization?.id || !selectedVault) return;
    Alert.alert('Delete Credential', 'Permanently delete this credential?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await ApiService.deleteSecret(organization.id, selectedVault.id, secretId);
            handleOpenVault(selectedVault);
            fetchVaults();
          } catch (err: any) {
            setSecretsError(err.message || 'Failed to delete credential.');
          }
        },
      },
    ]);
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

      {/* Action Bar: New Vault & Search */}
      <View style={styles.topActionBar}>
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
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.newVaultButton}
          onPress={() => setShowCreateVaultModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.newVaultIcon}>＋</Text>
          <Text style={styles.newVaultText}>New Vault</Text>
        </TouchableOpacity>
      </View>

      {/* Success Notification */}
      {successBanner && (
        <View style={styles.successBanner}>
          <Text style={styles.successBannerText}>{successBanner}</Text>
          <TouchableOpacity onPress={() => setSuccessBanner(null)}>
            <Text style={styles.bannerCloseIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

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
              : 'Create your first secure vault to store encrypted credentials for team delegation.'}
          </Text>
          <TouchableOpacity
            style={styles.emptyActionBtn}
            onPress={() => setShowCreateVaultModal(true)}
          >
            <Text style={styles.emptyActionBtnText}>＋ Create New Vault</Text>
          </TouchableOpacity>
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

      {/* Create Vault Modal */}
      <Modal
        visible={showCreateVaultModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateVaultModal(false)}
      >
        <View style={styles.modalBackdropCenter}>
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Create Secure Vault</Text>
            <Text style={styles.formSubtitle}>
              Creates an isolated AES-256 encrypted container for workspace credentials.
            </Text>

            <Text style={styles.inputLabel}>Vault Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Production Credentials, GitHub Orgs"
              placeholderTextColor={COLORS.textTertiary}
              value={newVaultName}
              onChangeText={setNewVaultName}
              autoFocus
            />

            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]}
              placeholder="Purpose or platform tags for this vault..."
              placeholderTextColor={COLORS.textTertiary}
              value={newVaultDesc}
              onChangeText={setNewVaultDesc}
              multiline
            />

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => setShowCreateVaultModal(false)}
                disabled={isSubmittingVault}
              >
                <Text style={styles.btnSecondaryText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnPrimary, isSubmittingVault && styles.btnDisabled]}
                onPress={handleCreateVault}
                disabled={isSubmittingVault}
              >
                {isSubmittingVault ? (
                  <ActivityIndicator size="small" color={COLORS.bgDarkest} />
                ) : (
                  <Text style={styles.btnPrimaryText}>Create Vault</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Secrets Metadata & Management Modal */}
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
                <Text style={styles.modalLabel}>CREDENTIAL STORAGE</Text>
                <Text style={styles.modalVaultName} numberOfLines={1}>
                  {selectedVault?.name}
                </Text>
              </View>
              <View style={styles.headerRightActions}>
                <TouchableOpacity
                  style={styles.deleteVaultBtn}
                  onPress={() => selectedVault && handleDeleteVault(selectedVault.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.deleteVaultIcon}>🗑️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={handleCloseModal}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.modalCloseIcon}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Zero Disclosure Notice & Add Credential Button */}
            <View style={styles.vaultDetailSubHeader}>
              <View style={styles.securityNotice}>
                <Text style={styles.securityNoticeIcon}>🛡️</Text>
                <Text style={styles.securityNoticeText}>
                  Secrets are hardware-encrypted. Plaintext is only streamed directly into authorized WebViews.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.addSecretButton}
                onPress={() => setShowAddSecretModal(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.addSecretBtnIcon}>＋</Text>
                <Text style={styles.addSecretBtnText}>Add Credential</Text>
              </TouchableOpacity>
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
                <Text style={styles.emptyText}>
                  Tap "+ Add Credential" to securely store login credentials in this vault.
                </Text>
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
                          {item.type ? item.type.toUpperCase() : 'PASSWORD / CREDENTIAL'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteSecretBtn}
                        onPress={() => handleDeleteSecret(item.id)}
                      >
                        <Text style={styles.deleteSecretIcon}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                    {item.description ? (
                      <Text style={styles.secretDescription}>{item.description}</Text>
                    ) : null}
                    <Text style={styles.secretDate}>Added {formatDate(item.createdAt)}</Text>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Add Credential Modal */}
      <Modal
        visible={showAddSecretModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddSecretModal(false)}
      >
        <View style={styles.modalBackdropCenter}>
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Add Credential</Text>
            <Text style={styles.formSubtitle}>
              Store encrypted credentials in "{selectedVault?.name}".
            </Text>

            <Text style={styles.inputLabel}>Credential / Service Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. GitHub Account, Vercel Production"
              placeholderTextColor={COLORS.textTertiary}
              value={newSecretName}
              onChangeText={setNewSecretName}
            />

            <Text style={styles.inputLabel}>Permitted Username / Login ID</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. admin@company.com or username"
              placeholderTextColor={COLORS.textTertiary}
              value={newUsername}
              onChangeText={setNewUsername}
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Password / Token *</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
                placeholder="Enter raw password or token"
                placeholderTextColor={COLORS.textTertiary}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.textInput, { height: 50 }]}
              placeholder="e.g. Used for production deployment"
              placeholderTextColor={COLORS.textTertiary}
              value={newSecretDesc}
              onChangeText={setNewSecretDesc}
            />

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => setShowAddSecretModal(false)}
                disabled={isSubmittingSecret}
              >
                <Text style={styles.btnSecondaryText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnPrimary, isSubmittingSecret && styles.btnDisabled]}
                onPress={handleCreateSecret}
                disabled={isSubmittingSecret}
              >
                {isSubmittingSecret ? (
                  <ActivityIndicator size="small" color={COLORS.bgDarkest} />
                ) : (
                  <Text style={styles.btnPrimaryText}>Save Credential</Text>
                )}
              </TouchableOpacity>
            </View>
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
  topActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    gap: SPACING.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
    borderRadius: RADIUS.md,
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
  newVaultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentCyan,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 44,
  },
  newVaultIcon: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.bgDarkest,
    marginRight: 4,
  },
  newVaultText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.bgDarkest,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.emeraldSubtle,
    borderWidth: 1,
    borderColor: COLORS.emeraldBorder,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  successBannerText: {
    fontSize: 12,
    color: COLORS.textEmerald,
    fontWeight: '600',
    flex: 1,
  },
  bannerCloseIcon: {
    fontSize: 12,
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
    marginBottom: SPACING.lg,
  },
  emptyActionBtn: {
    backgroundColor: COLORS.accentCyan,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
  },
  emptyActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.bgDarkest,
  },
  modalBackdropCenter: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  formCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textWhite,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginBottom: SPACING.lg,
    lineHeight: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  textInput: {
    backgroundColor: COLORS.bgInput,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    color: COLORS.textWhite,
    fontSize: 13,
    marginBottom: SPACING.md,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  eyeToggle: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.bgInput,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: {
    fontSize: 16,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  btnSecondary: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgTertiary,
  },
  btnSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  btnPrimary: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accentCyan,
    minWidth: 110,
    alignItems: 'center',
  },
  btnPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.bgDarkest,
  },
  btnDisabled: {
    opacity: 0.5,
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
    maxHeight: '90%',
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
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  deleteVaultBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.roseSubtle,
    borderWidth: 1,
    borderColor: COLORS.roseBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteVaultIcon: {
    fontSize: 14,
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
  vaultDetailSubHeader: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
    gap: SPACING.sm,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cyanSubtle,
    borderWidth: 1,
    borderColor: COLORS.cyanBorder,
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
  addSecretButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accentCyan,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 2,
  },
  addSecretBtnIcon: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.bgDarkest,
    marginRight: 6,
  },
  addSecretBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.bgDarkest,
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
  deleteSecretBtn: {
    padding: SPACING.xs,
  },
  deleteSecretIcon: {
    fontSize: 14,
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
