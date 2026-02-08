import { useState, useEffect, useCallback } from 'react';
import { database } from '../database/watermelon';
import { Q } from '@nozbe/watermelondb';

type ResourceType = 'orders' | 'customers' | 'templates' | 'invoices';

interface ResourceCounts {
  orders: number;
  customers: number;
  templates: number;
  invoices: number;
}

interface LimitStatus {
  resource: ResourceType;
  current: number;
  limit: number;
  percentage: number;
  isAtLimit: boolean;
  isNearLimit: boolean;
}

interface UseResourceLimitsReturn {
  counts: ResourceCounts;
  isLoading: boolean;
  refreshCounts: () => Promise<void>;
  canCreate: (resource: ResourceType) => {
    allowed: boolean;
    currentCount: number;
    limit: number;
    message: string;
    isAtLimit: boolean;
    isNearLimit: boolean;
  };
  getLimitStatus: (resource: ResourceType) => LimitStatus;
  anyResourceAtLimit: boolean;
}

const LIMITS: Record<ResourceType, number> = {
  orders: 5,
  customers: 5,
  templates: 3,
  invoices: 5,
};

export function useResourceLimits(): UseResourceLimitsReturn {
  const [counts, setCounts] = useState<ResourceCounts>({
    orders: 0,
    customers: 0,
    templates: 0,
    invoices: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const refreshCounts = useCallback(async () => {
    setIsLoading(true);
    try {
      // Count orders (not deleted)
      const orders = await database
        .get('orders')
        .query(Q.where('deleted_at', null))
        .fetchCount();

      // Count customers (not deleted)
      const customers = await database
        .get('customers')
        .query(Q.where('deleted_at', null))
        .fetchCount();

      // Count measurement templates (not deleted)
      const templates = await database
        .get('measurement_templates')
        .query(Q.where('deleted_at', null))
        .fetchCount();

      // Count invoices (orders with amount > 0, as a proxy)
      const invoices = await database
        .get('orders')
        .query(
          Q.where('deleted_at', null),
          Q.where('amount', Q.gt(0))
        )
        .fetchCount();

      setCounts({
        orders,
        customers,
        templates,
        invoices,
      });
    } catch (error) {
      console.error('Failed to fetch resource counts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  const canCreate = useCallback((resource: ResourceType) => {
    const current = counts[resource];
    const limit = LIMITS[resource];
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
  }, [counts]);

  const getLimitStatus = useCallback((resource: ResourceType): LimitStatus => {
    const current = counts[resource];
    const limit = LIMITS[resource];
    const percentage = (current / limit) * 100;
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
  }, [counts]);

  const anyResourceAtLimit = Object.keys(counts).some((key) => {
    const resource = key as ResourceType;
    return counts[resource] >= LIMITS[resource];
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
