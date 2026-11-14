import React, { useMemo, useState, useCallback } from 'react';
import { View, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ArrowLeft, Notification, Flash, Cup, MoneySend,
    Archive, ShoppingBag, Eye, CalendarTick, ReceiptItem
} from 'iconsax-react-native';
import { router } from 'expo-router';
import { Typography } from '../components/ui/Typography';
import { IconButton } from '../components/ui/IconButton';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import Animated from 'react-native-reanimated';
import { useSegmentSlider } from '../hooks/useSegmentSlider';
import { useCatalog } from '../hooks/useCatalog';
import { useOrders } from '../hooks/useOrders';
import { useCustomers } from '../hooks/useCustomers';
import { CatalogVisibilityModal } from '../components/CatalogVisibilityModal';
import { InstantRequestService, InstantLead } from '../services/InstantRequestService';
import { useUnreadOrderRequests } from '../hooks/useUnreadOrderRequests';

export type NotificationCategory =
    | 'lead-open'
    | 'lead-won'
    | 'lead-bid'
    | 'lead-closed'
    | 'order-request'
    | 'catalog-visibility'
    | 'delivery-reminder'
    | 'payment-reminder'
    | 'system';

type NotificationKind = 'instant' | 'order' | 'system';

interface AppNotification {
    id: string;
    message: string;
    time: string;
    read: boolean;
    timestamp?: number;
    kind: NotificationKind;
    category: NotificationCategory;
    badge?: { text: string; tone: 'open' | 'bid' | 'won' | 'closed' | 'info' };
    onPress?: () => void;
}

type Segment = 'all' | 'instant' | 'updates';

function NotificationCategoryAvatar({ category, isDark }: { category: NotificationCategory; isDark: boolean }) {
    switch (category) {
        case 'lead-won':
            return (
                <View
                    style={{ width: 48, height: 48, borderRadius: 24 }}
                    className={`items-center justify-center ${isDark ? 'bg-emerald-950/60 border border-emerald-500/30' : 'bg-emerald-50 border border-emerald-200/80'}`}
                >
                    <Cup size={24} color="#10B981" variant="Bold" />
                </View>
            );
        case 'lead-bid':
            return (
                <View
                    style={{ width: 48, height: 48, borderRadius: 24 }}
                    className={`items-center justify-center ${isDark ? 'bg-blue-950/60 border border-blue-500/30' : 'bg-blue-50 border border-blue-200/80'}`}
                >
                    <MoneySend size={24} color="#3B82F6" variant="Bold" />
                </View>
            );
        case 'lead-open':
            return (
                <View
                    style={{ width: 48, height: 48, borderRadius: 24 }}
                    className={`items-center justify-center ${isDark ? 'bg-rose-950/60 border border-rose-500/30' : 'bg-rose-50 border border-rose-200/80'}`}
                >
                    <Flash size={24} color="#FF5678" variant="Bold" />
                </View>
            );
        case 'lead-closed':
            return (
                <View
                    style={{ width: 48, height: 48, borderRadius: 24 }}
                    className={`items-center justify-center ${isDark ? 'bg-zinc-800 border border-zinc-700' : 'bg-zinc-100 border border-zinc-200'}`}
                >
                    <Archive size={24} color={isDark ? '#A1A1AA' : '#71717A'} variant="Bold" />
                </View>
            );
        case 'order-request':
            return (
                <View
                    style={{ width: 48, height: 48, borderRadius: 24 }}
                    className={`items-center justify-center ${isDark ? 'bg-purple-950/60 border border-purple-500/30' : 'bg-purple-50 border border-purple-200/80'}`}
                >
                    <ShoppingBag size={24} color="#8B5CF6" variant="Bold" />
                </View>
            );
        case 'catalog-visibility':
            return (
                <View
                    style={{ width: 48, height: 48, borderRadius: 24 }}
                    className={`items-center justify-center ${isDark ? 'bg-amber-950/60 border border-amber-500/30' : 'bg-amber-50 border border-amber-200/80'}`}
                >
                    <Eye size={24} color="#F59E0B" variant="Bold" />
                </View>
            );
        case 'delivery-reminder':
            return (
                <View
                    style={{ width: 48, height: 48, borderRadius: 24 }}
                    className={`items-center justify-center ${isDark ? 'bg-orange-950/60 border border-orange-500/30' : 'bg-orange-50 border border-orange-200/80'}`}
                >
                    <CalendarTick size={24} color="#F97316" variant="Bold" />
                </View>
            );
        case 'payment-reminder':
            return (
                <View
                    style={{ width: 48, height: 48, borderRadius: 24 }}
                    className={`items-center justify-center ${isDark ? 'bg-teal-950/60 border border-teal-500/30' : 'bg-teal-50 border border-teal-200/80'}`}
                >
                    <ReceiptItem size={24} color="#14B8A6" variant="Bold" />
                </View>
            );
        default:
            return (
                <View
                    style={{ width: 48, height: 48, borderRadius: 24 }}
                    className={`items-center justify-center ${isDark ? 'bg-indigo-950/60 border border-indigo-500/30' : 'bg-indigo-50 border border-indigo-200/80'}`}
                >
                    <Notification size={24} color="#6366F1" variant="Bold" />
                </View>
            );
    }
}

export default function NotificationsScreen() {
    const { isDark } = useTheme();
    const { user } = useAuth();
    const { catalog, needsVisibility, loading: catalogLoading } = useCatalog();
    const { orders } = useOrders();
    const { customers } = useCustomers();
    const [isCatalogModalVisible, setIsCatalogModalVisible] = useState(false);

    // For local non-persisted notifications
    const [localReadIds, setLocalReadIds] = useState<Set<string>>(new Set());

    const { orderRequests, readIds, markAsRead } = useUnreadOrderRequests();
    const [isLoadingRequests, setIsLoadingRequests] = useState(true);

    const [segment, setSegment] = useState<Segment>('all');
    const tabSlider = useSegmentSlider(segment);
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

    const customerNameMap = useMemo(() => {
        const map: Record<string, string> = {};
        customers.forEach(c => {
            map[c.id] = c.fullName || 'Customer';
        });
        return map;
    }, [customers]);

    const notifications = useMemo<AppNotification[]>(() => {
        const items: AppNotification[] = [];

        // 1. Catalog visibility alert
        if (needsVisibility) {
            items.push({
                id: 'catalog-visibility',
                message: "Turn on your catalog's visibility to start getting orders from customers.",
                time: 'Now',
                read: localReadIds.has('catalog-visibility'),
                kind: 'system',
                category: 'catalog-visibility',
                badge: { text: 'Action Needed', tone: 'info' },
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

        // 2. Direct customer order requests from Storefront
        orderRequests.forEach((req) => {
            const date = new Date(req.createdAt);
            const timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            items.push({
                id: `order-req-${req.id}`,
                message: `New Order Request from ${req.fullName}`,
                time: timeStr,
                timestamp: date.getTime(),
                read: readIds.has(req.id),
                kind: 'order',
                category: 'order-request',
                badge: { text: 'Order Request', tone: 'info' },
                onPress: () => {
                    markAsRead(req.id);
                    router.push({
                        pathname: '/order-request-details',
                        params: { data: JSON.stringify(req) }
                    });
                }
            });
        });

        // 3. Instant marketplace leads
        instantLeads.forEach((lead) => {
            const date = new Date(lead.createdAt);
            const timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            let badge: AppNotification['badge'];
            let message: string;
            let category: NotificationCategory;

            if (lead.myBid && lead.myBid.status === 'ACCEPTED') {
                badge = { text: 'Won / Accepted', tone: 'won' };
                message = `You won the lead from ${lead.fullName}! 🎉`;
                category = 'lead-won';
            } else if (lead.status !== 'PENDING') {
                badge = { text: 'Closed / Filled', tone: 'closed' };
                message = `Lead from ${lead.fullName} is closed`;
                category = 'lead-closed';
            } else if (lead.myBid && lead.myBid.status !== 'WITHDRAWN') {
                badge = { text: `Your bid: ₦${lead.myBid.price.toLocaleString()}`, tone: 'bid' };
                message = `${lead.fullName} near you — your bid is in`;
                category = 'lead-bid';
            } else {
                badge = { text: `Open · ${lead.bidCount} bid${lead.bidCount === 1 ? '' : 's'}`, tone: 'open' };
                const dist = lead.distanceKm != null ? ` (${Math.round(lead.distanceKm)}km)` : '';
                message = `⚡ New request from ${lead.fullName}${dist}: tap to bid`;
                category = 'lead-open';
            }

            items.push({
                id: `instant-${lead.id}`,
                message,
                time: timeStr,
                timestamp: date.getTime(),
                read: lead.status !== 'PENDING' || !!lead.myBid,
                kind: 'instant',
                category,
                badge,
                onPress: () => {
                    router.push({ pathname: '/instant-requests/[id]', params: { id: lead.id, data: JSON.stringify(lead) } });
                }
            });
        });

        // 4. Upcoming delivery reminders from active orders
        const now = Date.now();
        orders.forEach((o) => {
            if (o.deletedAt || o.status === 'DELIVERED' || !o.deliveryDate) return;
            const dueTime = new Date(o.deliveryDate).getTime();
            const diffDays = Math.ceil((dueTime - now) / (1000 * 60 * 60 * 24));
            if (diffDays >= -1 && diffDays <= 2) {
                const label = diffDays < 0 ? 'Overdue' : diffDays === 0 ? 'Due Today' : `Due in ${diffDays}d`;
                const customerName = customerNameMap[o.customerId || ''] || 'Customer';
                items.push({
                    id: `delivery-reminder-${o.id}`,
                    message: `Delivery Reminder: ${customerName}'s order (${o.styleName || 'Custom Style'}) is ${label.toLowerCase()}`,
                    time: label,
                    timestamp: dueTime,
                    read: localReadIds.has(`delivery-reminder-${o.id}`),
                    kind: 'system',
                    category: 'delivery-reminder',
                    badge: { text: label, tone: diffDays <= 0 ? 'closed' : 'bid' },
                    onPress: () => {
                        markLocalAsRead(`delivery-reminder-${o.id}`);
                        router.push(`/(tabs)/orders/${o.id}`);
                    }
                });
            }
        });

        // Sort items by timestamp descending
        items.sort((a, b) => {
            const timeA = a.timestamp || 0;
            const timeB = b.timestamp || 0;
            return timeB - timeA;
        });

        return items;
    }, [needsVisibility, userIsPro, localReadIds, markLocalAsRead, orderRequests, readIds, instantLeads, orders, customerNameMap]);

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

                {/* Segment tabs (sliding active indicator) */}
                <View className="relative flex-row px-4 pb-3 gap-2">
                    <Animated.View
                        pointerEvents="none"
                        style={[{ position: 'absolute', borderRadius: 999, backgroundColor: '#FF5678' }, tabSlider.indicatorStyle]}
                    />
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
                                onLayout={tabSlider.onTabLayout(tab.key)}
                                className="px-4 py-2 rounded-full"
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
                                    className={`flex-row px-4 py-4 items-center active:opacity-70 ${
                                        !note.read
                                            ? isDark ? 'bg-white/5' : 'bg-gray-50'
                                            : ''
                                    }`}
                                >
                                    <NotificationCategoryAvatar
                                        category={note.category}
                                        isDark={isDark}
                                    />

                                    <View className="flex-1 mx-3.5">
                                        <Typography
                                            variant="body"
                                            weight="medium"
                                            className={`leading-[20px] text-[14px] ${isDark ? 'text-white' : 'text-black'}`}
                                        >
                                            {note.message}
                                        </Typography>
                                        {note.badge && (
                                            <View
                                                className={`self-start mt-1.5 px-2.5 py-0.5 rounded-full ${
                                                    note.badge.tone === 'won'
                                                        ? 'bg-green-100 dark:bg-green-900/30'
                                                        : note.badge.tone === 'closed'
                                                            ? 'bg-gray-100 dark:bg-zinc-800'
                                                            : note.badge.tone === 'bid'
                                                                ? 'bg-blue-100 dark:bg-blue-900/30'
                                                                : note.badge.tone === 'info'
                                                                    ? 'bg-purple-100 dark:bg-purple-900/30'
                                                                    : 'bg-[#FF5678]/10'
                                                }`}
                                            >
                                                <Typography
                                                    variant="small"
                                                    weight="bold"
                                                    className={`text-[10px] ${
                                                        note.badge.tone === 'won'
                                                            ? 'text-green-700 dark:text-green-400'
                                                            : note.badge.tone === 'closed'
                                                                ? 'text-gray-500'
                                                                : note.badge.tone === 'bid'
                                                                    ? 'text-blue-600 dark:text-blue-400'
                                                                    : note.badge.tone === 'info'
                                                                        ? 'text-purple-700 dark:text-purple-400'
                                                                        : 'text-[#FF5678]'
                                                    }`}
                                                >
                                                    {note.badge.text}
                                                </Typography>
                                            </View>
                                        )}
                                    </View>

                                    <View className="items-end shrink-0 pl-1">
                                        <Typography variant="small" color="gray" weight="medium" className="text-[12px]">
                                            {note.time}
                                        </Typography>
                                        {!note.read && (
                                            <View className="w-2 h-2 rounded-full bg-[#FF5678] mt-2" />
                                        )}
                                    </View>
                                </Pressable>

                                {index < visibleNotifications.length - 1 && (
                                    <View className={`h-px ml-[68px] ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`} />
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
