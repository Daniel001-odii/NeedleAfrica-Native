import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import { Q } from '@nozbe/watermelondb';
import Measurement from '../database/watermelon/models/Measurement';
import MeasurementTemplate from '../database/watermelon/models/MeasurementTemplate';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from './useSync';

export function useCustomerMeasurements(customerId: string) {
    const database = useDatabase();
    const { user } = useAuth();
    const { sync } = useSync();
    const [measurements, setMeasurements] = useState<Measurement[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMeasurements = useCallback(() => {
        if (!user || !customerId) return () => { };

        const query = database.get<Measurement>('measurements').query(
            Q.where('customer_id', customerId),
            Q.where('deleted_at', Q.eq(null)),
            Q.sortBy('created_at', Q.desc)
        );

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

    const addMeasurement = async (title: string, values: any) => {
        if (!user) return;
        await Measurement.createSyncable(database, user.id, customerId, {
            title,
            valuesJson: JSON.stringify(values)
        });
        sync().catch(console.error);
    };

    const deleteMeasurement = async (id: string) => {
        const measurement = await database.get<Measurement>('measurements').find(id);
        await measurement.softDelete();
        sync().catch(console.error);
    };

    const updateMeasurement = async (id: string, title: string, values: any) => {
        const measurement = await database.get<Measurement>('measurements').find(id);
        await measurement.update(record => {
            record.title = title;
            record.valuesJson = JSON.stringify(values);
            record.sync_status = 'updated';
        });
        sync().catch(console.error);
    };

    return { measurements, loading, addMeasurement, deleteMeasurement, updateMeasurement };
}
