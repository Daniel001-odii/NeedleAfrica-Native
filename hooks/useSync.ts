import { useState, useCallback, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { sync } from '../database/watermelon/sync';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useSync() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncError, setLastSyncError] = useState<Error | null>(null);
    const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
    const [isOnline, setIsOnline] = useState(true);

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
        setIsSyncing(true);
        setLastSyncError(null);
        try {
            await sync();
            const timestamp = Date.now();
            await AsyncStorage.setItem('lastSyncedAt', timestamp.toString());
            setLastSyncedAt(timestamp);
        } catch (error: any) {
            console.error('Sync failed:', error);
            setLastSyncError(error);
            throw error;
        } finally {
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
