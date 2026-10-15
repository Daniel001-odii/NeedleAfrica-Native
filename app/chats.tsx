import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Messages1 } from 'iconsax-react-native';
import { router, useFocusEffect } from 'expo-router';
import { Typography } from '../components/ui/Typography';
import { useTheme } from '../contexts/ThemeContext';
import axiosInstance from '../lib/axios';
import { getSocket } from '../lib/socket';

interface ChatRoom {
    id: string;
    clientId: string;
    tailorId: string;
    lastMessageAt: string | null;
    lastMessageText: string | null;
    unreadTailor: number;
    client: {
        id: string;
        fullName: string;
        avatar: string | null;
        city: string | null;
    };
    createdAt: string;
}

function timeAgo(dateStr: string | null): string {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
}

export default function ChatsScreen() {
    const { isDark } = useTheme();
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const socketRef = useRef<any>(null);

    const fetchRooms = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await axiosInstance.get('/chats');
            setRooms(res.data.data ?? []);
        } catch {
            // silent
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(useCallback(() => {
        fetchRooms();
        let mounted = true;
        let activeSocket: any = null;

        const handleMessage = (msg: any) => {
            setRooms(prev =>
                prev
                    .map(r => r.id === msg.chatRoomId
                        ? {
                            ...r,
                            lastMessageText: msg.text,
                            lastMessageAt: msg.createdAt,
                            unreadTailor: msg.senderType === 'CLIENT'
                                ? r.unreadTailor + 1
                                : r.unreadTailor,
                        }
                        : r
                    )
                    .sort((a, b) =>
                        new Date(b.lastMessageAt ?? b.createdAt).getTime() -
                        new Date(a.lastMessageAt ?? a.createdAt).getTime()
                    )
            );
        };

        getSocket().then(socket => {
            if (!mounted) return;
            activeSocket = socket;
            socketRef.current = socket;
            socket.on('message_received', handleMessage);
        }).catch((err) => {
            console.warn('[chats] failed to initialize socket:', err);
        });

        return () => {
            mounted = false;
            if (activeSocket) {
                activeSocket.off('message_received', handleMessage);
            }
        };
    }, [fetchRooms]));

    const handleRefresh = () => {
        setRefreshing(true);
        fetchRooms(true);
    };

    const openRoom = (room: ChatRoom) => {
        router.push({
            pathname: '/chat-room',
            params: {
                roomId: room.id,
                clientName: room.client?.fullName ?? 'Client',
                clientAvatar: room.client?.avatar ?? '',
                clientCity: room.client?.city ?? '',
            },
        });
    };

    return (
        <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'}`}>
            {/* <SafeAreaView edges={['top']} className="flex-1"> */}
            {/* Header */}
            <View className={`px-6 pt-5 pb-4 ${isDark ? 'bg-black' : 'bg-white'}`}>
                <Typography variant="h2" weight="bold" className="text-2xl">
                    Chats
                </Typography>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#FF5678" />
                </View>
            ) : rooms.length === 0 ? (
                <ScrollView
                    contentContainerStyle={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 48 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FF5678" />}
                >
                    <View
                        className="w-24 h-24 rounded-full items-center justify-center mb-6"
                        style={{
                            backgroundColor: isDark ? 'rgba(255,86,120,0.12)' : 'rgba(255,86,120,0.08)',
                            borderWidth: 1,
                            borderColor: isDark ? 'rgba(255,86,120,0.25)' : 'rgba(255,86,120,0.15)',
                        }}
                    >
                        <Messages1 size={48} color="#FF5678" variant="Bold" />
                    </View>
                    <Typography variant="h3" weight="bold" className={`text-center text-xl mb-3 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                        No conversations yet
                    </Typography>
                    <Typography variant="body" color="gray" className="text-center text-sm leading-6 max-w-xs">
                        Messages from customers on your NeedleX catalog will appear here in real time.
                    </Typography>
                </ScrollView>
            ) : (
                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FF5678" />}
                >
                    {rooms.map((room, index) => {
                        const clientName = room.client?.fullName ?? 'Client';
                        const initials = clientName
                            .split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

                        return (
                            <React.Fragment key={room.id}>
                                <TouchableOpacity
                                    onPress={() => openRoom(room)}
                                    activeOpacity={0.65}
                                    className={`flex-row items-center px-4 py-4`}
                                >
                                    {/* Avatar */}
                                    {room.client?.avatar ? (
                                        <Image
                                            source={{ uri: room.client.avatar }}
                                            style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }}
                                        />
                                    ) : (
                                        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#FF5678', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                            <Typography weight="bold" color="white" className="text-[15px]">
                                                {initials}
                                            </Typography>
                                        </View>
                                    )}

                                    {/* Info */}
                                    <View className="flex-1 min-w-0">
                                        <View className="flex-row items-center justify-between mb-0.5">
                                            <Typography
                                                weight={room.unreadTailor > 0 ? 'bold' : 'semibold'}
                                                className={`text-[15px] ${isDark ? 'text-white' : 'text-black'}`}
                                                numberOfLines={1}
                                            >
                                                {clientName}
                                            </Typography>
                                            <Typography variant="small" color="gray" className="text-[12px] ml-2 shrink-0">
                                                {timeAgo(room.lastMessageAt)}
                                            </Typography>
                                        </View>
                                        <View className="flex-row items-center justify-between">
                                            <Typography
                                                variant="small"
                                                numberOfLines={1}
                                                className={`flex-1 text-[13px] ${room.unreadTailor > 0 ? (isDark ? 'text-white/80' : 'text-gray-700') : 'text-gray-400'}`}
                                            >
                                                {room.lastMessageText ?? 'Started a conversation'}
                                            </Typography>
                                            {room.unreadTailor > 0 && (
                                                <View style={{ minWidth: 20, height: 20, borderRadius: 10, backgroundColor: '#FF5678', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, marginLeft: 8 }}>
                                                    <Typography weight="bold" color="white" className="text-[11px]">
                                                        {room.unreadTailor > 99 ? '99+' : room.unreadTailor}
                                                    </Typography>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </TouchableOpacity>

                                {index < rooms.length - 1 && (
                                    <View className={`h-px ml-[72px] ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </ScrollView>
            )}
            {/* </SafeAreaView> */}
        </View>
    );
}
