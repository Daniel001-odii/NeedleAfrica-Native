import { useState, useEffect, useCallback } from 'react';
import { PurchasesPackage } from 'react-native-purchases';
import { useAuth } from '../contexts/AuthContext';
import { revenueCatService, RevenueCatCustomerInfo, SubscriptionStatus } from '../services/RevenueCatService';

export interface UseRevenueCatReturn {
  customerInfo: RevenueCatCustomerInfo | null;
  isLoading: boolean;
  error: string | null;
  isPro: boolean;
  subscriptionStatus: SubscriptionStatus | null;
  refreshCustomerInfo: () => Promise<void>;
  purchasePackage: (packageIdentifier: string) => Promise<RevenueCatCustomerInfo>;
  restorePurchases: () => Promise<RevenueCatCustomerInfo>;
  showManageSubscriptions: () => Promise<void>;
  canAccessFeature: (feature: string) => Promise<boolean>;
  getSubscriptionStatusForDisplay: () => Promise<{
    plan: 'FREE' | 'PRO';
    status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'TRIAL';
    expiryDate: Date | null;
    willRenew: boolean;
  }>;
}

export const useRevenueCat = (): UseRevenueCatReturn => {
  const { user, refreshUser } = useAuth();
  const [customerInfo, setCustomerInfo] = useState<RevenueCatCustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize RevenueCat when user logs in
  useEffect(() => {
    const initializeRevenueCat = async () => {
      if (user?.id) {
        try {
          setIsLoading(true);
          setError(null);
          await revenueCatService.initialize(user.id);
          await refreshCustomerInfo();
        } catch (err) {
          const errorMessage = (err as any)?.message || 'Failed to initialize RevenueCat';
          setError(errorMessage);
          console.error('RevenueCat initialization error:', err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    initializeRevenueCat();
  }, [user?.id]);

  // Logout from RevenueCat when user logs out
  useEffect(() => {
    const logoutRevenueCat = async () => {
      if (!user) {
        try {
          await revenueCatService.logout();
          setCustomerInfo(null);
        } catch (err) {
          console.error('RevenueCat logout error:', err);
        }
      }
    };

    logoutRevenueCat();
  }, [user]);

  const refreshCustomerInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const info = await revenueCatService.getCustomerInfo();
      setCustomerInfo(info);

      console.log('Customer info:', info);

      // Refresh backend user data to sync subscription status if Pro
      if (info.isPro) {
        try {
          await refreshUser();
        } catch (refreshErr) {
          console.error('Failed to refresh user after customer info refresh:', refreshErr);
        }
      }
    } catch (err) {
      const errorMessage = (err as any)?.message || 'Failed to get customer info';
      setError(errorMessage);
      console.error('Failed to refresh customer info:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const purchasePackage = useCallback(async (packageIdentifier: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const offerings = await revenueCatService.getOfferings();
      if (!offerings) {
        throw new Error('No offerings available');
      }

      // Flatten all packages from all offerings to find the one to purchase
      let packageToPurchase: PurchasesPackage | undefined;

      Object.values(offerings.all).forEach(offering => {
        const pkg = offering.availablePackages.find(p => p.identifier === packageIdentifier);
        if (pkg) packageToPurchase = pkg;
      });

      if (!packageToPurchase) {
        throw new Error(`Package ${packageIdentifier} not found`);
      }

      const result = await revenueCatService.purchasePackage(packageToPurchase);
      setCustomerInfo(result);

      // Refresh backend user data to sync subscription status
      try {
        await refreshUser();
      } catch (refreshErr) {
        console.error('Failed to refresh user after purchase:', refreshErr);
      }

      return result;
    } catch (err) {
      const errorMessage = (err as any)?.message || 'Purchase failed';
      setError(errorMessage);
      console.error('Purchase error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await revenueCatService.restorePurchases();
      setCustomerInfo(result);

      // Refresh backend user data
      try {
        await refreshUser();
      } catch (refreshErr) {
        console.error('Failed to refresh user after restore:', refreshErr);
      }

      return result;
    } catch (err) {
      const errorMessage = (err as any)?.message || 'Restore failed';
      setError(errorMessage);
      console.error('Restore purchases error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const showManageSubscriptions = useCallback(async () => {
    try {
      setIsLoading(true);
      await revenueCatService.showManageSubscriptions();
    } catch (err) {
      const errorMessage = (err as any)?.message || 'Failed to open subscription management';
      setError(errorMessage);
      console.error('Show manage subscriptions error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const canAccessFeature = useCallback(async (feature: string) => {
    try {
      return await revenueCatService.canAccessFeature(feature);
    } catch (err) {
      console.error('Feature access check error:', err);
      return false;
    }
  }, []);

  const getSubscriptionStatusForDisplay = useCallback(async () => {
    try {
      return await revenueCatService.getSubscriptionStatusForDisplay();
    } catch (err) {
      console.error('Get subscription status error:', err);
      return {
        plan: 'FREE' as const,
        status: 'ACTIVE' as const,
        expiryDate: null,
        willRenew: false,
      };
    }
  }, []);

  return {
    customerInfo,
    isLoading,
    error,
    isPro: user?.subscriptionPlan === 'PRO' || user?.subscriptionPlan === 'STUDIO_AI',
    subscriptionStatus: (user?.subscriptionPlan === 'PRO' || user?.subscriptionPlan === 'STUDIO_AI')
      ? {
        isActive: true,
        productId: user.currentPlanCode || (customerInfo?.subscriptionStatus?.productId || 'monthly'),
        planType: user.currentPlanCode?.includes('yearly') ? 'yearly' : (customerInfo?.subscriptionStatus?.planType || 'monthly'),
        willRenew: customerInfo?.subscriptionStatus?.willRenew ?? true,
        expiryDate: user.subscriptionExpiry ? new Date(user.subscriptionExpiry) : (customerInfo?.subscriptionStatus?.expiryDate || null)
      }
      : (customerInfo?.subscriptionStatus ?? null),
    refreshCustomerInfo,
    purchasePackage,
    restorePurchases,
    showManageSubscriptions,
    canAccessFeature: async (feature: string) => {
      const isProUser = user?.subscriptionPlan === 'PRO' || user?.subscriptionPlan === 'STUDIO_AI';
      // Basic features available to all users
      const basicFeatures = ['basic_measurements', 'customer_management', 'order_tracking'];
      if (basicFeatures.includes(feature)) return true;

      return isProUser;
    },
    getSubscriptionStatusForDisplay: async () => {
      const isProUser = user?.subscriptionPlan === 'PRO' || user?.subscriptionPlan === 'STUDIO_AI';
      return {
        plan: isProUser ? 'PRO' : 'FREE',
        status: user?.subscriptionStatus === 'ACTIVE' ? 'ACTIVE' : (user?.subscriptionStatus === 'EXPIRED' ? 'EXPIRED' : 'CANCELLED'),
        expiryDate: user?.subscriptionExpiry ? new Date(user.subscriptionExpiry) : null,
        willRenew: true, // Default to true if active in DB
      };
    },
  };
};
