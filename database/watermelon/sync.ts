import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from './index';
import axiosInstance from '../../lib/axios';

export async function sync() {
    await synchronize({
        database,
        pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
            const response = await axiosInstance.get('/sync', {
                params: {
                    last_pulled_at: lastPulledAt,
                    schema_version: schemaVersion,
                    migration,
                },
            });

            if (response.status !== 200) {
                throw new Error(response.data?.error || 'Pull failed');
            }

            const { changes, timestamp } = response.data;
            
            // Transform backend format to WatermelonDB format
            const transformedChanges = {
                customers: {
                    created: (changes.customers?.created || []).map((c: any) => ({
                        id: c.id,
                        server_id: c.server_id || c.id,
                        full_name: c.full_name,
                        phone_number: c.phone_number,
                        gender: c.gender,
                        notes: c.notes,
                        sync_status: 'synced',
                        created_at: c.created_at,
                        updated_at: c.updated_at,
                    })),
                    updated: (changes.customers?.updated || []).map((c: any) => ({
                        id: c.id,
                        server_id: c.server_id || c.id,
                        full_name: c.full_name,
                        phone_number: c.phone_number,
                        gender: c.gender,
                        notes: c.notes,
                        sync_status: 'synced',
                        created_at: c.created_at,
                        updated_at: c.updated_at,
                    })),
                    deleted: (changes.customers?.deleted || []).map((c: any) => c.id),
                },
                measurements: {
                    created: (changes.measurements?.created || []).map((m: any) => ({
                        id: m.id,
                        server_id: m.server_id || m.id,
                        customer_id: m.customer_id,
                        title: m.title,
                        values_json: m.values_json,
                        sync_status: 'synced',
                        created_at: m.created_at,
                        updated_at: m.updated_at,
                    })),
                    updated: (changes.measurements?.updated || []).map((m: any) => ({
                        id: m.id,
                        server_id: m.server_id || m.id,
                        customer_id: m.customer_id,
                        title: m.title,
                        values_json: m.values_json,
                        sync_status: 'synced',
                        created_at: m.created_at,
                        updated_at: m.updated_at,
                    })),
                    deleted: (changes.measurements?.deleted || []).map((m: any) => m.id),
                },
                orders: {
                    created: (changes.orders?.created || []).map((o: any) => ({
                        id: o.id,
                        server_id: o.server_id || o.id,
                        customer_id: o.customer_id,
                        style_name: o.style_name,
                        amount: o.amount,
                        status: o.status,
                        notes: o.notes,
                        delivery_date: o.delivery_date ? new Date(o.delivery_date).getTime() : null,
                        sync_status: 'synced',
                        created_at: o.created_at,
                        updated_at: o.updated_at,
                    })),
                    updated: (changes.orders?.updated || []).map((o: any) => ({
                        id: o.id,
                        server_id: o.server_id || o.id,
                        customer_id: o.customer_id,
                        style_name: o.style_name,
                        amount: o.amount,
                        status: o.status,
                        notes: o.notes,
                        delivery_date: o.delivery_date ? new Date(o.delivery_date).getTime() : null,
                        sync_status: 'synced',
                        created_at: o.created_at,
                        updated_at: o.updated_at,
                    })),
                    deleted: (changes.orders?.deleted || []).map((o: any) => o.id),
                },
            };

            return { changes: transformedChanges, timestamp };
        },
        pushChanges: async ({ changes, lastPulledAt }) => {
            const dbChanges = changes as any;
            // Transform WatermelonDB format to backend format
            const transformedChanges = {
                customers: {
                    created: dbChanges.customers?.created?.map((c: any) => ({
                        id: c.id,
                        full_name: c.full_name,
                        phone_number: c.phone_number,
                        gender: c.gender,
                        notes: c.notes,
                        created_at: c.created_at,
                        updated_at: c.updated_at,
                    })) || [],
                    updated: dbChanges.customers?.updated?.map((c: any) => ({
                        id: c.id,
                        full_name: c.full_name,
                        phone_number: c.phone_number,
                        gender: c.gender,
                        notes: c.notes,
                        created_at: c.created_at,
                        updated_at: c.updated_at,
                    })) || [],
                    deleted: dbChanges.customers?.deleted?.map((id: string) => ({ 
                        id, 
                        deleted_at: Date.now() 
                    })) || [],
                },
                measurements: {
                    created: dbChanges.measurements?.created?.map((m: any) => ({
                        id: m.id,
                        customer_id: m.customer_id,
                        title: m.title,
                        values_json: m.values_json,
                        created_at: m.created_at,
                        updated_at: m.updated_at,
                    })) || [],
                    updated: dbChanges.measurements?.updated?.map((m: any) => ({
                        id: m.id,
                        customer_id: m.customer_id,
                        title: m.title,
                        values_json: m.values_json,
                        created_at: m.created_at,
                        updated_at: m.updated_at,
                    })) || [],
                    deleted: dbChanges.measurements?.deleted?.map((id: string) => ({ 
                        id, 
                        deleted_at: Date.now() 
                    })) || [],
                },
                orders: {
                    created: dbChanges.orders?.created?.map((o: any) => ({
                        id: o.id,
                        customer_id: o.customer_id,
                        style_name: o.style_name,
                        amount: o.amount,
                        status: o.status,
                        notes: o.notes,
                        delivery_date: o.delivery_date,
                        created_at: o.created_at,
                        updated_at: o.updated_at,
                    })) || [],
                    updated: dbChanges.orders?.updated?.map((o: any) => ({
                        id: o.id,
                        customer_id: o.customer_id,
                        style_name: o.style_name,
                        amount: o.amount,
                        status: o.status,
                        notes: o.notes,
                        delivery_date: o.delivery_date,
                        created_at: o.created_at,
                        updated_at: o.updated_at,
                    })) || [],
                    deleted: dbChanges.orders?.deleted?.map((id: string) => ({ 
                        id, 
                        deleted_at: Date.now() 
                    })) || [],
                },
            };

            const response = await axiosInstance.post('/sync', {
                changes: transformedChanges,
                last_pulled_at: lastPulledAt,
            });

            if (response.status !== 200) {
                throw new Error(response.data?.error || 'Push failed');
            }
        },
        migrationsEnabledAtVersion: 1,
    });
}
