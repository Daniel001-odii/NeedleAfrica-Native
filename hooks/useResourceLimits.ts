import { useState, useEffect, useCallback } from 'react';
import { database } from '../database/watermelon/index.native';
import { Q } from '@nozbe/watermelondb';
import { useAuth } from '../contexts/AuthContext';

export type ResourceType = 'orders' | 'customers' | 'templates' | 'invoices';

export interface ResourceCounts {
  orders: number;
  customers: number;
  templates: number;
  invoices: number;
}

export interface LimitStatus {
  resource: ResourceType;
  current: number;
  limit: number;
  percentage: number;
  isAtLimit: boolean;
  isNearLimit: boolean;
}

export interface CanCreateResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  message: string;
  isAtLimit: boolean;
  isNearLimit: boolean;
}

export interface UseResourceLimitsReturn {
  counts: ResourceCounts;
  isLoading: boolean;
  refreshCounts: () => Promise<void>;
  canCreate: (resource: ResourceType) => Promise<CanCreateResult>;
  getLimitStatus: (resource: ResourceType) => LimitStatus;
  anyResourceAtLimit: boolean;
}

const BASE_LIMITS: Record<ResourceType, number> = {
  orders: 5,
  customers: 5,
  templates: 3,
  invoices: 5,
};

const REFERRAL_BONUS: Record<ResourceType, number> = {
  orders: 5,
  customers: 5,
  templates: 3,
  invoices: 5,
};

export function useResourceLimits(): UseResourceLimitsReturn {
  const { user } = useAuth();
  const [counts, setCounts] = useState<ResourceCounts>({
    orders: 0,
    customers: 0,
    templates: 0,
    invoices: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const getResourceLimit = useCallback((resource: ResourceType): number => {
    const referralCount = user?.activatedReferralCount || 0;
    return BASE_LIMITS[resource] + (referralCount * REFERRAL_BONUS[resource]);
  }, [user]);

  // Helper to create a query for a resource
  const getResourceQuery = useCallback((resource: ResourceType) => {
    if (!user?.id) return null;

    const tableName = resource === 'templates' ? 'measurement_templates' : resource;

    return database
      .get(tableName)
      .query(
        Q.where('user_id', user.id),
        Q.where('deleted_at', Q.eq(null))
      );
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Setup observers for all resources
    const resources: ResourceType[] = ['orders', 'customers', 'templates', 'invoices'];
    const subscriptions: any[] = [];

    const handleCountChange = (resource: ResourceType, count: number) => {
      setCounts(prev => ({ ...prev, [resource]: count }));
    };

    resources.forEach(resource => {
      const query = getResourceQuery(resource);
      if (query) {
        const subscription = query.observeCount().subscribe(count => {
          handleCountChange(resource, count);
        });
        subscriptions.push(subscription);
      }
    });

    setIsLoading(false);

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [user?.id, getResourceQuery]);

  const refreshCounts = useCallback(async () => {
    if (!user?.id) return;
    const resources: ResourceType[] = ['orders', 'customers', 'templates', 'invoices'];
    const newCounts: Partial<ResourceCounts> = {};

    for (const res of resources) {
      const query = getResourceQuery(res);
      if (query) {
        newCounts[res] = await query.fetchCount();
      }
    }

    setCounts(prev => ({ ...prev, ...newCounts }));
  }, [user?.id, getResourceQuery]);

  // Live asynchronous check directly against SQLite database to prevent race conditions
  const canCreate = useCallback(async (resource: ResourceType): Promise<CanCreateResult> => {
    const limit = getResourceLimit(resource);

    if (!user?.id) {
      return {
        allowed: false,
        currentCount: 0,
        limit,
        message: 'Please sign in',
        isAtLimit: true,
        isNearLimit: false,
      };
    }

    const query = getResourceQuery(resource);
    const current = query ? await query.fetchCount() : (counts[resource] ?? 0);

    // Keep state in sync
    setCounts(prev => prev[resource] === current ? prev : { ...prev, [resource]: current });

    const isAtLimit = current >= limit;
    const isNearLimit = current >= limit - 1;

    let message: string;
    if (isAtLimit) {
      message = `You have reached the limit of ${limit} ${resource}. Upgrade to Pro for unlimited ${resource}.`;
    } else if (isNearLimit) {
      message = `You are at ${current}/${limit} ${resource}. One more and you'll reach your limit.`;
    } else {
      message = `${current}/${limit} ${resource} used`;
    }

    return {
      allowed: !isAtLimit,
      currentCount: current,
      limit,
      message,
      isAtLimit,
      isNearLimit,
    };
  }, [user?.id, getResourceLimit, getResourceQuery, counts]);

  const getLimitStatus = useCallback((resource: ResourceType): LimitStatus => {
    const current = counts[resource];
    const limit = getResourceLimit(resource);
    const percentage = limit > 0 ? Math.min((current / limit) * 100, 100) : 100;
    const isAtLimit = current >= limit;
    const isNearLimit = current >= limit - 1;

    return {
      resource,
      current,
      limit,
      percentage,
      isAtLimit,
      isNearLimit,
    };
  }, [counts, getResourceLimit]);

  const anyResourceAtLimit = Object.keys(counts).some((key) => {
    const resource = key as ResourceType;
    return counts[resource] >= getResourceLimit(resource);
  });

  return {
    counts,
    isLoading,
    refreshCounts,
    canCreate,
    getLimitStatus,
    anyResourceAtLimit,
  };
}
