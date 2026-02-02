import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import { Q } from '@nozbe/watermelondb';
import Measurement from '../database/watermelon/models/Measurement';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from './useSync';
export { Measurement };

export function useMeasurements(customerId?: string) {
    const database = useDatabase();
    const { user } = useAuth();
    const { sync } = useSync();
    const [measurements, setMeasurements] = useState<Measurement[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMeasurements = useCallback(() => {
        if (!user) return () => { };

        let query = database.get<Measurement>('measurements').query(
            Q.where('user_id', user.id),
            Q.where('deleted_at', Q.eq(null))
        );

        if (customerId) {
            query = query.extend(Q.where('customer_id', customerId));
        }

        const subscription = query.observe().subscribe(data => {
            setMeasurements(data);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [database, customerId, user]);

    useEffect(() => {
        const unsubscribe = fetchMeasurements();
        return unsubscribe;
    }, [fetchMeasurements]);

    const addMeasurement = async (data: {
        customerId: string;
        title: string;
        valuesJson: string;
    }) => {
        if (!user) return;

        await Measurement.createSyncable(database, user.id, data.customerId, data);

        // Trigger immediate sync to server
        sync().catch(console.error);
    };

    const updateMeasurement = async (id: string, data: { title?: string; valuesJson?: string }) => {
        await database.write(async () => {
            const measurement = await database.get<Measurement>('measurements').find(id);
            await measurement.update(record => {
                if (data.title !== undefined) record.title = data.title;
                if (data.valuesJson !== undefined) record.valuesJson = data.valuesJson;
                record.syncStatus = 'created';
            });
        });
        sync().catch(console.error);
    };

    const deleteMeasurement = async (id: string) => {
        await database.write(async () => {
            const measurement = await database.get<Measurement>('measurements').find(id);
            await measurement.markAsDeleted();
        });
        sync().catch(console.error);
    };

    return { measurements, loading, addMeasurement, updateMeasurement, deleteMeasurement, refresh: fetchMeasurements };
}
