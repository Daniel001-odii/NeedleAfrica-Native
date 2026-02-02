import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import { Q } from '@nozbe/watermelondb';
import Order from '../database/watermelon/models/Order';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from './useSync';
export { Order };

export function useOrders(customerId?: string) {
    const database = useDatabase();
    const { user } = useAuth();
    const { sync } = useSync();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = useCallback(() => {
        if (!user) return () => { };

        let query = database.get<Order>('orders').query(
            Q.where('user_id', user.id),
            Q.where('deleted_at', Q.eq(null))
        );

        if (customerId) {
            query = query.extend(Q.where('customer_id', customerId));
        }

        const subscription = query.observe().subscribe(data => {
            setOrders(data);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [database, customerId, user]);

    useEffect(() => {
        const unsubscribe = fetchOrders();
        return unsubscribe;
    }, [fetchOrders]);

    const addOrder = async (data: {
        customerId: string;
        styleName: string;
        amount: number;
        status: string;
        notes?: string;
        deliveryDate?: Date;
    }) => {
        if (!user) return;

        await Order.createSyncable(database, user.id, data.customerId, data);

        // Trigger immediate sync to server
        sync().catch(console.error);
    };

    const updateOrderStatus = async (id: string, status: string) => {
        await database.write(async () => {
            const order = await database.get<Order>('orders').find(id);
            await order.update(record => {
                record.status = status;
                record.syncStatus = 'created';
            });
        });
        sync().catch(console.error);
    };

    const deleteOrder = async (id: string) => {
        await database.write(async () => {
            const order = await database.get<Order>('orders').find(id);
            await order.markAsDeleted();
        });
        sync().catch(console.error);
    };

    return { orders, loading, addOrder, updateOrderStatus, deleteOrder, refresh: fetchOrders };
}
