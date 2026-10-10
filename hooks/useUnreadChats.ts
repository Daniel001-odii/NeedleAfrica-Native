import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import axiosInstance from '../lib/axios';
import { getSocket } from '../lib/socket';

export function useUnreadChats() {
    const [unreadChats, setUnreadChats] = useState(0);

    const fetchUnread = useCallback(async () => {
        try {
            const res = await axiosInstance.get('/chats');
            const rooms: any[] = res.data.data ?? [];
            const total = rooms.reduce((sum, r) => sum + (r.unreadTailor ?? 0), 0);
            setUnreadChats(total);
        } catch {
            // silent
        }
    }, []);

    useEffect(() => {
        fetchUnread();
        const interval = setInterval(fetchUnread, 30000);
        const appSub = AppState.addEventListener('change', state => {
            if (state === 'active') fetchUnread();
        });

        // Increment badge in real time when a client sends a message
        let mounted = true;
        const onMessageReceived = (msg: any) => {
            if (msg.senderType === 'CLIENT') {
                setUnreadChats(prev => prev + 1);
            }
        };
        const onMessagesRead = () => fetchUnread();

        getSocket().then(socket => {
            if (!mounted) return;
            socket.on('message_received', onMessageReceived);
            socket.on('messages_read', onMessagesRead);
        }).catch(() => { });

        return () => {
            mounted = false;
            clearInterval(interval);
            appSub.remove();
            getSocket().then(socket => {
                socket.off('message_received', onMessageReceived);
                socket.off('messages_read', onMessagesRead);
            }).catch(() => { });
        };
    }, [fetchUnread]);

    return { unreadChats, refresh: fetchUnread };
}
