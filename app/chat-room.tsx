import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View, ScrollView, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ActivityIndicator, Image, Modal, Pressable, Text, Animated, Dimensions, PanResponder,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Send, Camera, CloseCircle, Forward, Edit2, Copy, ArrowDown2, ArrowLeft2, ArrowRight2, Ruler } from 'iconsax-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { Typography } from '../components/ui/Typography';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../lib/axios';
import { getSocket } from '../lib/socket';

interface MessageReaction {
    emoji: string;
    userId: string;
    senderType: 'CLIENT' | 'TAILOR';
}

interface ReplyPreview {
    id: string;
    text?: string | null;
    imageUrl?: string | null;
    senderType: 'CLIENT' | 'TAILOR';
}

interface ChatMeasurement {
    id: string;
    name: string;
    relationship?: string;
    takenBy?: string;
    isDefault?: boolean;
    garments: {
        [garmentType: string]: {
            title: string;
            values: { [field: string]: number };
            notes?: string;
        };
    };
}

interface ChatMessage {
    id: string;
    chatRoomId: string;
    senderId: string;
    senderType: 'CLIENT' | 'TAILOR';
    text?: string | null;
    imageUrl?: string | null;
    imageUrls?: string[] | null;
    measurementProfile?: ChatMeasurement | null;
    read: boolean;
    isEdited?: boolean;
    editedAt?: string | null;
    replyToId?: string | null;
    replyToMessage?: ReplyPreview | null;
    reactions?: MessageReaction[];
    createdAt: string;
    // Client-only fields for optimistic sending (never persisted server-side)
    clientTempId?: string;
    status?: 'sending' | 'failed';
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

function formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const MAX_IMAGES = 3;

// In-memory message cache so reopening a room shows instantly (no spinner)
const MESSAGE_CACHE = new Map<string, ChatMessage[]>();

let tempIdCounter = 0;
function genTempId(): string {
    tempIdCounter += 1;
    return `temp-${Date.now()}-${tempIdCounter}`;
}

const SKELETON_ROWS: Array<{ side: 'in' | 'out'; w: number; h: number }> = [
    { side: 'in', w: 150, h: 40 },
    { side: 'out', w: 200, h: 58 },
    { side: 'in', w: 220, h: 46 },
    { side: 'out', w: 130, h: 40 },
    { side: 'in', w: 170, h: 52 },
    { side: 'out', w: 190, h: 40 },
    { side: 'in', w: 140, h: 40 },
];

function MessagesSkeleton({ isDark }: { isDark: boolean }) {
    const opacity = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.4, duration: 650, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [opacity]);

    const base = isDark ? '#27272a' : '#E5E7EB';

    return (
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            {SKELETON_ROWS.map((r, i) => (
                <View
                    key={i}
                    style={{
                        flexDirection: 'row',
                        justifyContent: r.side === 'out' ? 'flex-end' : 'flex-start',
                        alignItems: 'flex-end',
                        marginBottom: 10,
                    }}
                >
                    {r.side === 'in' ? (
                        <Animated.View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: base, marginRight: 8, opacity }} />
                    ) : null}
                    <Animated.View
                        style={{
                            width: r.w,
                            height: r.h,
                            borderRadius: 18,
                            borderBottomRightRadius: r.side === 'out' ? 4 : 18,
                            borderBottomLeftRadius: r.side === 'in' ? 4 : 18,
                            backgroundColor: base,
                            opacity,
                        }}
                    />
                </View>
            ))}
        </View>
    );
}

function previewText(msg: { text?: string | null; imageUrl?: string | null; imageUrls?: string[] | null; measurementProfile?: ChatMeasurement | null }): string {
    if (msg.text) return msg.text;
    if (msg.measurementProfile) return `📏 ${msg.measurementProfile.name || 'Measurement profile'}`;
    const count = msg.imageUrls?.length ?? (msg.imageUrl ? 1 : 0);
    if (count > 1) return `📷 ${count} Photos`;
    if (count === 1) return '📷 Photo';
    return '';
}

function MeasurementCardRN({ profile, isDark }: { profile: ChatMeasurement; isDark: boolean }) {
    const garments = Object.values(profile.garments || {});
    const totalFields = garments.reduce((n, g) => n + Object.keys(g?.values || {}).length, 0);
    const cardW = Math.min(300, Dimensions.get('window').width - 100);

    return (
        <View style={{ width: cardW, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: isDark ? '#3f3f46' : '#e5e7eb', backgroundColor: isDark ? '#18181b' : '#ffffff' }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FF5678' }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                    <Ruler size={16} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                    <Typography weight="bold" className="text-[9px] text-white/80" style={{ letterSpacing: 0.5 }}>MEASUREMENT PROFILE</Typography>
                    <Typography weight="bold" numberOfLines={1} className="text-[14px] text-white">{profile.name}</Typography>
                </View>
            </View>
            {/* Meta */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 14, paddingTop: 10, alignItems: 'center' }}>
                {profile.relationship ? (
                    <View style={{ backgroundColor: isDark ? '#3f1620' : '#FFE3E8', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Typography weight="bold" className="text-[10px]" style={{ color: '#FF5678' }}>{profile.relationship}</Typography>
                    </View>
                ) : null}
                {profile.isDefault ? (
                    <View style={{ backgroundColor: isDark ? '#27272a' : '#f4f4f5', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Typography weight="bold" className={`text-[10px] ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Default</Typography>
                    </View>
                ) : null}
                <Typography className="text-[10px] text-gray-400">
                    {garments.length} garment{garments.length !== 1 ? 's' : ''} · {totalFields} measurement{totalFields !== 1 ? 's' : ''}
                </Typography>
            </View>
            {/* Garments */}
            <View style={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12, gap: 10 }}>
                {garments.length === 0 ? (
                    <Typography className="text-[12px] text-gray-400">No measurements recorded.</Typography>
                ) : garments.map((g, i) => (
                    <View key={i}>
                        <Typography weight="bold" className={`text-[12px] mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{g.title}</Typography>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {Object.entries(g?.values || {}).map(([field, val]) => (
                                <View key={field} style={{ width: '50%', flexDirection: 'row', justifyContent: 'space-between', paddingRight: 10, paddingVertical: 2 }}>
                                    <Typography numberOfLines={1} className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`} style={{ textTransform: 'capitalize', flexShrink: 1 }}>{field}</Typography>
                                    <Typography weight="bold" className={`text-[11px] ${isDark ? 'text-white' : 'text-gray-900'}`}>{String(val)}</Typography>
                                </View>
                            ))}
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
}

const SWIPE_THRESHOLD = 56;
const SWIPE_MAX = 72;

// Swipe a message horizontally to reply (own messages swipe left, incoming swipe right)
function SwipeToReplyRN({ children, onReply, isOwn, isDark, disabled }: {
    children: React.ReactNode;
    onReply: () => void;
    isOwn: boolean;
    isDark: boolean;
    disabled?: boolean;
}) {
    const dir = isOwn ? -1 : 1;
    const translateX = useRef(new Animated.Value(0)).current;
    const triggered = useRef(false);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_evt, g) => {
                if (disabled) return false;
                return Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5;
            },
            onPanResponderMove: (_evt, g) => {
                const v = dir > 0 ? Math.max(0, Math.min(g.dx, SWIPE_MAX)) : Math.min(0, Math.max(g.dx, -SWIPE_MAX));
                translateX.setValue(v);
                triggered.current = Math.abs(v) >= SWIPE_THRESHOLD;
            },
            onPanResponderRelease: () => {
                if (triggered.current) onReply();
                triggered.current = false;
                Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
            },
            onPanResponderTerminate: () => {
                triggered.current = false;
                Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
            },
        })
    ).current;

    const iconOpacity = translateX.interpolate({
        inputRange: dir > 0 ? [0, SWIPE_THRESHOLD] : [-SWIPE_THRESHOLD, 0],
        outputRange: dir > 0 ? [0, 1] : [1, 0],
        extrapolate: 'clamp',
    });

    return (
        <View style={{ width: '100%', justifyContent: 'center' }}>
            <Animated.View
                pointerEvents="none"
                style={{
                    position: 'absolute',
                    [isOwn ? 'right' : 'left']: 6,
                    opacity: iconOpacity,
                }}
            >
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isDark ? '#3f1620' : '#FFE3E8', alignItems: 'center', justifyContent: 'center' }}>
                    <Forward size={16} color="#FF5678" style={{ transform: [{ scaleX: -1 }] }} />
                </View>
            </Animated.View>
            <Animated.View
                {...panResponder.panHandlers}
                style={{ width: '100%', alignItems: isOwn ? 'flex-end' : 'flex-start', transform: [{ translateX }] }}
            >
                {children}
            </Animated.View>
        </View>
    );
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
    const [selectedImages, setSelectedImages] = useState<Array<{ uri: string; base64?: string | null; mimeType: string }>>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [previewImages, setPreviewImages] = useState<string[] | null>(null);
    const [previewIndex, setPreviewIndex] = useState(0);

    // Reactions / reply / edit state
    const [actionMenuMsg, setActionMenuMsg] = useState<ChatMessage | null>(null);
    const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
    const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);

    // Scroll helpers
    const [showScrollDown, setShowScrollDown] = useState(false);
    const [highlightedId, setHighlightedId] = useState<string | null>(null);

    const scrollRef = useRef<ScrollView>(null);
    const socketRef = useRef<any>(null);
    const inputRef = useRef<TextInput>(null);
    const isNearBottomRef = useRef(true);
    const messageOffsets = useRef<Record<string, number>>({});
    const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const previewScrollRef = useRef<ScrollView>(null);
    const pendingPreviewIndex = useRef(0);
    const screenW = Dimensions.get('window').width;
    // Original image assets kept by tempId so a failed send can be retried
    const pendingImageAssets = useRef<Record<string, Array<{ uri: string; base64?: string | null; mimeType: string }>>>({});

    // Load messages — seed from cache instantly, then refresh from the server
    useEffect(() => {
        if (!roomId) return;
        const cached = MESSAGE_CACHE.get(roomId);
        if (cached && cached.length) {
            setMessages(cached);
            setLoading(false);
        }
        axiosInstance.get(`/chats/${roomId}/messages`)
            .then(res => {
                const msgs: ChatMessage[] = res.data.data ?? [];
                MESSAGE_CACHE.set(roomId, msgs);
                setMessages(prev => {
                    const pending = prev.filter(m => m.status && m.chatRoomId === roomId);
                    return pending.length ? [...msgs, ...pending] : msgs;
                });
            })
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
                // Reconcile our optimistic message when the server echoes it back
                if (msg.clientTempId) {
                    const idx = prev.findIndex(m => m.clientTempId === msg.clientTempId);
                    if (idx >= 0) {
                        delete pendingImageAssets.current[msg.clientTempId];
                        const next = [...prev];
                        next[idx] = { ...msg, status: undefined };
                        return next;
                    }
                }
                if (prev.find(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
            // Mark as read immediately since we're in the room
            activeSocket?.emit('mark_read', { roomId });
        };

        const handleReacted = ({ roomId: rid, messageId, reactions }: { roomId: string; messageId: string; reactions: MessageReaction[] }) => {
            if (rid !== roomId) return;
            setMessages(prev => prev.map(m => (m.id === messageId ? { ...m, reactions } : m)));
        };

        const handleEdited = ({ roomId: rid, messageId, text, isEdited, editedAt }: { roomId: string; messageId: string; text: string | null; isEdited: boolean; editedAt: string }) => {
            if (rid !== roomId) return;
            setMessages(prev => prev.map(m => (m.id === messageId ? { ...m, text, isEdited, editedAt } : m)));
        };

        getSocket().then(socket => {
            if (!mounted) return;
            activeSocket = socket;
            socketRef.current = socket;

            socket.emit('join_room', roomId);
            socket.emit('mark_read', { roomId });
            socket.on('message_received', handleMessage);
            socket.on('message_reacted', handleReacted);
            socket.on('message_edited', handleEdited);
        }).catch((err) => {
            console.warn('[chat-room] failed to initialize socket:', err);
        });

        return () => {
            mounted = false;
            if (activeSocket) {
                activeSocket.off('message_received', handleMessage);
                activeSocket.off('message_reacted', handleReacted);
                activeSocket.off('message_edited', handleEdited);
            }
        };
    }, [roomId]);

    // Auto-scroll on new message — only when the user is already near the bottom
    useEffect(() => {
        if (messages.length > 0 && isNearBottomRef.current) {
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
        }
    }, [messages.length]);

    // Keep the per-room cache fresh (confirmed messages only) for instant reopen
    useEffect(() => {
        if (roomId && messages.length) {
            MESSAGE_CACHE.set(roomId, messages.filter(m => !m.status));
        }
    }, [messages, roomId]);

    useEffect(() => () => {
        if (highlightTimer.current) clearTimeout(highlightTimer.current);
    }, []);

    const handleScroll = useCallback((e: any) => {
        const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
        const distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
        isNearBottomRef.current = distanceFromBottom < 120;
        setShowScrollDown(distanceFromBottom > 320);
    }, []);

    const scrollToBottom = useCallback(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
    }, []);

    const scrollToMessage = useCallback((messageId?: string | null) => {
        if (!messageId) return;
        const y = messageOffsets.current[messageId];
        if (y == null) return;
        scrollRef.current?.scrollTo({ y: Math.max(y - 12, 0), animated: true });
        setHighlightedId(messageId);
        if (highlightTimer.current) clearTimeout(highlightTimer.current);
        highlightTimer.current = setTimeout(() => setHighlightedId(null), 1400);
    }, []);

    // Image lightbox / carousel
    const openPreview = useCallback((imgs: string[], index: number) => {
        pendingPreviewIndex.current = index;
        setPreviewImages(imgs);
        setPreviewIndex(index);
    }, []);

    const closePreview = useCallback(() => setPreviewImages(null), []);

    // Scroll the carousel to the tapped image once it opens
    useEffect(() => {
        if (!previewImages) return;
        const t = setTimeout(() => {
            previewScrollRef.current?.scrollTo({ x: pendingPreviewIndex.current * screenW, animated: false });
        }, 40);
        return () => clearTimeout(t);
    }, [previewImages, screenW]);

    const goToPreview = useCallback((index: number) => {
        if (!previewImages) return;
        const clamped = Math.max(0, Math.min(index, previewImages.length - 1));
        setPreviewIndex(clamped);
        previewScrollRef.current?.scrollTo({ x: clamped * screenW, animated: true });
    }, [previewImages, screenW]);

    const ensureSocket = useCallback(async () => {
        let socket = socketRef.current;
        if (!socket || !socket.connected) {
            try {
                socket = await getSocket();
                socketRef.current = socket;
                socket.emit('join_room', roomId);
            } catch (err) {
                console.warn('[chat-room] Reconnect socket error:', err);
                return null;
            }
        }
        return socket;
    }, [roomId]);

    const handlePickImage = async () => {
        const remaining = MAX_IMAGES - selectedImages.length;
        if (remaining <= 0) return;
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                selectionLimit: remaining,
                quality: 0.8,
                base64: true,
            });

            if (!result.canceled && result.assets?.length) {
                const picked = result.assets.slice(0, remaining).map((asset) => {
                    const extension = asset.uri.split('.').pop()?.toLowerCase() || 'jpg';
                    const mimeType = asset.mimeType || (extension === 'png' ? 'image/png' : 'image/jpeg');
                    return { uri: asset.uri, base64: asset.base64, mimeType };
                });
                setSelectedImages((prev) => [...prev, ...picked].slice(0, MAX_IMAGES));
            }
        } catch (err) {
            console.warn('[chat-room] Pick image error:', err);
        }
    };

    const sendMessage = useCallback(async () => {
        if (!roomId) return;
        const text = inputText.trim();

        // Edit mode — update existing message text
        if (editingMessage) {
            if (!text) return;
            const socket = await ensureSocket();
            if (!socket) return;
            socket.emit('edit_message', { roomId, messageId: editingMessage.id, text });
            setEditingMessage(null);
            setInputText('');
            return;
        }

        if (!text && selectedImages.length === 0) return;

        const tempId = genTempId();
        const imagesToUpload = selectedImages;
        const replyId = replyingTo?.id;
        const replyPreview: ReplyPreview | null = replyingTo
            ? { id: replyingTo.id, text: replyingTo.text, imageUrl: replyingTo.imageUrl, senderType: replyingTo.senderType }
            : null;

        // Optimistic message appears instantly with local image previews
        const optimistic: ChatMessage = {
            id: tempId,
            clientTempId: tempId,
            chatRoomId: roomId,
            senderId: user?.id ?? 'me',
            senderType: 'TAILOR',
            text: text || null,
            imageUrls: imagesToUpload.length ? imagesToUpload.map(i => i.uri) : null,
            read: false,
            replyToId: replyId ?? null,
            replyToMessage: replyPreview,
            reactions: [],
            status: 'sending',
            createdAt: new Date().toISOString(),
        };
        if (imagesToUpload.length) pendingImageAssets.current[tempId] = imagesToUpload;
        setMessages(prev => [...prev, optimistic]);

        // Clear composer immediately so it feels instant
        setInputText('');
        setSelectedImages([]);
        setReplyingTo(null);

        try {
            const socket = await ensureSocket();
            if (!socket) throw new Error('No socket connection');

            let uploadedImageUrls: string[] = [];
            if (imagesToUpload.length > 0) {
                uploadedImageUrls = await Promise.all(
                    imagesToUpload.map(async (img) => {
                        const base64Data = img.base64
                            ? (img.base64.startsWith('data:') ? img.base64 : `data:${img.mimeType};base64,${img.base64}`)
                            : img.uri;
                        const res = await axiosInstance.post('/chats/upload', { image: base64Data });
                        return res.data?.data?.imageUrl as string | undefined;
                    })
                ).then((urls) => urls.filter((u): u is string => !!u));
            }

            socket.emit('send_message', {
                roomId,
                text: text || undefined,
                imageUrls: uploadedImageUrls.length ? uploadedImageUrls : undefined,
                replyToId: replyId,
                clientTempId: tempId,
            });
        } catch (err) {
            console.error('[chat-room] Send error:', err);
            setMessages(prev => prev.map(m => (m.clientTempId === tempId ? { ...m, status: 'failed' } : m)));
        }
    }, [inputText, selectedImages, roomId, editingMessage, replyingTo, ensureSocket, user?.id]);

    const retrySend = useCallback(async (msg: ChatMessage) => {
        if (!msg.clientTempId) return;
        const tempId = msg.clientTempId;
        setMessages(prev => prev.map(m => (m.clientTempId === tempId ? { ...m, status: 'sending' } : m)));
        try {
            const socket = await ensureSocket();
            if (!socket) throw new Error('No socket connection');

            const assets = pendingImageAssets.current[tempId];
            let uploadedImageUrls: string[] = [];
            if (assets?.length) {
                uploadedImageUrls = await Promise.all(
                    assets.map(async (img) => {
                        const base64Data = img.base64
                            ? (img.base64.startsWith('data:') ? img.base64 : `data:${img.mimeType};base64,${img.base64}`)
                            : img.uri;
                        const res = await axiosInstance.post('/chats/upload', { image: base64Data });
                        return res.data?.data?.imageUrl as string | undefined;
                    })
                ).then((urls) => urls.filter((u): u is string => !!u));
            }

            socket.emit('send_message', {
                roomId,
                text: msg.text || undefined,
                imageUrls: uploadedImageUrls.length ? uploadedImageUrls : undefined,
                replyToId: msg.replyToId || undefined,
                clientTempId: tempId,
            });
        } catch {
            setMessages(prev => prev.map(m => (m.clientTempId === tempId ? { ...m, status: 'failed' } : m)));
        }
    }, [ensureSocket, roomId]);

    const handleReact = useCallback(async (message: ChatMessage, emoji: string) => {
        setActionMenuMsg(null);
        const socket = await ensureSocket();
        if (!socket) return;
        socket.emit('react_message', { roomId, messageId: message.id, emoji });
    }, [ensureSocket, roomId]);

    const startReply = useCallback((message: ChatMessage) => {
        setActionMenuMsg(null);
        setEditingMessage(null);
        setReplyingTo(message);
        setTimeout(() => inputRef.current?.focus(), 80);
    }, []);

    const startEdit = useCallback((message: ChatMessage) => {
        setActionMenuMsg(null);
        setReplyingTo(null);
        setSelectedImages([]);
        setEditingMessage(message);
        setInputText(message.text ?? '');
        setTimeout(() => inputRef.current?.focus(), 80);
    }, []);

    const cancelEdit = useCallback(() => {
        setEditingMessage(null);
        setInputText('');
    }, []);

    const handleCopy = useCallback(async (message: ChatMessage) => {
        setActionMenuMsg(null);
        if (message.text) await Clipboard.setStringAsync(message.text);
    }, []);

    const initials = clientName?.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase() ?? '?';

    const canSend = editingMessage ? !!inputText.trim() : (!!inputText.trim() || selectedImages.length > 0) && !isUploading;

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
                    <View style={{ flex: 1 }}>
                    {loading ? (
                        <MessagesSkeleton isDark={isDark} />
                    ) : (
                        <ScrollView
                            ref={scrollRef}
                            className="flex-1"
                            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
                            showsVerticalScrollIndicator={false}
                            onScroll={handleScroll}
                            scrollEventThrottle={16}
                            onContentSizeChange={() => {
                                if (isNearBottomRef.current) scrollRef.current?.scrollToEnd({ animated: false });
                            }}
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
                                const reactions = msg.reactions ?? [];
                                const hasReactions = reactions.length > 0;
                                const reply = msg.replyToMessage;
                                const images = (msg.imageUrls && msg.imageUrls.length)
                                    ? msg.imageUrls
                                    : (msg.imageUrl ? [msg.imageUrl] : []);
                                const imageOnly = images.length > 0 && !msg.text && !reply;
                                const gridW = imageOnly ? 244 : 220;

                                // Group reactions by emoji with counts & whether current (tailor) user reacted
                                const grouped: Record<string, { count: number; mine: boolean }> = {};
                                for (const r of reactions) {
                                    if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, mine: false };
                                    grouped[r.emoji].count += 1;
                                    if (r.senderType === 'TAILOR') grouped[r.emoji].mine = true;
                                }

                                const isHighlighted = highlightedId === msg.id;
                                const isMeasurement = !!msg.measurementProfile;
                                const isSending = msg.status === 'sending';
                                const isFailed = msg.status === 'failed';

                                return (
                                    <View
                                        key={msg.id}
                                        onLayout={(e) => { messageOffsets.current[msg.id] = e.nativeEvent.layout.y; }}
                                        style={{
                                            alignItems: isTailor ? 'flex-end' : 'flex-start',
                                            marginBottom: hasReactions ? 18 : 8,
                                        }}
                                    >
                                        <SwipeToReplyRN
                                            isOwn={isTailor}
                                            isDark={isDark}
                                            disabled={!!msg.status}
                                            onReply={() => startReply(msg)}
                                        >
                                        <Pressable
                                            onPress={isFailed ? () => retrySend(msg) : undefined}
                                            onLongPress={msg.status ? undefined : () => setActionMenuMsg(msg)}
                                            delayLongPress={250}
                                            style={{
                                                maxWidth: isMeasurement ? '92%' : '78%',
                                                backgroundColor: isMeasurement ? 'transparent' : (isTailor ? '#FF5678' : (isDark ? '#27272a' : '#F3F4F6')),
                                                borderRadius: isMeasurement ? 0 : 18,
                                                borderBottomRightRadius: isMeasurement ? 0 : (isTailor ? 4 : 18),
                                                borderBottomLeftRadius: isMeasurement ? 0 : (isTailor ? 18 : 4),
                                                paddingHorizontal: (imageOnly || isMeasurement) ? 0 : 14,
                                                paddingVertical: (imageOnly || isMeasurement) ? 0 : 9,
                                                overflow: 'hidden',
                                                borderWidth: isHighlighted ? 2 : 0,
                                                borderColor: isHighlighted ? '#FF5678' : 'transparent',
                                                opacity: msg.status ? 0.6 : 1,
                                            }}
                                        >
                                            {/* Measurement profile card */}
                                            {msg.measurementProfile ? (
                                                <MeasurementCardRN profile={msg.measurementProfile} isDark={isDark} />
                                            ) : null}

                                            {/* Reply quote — tap to jump to the original message */}
                                            {reply ? (
                                                <TouchableOpacity
                                                    activeOpacity={0.7}
                                                    onPress={() => scrollToMessage(reply.id)}
                                                    style={{
                                                        borderLeftWidth: 3,
                                                        borderLeftColor: isTailor ? 'rgba(255,255,255,0.8)' : '#FF5678',
                                                        backgroundColor: isTailor ? 'rgba(255,255,255,0.15)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                                                        borderRadius: 8,
                                                        paddingHorizontal: 8,
                                                        paddingVertical: 6,
                                                        marginBottom: 6,
                                                    }}
                                                >
                                                    <Typography
                                                        weight="bold"
                                                        className={`text-[11px] ${isTailor ? 'text-white' : (isDark ? 'text-white' : 'text-gray-900')}`}
                                                    >
                                                        {reply.senderType === 'TAILOR' ? 'You' : (clientName ?? 'Client')}
                                                    </Typography>
                                                    <Typography
                                                        numberOfLines={1}
                                                        className={`text-[12px] ${isTailor ? 'text-white/80' : (isDark ? 'text-gray-300' : 'text-gray-600')}`}
                                                    >
                                                        {previewText(reply)}
                                                    </Typography>
                                                </TouchableOpacity>
                                            ) : null}

                                            {images.length > 0 ? (
                                                <View style={{ marginBottom: msg.text ? 8 : 0, position: 'relative' }}>
                                                    {images.length === 1 ? (
                                                        <TouchableOpacity
                                                            activeOpacity={0.9}
                                                            onPress={() => openPreview(images, 0)}
                                                            onLongPress={() => setActionMenuMsg(msg)}
                                                            delayLongPress={250}
                                                            style={{ borderRadius: imageOnly ? 0 : 14, overflow: 'hidden' }}
                                                        >
                                                            <Image
                                                                source={{ uri: images[0] }}
                                                                style={{
                                                                    width: imageOnly ? 244 : 220,
                                                                    height: imageOnly ? 200 : 180,
                                                                    backgroundColor: isDark ? '#18181b' : '#e4e4e7',
                                                                }}
                                                                resizeMode="cover"
                                                            />
                                                        </TouchableOpacity>
                                                    ) : images.length === 2 ? (
                                                        <View style={{ flexDirection: 'row', gap: 2, borderRadius: imageOnly ? 0 : 14, overflow: 'hidden' }}>
                                                            {images.map((url, idx) => (
                                                                <TouchableOpacity
                                                                    key={idx}
                                                                    activeOpacity={0.9}
                                                                    onPress={() => openPreview(images, idx)}
                                                                    onLongPress={() => setActionMenuMsg(msg)}
                                                                    delayLongPress={250}
                                                                >
                                                                    <Image
                                                                        source={{ uri: url }}
                                                                        style={{ width: (gridW - 2) / 2, height: 130, backgroundColor: isDark ? '#18181b' : '#e4e4e7' }}
                                                                        resizeMode="cover"
                                                                    />
                                                                </TouchableOpacity>
                                                            ))}
                                                        </View>
                                                    ) : (
                                                        <View style={{ width: gridW, borderRadius: imageOnly ? 0 : 14, overflow: 'hidden', gap: 2 }}>
                                                            <TouchableOpacity
                                                                activeOpacity={0.9}
                                                                onPress={() => openPreview(images, 0)}
                                                                onLongPress={() => setActionMenuMsg(msg)}
                                                                delayLongPress={250}
                                                            >
                                                                <Image
                                                                    source={{ uri: images[0] }}
                                                                    style={{ width: gridW, height: 140, backgroundColor: isDark ? '#18181b' : '#e4e4e7' }}
                                                                    resizeMode="cover"
                                                                />
                                                            </TouchableOpacity>
                                                            <View style={{ flexDirection: 'row', gap: 2 }}>
                                                                {images.slice(1, 3).map((url, idx) => (
                                                                    <TouchableOpacity
                                                                        key={idx}
                                                                        activeOpacity={0.9}
                                                                        onPress={() => openPreview(images, idx + 1)}
                                                                        onLongPress={() => setActionMenuMsg(msg)}
                                                                        delayLongPress={250}
                                                                    >
                                                                        <Image
                                                                            source={{ uri: url }}
                                                                            style={{ width: (gridW - 2) / 2, height: 95, backgroundColor: isDark ? '#18181b' : '#e4e4e7' }}
                                                                            resizeMode="cover"
                                                                        />
                                                                    </TouchableOpacity>
                                                                ))}
                                                            </View>
                                                        </View>
                                                    )}

                                                    {/* Overlaid timestamp for edge-to-edge images */}
                                                    {imageOnly && !msg.status ? (
                                                        <View
                                                            style={{
                                                                position: 'absolute',
                                                                bottom: 6,
                                                                right: 6,
                                                                backgroundColor: 'rgba(0,0,0,0.45)',
                                                                borderRadius: 10,
                                                                paddingHorizontal: 7,
                                                                paddingVertical: 2,
                                                            }}
                                                        >
                                                            <Typography className="text-[10px] text-white">
                                                                {formatTime(msg.createdAt)}
                                                            </Typography>
                                                        </View>
                                                    ) : null}
                                                </View>
                                            ) : null}

                                            {msg.text ? (
                                                <Typography
                                                    className={`text-[14px] leading-[20px] ${isTailor ? 'text-white' : (isDark ? 'text-white' : 'text-gray-900')}`}
                                                >
                                                    {msg.text}
                                                </Typography>
                                            ) : null}

                                            {(!imageOnly || msg.status) ? (
                                                <Typography
                                                    className={`text-[10px] mt-1 ${isFailed ? 'text-red-400' : (isTailor ? 'text-white/70' : 'text-gray-400')}`}
                                                    style={{ textAlign: isTailor ? 'right' : 'left' }}
                                                >
                                                    {isSending
                                                        ? 'Sending…'
                                                        : isFailed
                                                            ? 'Failed · Tap to retry'
                                                            : `${msg.isEdited ? 'Edited · ' : ''}${formatTime(msg.createdAt)}`}
                                                </Typography>
                                            ) : null}
                                        </Pressable>
                                        </SwipeToReplyRN>

                                        {/* Reaction chips */}
                                        {hasReactions ? (
                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    flexWrap: 'wrap',
                                                    marginTop: -10,
                                                    marginHorizontal: 6,
                                                }}
                                            >
                                                {Object.entries(grouped).map(([emoji, info]) => (
                                                    <TouchableOpacity
                                                        key={emoji}
                                                        activeOpacity={0.7}
                                                        onPress={() => handleReact(msg, emoji)}
                                                        style={{
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                            backgroundColor: isDark ? '#18181b' : '#ffffff',
                                                            borderWidth: 1,
                                                            borderColor: info.mine ? '#FF5678' : (isDark ? '#3f3f46' : '#e5e7eb'),
                                                            borderRadius: 12,
                                                            paddingHorizontal: 6,
                                                            paddingVertical: 1,
                                                            marginHorizontal: 2,
                                                        }}
                                                    >
                                                        <Text style={{ fontSize: 12 }}>{emoji}</Text>
                                                        {info.count > 1 ? (
                                                            <Typography className={`text-[11px] ml-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                                                {info.count}
                                                            </Typography>
                                                        ) : null}
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        ) : null}
                                    </View>
                                );
                            })}
                        </ScrollView>
                    )}

                        {/* Scroll to bottom button */}
                        {showScrollDown && !loading ? (
                            <TouchableOpacity
                                onPress={scrollToBottom}
                                activeOpacity={0.85}
                                style={{
                                    position: 'absolute',
                                    bottom: 16,
                                    right: 16,
                                    width: 40,
                                    height: 40,
                                    borderRadius: 20,
                                    backgroundColor: isDark ? '#27272a' : '#ffffff',
                                    borderWidth: 1,
                                    borderColor: isDark ? '#3f3f46' : '#e5e7eb',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.15,
                                    shadowRadius: 4,
                                    elevation: 4,
                                }}
                            >
                                <ArrowDown2 size={20} color={isDark ? '#e4e4e7' : '#4b5563'} />
                            </TouchableOpacity>
                        ) : null}
                    </View>

                    {/* Reply banner */}
                    {replyingTo ? (
                        <View
                            className={`flex-row items-center px-4 py-2 border-t ${isDark ? 'border-zinc-800 bg-zinc-900' : 'border-gray-100 bg-gray-50'}`}
                        >
                            <View style={{ width: 3, alignSelf: 'stretch', backgroundColor: '#FF5678', borderRadius: 2, marginRight: 10 }} />
                            <View className="flex-1">
                                <Typography weight="bold" className={`text-[12px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    Replying to {replyingTo.senderType === 'TAILOR' ? 'yourself' : (clientName ?? 'client')}
                                </Typography>
                                <Typography numberOfLines={1} variant="small" color="gray" className="text-[12px]">
                                    {previewText(replyingTo)}
                                </Typography>
                            </View>
                            <TouchableOpacity onPress={() => setReplyingTo(null)} className="p-1 ml-2">
                                <CloseCircle size={22} color={isDark ? '#a1a1aa' : '#6b7280'} />
                            </TouchableOpacity>
                        </View>
                    ) : null}

                    {/* Edit banner */}
                    {editingMessage ? (
                        <View
                            className={`flex-row items-center px-4 py-2 border-t ${isDark ? 'border-zinc-800 bg-zinc-900' : 'border-gray-100 bg-gray-50'}`}
                        >
                            <View style={{ marginRight: 10 }}>
                                <Edit2 size={18} color="#FF5678" />
                            </View>
                            <View className="flex-1">
                                <Typography weight="bold" className={`text-[12px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    Editing message
                                </Typography>
                                <Typography numberOfLines={1} variant="small" color="gray" className="text-[12px]">
                                    {previewText(editingMessage)}
                                </Typography>
                            </View>
                            <TouchableOpacity onPress={cancelEdit} className="p-1 ml-2">
                                <CloseCircle size={22} color={isDark ? '#a1a1aa' : '#6b7280'} />
                            </TouchableOpacity>
                        </View>
                    ) : null}

                    {/* Attached image preview */}
                    {selectedImages.length > 0 && !editingMessage ? (
                        <View
                            className={`px-4 py-2 border-t ${isDark ? 'border-zinc-800 bg-zinc-900' : 'border-gray-100 bg-gray-50'}`}
                        >
                            <View className="flex-row items-center justify-between mb-2">
                                <Typography weight="medium" className={`text-[12px] ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                                    {selectedImages.length} / {MAX_IMAGES} photo{selectedImages.length > 1 ? 's' : ''} attached
                                </Typography>
                                {selectedImages.length < MAX_IMAGES ? (
                                    <TouchableOpacity onPress={handlePickImage} activeOpacity={0.7}>
                                        <Typography weight="bold" className="text-[12px]" style={{ color: '#FF5678' }}>
                                            + Add more
                                        </Typography>
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                            <View className="flex-row" style={{ gap: 8 }}>
                                {selectedImages.map((img, idx) => (
                                    <View key={idx} style={{ position: 'relative' }}>
                                        <Image
                                            source={{ uri: img.uri }}
                                            style={{ width: 56, height: 56, borderRadius: 8 }}
                                        />
                                        <TouchableOpacity
                                            onPress={() => setSelectedImages((prev) => prev.filter((_, i) => i !== idx))}
                                            style={{
                                                position: 'absolute',
                                                top: -6,
                                                right: -6,
                                                backgroundColor: '#18181b',
                                                borderRadius: 10,
                                            }}
                                        >
                                            <CloseCircle size={20} color="#ffffff" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ) : null}

                    {/* Input bar */}
                    <View
                        className={`flex-row items-end px-3 pt-3 border-t ${isDark ? 'border-zinc-800 bg-black' : 'border-gray-100 bg-white'}`}
                        style={{ paddingBottom: insets.bottom > 0 ? insets.bottom + 4 : 12 }}
                    >
                        {!editingMessage ? (
                            <TouchableOpacity
                                onPress={handlePickImage}
                                disabled={isUploading || selectedImages.length >= MAX_IMAGES}
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 22,
                                    backgroundColor: isDark ? '#27272a' : '#F3F4F6',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: 8,
                                    opacity: selectedImages.length >= MAX_IMAGES ? 0.4 : 1,
                                }}
                                activeOpacity={0.7}
                            >
                                <Camera size={20} color={isDark ? '#e4e4e7' : '#4b5563'} />
                            </TouchableOpacity>
                        ) : null}

                        <View
                            className={`flex-1 rounded-3xl px-4 py-2.5 mr-2 ${isDark ? 'bg-zinc-900' : 'bg-gray-100'}`}
                            style={{ minHeight: 44, maxHeight: 120, justifyContent: 'center' }}
                        >
                            <TextInput
                                ref={inputRef}
                                value={inputText}
                                onChangeText={setInputText}
                                placeholder={editingMessage ? 'Edit your message…' : `Reply to ${clientName ?? 'client'}…`}
                                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                                multiline
                                style={{
                                    color: isDark ? '#fff' : '#111',
                                    fontSize: 14,
                                    lineHeight: 20,
                                    padding: 0,
                                }}
                                returnKeyType="default"
                                blurOnSubmit={false}
                            />
                        </View>

                        <TouchableOpacity
                            onPress={sendMessage}
                            disabled={!canSend}
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 22,
                                backgroundColor: canSend ? '#FF5678' : (isDark ? '#27272a' : '#E5E7EB'),
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            activeOpacity={0.8}
                        >
                            {isUploading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Send size={20} color={canSend ? '#fff' : '#9CA3AF'} variant="Linear" />
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>

            {/* Message action menu (long-press) */}
            <Modal
                visible={!!actionMenuMsg}
                transparent
                animationType="fade"
                onRequestClose={() => setActionMenuMsg(null)}
            >
                <Pressable
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
                    onPress={() => setActionMenuMsg(null)}
                >
                    <Pressable
                        onPress={() => { }}
                        style={{
                            backgroundColor: isDark ? '#18181b' : '#ffffff',
                            borderTopLeftRadius: 20,
                            borderTopRightRadius: 20,
                            paddingTop: 10,
                            paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 20,
                            paddingHorizontal: 16,
                        }}
                    >
                        {/* Grab handle */}
                        <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: isDark ? '#3f3f46' : '#d4d4d8', marginBottom: 14 }} />

                        {/* Quick reactions */}
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                backgroundColor: isDark ? '#27272a' : '#f4f4f5',
                                borderRadius: 24,
                                paddingVertical: 10,
                                paddingHorizontal: 12,
                                marginBottom: 12,
                            }}
                        >
                            {QUICK_EMOJIS.map((emoji) => (
                                <TouchableOpacity
                                    key={emoji}
                                    activeOpacity={0.6}
                                    onPress={() => actionMenuMsg && handleReact(actionMenuMsg, emoji)}
                                >
                                    <Text style={{ fontSize: 28 }}>{emoji}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Actions */}
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => actionMenuMsg && startReply(actionMenuMsg)}
                            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}
                        >
                            <Forward size={22} color={isDark ? '#e4e4e7' : '#3f3f46'} style={{ transform: [{ scaleX: -1 }] }} />
                            <Typography className={`text-[15px] ml-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Reply</Typography>
                        </TouchableOpacity>

                        {actionMenuMsg?.senderType === 'TAILOR' && actionMenuMsg?.text ? (
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => actionMenuMsg && startEdit(actionMenuMsg)}
                                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}
                            >
                                <Edit2 size={22} color={isDark ? '#e4e4e7' : '#3f3f46'} />
                                <Typography className={`text-[15px] ml-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Edit</Typography>
                            </TouchableOpacity>
                        ) : null}

                        {actionMenuMsg?.text ? (
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => actionMenuMsg && handleCopy(actionMenuMsg)}
                                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}
                            >
                                <Copy size={22} color={isDark ? '#e4e4e7' : '#3f3f46'} />
                                <Typography className={`text-[15px] ml-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Copy</Typography>
                            </TouchableOpacity>
                        ) : null}
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Image Fullscreen Preview / Carousel Modal */}
            <Modal
                visible={!!previewImages}
                transparent
                animationType="fade"
                onRequestClose={closePreview}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.94)' }}>
                    {/* Swipeable image pager */}
                    <ScrollView
                        ref={previewScrollRef}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onContentSizeChange={() => {
                            previewScrollRef.current?.scrollTo({ x: pendingPreviewIndex.current * screenW, animated: false });
                        }}
                        onMomentumScrollEnd={(e) => {
                            const idx = Math.round(e.nativeEvent.contentOffset.x / screenW);
                            setPreviewIndex(idx);
                        }}
                        style={{ flex: 1 }}
                    >
                        {(previewImages ?? []).map((url, idx) => (
                            <View key={idx} style={{ width: screenW, height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                <Image
                                    source={{ uri: url }}
                                    style={{ width: screenW * 0.92, height: '75%' }}
                                    resizeMode="contain"
                                />
                            </View>
                        ))}
                    </ScrollView>

                    {/* Close */}
                    <TouchableOpacity
                        onPress={closePreview}
                        style={{ position: 'absolute', top: (insets.top || 20) + 10, right: 20, zIndex: 10, padding: 8 }}
                    >
                        <CloseCircle size={32} color="#ffffff" />
                    </TouchableOpacity>

                    {/* Counter */}
                    {previewImages && previewImages.length > 1 ? (
                        <View style={{ position: 'absolute', top: (insets.top || 20) + 16, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 }}>
                            <Typography weight="bold" className="text-[12px] text-white">
                                {previewIndex + 1} / {previewImages.length}
                            </Typography>
                        </View>
                    ) : null}

                    {/* Prev / Next */}
                    {previewImages && previewImages.length > 1 ? (
                        <>
                            {previewIndex > 0 ? (
                                <TouchableOpacity
                                    onPress={() => goToPreview(previewIndex - 1)}
                                    style={{ position: 'absolute', left: 16, top: '50%', marginTop: -22, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <ArrowLeft2 size={24} color="#ffffff" />
                                </TouchableOpacity>
                            ) : null}
                            {previewIndex < previewImages.length - 1 ? (
                                <TouchableOpacity
                                    onPress={() => goToPreview(previewIndex + 1)}
                                    style={{ position: 'absolute', right: 16, top: '50%', marginTop: -22, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <ArrowRight2 size={24} color="#ffffff" />
                                </TouchableOpacity>
                            ) : null}
                        </>
                    ) : null}

                    {/* Dots */}
                    {previewImages && previewImages.length > 1 ? (
                        <View style={{ position: 'absolute', bottom: (insets.bottom || 20) + 16, alignSelf: 'center', flexDirection: 'row', gap: 8 }}>
                            {previewImages.map((_, idx) => (
                                <TouchableOpacity key={idx} onPress={() => goToPreview(idx)} activeOpacity={0.7}>
                                    <View
                                        style={{
                                            width: idx === previewIndex ? 10 : 8,
                                            height: idx === previewIndex ? 10 : 8,
                                            borderRadius: 5,
                                            backgroundColor: idx === previewIndex ? '#ffffff' : 'rgba(255,255,255,0.4)',
                                        }}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : null}
                </View>
            </Modal>
        </View>
    );
}
