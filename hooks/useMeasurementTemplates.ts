import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import { Q } from '@nozbe/watermelondb';
import MeasurementTemplate from '../database/watermelon/models/MeasurementTemplate';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from './useSync';
export { MeasurementTemplate };

export function useMeasurementTemplates() {
    const database = useDatabase();
    const { user } = useAuth();
    const { sync } = useSync();
    const [templates, setTemplates] = useState<MeasurementTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTemplates = useCallback(() => {
        if (!user) return () => { };

        let query = database.get<MeasurementTemplate>('measurement_templates').query(
            Q.where('user_id', user.id),
            Q.where('deleted_at', Q.eq(null)),
            Q.sortBy('created_at', Q.desc)
        );

        const subscription = query.observe().subscribe(data => {
            setTemplates(data);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [database, user]);

    useEffect(() => {
        const unsubscribe = fetchTemplates();
        return unsubscribe;
    }, [fetchTemplates]);

    const addTemplate = async (data: { name: string; fields: string[] }) => {
        if (!user) return;
        const template = await MeasurementTemplate.createSyncable(database, user.id, data);
        sync().catch(console.error);
        return template;
    };
 
    const deleteTemplate = async (id: string) => {
        const template = await database.get<MeasurementTemplate>('measurement_templates').find(id);
        await template.softDelete();
        sync().catch(console.error);
    };
 
    const updateTemplate = async (id: string, data: { name: string; fields: string[] }) => {
        await database.write(async () => {
            const template = await database.get<MeasurementTemplate>('measurement_templates').find(id);
            await template.update(record => {
                record.name = data.name;
                record.fieldsJson = JSON.stringify(data.fields);
            });
        });
        sync().catch(console.error);
    };

    return { templates, loading, addTemplate, deleteTemplate, updateTemplate };
}
