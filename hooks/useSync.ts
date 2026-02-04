import { useState, useCallback, useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { sync } from '../database/watermelon/sync';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useSync() {
    // Use a flag to prevent concurrent sync calls
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncError, setLastSyncError] = useState<Error | null>(null);
    const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
    const [isOnline, setIsOnline] = useState(true);

    // Ref to track if a sync is currently running globally in this hook instance
    // Or better, a shared state. Using a ref for immediate check.
    const syncInProgress = useRef(false);

    useEffect(() => {
        // Load last synced time
        AsyncStorage.getItem('lastSyncedAt').then(value => {
            if (value) setLastSyncedAt(parseInt(value, 10));
        });

        // Monitor network state
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsOnline(!!state.isConnected);
        });

        return () => unsubscribe();
    }, []);

    const performSync = useCallback(async () => {
        if (syncInProgress.current) {
            console.log('[Sync] Synchronization already in progress, skipping...');
            return;
        }

        syncInProgress.current = true;
        setIsSyncing(true);
        setLastSyncError(null);
        try {
            await sync();
            const timestamp = Date.now();
            await AsyncStorage.setItem('lastSyncedAt', timestamp.toString());
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
    }, []);

    return {
        isSyncing,
        lastSyncError,
        lastSyncedAt,
        isOnline,
        sync: performSync,
    };
}
