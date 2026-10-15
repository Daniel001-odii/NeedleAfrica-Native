import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View, ScrollView, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, DirectSend } from 'iconsax-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Typography } from '../components/ui/Typography';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../lib/axios';
import { getSocket } from '../lib/socket';

interface ChatMessage {
    id: string;
    chatRoomId: string;
    senderId: string;
    senderType: 'CLIENT' | 'TAILOR';
    text: string;
    read: boolean;
    createdAt: string;
}

function formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatRoomScreen() {
    const { isDark } = useTheme();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{
        roomId: string;
        clientName: string;
        clientAvatar: string;
        clientCity: string;
    }>();

    const { roomId, clientName, clientAvatar, clientCity } = params;

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [inputText, setInputText] = useState('');
    const scrollRef = useRef<ScrollView>(null);
    const socketRef = useRef<any>(null);

    // Load messages
    useEffect(() => {
        if (!roomId) return;
        axiosInstance.get(`/chats/${roomId}/messages`)
            .then(res => setMessages(res.data.data ?? []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [roomId]);

    // Socket setup
    useEffect(() => {
        if (!roomId) return;
        let mounted = true;
        let activeSocket: any = null;

        const handleMessage = (msg: ChatMessage) => {
            if (msg.chatRoomId !== roomId) return;
            setMessages(prev => {
                if (prev.find(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
            // Mark as read immediately since we're in the room
            activeSocket?.emit('mark_read', { roomId });
        };

        getSocket().then(socket => {
            if (!mounted) return;
            activeSocket = socket;
            socketRef.current = socket;

            socket.emit('join_room', roomId);
            socket.emit('mark_read', { roomId });
            socket.on('message_received', handleMessage);
        }).catch((err) => {
            console.warn('[chat-room] failed to initialize socket:', err);
        });

        return () => {
            mounted = false;
            if (activeSocket) {
                activeSocket.off('message_received', handleMessage);
            }
        };
    }, [roomId]);

    // Auto-scroll on new message
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
        }
    }, [messages.length]);

    const sendMessage = useCallback(async () => {
        const text = inputText.trim();
        if (!text || !roomId) return;

        let socket = socketRef.current;
        if (!socket || !socket.connected) {
            try {
                socket = await getSocket();
                socketRef.current = socket;
                socket.emit('join_room', roomId);
            } catch (err) {
                console.warn('[chat-room] Reconnect socket error:', err);
            }
        }

        if (!socket) return;
        socket.emit('send_message', { roomId, text });
        setInputText('');
    }, [inputText, roomId]);

    const initials = clientName?.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase() ?? '?';

    return (
        <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'}`}>
            <SafeAreaView edges={['top']} className="flex-1">
                {/* Header */}
                <View
                    className={`flex-row items-center px-3 py-3 border-b ${isDark ? 'border-zinc-800' : 'border-gray-100'}`}
                >
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-1 mr-2">
                        <ArrowLeft size={22} color={isDark ? '#fff' : '#000'} />
                    </TouchableOpacity>

                    {clientAvatar ? (
                        <Image source={{ uri: clientAvatar }} style={{ width: 38, height: 38, borderRadius: 19, marginRight: 10 }} />
                    ) : (
                        <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#FF5678', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                            <Typography weight="bold" color="white" className="text-[13px]">{initials}</Typography>
                        </View>
                    )}

                    <View className="flex-1">
                        <Typography weight="bold" className={`text-[15px] ${isDark ? 'text-white' : 'text-black'}`}>
                            {clientName ?? 'Client'}
                        </Typography>
                        {clientCity ? (
                            <Typography variant="small" color="gray" className="text-[12px]">
                                {clientCity}
                            </Typography>
                        ) : null}
                    </View>
                </View>

                {/* Messages */}
                <KeyboardAvoidingView
                    className="flex-1"
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
                >
                    {loading ? (
                        <View className="flex-1 items-center justify-center">
                            <ActivityIndicator size="large" color="#FF5678" />
                        </View>
                    ) : (
                        <ScrollView
                            ref={scrollRef}
                            className="flex-1"
                            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
                            showsVerticalScrollIndicator={false}
                            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
                        >
                            {messages.length === 0 && (
                                <View className="items-center py-8">
                                    <Typography variant="small" color="gray" className="text-center">
                                        No messages yet. The client will start the conversation.
                                    </Typography>
                                </View>
                            )}

                            {messages.map((msg) => {
                                const isTailor = msg.senderType === 'TAILOR';
                                return (
                                    <View
                                        key={msg.id}
                                        style={{
                                            flexDirection: 'row',
                                            justifyContent: isTailor ? 'flex-end' : 'flex-start',
                                            marginBottom: 8,
                                        }}
                                    >
                                        <View
                                            style={{
                                                maxWidth: '78%',
                                                backgroundColor: isTailor ? '#FF5678' : (isDark ? '#27272a' : '#F3F4F6'),
                                                borderRadius: 18,
                                                borderBottomRightRadius: isTailor ? 4 : 18,
                                                borderBottomLeftRadius: isTailor ? 18 : 4,
                                                paddingHorizontal: 14,
                                                paddingVertical: 9,
                                            }}
                                        >
                                            <Typography
                                                className={`text-[14px] leading-[20px] ${isTailor ? 'text-white' : (isDark ? 'text-white' : 'text-gray-900')}`}
                                            >
                                                {msg.text}
                                            </Typography>
                                            <Typography
                                                className={`text-[10px] mt-1 ${isTailor ? 'text-white/70' : 'text-gray-400'}`}
                                                style={{ textAlign: isTailor ? 'right' : 'left' }}
                                            >
                                                {formatTime(msg.createdAt)}
                                            </Typography>
                                        </View>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    )}

                    {/* Input bar */}
                    <View
                        className={`flex-row items-end px-3 pt-3 border-t ${isDark ? 'border-zinc-800 bg-black' : 'border-gray-100 bg-white'}`}
                        style={{ paddingBottom: insets.bottom > 0 ? insets.bottom + 4 : 12 }}
                    >
                        <View
                            className={`flex-1 rounded-3xl px-4 py-2.5 mr-2 ${isDark ? 'bg-zinc-900' : 'bg-gray-100'}`}
                            style={{ minHeight: 44, maxHeight: 120 }}
                        >
                            <TextInput
                                value={inputText}
                                onChangeText={setInputText}
                                placeholder={`Reply to ${clientName ?? 'client'}…`}
                                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                                multiline
                                style={{
                                    color: isDark ? '#fff' : '#111',
                                    fontSize: 14,
                                    lineHeight: 20,
                                    padding: 0,
                                }}
                                onSubmitEditing={sendMessage}
                                returnKeyType="send"
                                blurOnSubmit={false}
                            />
                        </View>

                        <TouchableOpacity
                            onPress={sendMessage}
                            disabled={!inputText.trim()}
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 22,
                                backgroundColor: inputText.trim() ? '#FF5678' : (isDark ? '#27272a' : '#E5E7EB'),
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            activeOpacity={0.8}
                        >
                            <DirectSend size={20} color={inputText.trim() ? '#fff' : '#9CA3AF'} />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
