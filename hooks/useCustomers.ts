import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import { Q } from '@nozbe/watermelondb';
import Customer from '../database/watermelon/models/Customer';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from './useSync';
export { Customer };

export function useCustomers(searchQuery: string = '') {
    const database = useDatabase();
    const { user } = useAuth();
    const { sync } = useSync();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCustomers = useCallback(() => {
        if (!user) return () => { };

        let query = database.get<Customer>('customers').query(
            Q.where('user_id', user.id),
            Q.where('deleted_at', Q.eq(null))
        );

        if (searchQuery) {
            query = query.extend(
                Q.or(
                    Q.where('full_name', Q.like(`%${Q.sanitizeLikeString(searchQuery)}%`)),
                    Q.where('phone_number', Q.like(`%${Q.sanitizeLikeString(searchQuery)}%`))
                )
            );
        }

        const subscription = query.observe().subscribe(data => {
            setCustomers(data);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [database, searchQuery, user]);

    useEffect(() => {
        const unsubscribe = fetchCustomers();
        return unsubscribe;
    }, [fetchCustomers]);

    const addCustomer = async (data: { fullName: string; phoneNumber: string; gender?: string; notes?: string }) => {
        if (!user) return;
        const customer = await Customer.createSyncable(database, user.id, data);
        sync().catch(console.error);
        return customer;
    };

    const seedCustomers = async () => {
        if (!user) return;
        const dummyData = [
            { fullName: 'Sarah Johnson', phoneNumber: '08012345678', gender: 'female', notes: 'Prefers silk fabrics. Waist: 28, Bust: 34.' },
            { fullName: 'Michael Chen', phoneNumber: '07098765432', gender: 'male', notes: 'Suit specialist. Shoulder: 18, Sleeve: 25.' },
            { fullName: 'Amaka Eze', phoneNumber: '09011223344', gender: 'female', notes: 'Native wear enthusiast. Likes bold patterns.' },
            { fullName: 'David Okoro', phoneNumber: '08155667788', gender: 'male', notes: 'Slim fit preferences.' },
        ];

        for (const data of dummyData) {
            await Customer.createSyncable(database, user.id, data);
        }
        sync().catch(console.error);
    };

    const updateCustomer = async (id: string, data: { fullName?: string; phoneNumber?: string; gender?: string; notes?: string }) => {
        await database.write(async () => {
            const customer = await database.get<Customer>('customers').find(id);
            await customer.update(record => {
                if (data.fullName !== undefined) record.fullName = data.fullName;
                if (data.phoneNumber !== undefined) record.phoneNumber = data.phoneNumber;
                if (data.gender !== undefined) record.gender = data.gender;
                if (data.notes !== undefined) record.notes = data.notes;
                record.syncStatus = 'created'; // Custom flag for UI
            });
        });
        sync().catch(console.error);
    };

    const deleteCustomer = async (id: string) => {
        await database.write(async () => {
            const customer = await database.get<Customer>('customers').find(id);
            await customer.markAsDeleted();
        });
        sync().catch(console.error);
    };

    return { customers, loading, addCustomer, updateCustomer, deleteCustomer, seedCustomers, refresh: fetchCustomers };
}
