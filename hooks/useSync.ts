import { useState, useCallback, useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { performSync as syncRecords } from '../database/watermelon/sync';
import { database } from '../database/watermelon';
import { useAuth } from '../contexts/AuthContext';

// Global lock to prevent concurrent sync calls across multiple instances of useSync
let globalSyncInProgress = false;

export function useSync() {
    const { user } = useAuth();
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncError, setLastSyncError] = useState<Error | null>(null);
    const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
    const [isOnline, setIsOnline] = useState(true);

    const syncKey = user ? `lastSyncedAt_${user.id}` : null;
    const syncTimeout = useRef<NodeJS.Timeout | null>(null);

    // Keep local isSyncing state in sync with global lock for this instance
    useEffect(() => {
        if (isSyncing && !globalSyncInProgress) {
            setIsSyncing(false);
        }
    }, [isSyncing]);

    // Load last sync time
    useEffect(() => {
        if (!syncKey) return;
        AsyncStorage.getItem(syncKey).then(v => v && setLastSyncedAt(parseInt(v, 10)));
    }, [syncKey]);

    const sync = useCallback(async (options?: { full?: boolean }) => {
        if (!user || globalSyncInProgress) {
            if (globalSyncInProgress) console.log('[Sync] Synchronization already in progress, skipping...');
            return;
        }

        globalSyncInProgress = true;
        setIsSyncing(true);
        setLastSyncError(null);

        try {
            if (options?.full) {
                console.log('[Sync] Forcing full sync...');
                await database.adapter.setLocal('__watermelon_last_pulled_at', '0');
            }
            await syncRecords();
            const now = Date.now();
            setLastSyncedAt(now);
            if (syncKey) await AsyncStorage.setItem(syncKey, now.toString());
            console.log('[Sync] Synchronization successful');

            // CRITICAL: Refresh reminders after successful sync to ensure notifications match local state
            try {
                const { NotificationService } = await import('../services/NotificationService');
                const { Q } = await import('@nozbe/watermelondb');
                const orders = await database.get('orders').query(Q.where('deleted_at', Q.eq(null))).fetch();
                await NotificationService.refreshAllReminders(orders, user);
            } catch (notifyError) {
                console.error('[Sync] Failed to refresh notifications after sync:', notifyError);
            }
        } catch (error: any) {
            console.error('[Sync] Synchronization failed:', error);
            setLastSyncError(error);
            throw error;
        } finally {
            globalSyncInProgress = false;
            setIsSyncing(false);
        }
    }, [user, syncKey]);

    const triggerSync = useCallback((options?: { immediate?: boolean; full?: boolean }) => {
        if (syncTimeout.current) clearTimeout(syncTimeout.current);
        
        if (options?.immediate || options?.full) {
            return sync({ full: options?.full });
        } else {
            syncTimeout.current = setTimeout(() => {
                sync();
            }, 1000);
            return Promise.resolve();
        }
    }, [sync]);

    useEffect(() => {
        // Only trigger initial sync if not already syncing
        if (!globalSyncInProgress) {
            triggerSync();
        }

        const unsubscribe = NetInfo.addEventListener(state => {
            const wasOffline = !isOnline;
            const nowOnline = !!state.isConnected;
            setIsOnline(nowOnline);
            
            if (wasOffline && nowOnline) {
                triggerSync();
            }
        });

        return () => {
            unsubscribe();
            if (syncTimeout.current) clearTimeout(syncTimeout.current);
        };
    }, [isOnline, triggerSync]);

    return {
        isSyncing,
        lastSyncError,
        lastSyncedAt,
        isOnline,
        sync: triggerSync,
    };
}

