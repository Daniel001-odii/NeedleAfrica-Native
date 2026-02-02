import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from './index';
import axiosInstance from '../../lib/axios';

export async function sync() {
    await synchronize({
        database,
        pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
            console.log('[Sync] Pulling changes since:', lastPulledAt);
            const response = await axiosInstance.get('/sync', {
                params: {
                    last_pulled_at: lastPulledAt || 0,
                    schema_version: schemaVersion,
                    migration,
                },
            });

            if (response.status !== 200) {
                throw new Error(response.data?.error || 'Pull failed');
            }

            const { changes, timestamp } = response.data;
            console.log('[Sync] Raw changes from server:', JSON.stringify(changes, null, 2));

            // Clean up the changes object to ensure it matches WatermelonDB's expectations
            // The backend might return nulls or missing fields, so we normalize here.

            const normalizedChanges = {
                customers: {
                    created: (changes.customers?.created || []).map((c: any) => ({
                        ...c,
                        sync_status: 'synced'
                    })),
                    updated: (changes.customers?.updated || []).map((c: any) => ({
                        ...c,
                        sync_status: 'synced'
                    })),
                    deleted: changes.customers?.deleted?.map((c: any) => typeof c === 'string' ? c : c.id) || [],
                },
                measurements: {
                    created: (changes.measurements?.created || []).map((m: any) => ({
                        ...m,
                        sync_status: 'synced'
                    })),
                    updated: (changes.measurements?.updated || []).map((m: any) => ({
                        ...m,
                        sync_status: 'synced'
                    })),
                    deleted: changes.measurements?.deleted?.map((m: any) => typeof m === 'string' ? m : m.id) || [],
                },
                orders: {
                    created: (changes.orders?.created || []).map((o: any) => ({
                        ...o,
                        sync_status: 'synced'
                    })),
                    updated: (changes.orders?.updated || []).map((o: any) => ({
                        ...o,
                        sync_status: 'synced'
                    })),
                    deleted: changes.orders?.deleted?.map((o: any) => typeof o === 'string' ? o : o.id) || [],
                },
            };

            console.log('[Sync] Pulled changes successfully');
            return { changes: normalizedChanges, timestamp };
        },
        pushChanges: async ({ changes, lastPulledAt }) => {
            console.log('[Sync] Pushing changes');

            // We need to ensure we send the changes in a format the backend expects
            // and include necessary metadata.

            const response = await axiosInstance.post('/sync', {
                changes,
                last_pulled_at: lastPulledAt || 0,
            });

            if (response.status !== 200) {
                throw new Error(response.data?.error || 'Push failed');
            }
            console.log('[Sync] Pushed changes successfully');
        },
        migrationsEnabledAtVersion: 1,
    });
}
