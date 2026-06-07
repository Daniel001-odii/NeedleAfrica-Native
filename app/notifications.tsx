import React, { useMemo, useState, useCallback } from 'react';
import { View, ScrollView, ActivityIndicator, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Notification } from 'iconsax-react-native';
import { router } from 'expo-router';
import { Typography } from '../components/ui/Typography';
import { IconButton } from '../components/ui/IconButton';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useCatalog } from '../hooks/useCatalog';
import { CatalogVisibilityModal } from '../components/CatalogVisibilityModal';

interface AppNotification {
    id: string;
    message: string;
    time: string;
    read: boolean;
    onPress?: () => void;
}

function NotificationAvatar({ logoUri, fallbackLabel }: { logoUri?: string | null; fallbackLabel: string }) {
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

    const initials = fallbackLabel
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toLowerCase();

    return (
        <View style={{ width: 48, height: 48, backgroundColor: '#000000' }} className="items-center justify-center rounded-full">
            <Typography weight="bold" color="white" className="text-[15px] lowercase">
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
    const [readIds, setReadIds] = useState<Set<string>>(new Set());

    const markAsRead = useCallback((id: string) => {
        setReadIds((prev) => new Set(prev).add(id));
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
                read: readIds.has('catalog-visibility'),
                onPress: () => {
                    markAsRead('catalog-visibility');
                    if (userIsPro) {
                        router.push('/(tabs)/profile/catalog');
                    } else {
                        setIsCatalogModalVisible(true);
                    }
                },
            });
        }

        return items;
    }, [needsVisibility, userIsPro, readIds, markAsRead]);

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
                    {catalogLoading ? (
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
