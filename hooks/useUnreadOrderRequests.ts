import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OrderRequestService, OrderRequest } from '../services/OrderRequestService';
import { useFocusEffect } from 'expo-router';

export function useUnreadOrderRequests() {
    const [unreadCount, setUnreadCount] = useState(0);
    const [orderRequests, setOrderRequests] = useState<OrderRequest[]>([]);
    const [readIds, setReadIds] = useState<Set<string>>(new Set());

    const fetchUnread = useCallback(async () => {
        try {
            const requests = await OrderRequestService.getOrderRequests();
            const storedReadIds = await AsyncStorage.getItem('read_order_request_ids');
            const readIdsSet = new Set<string>(storedReadIds ? JSON.parse(storedReadIds) : []);
            
            setOrderRequests(requests);
            setReadIds(readIdsSet);
            
            const unread = requests.filter(req => !readIdsSet.has(req.id));
            setUnreadCount(unread.length);
        } catch (error) {
            console.error('Failed to fetch unread order requests', error);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchUnread();
        }, [fetchUnread])
    );

    const markAsRead = async (id: string) => {
        const newReadIds = new Set(readIds);
        newReadIds.add(id);
        setReadIds(newReadIds);
        await AsyncStorage.setItem('read_order_request_ids', JSON.stringify(Array.from(newReadIds)));
        
        const unread = orderRequests.filter(req => !newReadIds.has(req.id));
        setUnreadCount(unread.length);
    };

    return {
        unreadCount,
        orderRequests,
        readIds,
        markAsRead,
        refresh: fetchUnread
    };
}
