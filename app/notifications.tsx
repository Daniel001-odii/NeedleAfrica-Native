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
import { InstantRequestService, InstantLead } from '../services/InstantRequestService';
import { useUnreadOrderRequests } from '../hooks/useUnreadOrderRequests';

type NotificationKind = 'instant' | 'order' | 'system';

interface AppNotification {
    id: string;
    message: string;
    time: string;
    read: boolean;
    timestamp?: number;
    kind: NotificationKind;
    badge?: { text: string; tone: 'open' | 'bid' | 'won' | 'closed' };
    onPress?: () => void;
}

type Segment = 'all' | 'instant' | 'updates';

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

    const [segment, setSegment] = useState<Segment>('all');
    const [instantLeads, setInstantLeads] = useState<InstantLead[]>([]);

    React.useEffect(() => {
        setIsLoadingRequests(false);
    }, [orderRequests]);

    React.useEffect(() => {
        let active = true;
        InstantRequestService.getInstantLeads()
            .then((leads) => { if (active) setInstantLeads(leads); })
            .catch(() => { });
        return () => { active = false; };
    }, []);

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
                kind: 'system',
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
                kind: 'order',
                onPress: () => {
                    markAsRead(req.id);
                    router.push({
                        pathname: '/order-request-details',
                        params: { data: JSON.stringify(req) }
                    });
                }
            });
        });

        // ⚡ Instant leads — permanently preserved regardless of push dismissal
        instantLeads.forEach((lead) => {
            const date = new Date(lead.createdAt);
            const timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            let badge: AppNotification['badge'];
            let message: string;
            if (lead.myBid && lead.myBid.status === 'ACCEPTED') {
                badge = { text: 'Won / Accepted', tone: 'won' };
                message = `You won the lead from ${lead.fullName}! 🎉`;
            } else if (lead.status !== 'PENDING') {
                badge = { text: 'Closed / Filled', tone: 'closed' };
                message = `Lead from ${lead.fullName} is closed`;
            } else if (lead.myBid && lead.myBid.status !== 'WITHDRAWN') {
                badge = { text: `Your bid: ₦${lead.myBid.price.toLocaleString()}`, tone: 'bid' };
                message = `${lead.fullName} near you — your bid is in`;
            } else {
                badge = { text: `Open · ${lead.bidCount} bid${lead.bidCount === 1 ? '' : 's'}`, tone: 'open' };
                const dist = lead.distanceKm != null ? ` (${Math.round(lead.distanceKm)}km)` : '';
                message = `⚡ New request from ${lead.fullName}${dist}: tap to bid`;
            }

            items.push({
                id: `instant-${lead.id}`,
                message,
                time: timeStr,
                timestamp: date.getTime(),
                read: lead.status !== 'PENDING' || !!lead.myBid,
                kind: 'instant',
                badge,
                onPress: () => {
                    router.push({ pathname: '/instant-requests/[id]', params: { id: lead.id, data: JSON.stringify(lead) } });
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
    }, [needsVisibility, userIsPro, localReadIds, markLocalAsRead, orderRequests, readIds, instantLeads]);

    const visibleNotifications = useMemo(() => {
        if (segment === 'instant') return notifications.filter((n) => n.kind === 'instant');
        if (segment === 'updates') return notifications.filter((n) => n.kind !== 'instant');
        return notifications;
    }, [notifications, segment]);

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

                {/* Segment tabs */}
                <View className="flex-row px-4 pb-3 gap-2">
                    {([
                        { key: 'all', label: 'All' },
                        { key: 'instant', label: '⚡ Instant Leads' },
                        { key: 'updates', label: 'Updates' },
                    ] as { key: Segment; label: string }[]).map((tab) => {
                        const activeTab = segment === tab.key;
                        return (
                            <Pressable
                                key={tab.key}
                                onPress={() => setSegment(tab.key)}
                                className={`px-4 py-2 rounded-full ${activeTab ? 'bg-[#FF5678]' : isDark ? 'bg-zinc-900' : 'bg-gray-100'}`}
                            >
                                <Typography
                                    variant="small"
                                    weight="bold"
                                    className={activeTab ? 'text-white' : isDark ? 'text-zinc-400' : 'text-gray-600'}
                                >
                                    {tab.label}
                                </Typography>
                            </Pressable>
                        );
                    })}
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
                    ) : visibleNotifications.length > 0 ? (
                        visibleNotifications.map((note, index) => (
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
                                        logoUri={note.kind === 'instant' ? null : catalogPhoto}
                                        fallbackLabel={user?.businessName || user?.username || 'Needle'}
                                        type={note.kind === 'instant' || note.id.startsWith('order-req-') ? 'order-request' : 'default'}
                                    />

                                    <View className="flex-1 mx-4">
                                        <Typography
                                            variant="body"
                                            weight="medium"
                                            className={`leading-[22px] ${isDark ? 'text-white' : 'text-black'}`}
                                        >
                                            {note.message}
                                        </Typography>
                                        {note.badge && (
                                            <View
                                                className={`self-start mt-2 px-2.5 py-1 rounded-full ${
                                                    note.badge.tone === 'won'
                                                        ? 'bg-green-100 dark:bg-green-900/30'
                                                        : note.badge.tone === 'closed'
                                                            ? 'bg-gray-100 dark:bg-zinc-800'
                                                            : note.badge.tone === 'bid'
                                                                ? 'bg-blue-100 dark:bg-blue-900/30'
                                                                : 'bg-[#FF5678]/10'
                                                }`}
                                            >
                                                <Typography
                                                    variant="small"
                                                    weight="bold"
                                                    className={`text-[11px] ${
                                                        note.badge.tone === 'won'
                                                            ? 'text-green-700 dark:text-green-400'
                                                            : note.badge.tone === 'closed'
                                                                ? 'text-gray-500'
                                                                : note.badge.tone === 'bid'
                                                                    ? 'text-blue-600 dark:text-blue-400'
                                                                    : 'text-[#FF5678]'
                                                    }`}
                                                >
                                                    {note.badge.text}
                                                </Typography>
                                            </View>
                                        )}
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

                                {index < visibleNotifications.length - 1 && (
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
