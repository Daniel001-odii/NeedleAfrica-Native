import { synchronize } from '@nozbe/watermelondb/sync';
import { Q } from '@nozbe/watermelondb';
import { database } from './index.native';
import axiosInstance from '../../lib/axios';

export async function performSync() {
    await synchronize({
        database,
        pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
            console.log('[Sync] Pulling changes...', { lastPulledAt });
            const response = await axiosInstance.get('/sync/pull', {
                params: {
                    lastPulledAt: lastPulledAt || 0,
                    schemaVersion
                }
            });

            if (response.status !== 200) {
                throw new Error(`Pull failed: ${response.data?.error || response.statusText}`);
            }

            const { changes, timestamp } = response.data;

            // Normalize pull changes to ensure correct local types
            const normalizedChanges = { ...changes };
            Object.keys(normalizedChanges).forEach(table => {
                const tableChanges = normalizedChanges[table];
                ['created', 'updated'].forEach(type => {
                    if (tableChanges[type]) {
                        tableChanges[type] = tableChanges[type].map((record: any) => ({
                            ...record,
                            created_at: record.created_at ? new Date(record.created_at).getTime() : Date.now(),
                            updated_at: record.updated_at ? new Date(record.updated_at).getTime() : Date.now(),
                            deleted_at: record.deleted_at ? new Date(record.deleted_at).getTime() : null,
                            // Table specific conversions
                            ...(table === 'orders' && record.delivery_date ? {
                                delivery_date: new Date(record.delivery_date).getTime()
                            } : {}),
                            ...(table === 'invoices' && record.amount ? {
                                amount: parseFloat(record.amount.toString())
                            } : {}),
                            ...(table === 'orders' && record.amount ? {
                                amount: parseFloat(record.amount.toString())
                            } : {}),
                            ...(table === 'orders' && record.amount_paid ? {
                                amount_paid: parseFloat(record.amount_paid.toString())
                            } : {}),
                        }));
                    }
                });
            });

            // Filter out existing local records from 'created' to prevent diagnostic warning
            for (const table of Object.keys(normalizedChanges)) {
                const tableChanges = normalizedChanges[table];
                const created = tableChanges.created || [];
                if (created.length > 0) {
                    const ids = created.map((r: any) => r.id);
                    try {
                        const collection = database.get(table);
                        const existingRecords = await collection.query(Q.where('id', Q.oneOf(ids))).fetch();
                        const existingIds = new Set(existingRecords.map((r: any) => r.id));

                        if (existingIds.size > 0) {
                            console.log(`[Sync] Found ${existingIds.size} records in table "${table}" that already exist locally. Moving from created to updated.`);
                            const newCreated = [];
                            const newUpdated = [...(tableChanges.updated || [])];
                            for (const record of created) {
                                if (existingIds.has(record.id)) {
                                    newUpdated.push(record);
                                } else {
                                    newCreated.push(record);
                                }
                            }
                            tableChanges.created = newCreated;
                            tableChanges.updated = newUpdated;
                        }
                    } catch (err) {
                        console.error(`[Sync] Pre-validation failed for table ${table}:`, err);
                    }
                }
            }

            return { changes: normalizedChanges, timestamp };
        },
        pushChanges: async ({ changes, lastPulledAt }) => {
            console.log('[Sync] Pushing changes...', { lastPulledAt });

            const response = await axiosInstance.post('/sync/push', {
                changes,
                lastPulledAt
            });

            if (response.status !== 200) {
                throw new Error(`Push failed: ${response.data?.error || response.statusText}`);
            }
        },
        migrationsEnabledAtVersion: 1,
    });
}
