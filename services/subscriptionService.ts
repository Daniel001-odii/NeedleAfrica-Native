import axiosInstance from '../lib/axios';

export interface SubscriptionStatus {
  plan: 'FREE' | 'PRO' | 'STUDIO_AI';
  status: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'UNPAID' | 'EXPIRED';
  expiry: string | null;
  isExpired: boolean;
  planCode: string | null;
}

export interface InitiateSubscriptionResponse {
  authorizationUrl: string;
  reference: string;
}

export interface SubscriptionTransaction {
  id: string;
  planCode: string;
  amount: number;
  currency: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

export interface Plan {
  id: string;
  planId: 'free' | 'pro' | 'studio_ai';
  name: string;
  description: string;
  planCode: string;
  billingCycle: 'monthly' | 'yearly';
  price: number;
  originalPrice?: number;
  currency: string;
  interval: string;
  isActive: boolean;
  isPopular: boolean;
  features: string[];
  limits?: {
    orders: number;
    customers: number;
    templates: number;
    invoices: number;
  };
  createdAt: string;
  updatedAt: string;
}

class SubscriptionService {
  /**
   * Get current user's subscription status
   */
  async getStatus(): Promise<SubscriptionStatus> {
    const response = await axiosInstance.get('/subscriptions/status');
    return response.data.data;
  }

  /**
   * Initiate a new subscription
   */
  async initiate(
    planId: 'pro' | 'studio_ai',
    billingCycle: 'monthly' | 'yearly'
  ): Promise<InitiateSubscriptionResponse> {
    const response = await axiosInstance.post('/subscriptions/initiate', {
      planId,
      billingCycle,
    });
    return response.data.data;
  }

  /**
   * Verify a subscription payment after Paystack redirect
   */
  async verify(reference: string): Promise<{ plan: string; amount: number }> {
    const response = await axiosInstance.post('/subscriptions/verify', {
      reference,
    });
    return response.data.data;
  }

  /**
   * Cancel current subscription
   */
  async cancel(): Promise<{ message: string }> {
    const response = await axiosInstance.post('/subscriptions/cancel');
    return response.data;
  }

  /**
   * Get transaction history
   */
  async getTransactions(): Promise<SubscriptionTransaction[]> {
    const response = await axiosInstance.get('/subscriptions/transactions');
    return response.data.data;
  }

  /**
   * Get all subscription plans from API
   */
  async getPlans(): Promise<Plan[]> {
    const response = await axiosInstance.get('/subscriptions/plans');
    return response.data.data;
  }

  /**
   * Get a specific plan
   */
  async getPlan(planId: string, billingCycle: string): Promise<Plan> {
    const response = await axiosInstance.get(`/subscriptions/plans/${planId}/${billingCycle}`);
    return response.data.data;
  }

  /**
   * Get free plan for display
   */
  getFreePlan(): Plan {
    return {
      id: 'free',
      planId: 'free',
      name: 'Free',
      description: 'Get started and manage a few orders at no cost',
      planCode: '',
      billingCycle: 'monthly',
      price: 0,
      currency: 'NGN',
      interval: '',
      isActive: true,
      isPopular: false,
      features: [
        'Up to 5 active orders',
        '3 basic measurement templates',
        'Up to 5 customer profiles',
        'Up to 5 invoices',
        'Static invoices',
      ],
      limits: { orders: 5, customers: 5, templates: 3, invoices: 5 },
      createdAt: '',
      updatedAt: '',
    };
  }

  /**
   * Check if user can access a feature based on their tier
   */
  canAccessFeature(
    plan: 'FREE' | 'PRO' | 'STUDIO_AI',
    feature: 'customizableInvoices' | 'publicLookbook' | 'downloadData' | 'aiFeatures' | 'teamManagement' | 'prioritySupport'
  ): boolean {
    const features = {
      FREE: {
        customizableInvoices: false,
        publicLookbook: false,
        downloadData: false,
        aiFeatures: false,
        teamManagement: false,
        prioritySupport: false,
      },
      PRO: {
        customizableInvoices: true,
        publicLookbook: true,
        downloadData: true,
        aiFeatures: false,
        teamManagement: false,
        prioritySupport: false,
      },
      STUDIO_AI: {
        customizableInvoices: true,
        publicLookbook: true,
        downloadData: true,
        aiFeatures: true,
        teamManagement: true,
        prioritySupport: true,
      },
    };

    return features[plan]?.[feature] ?? false;
  }

  /**
   * Check if user has exceeded free tier limits
   */
  checkFreeTierLimits(
    resource: 'orders' | 'customers' | 'templates' | 'invoices',
    currentCount: number
  ): { allowed: boolean; limit: number } {
    const limits = {
      orders: 10,
      customers: 10,
      templates: 3,
      invoices: 10,
    };

    const limit = limits[resource];
    return {
      allowed: currentCount < limit,
      limit,
    };
  }

  /**
   * Get display name for plan
   */
  getPlanDisplayName(plan: 'FREE' | 'PRO' | 'STUDIO_AI'): string {
    const names = {
      FREE: 'Free',
      PRO: 'Professional',
      STUDIO_AI: 'Studio AI',
    };
    return names[plan];
  }

  /**
   * Check if plan is active (not expired or cancelled)
   */
  isPlanActive(status: string, isExpired: boolean): boolean {
    if (isExpired) return false;
    return status === 'ACTIVE';
  }
}

export const subscriptionService = new SubscriptionService();
