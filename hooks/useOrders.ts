import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import { Q } from '@nozbe/watermelondb';
import Order from '../database/watermelon/models/Order';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from './useSync';
import { NotificationService } from '../services/NotificationService';
import Customer from '../database/watermelon/models/Customer';
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
        amountPaid?: number;
        status: string;
        notes?: string;
        deliveryDate?: Date;
        fabricImage?: string;
        styleImage?: string;
    }) => {
        if (!user) return;

        const newOrder = await Order.createSyncable(database, user.id, data.customerId, data);

        // Schedule Notification if delivery date is set
        if (data.deliveryDate) {
            const customer = await database.get<Customer>('customers').find(data.customerId);
            await NotificationService.scheduleDeliveryReminder(
                newOrder.id,
                customer.fullName || 'Customer',
                data.deliveryDate,
                parseInt((!user.reminderDays || user.reminderDays === '0') ? '1' : user.reminderDays)
            );
        }

        // Trigger immediate sync to server
        sync().catch(console.error);
    };

    const updateOrder = async (id: string, data: {
        styleName?: string;
        amount?: number;
        amountPaid?: number;
        status?: string;
        notes?: string;
        deliveryDate?: Date | null;
        fabricImage?: string;
        styleImage?: string;
    }) => {
        await database.write(async () => {
            const order = await database.get<Order>('orders').find(id);
            await order.update(record => {
                if (data.styleName !== undefined) record.styleName = data.styleName;
                if (data.amount !== undefined) record.amount = data.amount;
                if (data.amountPaid !== undefined) record.amountPaid = data.amountPaid;
                if (data.status !== undefined) record.status = data.status;
                if (data.notes !== undefined) record.notes = data.notes;
                if (data.deliveryDate !== undefined) record.deliveryDate = data.deliveryDate;
                if (data.fabricImage !== undefined) record.fabricImage = data.fabricImage;
                if (data.styleImage !== undefined) record.styleImage = data.styleImage;
                record.syncStatus = 'created';
                record.updatedAt = new Date();
            });

            // Handle Notification Rescheduling
            if (data.status === 'COMPLETED' || data.status === 'CANCELLED') {
                await NotificationService.cancelOrderReminders(id);
            } else if (data.deliveryDate && order.customer) {
                // Determine user reminder days setting (default to '1' if not set)
                const reminderDaysStr = (!user?.reminderDays || user?.reminderDays === '0') ? '1' : user?.reminderDays;
                const days = parseInt(reminderDaysStr);

                const customer = await order.customer.fetch();
                if (customer) {
                    await NotificationService.scheduleDeliveryReminder(
                        id,
                        customer.fullName || 'Customer',
                        data.deliveryDate,
                        isNaN(days) ? 1 : days
                    );
                }
            }
        });
        sync().catch(console.error);
    };

    const updateOrderStatus = async (id: string, status: string) => {
        await updateOrder(id, { status });
    };

    const deleteOrder = async (id: string) => {
        const order = await database.get<Order>('orders').find(id);
        await order.softDelete();
        await NotificationService.cancelOrderReminders(id);
        sync().catch(console.error);
    };

    return { orders, loading, addOrder, updateOrder, updateOrderStatus, deleteOrder, refresh: fetchOrders };
}
