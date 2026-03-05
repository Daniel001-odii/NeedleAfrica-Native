import { useState, useCallback, useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { sync } from '../database/watermelon/sync';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';

export function useSync() {
    const { user } = useAuth();
    // Use a flag to prevent concurrent sync calls
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncError, setLastSyncError] = useState<Error | null>(null);
    const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
    const [isOnline, setIsOnline] = useState(true);

    const syncKey = user ? `lastSyncedAt_${user.id}` : null;

    // Ref to track if a sync is currently running globally in this hook instance
    const syncInProgress = useRef(false);

    useEffect(() => {
        if (!syncKey) return;

        // Load last synced time for this specific user
        AsyncStorage.getItem(syncKey).then(value => {
            if (value) {
                setLastSyncedAt(parseInt(value, 10));
            } else {
                setLastSyncedAt(null);
            }
        });

        // Monitor network state
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsOnline(!!state.isConnected);
        });

        return () => unsubscribe();
    }, [syncKey]);

    const performSync = useCallback(async (options: { full?: boolean } = {}) => {
        if (!user) return;

        if (syncInProgress.current) {
            console.log('[Sync] Synchronization already in progress, skipping...');
            return;
        }

        syncInProgress.current = true;
        setIsSyncing(true);
        setLastSyncError(null);
        try {
            await sync(options.full);

            const timestamp = Date.now();
            if (syncKey) {
                await AsyncStorage.setItem(syncKey, timestamp.toString());
            }
            setLastSyncedAt(timestamp);
        } catch (error: any) {
            // Check if it's the specific WatermelonDB concurrent sync error
            if (error?.message?.includes('Concurrent synchronization')) {
                console.log('[Sync] Concurrent sync detected and handled.');
            } else {
                console.error('Sync failed:', error);
                setLastSyncError(error);
                throw error;
            }
        } finally {
            syncInProgress.current = false;
            setIsSyncing(false);
        }
    }, [user, syncKey]);

    return {
        isSyncing,
        lastSyncError,
        lastSyncedAt,
        isOnline,
        sync: performSync,
    };
}

