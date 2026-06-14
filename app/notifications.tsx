import React, { useMemo, useState, useCallback } from 'react';
import { View, ScrollView, ActivityIndicator, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Notification } from 'iconsax-react-native';
import OrderRequestIcon from '../assets/icons/OrderRequestIcon';
import { router } from 'expo-router';
import { Typography } from '../components/ui/Typography';
import { IconButton } from '../components/ui/IconButton';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useCatalog } from '../hooks/useCatalog';
import { CatalogVisibilityModal } from '../components/CatalogVisibilityModal';
import { OrderRequestService, OrderRequest } from '../services/OrderRequestService';
import { useUnreadOrderRequests } from '../hooks/useUnreadOrderRequests';

interface AppNotification {
    id: string;
    message: string;
    time: string;
    read: boolean;
    timestamp?: number;
    onPress?: () => void;
}

function NotificationAvatar({ logoUri, fallbackLabel, type }: { logoUri?: string | null; fallbackLabel: string; type?: 'order-request' | 'default' }) {
    if (logoUri) {
        return (
            <Image
                source={{ uri: logoUri }}
                className='rounded-full'
                style={{ width: 48, height: 48 }}
                resizeMode="cover"
            />
        );
    }

    if (type === 'order-request') {
        return (
            <View style={{ width: 48, height: 48 }} className="items-center justify-center rounded-full bg-black">
                <OrderRequestIcon size={24} color="white" />
            </View>
        );
    }

    const initials = fallbackLabel
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toLowerCase();

    return (
        <View style={{ width: 48, height: 48 }} className="items-center justify-center rounded-full bg-black">
            <Typography weight="bold" color="white" className="text-[15px] uppercase">
                {initials || 'na'}
            </Typography>
        </View>
    );
}

export default function NotificationsScreen() {
    const { isDark } = useTheme();
    const { user } = useAuth();
    const { catalog, needsVisibility, loading: catalogLoading } = useCatalog();
    const [isCatalogModalVisible, setIsCatalogModalVisible] = useState(false);
    
    // For local non-persisted notifications
    const [localReadIds, setLocalReadIds] = useState<Set<string>>(new Set());
    
    const { orderRequests, readIds, markAsRead, refresh } = useUnreadOrderRequests();
    const [isLoadingRequests, setIsLoadingRequests] = useState(true);

    React.useEffect(() => {
        setIsLoadingRequests(false);
    }, [orderRequests]);

    const markLocalAsRead = useCallback((id: string) => {
        setLocalReadIds((prev) => new Set(prev).add(id));
    }, []);

    const userIsPro = user?.subscriptionPlan !== 'FREE' && user?.subscriptionStatus === 'ACTIVE';
    const catalogPhoto = catalog?.businessLogo || null;

    const notifications = useMemo<AppNotification[]>(() => {
        const items: AppNotification[] = [];

        if (needsVisibility) {
            items.push({
                id: 'catalog-visibility',
                message: "Turn on your catalog's visibility to start getting orders from customers.",
                time: 'Now',
                read: localReadIds.has('catalog-visibility'),
                onPress: () => {
                    markLocalAsRead('catalog-visibility');
                    if (userIsPro) {
                        router.push('/(tabs)/profile/catalog');
                    } else {
                        setIsCatalogModalVisible(true);
                    }
                },
            });
        }

        orderRequests.forEach((req) => {
            const date = new Date(req.createdAt);
            // Simple time string formatting
            const timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            items.push({
                id: `order-req-${req.id}`,
                message: `New Order Request from ${req.fullName}`,
                time: timeStr,
                timestamp: date.getTime(),
                read: readIds.has(req.id),
                onPress: () => {
                    markAsRead(req.id);
                    router.push({
                        pathname: '/order-request-details',
                        params: { data: JSON.stringify(req) }
                    });
                }
            });
        });

        // Sort items by timestamp descending
        items.sort((a, b) => {
            const timeA = a.timestamp || 0;
            const timeB = b.timestamp || 0;
            return timeB - timeA;
        });

        return items;
    }, [needsVisibility, userIsPro, localReadIds, markLocalAsRead, orderRequests, readIds]);

    return (
        <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'}`}>
            <SafeAreaView edges={['top']} className="flex-1">
                <View className="flex-row items-center px-4 py-3">
                    <IconButton
                        icon={<ArrowLeft size={24} color={isDark ? 'white' : 'black'} />}
                        onPress={() => router.back()}
                        variant="ghost"
                        className="-ml-2"
                    />
                    <View className="flex-1 items-center -ml-10">
                        <Typography variant="h3" weight="bold" className={isDark ? 'text-white' : 'text-black'}>
                            Notifications
                        </Typography>
                    </View>
                </View>

                <ScrollView
                    className="flex-1"
                    contentContainerClassName="pb-20"
                    showsVerticalScrollIndicator={false}
                >
                    {catalogLoading || isLoadingRequests ? (
                        <View className="items-center justify-center py-20">
                            <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#FF5678'} />
                        </View>
                    ) : notifications.length > 0 ? (
                        notifications.map((note, index) => (
                            <View key={note.id}>
                                <Pressable
                                    onPress={note.onPress}
                                    className={`flex-row px-4 py-5 active:opacity-70 ${
                                        !note.read
                                            ? isDark ? 'bg-white/5' : 'bg-gray-50'
                                            : ''
                                    }`}
                                >
                                    <NotificationAvatar
                                        logoUri={catalogPhoto}
                                        fallbackLabel={user?.businessName || user?.username || 'Needle'}
                                        type={note.id.startsWith('order-req-') ? 'order-request' : 'default'}
                                    />

                                    <View className="flex-1 mx-4">
                                        <Typography
                                            variant="body"
                                            weight="medium"
                                            className={`leading-[22px] ${isDark ? 'text-white' : 'text-black'}`}
                                        >
                                            {note.message}
                                        </Typography>
                                    </View>

                                    <View className="items-end pt-0.5">
                                        <Typography variant="small" color="gray" weight="medium" className="text-[13px]">
                                            {note.time}
                                        </Typography>
                                        {!note.read && (
                                            <View className="w-2 h-2 rounded-full bg-[#FF5678] mt-2" />
                                        )}
                                    </View>
                                </Pressable>

                                {index < notifications.length - 1 && (
                                    <View className={`h-px ml-[72px] ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`} />
                                )}
                            </View>
                        ))
                    ) : (
                        <View className="items-center justify-center py-20 px-10">
                            <Notification size={40} color="#9CA3AF" variant="Bulk" />
                            <Typography variant="subtitle" weight="bold" color="gray" className="mt-6">
                                All caught up!
                            </Typography>
                            <Typography variant="small" color="gray" className="mt-2 text-center">
                                You don't have any new notifications at the moment.
                            </Typography>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>

            <CatalogVisibilityModal
                visible={isCatalogModalVisible}
                onClose={() => setIsCatalogModalVisible(false)}
            />
        </View>
    );
}
