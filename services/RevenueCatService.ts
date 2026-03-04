import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  PurchasesPackage,
  PurchasesOffering,
  PurchasesOfferings,
  PurchasesStoreProduct,
  LOG_LEVEL,
  PurchasesError,
  PURCHASES_ERROR_CODE,
  PURCHASE_TYPE,
} from 'react-native-purchases';
import { subscriptionService } from './subscriptionService';

// RevenueCat configuration
const REVENUECAT_API_KEY = Platform.select({
  ios: 'test_sexoiKVvIUczqwYIDMcBTzzSLqO',
  android: 'test_sexoiKVvIUczqwYIDMcBTzzSLqO',
});

// Entitlement identifiers
export const ENTITLEMENTS = {
  NEEDLE_AFRICA_PRO: 'NeedleAfrica Pro',
} as const;

// Product identifiers
export const PRODUCTS = {
  PRO_MONTHLY: 'monthly',
  PRO_YEARLY: 'yearly',
} as const;

// Offering identifier
export const OFFERING_ID = 'default';

export interface SubscriptionStatus {
  isActive: boolean;
  willRenew: boolean;
  expiryDate: Date | null;
  productId: string | null;
  planType: 'monthly' | 'yearly' | null;
  entitlementVerification?: any;
}

export interface RevenueCatCustomerInfo {
  customerInfo: CustomerInfo;
  subscriptionStatus: SubscriptionStatus;
  isPro: boolean;
}

class RevenueCatService {
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Initialize RevenueCat SDK
   */
  async initialize(userId?: string): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._initializeInternal(userId);
    return this.initializationPromise;
  }

  private async _initializeInternal(userId?: string): Promise<void> {
    try {
      // Configure logging
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);

      // Configure RevenueCat with API key and user ID
      if (userId) {
        await Purchases.configure({
          apiKey: REVENUECAT_API_KEY!,
          appUserID: userId,
        });
      } else {
        await Purchases.configure({
          apiKey: REVENUECAT_API_KEY!,
        });
      }

      this.isInitialized = true;
      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      throw error;
    }
  }

  /**
   * Set the user ID for RevenueCat (call after login)
   */
  async setUserId(userId: string): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      await Purchases.logIn(userId);
      console.log('RevenueCat user ID set:', userId);
    } catch (error) {
      console.error('Failed to set RevenueCat user ID:', error);
      throw error;
    }
  }

  /**
   * Log out user from RevenueCat
   */
  async logout(): Promise<void> {
    try {
      if (!this.isInitialized) {
        return;
      }

      await Purchases.logOut();
      console.log('RevenueCat user logged out');
    } catch (error) {
      console.error('Failed to logout from RevenueCat:', error);
      throw error;
    }
  }

  /**
   * Get current customer info
   */
  async getCustomerInfo(): Promise<RevenueCatCustomerInfo> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const customerInfo = await Purchases.getCustomerInfo();
      const subscriptionStatus = this.extractSubscriptionStatus(customerInfo);
      const isPro = this.isProSubscriber(customerInfo);

      return {
        customerInfo,
        subscriptionStatus,
        isPro,
      };
    } catch (error) {
      console.error('Failed to get customer info:', error);
      throw error;
    }
  }

  /**
   * Get available offerings
   */
  async getOfferings(): Promise<PurchasesOfferings | null> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const offerings = await Purchases.getOfferings();
      return offerings;
    } catch (error) {
      console.error('Failed to get offerings:', error);
      throw error;
    }
  }

  /**
   * Purchase a package
   */
  async purchasePackage(packageToPurchase: PurchasesPackage): Promise<RevenueCatCustomerInfo> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      console.log('RevenueCat purchase successful:', customerInfo);

      const subscriptionStatus = this.extractSubscriptionStatus(customerInfo);
      const isPro = this.isProSubscriber(customerInfo);

      console.log(`User isPro after purchase: ${isPro}`);

      // Sync with backend if user is Pro
      if (isPro) {
        try {
          await this.syncWithBackend(customerInfo);
        } catch (syncError) {
          console.error('Failed to sync purchase with backend:', syncError);
        }
      }

      return {
        customerInfo,
        subscriptionStatus,
        isPro,
      };
    } catch (error) {
      console.error('Failed to purchase package:', error);

      const purchaseError = error as PurchasesError;
      if (purchaseError && purchaseError.code !== undefined) {
        if (purchaseError.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
          throw new Error('Purchase was cancelled');
        } else if (purchaseError.code === PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR) {
          throw new Error('Purchases are not allowed on this device');
        } else if (purchaseError.code === PURCHASES_ERROR_CODE.PURCHASE_INVALID_ERROR) {
          throw new Error('Purchase is invalid');
        } else if (purchaseError.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
          throw new Error('Payment is pending');
        }
      }

      throw error;
    }
  }

  /**
   * Restore purchases
   */
  async restorePurchases(): Promise<RevenueCatCustomerInfo> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const customerInfo = await Purchases.restorePurchases();
      const subscriptionStatus = this.extractSubscriptionStatus(customerInfo);
      const isPro = this.isProSubscriber(customerInfo);

      // Sync with backend if user is Pro
      if (isPro) {
        try {
          await this.syncWithBackend(customerInfo);
        } catch (syncError) {
          console.error('Failed to sync restored purchase with backend:', syncError);
        }
      }

      return {
        customerInfo,
        subscriptionStatus,
        isPro,
      };
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      throw error;
    }
  }

  /**
   * Sync RevenueCat status with the app backend
   */
  async syncWithBackend(customerInfo: CustomerInfo): Promise<void> {
    try {
      const activeSubscriptions = customerInfo.activeSubscriptions;
      console.log('Active subscriptions for sync:', activeSubscriptions);

      if (activeSubscriptions.length === 0) {
        console.warn('No active subscriptions found in customerInfo. Skipping backend sync.');
        return;
      }

      // Use the first active subscription (product identifier) as a reference for the backend
      const reference = activeSubscriptions[0];

      console.log(`Sending sync request to backend with reference (product ID): ${reference}`);
      const result = await subscriptionService.verify(reference);
      console.log('Backend sync result:', result);
    } catch (error) {
      console.error('Failed to sync with backend:', error);
      throw error;
    }
  }

  /**
   * Check if user has Pro entitlement
   */
  isProSubscriber(customerInfo: CustomerInfo): boolean {
    const entitlement = customerInfo?.entitlements?.active?.[ENTITLEMENTS.NEEDLE_AFRICA_PRO];
    // In some older/newer versions of Purchases, verificationResult might not exist 
    // or ENTITLEMENT_VERIFICATION_RESULT might be tricky to import. 
    // We mainly care if the entitlement exists and is active.
    return !!entitlement;
  }

  /**
   * Show the system subscription management UI (useful for cancellations)
   */
  async showManageSubscriptions(): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      await Purchases.showManageSubscriptions();
    } catch (error) {
      console.error('Failed to show manage subscriptions:', error);
      throw error;
    }
  }

  /**
   * Extract subscription status from customer info
   */
  private extractSubscriptionStatus(customerInfo: CustomerInfo): SubscriptionStatus {
    const entitlement = customerInfo?.entitlements?.active?.[ENTITLEMENTS.NEEDLE_AFRICA_PRO];

    if (!entitlement) {
      // Check for expired entitlements
      const expiredEntitlement = customerInfo?.entitlements?.all?.[ENTITLEMENTS.NEEDLE_AFRICA_PRO];
      if (expiredEntitlement) {
        return {
          isActive: false,
          willRenew: false,
          expiryDate: expiredEntitlement.expirationDate ? new Date(expiredEntitlement.expirationDate) : null,
          productId: expiredEntitlement.productIdentifier,
          planType: this.getPlanTypeFromProductId(expiredEntitlement.productIdentifier),
          entitlementVerification: expiredEntitlement?.verification,
        };
      }

      return {
        isActive: false,
        willRenew: false,
        expiryDate: null,
        productId: null,
        planType: null,
        entitlementVerification: undefined, // Fixed error: cannot read property 'NOT_REQUESTED' of undefined
      };
    }

    return {
      isActive: true,
      willRenew: entitlement.willRenew,
      expiryDate: entitlement.expirationDate ? new Date(entitlement.expirationDate) : null,
      productId: entitlement.productIdentifier,
      planType: this.getPlanTypeFromProductId(entitlement.productIdentifier),
      entitlementVerification: entitlement?.verification,
    };
  }

  /**
   * Get plan type from product identifier
   */
  private getPlanTypeFromProductId(productId: string): 'monthly' | 'yearly' | null {
    if (productId.includes('monthly')) return 'monthly';
    if (productId.includes('yearly')) return 'yearly';
    return null;
  }

  /**
   * Get product details by identifier
   */
  async getProduct(productId: string): Promise<PurchasesStoreProduct | null> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const products = await Purchases.getProducts([productId]);
      return products[0] || null;
    } catch (error) {
      console.error(`Failed to get product ${productId}:`, error);
      return null;
    }
  }

  /**
   * Check if user can access a feature based on subscription
   */
  async canAccessFeature(feature: string): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();

      // Basic features available to all users
      const basicFeatures = ['basic_measurements', 'customer_management', 'order_tracking'];
      if (basicFeatures.includes(feature)) {
        return true;
      }

      // Pro features require subscription
      const proFeatures = [
        'advanced_analytics',
        'custom_templates',
        'bulk_operations',
        'priority_support',
        'data_export',
        'team_collaboration',
        'ai_features',
      ];

      if (proFeatures.includes(feature)) {
        return customerInfo.isPro;
      }

      return false;
    } catch (error) {
      console.error('Failed to check feature access:', error);
      return false;
    }
  }

  /**
   * Get subscription status for display
   */
  async getSubscriptionStatusForDisplay(): Promise<{
    plan: 'FREE' | 'PRO';
    status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'TRIAL';
    expiryDate: Date | null;
    willRenew: boolean;
  }> {
    try {
      const customerInfo = await this.getCustomerInfo();

      if (!customerInfo.isPro) {
        return {
          plan: 'FREE',
          status: 'ACTIVE',
          expiryDate: null,
          willRenew: false,
        };
      }

      const { subscriptionStatus } = customerInfo;

      let status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'TRIAL' = 'ACTIVE';
      if (!subscriptionStatus.isActive) {
        status = subscriptionStatus.expiryDate && subscriptionStatus.expiryDate < new Date() ? 'EXPIRED' : 'CANCELLED';
      }

      return {
        plan: 'PRO',
        status,
        expiryDate: subscriptionStatus.expiryDate,
        willRenew: subscriptionStatus.willRenew,
      };
    } catch (error) {
      console.error('Failed to get subscription status for display:', error);
      return {
        plan: 'FREE',
        status: 'ACTIVE',
        expiryDate: null,
        willRenew: false,
      };
    }
  }
}

export const revenueCatService = new RevenueCatService();
