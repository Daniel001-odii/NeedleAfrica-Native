import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../database/watermelon/index.native';
import { Q } from '@nozbe/watermelondb';
import { useAuth } from '../contexts/AuthContext';

const CHECKLIST_STORAGE_KEY = 'todo_checklist_completed';

export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  route: string;
  /** Key used to check actual data from the database to auto-mark as done */
  checkKey: string;
}

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'first_client',
    label: 'Add your first client',
    description: 'Save their details & measurements',
    route: '/(tabs)/customers/new',
    checkKey: 'has_client',
  },
  {
    id: 'first_order',
    label: 'Create your first order',
    description: 'Start tracking deliveries & payments',
    route: '/(tabs)/orders/new',
    checkKey: 'has_order',
  },
  {
    id: 'first_invoice',
    label: 'Create your first invoice',
    description: 'Send professional invoices to clients',
    route: '/(tabs)/orders/invoices/new',
    checkKey: 'has_invoice',
  },
  {
    id: 'first_template',
    label: 'Set up measurement templates',
    description: 'Save time with reusable templates',
    route: '/measurement-templates/create',
    checkKey: 'has_template',
  },
  {
    id: 'first_catalog',
    label: 'Publish your catalog',
    description: 'Showcase your designs online',
    route: '/(tabs)/profile/catalog',
    checkKey: 'has_catalog',
  },
];

interface TodoChecklistState {
  /** Which items the user has manually dismissed/ticked off */
  dismissedIds: string[];
  /** Items that are auto-detected as done from actual data */
  autoCompletedIds: string[];
  /** Whether the checklist is visible (hides when all done) */
  isVisible: boolean;
  /** All checklist items with completion status */
  items: Array<ChecklistItem & { completed: boolean }>;
  /** Count of completed items */
  completedCount: number;
  /** Total items */
  totalCount: number;
}

/**
 * Hook to track and persist a "Getting Started" todo checklist.
 *
 * Items auto-complete when the corresponding database resource exists,
 * but users can also manually dismiss items via checkboxes.
 * State is persisted in AsyncStorage.
 */
export function useTodoChecklist() {
  const { user } = useAuth();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [autoCompletedIds, setAutoCompletedIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persisted dismissed IDs on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(CHECKLIST_STORAGE_KEY);
        if (stored) {
          setDismissedIds(JSON.parse(stored));
        }
      } catch (e) {
        console.warn('[TodoChecklist] Failed to load persisted state:', e);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  // Persist dismissed IDs whenever they change
  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(dismissedIds)).catch((e) =>
      console.warn('[TodoChecklist] Failed to save state:', e)
    );
  }, [dismissedIds, isLoaded]);

  // Auto-detect completed items from database
  const refreshAutoCompleted = useCallback(async () => {
    if (!user) return;

    const completed: string[] = [];

    try {
      // Check for clients
      const customerCount = await database
        .get('customers')
        .query(Q.where('user_id', user.id), Q.where('deleted_at', Q.eq(null)))
        .fetchCount();
      if (customerCount > 0) completed.push('has_client');

      // Check for orders
      const orderCount = await database
        .get('orders')
        .query(Q.where('user_id', user.id), Q.where('deleted_at', Q.eq(null)))
        .fetchCount();
      if (orderCount > 0) completed.push('has_order');

      // Check for invoices
      const invoiceCount = await database
        .get('invoices')
        .query(Q.where('user_id', user.id), Q.where('deleted_at', Q.eq(null)))
        .fetchCount();
      if (invoiceCount > 0) completed.push('has_invoice');

      // Check for measurement templates
      const templateCount = await database
        .get('measurement_templates')
        .query(Q.where('user_id', user.id), Q.where('deleted_at', Q.eq(null)))
        .fetchCount();
      if (templateCount > 0) completed.push('has_template');

      // Check for catalog (via API check - we'll use the existence check)
      try {
        const { default: axiosInstance } = await import('../lib/axios');
        const res = await axiosInstance.get('/catalog');
        if (res.data?.id) {
          completed.push('has_catalog');
        }
      } catch {
        // Catalog not found or not activated
      }
    } catch (e) {
      console.warn('[TodoChecklist] Failed to check database:', e);
    }

    setAutoCompletedIds(completed);
  }, [user]);

  // Refresh auto-completed on mount and when user changes
  useEffect(() => {
    if (!user) return;
    refreshAutoCompleted();
  }, [user, refreshAutoCompleted]);

  // Re-check after coming back to foreground / manual refresh
  const refresh = useCallback(() => {
    refreshAutoCompleted();
  }, [refreshAutoCompleted]);

  /** Toggle a single item's dismissed state */
  const toggleItem = useCallback((itemId: string) => {
    setDismissedIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  }, []);

  /** Mark all items as dismissed (hides the whole section) */
  const dismissAll = useCallback(() => {
    const allIds = CHECKLIST_ITEMS.map((item) => item.id);
    setDismissedIds(allIds);
  }, []);

  // Build the final items list with completion status
  const items = CHECKLIST_ITEMS.map((item) => {
    const autoDone = autoCompletedIds.includes(item.checkKey);
    const manuallyDismissed = dismissedIds.includes(item.id);
    return { ...item, completed: autoDone || manuallyDismissed };
  });

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  // Visible if not all items are done
  const isVisible = isLoaded && completedCount < totalCount;

  return {
    dismissedIds,
    autoCompletedIds,
    isVisible,
    items,
    completedCount,
    totalCount,
    toggleItem,
    dismissAll,
    refresh,
  } as TodoChecklistState & {
    toggleItem: (itemId: string) => void;
    dismissAll: () => void;
    refresh: () => void;
  };
}
