import { useState, useEffect, useCallback } from 'react';
import { database } from '../database/watermelon';
import { Q } from '@nozbe/watermelondb';
import { useAuth } from '../contexts/AuthContext';

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
  const { user } = useAuth();
  const [counts, setCounts] = useState<ResourceCounts>({
    orders: 0,
    customers: 0,
    templates: 0,
    invoices: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Helper to create a query for a resource
  const getResourceQuery = useCallback((resource: ResourceType) => {
    if (!user) return null;

    const tableName = resource === 'templates' ? 'measurement_templates' : resource;

    return database
      .get(tableName)
      .query(
        Q.where('user_id', user.id),
        Q.where('deleted_at', Q.eq(null))
      );
  }, [user]);

  useEffect(() => {
    if (!user) {
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
  }, [user, getResourceQuery]);

  // Keep refreshCounts for manual triggers if needed, though observers handle most cases
  const refreshCounts = useCallback(async () => {
    if (!user) return;
    // Handled by observers, but we can do a manual fetch if needed
  }, [user]);

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

