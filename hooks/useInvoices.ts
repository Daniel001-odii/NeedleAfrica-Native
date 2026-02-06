import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import { Q } from '@nozbe/watermelondb';
import Invoice from '../database/watermelon/models/Invoice';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from './useSync';

export function useInvoices(customerId?: string) {
    const database = useDatabase();
    const { user } = useAuth();
    const { sync } = useSync();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchInvoices = useCallback(() => {
        if (!user) return () => { };

        let query = database.get<Invoice>('invoices').query(
            Q.where('user_id', user.id),
            Q.where('deleted_at', Q.eq(null)),
            Q.sortBy('created_at', Q.desc)
        );

        if (customerId) {
            query = query.extend(Q.where('customer_id', customerId));
        }

        const subscription = query.observe().subscribe(data => {
            setInvoices(data);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [database, customerId, user]);

    useEffect(() => {
        const unsubscribe = fetchInvoices();
        return unsubscribe;
    }, [fetchInvoices]);

    const createInvoice = async (data: {
        customerId: string;
        orderId: string;
        amount: number;
        currency: string;
        notes?: string;
    }) => {
        if (!user) return;

        // Generate invoice number: INV-[timestamp-suffix] or INV-[count+1]
        // For simplicity, let's use INV-[count + 1] padded
        const existingCount = await database.get<Invoice>('invoices').query(
            Q.where('user_id', user.id)
        ).fetchCount();

        const invoiceNumber = `INV-${(existingCount + 1).toString().padStart(4, '0')}`;

        const invoice = await Invoice.createSyncable(database, user.id, {
            ...data,
            invoiceNumber
        });

        sync().catch(console.error);
        return invoice;
    };

    const deleteInvoice = async (id: string) => {
        const invoice = await database.get<Invoice>('invoices').find(id);
        await invoice.softDelete();
        sync().catch(console.error);
    };

    return { invoices, loading, createInvoice, deleteInvoice, refresh: fetchInvoices };
}
