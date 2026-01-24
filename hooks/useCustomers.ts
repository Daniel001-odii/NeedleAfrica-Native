import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import * as Crypto from 'expo-crypto';

export interface Customer {
    id: string;
    server_id: string | null;
    full_name: string;
    phone_number: string | null;
    gender: string | null;
    notes: string | null;
    is_synced: boolean;
    created_at: number;
    updated_at: number;
}

// Map database row to interface
const mapRow = (row: any): Customer => ({
    ...row,
    is_synced: !!row.is_synced,
    fullName: row.full_name, // Support old camelCase if needed, but let's stick to what UI expects
});

export function useCustomers(searchQuery: string = '') {
    const [customers, setCustomers] = useState<(Customer & { fullName: string; phoneNumber: string | null })[]>([]);
    const [loading, setLoading] = useState(true);
    const db = useSQLiteContext();

    const fetchCustomers = useCallback(async () => {
        try {
            setLoading(true);
            let query = 'SELECT * FROM customers';
            let params: any[] = [];

            if (searchQuery) {
                query += ' WHERE full_name LIKE ? OR phone_number LIKE ?';
                const searchParam = `%${searchQuery}%`;
                params = [searchParam, searchParam];
            }

            query += ' ORDER BY created_at DESC';

            const result = await db.getAllAsync(query, params);
            const mapped = result.map((row: any) => ({
                ...row,
                fullName: row.full_name,
                phoneNumber: row.phone_number,
                is_synced: !!row.is_synced,
            }));
            setCustomers(mapped);
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    }, [db, searchQuery]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const addCustomer = async (data: { fullName: string; phoneNumber: string; gender?: string; notes?: string }) => {
        const id = Crypto.randomUUID();
        const now = Date.now();

        await db.runAsync(
            `INSERT INTO customers (id, full_name, phone_number, gender, notes, is_synced, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, data.fullName, data.phoneNumber, data.gender || '', data.notes || '', 0, now, now]
        );

        await fetchCustomers(); // Refresh list
    };

    const seedCustomers = async () => {
        const dummyData = [
            { fullName: 'Sarah Johnson', phoneNumber: '08012345678', gender: 'female', notes: 'Prefers silk fabrics. Waist: 28, Bust: 34.' },
            { fullName: 'Michael Chen', phoneNumber: '07098765432', gender: 'male', notes: 'Suit specialist. Shoulder: 18, Sleeve: 25.' },
            { fullName: 'Amaka Eze', phoneNumber: '09011223344', gender: 'female', notes: 'Native wear enthusiast. Likes bold patterns.' },
            { fullName: 'David Okoro', phoneNumber: '08155667788', gender: 'male', notes: 'Slim fit preferences.' },
        ];

        for (const data of dummyData) {
            const id = Crypto.randomUUID();
            const now = Date.now();
            await db.runAsync(
                `INSERT INTO customers (id, full_name, phone_number, gender, notes, is_synced, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [id, data.fullName, data.phoneNumber, data.gender, data.notes, 0, now, now]
            );
        }

        await fetchCustomers();
    };

    return { customers, loading, addCustomer, seedCustomers, refresh: fetchCustomers };
}
