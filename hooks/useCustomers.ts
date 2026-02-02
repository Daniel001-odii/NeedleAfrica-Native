import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import { Q } from '@nozbe/watermelondb';
import Customer from '../database/watermelon/models/Customer';
export { Customer };

export function useCustomers(searchQuery: string = '') {
    const database = useDatabase();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCustomers = useCallback(() => {
        let query = database.get<Customer>('customers').query();

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
    }, [database, searchQuery]);

    useEffect(() => {
        const unsubscribe = fetchCustomers();
        return unsubscribe;
    }, [fetchCustomers]);

    const addCustomer = async (data: { fullName: string; phoneNumber: string; gender?: string; notes?: string }) => {
        await database.write(async () => {
            await database.get<Customer>('customers').create(customer => {
                customer.fullName = data.fullName;
                customer.phoneNumber = data.phoneNumber;
                customer.gender = data.gender || '';
                customer.notes = data.notes || '';
                customer.syncStatus = 'created';
            });
        });
    };

    const seedCustomers = async () => {
        const dummyData = [
            { fullName: 'Sarah Johnson', phoneNumber: '08012345678', gender: 'female', notes: 'Prefers silk fabrics. Waist: 28, Bust: 34.' },
            { fullName: 'Michael Chen', phoneNumber: '07098765432', gender: 'male', notes: 'Suit specialist. Shoulder: 18, Sleeve: 25.' },
            { fullName: 'Amaka Eze', phoneNumber: '09011223344', gender: 'female', notes: 'Native wear enthusiast. Likes bold patterns.' },
            { fullName: 'David Okoro', phoneNumber: '08155667788', gender: 'male', notes: 'Slim fit preferences.' },
        ];

        await database.write(async () => {
            for (const data of dummyData) {
                await database.get<Customer>('customers').create(customer => {
                    customer.fullName = data.fullName;
                    customer.phoneNumber = data.phoneNumber;
                    customer.gender = data.gender;
                    customer.notes = data.notes;
                    customer.syncStatus = 'created';
                });
            }
        });
    };

    const updateCustomer = async (id: string, data: { fullName?: string; phoneNumber?: string; gender?: string; notes?: string }) => {
        await database.write(async () => {
            const customer = await database.get<Customer>('customers').find(id);
            await customer.update(record => {
                if (data.fullName !== undefined) record.fullName = data.fullName;
                if (data.phoneNumber !== undefined) record.phoneNumber = data.phoneNumber;
                if (data.gender !== undefined) record.gender = data.gender;
                if (data.notes !== undefined) record.notes = data.notes;
                record.syncStatus = 'created';
            });
        });
    };

    const deleteCustomer = async (id: string) => {
        await database.write(async () => {
            const customer = await database.get<Customer>('customers').find(id);
            await customer.markAsDeleted(); // WatermelonDB's standard way to handle deletions for sync
        });
    };

    return { customers, loading, addCustomer, updateCustomer, deleteCustomer, seedCustomers, refresh: fetchCustomers };
}
