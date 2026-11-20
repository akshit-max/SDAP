/**
 * WITHUS Mobile — Delegated Access Approvals Screen
 * Review incoming access requests & track personal access authorization requests.
 * Fully supports Approve & Reject operations with reason prompts and confirmation.
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import { UserProfile, Organization } from '../types/auth.types';
import { ApprovalRequest } from '../types/module.types';
import { ApiService, ApiError } from '../services/api.service';
import { AppHeader } from '../components/AppHeader';
import { PlatformBadge } from '../components/PlatformBadge';
import { COLORS, SPACING, RADIUS } from '../theme/theme';

interface ApprovalsScreenProps {
  user: UserProfile;
  organization: Organization | null;
  onOpenDrawer: () => void;
  onOpenOrgPicker: () => void;
}

export const ApprovalsScreen: React.FC<ApprovalsScreenProps> = ({
  user,
  organization,
  onOpenDrawer,
  onOpenOrgPicker,
}) => {
  const [activeTab, setActiveTab] = useState<'PENDING' | 'MY_REQUESTS'>('PENDING');
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);
  const [myRequests, setMyRequests] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Rejection modal state
  const [rejectingApprovalId, setRejectingApprovalId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingResolve, setIsSubmittingResolve] = useState(false);

  const fetchApprovals = useCallback(async () => {
    if (!organization?.id) {
      setErrorMessage('No organization selected.');
      setIsLoading(false);
      return;
    }

    setErrorMessage(null);
    try {
      const [pendingData, requestsData] = await Promise.all([
        ApiService.getPendingApprovals(organization.id).catch(() => []),
        ApiService.getMyRequests(organization.id).catch(() => []),
      ]);

      // Filter out user's own requests from the "To Review" queue if needed
      const toReview = pendingData.filter((r) => r.requesterId !== user.id);
      setPendingApprovals(toReview.length > 0 ? toReview : pendingData);
      setMyRequests(requestsData);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(err.message || 'Failed to load approvals');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [organization?.id, user.id]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchApprovals();
  };

  const handleApprove = async (approvalId: string) => {
    if (!organization?.id || isSubmittingResolve) return;
    setIsSubmittingResolve(true);
    setFeedbackMessage(null);

    try {
      await ApiService.resolveApproval(organization.id, approvalId, {
        status: 'APPROVED',
      });
      setFeedbackMessage({
        type: 'success',
        text: 'Access granted. Delegated session created.',
      });
      fetchApprovals();
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Failed to approve request.',
      });
    } finally {
      setIsSubmittingResolve(false);
    }
  };

  const handleOpenRejectModal = (approvalId: string) => {
    setRejectingApprovalId(approvalId);
    setRejectionReason('');
  };

  const handleConfirmReject = async () => {
    if (!organization?.id || !rejectingApprovalId || isSubmittingResolve) return;
    setIsSubmittingResolve(true);
    setFeedbackMessage(null);

    try {
      await ApiService.resolveApproval(organization.id, rejectingApprovalId, {
        status: 'REJECTED',
        reason: rejectionReason.trim() || undefined,
      });
      setFeedbackMessage({
        type: 'success',
        text: 'Access request has been rejected.',
      });
      setRejectingApprovalId(null);
      setRejectionReason('');
      fetchApprovals();
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Failed to reject request.',
      });
    } finally {
      setIsSubmittingResolve(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const currentList = activeTab === 'PENDING' ? pendingApprovals : myRequests;

  const renderApprovalItem = ({ item }: { item: ApprovalRequest }) => {
    const isPending = item.status === 'PENDING';
    const requesterName = item.requester?.fullName || item.requester?.email?.split('@')[0] || 'Requester';
    const requesterEmail = item.requester?.email || 'Unknown User';
    const resource = item.resourceName || item.platformId || 'Delegated Resource';
    const platformKey = (item.platformId || resource).toUpperCase();

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <PlatformBadge platform={platformKey} size="small" />
            <View style={styles.requesterGroup}>
              <Text style={styles.requesterName} numberOfLines={1}>
                {requesterName}
              </Text>
              <Text style={styles.requesterEmail} numberOfLines={1}>
                {requesterEmail}
              </Text>
            </View>
          </View>

          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              item.status === 'APPROVED' && styles.statusBadgeApproved,
              item.status === 'REJECTED' && styles.statusBadgeRejected,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                item.status === 'APPROVED' && styles.statusTextApproved,
                item.status === 'REJECTED' && styles.statusTextRejected,
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>

        {/* Resource Requested */}
        <View style={styles.resourceRow}>
          <Text style={styles.resourceLabel}>TARGET RESOURCE:</Text>
          <Text style={styles.resourceValue} numberOfLines={1}>
            {resource}
          </Text>
        </View>

        {item.reason ? (
          <View style={styles.reasonRow}>
            <Text style={styles.reasonLabel}>Reason:</Text>
            <Text style={styles.reasonText}>{item.reason}</Text>
          </View>
        ) : null}

        {/* Footer / Timestamps */}
        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>Requested {formatDate(item.createdAt)}</Text>
        </View>

        {/* Action Buttons for Pending Review in the 'To Review' tab */}
        {activeTab === 'PENDING' && isPending && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.rejectButton, isSubmittingResolve && styles.disabledButton]}
              onPress={() => handleOpenRejectModal(item.id)}
              disabled={isSubmittingResolve}
              activeOpacity={0.8}
            >
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.approveButton, isSubmittingResolve && styles.disabledButton]}
              onPress={() => handleApprove(item.id)}
              disabled={isSubmittingResolve}
              activeOpacity={0.8}
            >
              <Text style={styles.approveButtonText}>Approve Access</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Approvals"
        subtitle="ACCESS GOVERNANCE"
        organization={organization}
        onOpenDrawer={onOpenDrawer}
        onOpenOrgPicker={onOpenOrgPicker}
      />

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'PENDING' && styles.tabButtonActive]}
          onPress={() => setActiveTab('PENDING')}
        >
          <Text style={[styles.tabText, activeTab === 'PENDING' && styles.tabTextActive]}>
            To Review ({pendingApprovals.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'MY_REQUESTS' && styles.tabButtonActive]}
          onPress={() => setActiveTab('MY_REQUESTS')}
        >
          <Text style={[styles.tabText, activeTab === 'MY_REQUESTS' && styles.tabTextActive]}>
            My Requests ({myRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <View
          style={[
            styles.feedbackBanner,
            feedbackMessage.type === 'success'
              ? styles.feedbackBannerSuccess
              : styles.feedbackBannerError,
          ]}
        >
          <Text style={styles.feedbackText}>{feedbackMessage.text}</Text>
          <TouchableOpacity onPress={() => setFeedbackMessage(null)}>
            <Text style={styles.feedbackClose}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content Area */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accentCyan} />
          <Text style={styles.loadingText}>Loading Approvals Queue...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Error Loading Approvals</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchApprovals}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : currentList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>
            {activeTab === 'PENDING' ? 'No Pending Approvals' : 'No Access Requests'}
          </Text>
          <Text style={styles.emptyText}>
            {activeTab === 'PENDING'
              ? 'All access requests in this organization have been resolved.'
              : 'You have not submitted any delegated access requests yet.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item) => item.id}
          renderItem={renderApprovalItem}
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

      {/* Reject Modal with Reason Input */}
      <Modal
        visible={rejectingApprovalId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectingApprovalId(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.rejectModalCard}>
            <Text style={styles.rejectModalTitle}>Reject Access Request</Text>
            <Text style={styles.rejectModalSub}>
              Please provide an optional reason for denying access to this resource.
            </Text>

            <TextInput
              style={styles.reasonInput}
              placeholder="e.g. Inappropriate scope or expired ticket..."
              placeholderTextColor={COLORS.textTertiary}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={3}
            />

            <View style={styles.rejectModalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setRejectingApprovalId(null)}
                disabled={isSubmittingResolve}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalConfirmRejectButton, isSubmittingResolve && styles.disabledButton]}
                onPress={handleConfirmReject}
                disabled={isSubmittingResolve}
              >
                {isSubmittingResolve ? (
                  <ActivityIndicator size="small" color={COLORS.textWhite} />
                ) : (
                  <Text style={styles.modalConfirmRejectText}>Confirm Rejection</Text>
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
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.md,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
  },
  tabButton: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  tabButtonActive: {
    backgroundColor: COLORS.bgTertiary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textTertiary,
  },
  tabTextActive: {
    color: COLORS.textWhite,
    fontWeight: '700',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  feedbackBannerSuccess: {
    backgroundColor: COLORS.emeraldSubtle,
    borderWidth: 1,
    borderColor: COLORS.emeraldBorder,
  },
  feedbackBannerError: {
    backgroundColor: COLORS.roseSubtle,
    borderWidth: 1,
    borderColor: COLORS.roseBorder,
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textWhite,
    flex: 1,
  },
  feedbackClose: {
    fontSize: 12,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  requesterGroup: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  requesterName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  requesterEmail: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.amberSubtle,
    borderWidth: 1,
    borderColor: COLORS.amberBorder,
  },
  statusBadgeApproved: {
    backgroundColor: COLORS.emeraldSubtle,
    borderColor: COLORS.emeraldBorder,
  },
  statusBadgeRejected: {
    backgroundColor: COLORS.roseSubtle,
    borderColor: COLORS.roseBorder,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textAmber,
    letterSpacing: 0.5,
  },
  statusTextApproved: {
    color: COLORS.textEmerald,
  },
  statusTextRejected: {
    color: COLORS.textRose,
  },
  resourceRow: {
    backgroundColor: COLORS.bgPrimary,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs + 2,
    marginTop: SPACING.xs,
  },
  resourceLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 0.5,
  },
  resourceValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textWhite,
    marginTop: 1,
  },
  reasonRow: {
    marginTop: SPACING.sm,
    paddingHorizontal: 2,
  },
  reasonLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textTertiary,
  },
  reasonText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  cardFooter: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
  },
  dateText: {
    fontSize: 10,
    color: COLORS.textTertiary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: COLORS.bgTertiary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
  },
  rejectButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  approveButton: {
    flex: 2,
    backgroundColor: COLORS.accentCyan,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
  },
  approveButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.bgDarkest,
  },
  disabledButton: {
    opacity: 0.5,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  rejectModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
  },
  rejectModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textWhite,
    marginBottom: SPACING.xs,
  },
  rejectModalSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginBottom: SPACING.md,
  },
  reasonInput: {
    backgroundColor: COLORS.bgInput,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    color: COLORS.textWhite,
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: SPACING.lg,
  },
  rejectModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  modalCancelButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgTertiary,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modalConfirmRejectButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accentRose,
    minWidth: 120,
    alignItems: 'center',
  },
  modalConfirmRejectText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
});

