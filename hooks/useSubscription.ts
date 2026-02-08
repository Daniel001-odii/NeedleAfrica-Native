import { useState, useCallback, useEffect } from 'react';
import { subscriptionService, SubscriptionStatus } from '../services/subscriptionService';
import { useAuth } from '../contexts/AuthContext';

export interface UseSubscriptionReturn {
  // State
  status: SubscriptionStatus | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  refreshStatus: () => Promise<void>;
  initiateSubscription: (planId: 'pro' | 'studio_ai', billingCycle: 'monthly' | 'yearly') => Promise<{ authorizationUrl: string; reference: string }>;
  verifySubscription: (reference: string) => Promise<{ plan: string; amount: number }>;
  cancelSubscription: () => Promise<void>;

  // Helpers
  canAccessFeature: (feature: 'customizableInvoices' | 'publicLookbook' | 'downloadData' | 'aiFeatures' | 'teamManagement' | 'prioritySupport') => boolean;
  hasReachedLimit: (resource: 'orders' | 'customers' | 'templates' | 'invoices', currentCount: number) => boolean;
  getLimitForResource: (resource: 'orders' | 'customers' | 'templates' | 'invoices') => number;
  isFeatureAvailable: (feature: string) => { available: boolean; disabled: boolean; upgradeMessage?: string };

  // Computed
  currentPlan: 'FREE' | 'PRO' | 'STUDIO_AI';
  isPro: boolean;
  isStudioAI: boolean;
  isFree: boolean;
  isActive: boolean;
  isExpired: boolean;
}

export function useSubscription(): UseSubscriptionReturn {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshUser } = useAuth();

  const refreshStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await subscriptionService.getStatus();
      setStatus(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch subscription status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch status on mount
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const initiateSubscription = useCallback(async (
    planId: 'pro' | 'studio_ai',
    billingCycle: 'monthly' | 'yearly'
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await subscriptionService.initiate(planId, billingCycle);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to initiate subscription');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifySubscription = useCallback(async (reference: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await subscriptionService.verifyTransaction(reference);
      // Refresh both subscription status and user data
      await Promise.all([refreshStatus(), refreshUser()]);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to verify subscription');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshStatus, refreshUser]);

  const cancelSubscription = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await subscriptionService.cancel();
      // Refresh status after cancellation
      await refreshStatus();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel subscription');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshStatus]);

  const canAccessFeature = useCallback((
    feature: 'customizableInvoices' | 'publicLookbook' | 'downloadData' | 'aiFeatures' | 'teamManagement' | 'prioritySupport'
  ): boolean => {
    if (!status) return false;
    return subscriptionService.canAccessFeature(status.plan, feature);
  }, [status]);

  const hasReachedLimit = useCallback((
    resource: 'orders' | 'customers' | 'templates' | 'invoices',
    currentCount: number
  ): boolean => {
    if (!status || status.plan !== 'FREE') return false;
    const { allowed } = subscriptionService.checkFreeTierLimits(resource, currentCount);
    return !allowed;
  }, [status]);

  const getLimitForResource = useCallback((
    resource: 'orders' | 'customers' | 'templates' | 'invoices'
  ): number => {
    const limits = {
      orders: 5,
      customers: 5,
      templates: 3,
      invoices: 5,
    };
    return limits[resource];
  }, []);

  const isFeatureAvailable = useCallback((feature: string): { available: boolean; disabled: boolean; upgradeMessage?: string } => {
    if (!status) {
      return { available: false, disabled: true, upgradeMessage: 'Loading subscription...' };
    }

    const plan = status.plan;
    const isActive = subscriptionService.isPlanActive(status.status, status.isExpired);

    // Map feature names to tier requirements
    const featureTiers: Record<string, ('FREE' | 'PRO' | 'STUDIO_AI')[]> = {
      'customizableInvoices': ['PRO', 'STUDIO_AI'],
      'publicLookbook': ['PRO', 'STUDIO_AI'],
      'downloadData': ['PRO', 'STUDIO_AI'],
      'aiFeatures': ['STUDIO_AI'],
      'teamManagement': ['STUDIO_AI'],
      'prioritySupport': ['STUDIO_AI'],
      'unlimitedOrders': ['PRO', 'STUDIO_AI'],
      'unlimitedCustomers': ['PRO', 'STUDIO_AI'],
      'unlimitedTemplates': ['PRO', 'STUDIO_AI'],
      'unlimitedInvoices': ['PRO', 'STUDIO_AI'],
    };

    const requiredTiers = featureTiers[feature];

    if (!requiredTiers) {
      // Unknown feature, allow by default
      return { available: true, disabled: false };
    }

    const hasTier = requiredTiers.includes(plan);
    const isAvailable = hasTier && isActive;

    if (isAvailable) {
      return { available: true, disabled: false };
    }

    // Determine upgrade message
    let upgradeMessage: string;
    if (!isActive) {
      upgradeMessage = 'Your subscription has expired. Please renew to access this feature.';
    } else if (requiredTiers.includes('STUDIO_AI')) {
      upgradeMessage = 'This feature is available on Studio AI plan.';
    } else if (requiredTiers.includes('PRO')) {
      upgradeMessage = 'This feature is available on Pro plan.';
    } else {
      upgradeMessage = 'Upgrade your plan to access this feature.';
    }

    return {
      available: false,
      disabled: true,
      upgradeMessage,
    };
  }, [status]);

  // Computed values
  const currentPlan = status?.plan || 'FREE';
  const isPro = currentPlan === 'PRO';
  const isStudioAI = currentPlan === 'STUDIO_AI';
  const isFree = currentPlan === 'FREE';
  const isActive = status ? subscriptionService.isPlanActive(status.status, status.isExpired) : false;
  const isExpired = status?.isExpired || false;

  return {
    status,
    isLoading,
    error,
    refreshStatus,
    initiateSubscription,
    verifySubscription,
    cancelSubscription,
    canAccessFeature,
    hasReachedLimit,
    getLimitForResource,
    isFeatureAvailable,
    currentPlan,
    isPro,
    isStudioAI,
    isFree,
    isActive,
    isExpired,
  };
}
