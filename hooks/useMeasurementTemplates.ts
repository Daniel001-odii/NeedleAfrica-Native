import { useState, useEffect, useCallback, useRef } from 'react';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import { Q } from '@nozbe/watermelondb';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MeasurementTemplate from '../database/watermelon/models/MeasurementTemplate';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from './useSync';
import { PRESET_MEASUREMENT_TEMPLATES } from '../constants/presetMeasurementTemplates';
export { MeasurementTemplate };

const presetSeedKey = (userId: string) => `@preset_templates_seeded_${userId}`;

export function useMeasurementTemplates() {
    const database = useDatabase();
    const { user } = useAuth();
    const { sync } = useSync();
    const [templates, setTemplates] = useState<MeasurementTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const seedingRef = useRef(false);

    const seedPresetTemplates = useCallback(async () => {
        if (!user || seedingRef.current) return;

        const alreadySeeded = await AsyncStorage.getItem(presetSeedKey(user.id));
        if (alreadySeeded) return;

        const existing = await database.get<MeasurementTemplate>('measurement_templates').query(
            Q.where('user_id', user.id),
            Q.where('deleted_at', Q.eq(null))
        ).fetchCount();

        if (existing > 0) {
            await AsyncStorage.setItem(presetSeedKey(user.id), 'true');
            return;
        }

        seedingRef.current = true;
        try {
            for (const preset of PRESET_MEASUREMENT_TEMPLATES) {
                await MeasurementTemplate.createSyncable(database, user.id, preset);
            }
            await AsyncStorage.setItem(presetSeedKey(user.id), 'true');
            sync().catch(console.error);
        } finally {
            seedingRef.current = false;
        }
    }, [database, user, sync]);

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
        if (user) {
            seedPresetTemplates().catch(console.error);
        }
    }, [user, seedPresetTemplates]);

    useEffect(() => {
        const unsubscribe = fetchTemplates();
        return unsubscribe;
    }, [fetchTemplates]);

    const addTemplate = async (data: { name: string; fields: string[]; isPublic?: boolean }) => {
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
 
    const updateTemplate = async (id: string, data: { name: string; fields: string[]; isPublic?: boolean }) => {
        await database.write(async () => {
            const template = await database.get<MeasurementTemplate>('measurement_templates').find(id);
            await template.update(record => {
                record.name = data.name;
                record.fieldsJson = JSON.stringify(data.fields);
                if (data.isPublic !== undefined) {
                    record.isPublic = data.isPublic;
                }
            });
        });
        sync().catch(console.error);
    };

    return { templates, loading, addTemplate, deleteTemplate, updateTemplate };
}
