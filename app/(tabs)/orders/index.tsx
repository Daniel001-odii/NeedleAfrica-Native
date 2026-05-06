import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, ScrollView, Pressable, RefreshControl, FlatList, ActivityIndicator, Image, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../../components/ui/Typography';
import { Surface } from '../../../components/ui/Surface';
import { IconButton } from '../../../components/ui/IconButton';
import { Box, FilterSearch, Add, Trash, TickCircle, DocumentText, InfoCircle, SearchNormal, ArrowRight } from 'iconsax-react-native';
import { useRouter } from 'expo-router';
import { useOrders } from '../../../hooks/useOrders';
import { useSync } from '../../../hooks/useSync';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useResourceLimits } from '../../../hooks/useResourceLimits';
import Toast from 'react-native-toast-message';

const TABS = ['All', 'Pending', 'Delivered'] as const;
type TabType = typeof TABS[number];

type SurfaceVariant = 'white' | 'lavender' | 'peach' | 'blue' | 'green' | 'muted' | 'dark';

type SortOption = 'recent' | 'oldest' | 'due-soon' | 'due-later';

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
    { key: 'recent', label: 'Most Recent' },
    { key: 'oldest', label: 'Oldest First' },
    { key: 'due-soon', label: 'Due Date (Soonest)' },
    { key: 'due-later', label: 'Due Date (Latest)' },
];

import { Swipeable } from 'react-native-gesture-handler';
import { useConfirm } from '../../../contexts/ConfirmContext';
import { ProgressSquare } from '../../../components/ui/ProgressSquare';
import { ActionSheet } from '../../../components/ui/ActionSheet';

export default function Orders() {
    const [activeTab, setActiveTab] = useState<TabType>('All');
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>('recent');
    const [showSortModal, setShowSortModal] = useState(false);
    const { orders, loading, refresh, deleteOrder, updateOrderStatus } = useOrders();
    const router = useRouter();
    const { sync: performSync } = useSync();
    const { confirm } = useConfirm();
    const { isDark } = useTheme();
    const { user } = useAuth();
    const { getLimitStatus } = useResourceLimits();
    const swipeableRefs = useRef<Record<string, Swipeable | null>>({});

    const showHelpAnimation = () => {
        const firstId = sortedOrders[0]?.id;
        if (firstId && swipeableRefs.current[firstId]) {
            swipeableRefs.current[firstId]?.openRight();
            setTimeout(() => {
                swipeableRefs.current[firstId]?.close();
            }, 1500);
        }
    };

    const isPro = user?.subscriptionPlan === 'PRO' || user?.subscriptionPlan === 'STUDIO_AI';
    const orderLimit = getLimitStatus('orders');

    const getProgressColors = (order: any) => {
        if (order.status === 'DELIVERED') return '#16a34a'; // Green
        if (!order.deliveryDate) return '#9CA3AF'; // Gray
        const now = new Date();
        const due = new Date(order.deliveryDate);
        const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return '#dc2626'; // Overdue Red
        if (diffDays <= 3) return '#f97316'; // Soon Orange
        return '#6366f1';
    };

    const getProgressValue = (order: any) => {
        if (order.status === 'DELIVERED') return 1;
        if (!order.deliveryDate || !order.createdAt) return 0.5;
        const start = new Date(order.createdAt).getTime();
        const end = new Date(order.deliveryDate).getTime();
        const now = Date.now();
        if (now >= end) return 1;
        if (now <= start) return 0;
        const total = end - start;
        const elapsed = now - start;
        return Math.min(1, elapsed / total);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    }, [refresh]);

    const handleDelete = (id: string, name: string) => {
        confirm({
            title: "Delete Order",
            message: `Are you sure you want to delete "${name}"?`,
            confirmText: "Delete",
            type: "danger",
            onConfirm: () => deleteOrder(id)
        });
    };

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'DELIVERED' ? 'PENDING' : 'DELIVERED';
        
        const performToggle = async () => {
            try {
                await updateOrderStatus(id, newStatus);
                Toast.show({
                    type: 'success',
                    text1: newStatus === 'DELIVERED' ? 'Order Delivered' : 'Order Reopened',
                });
                performSync().catch(console.error);
            } catch (error) {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update status' });
            }
        };

        if (newStatus === 'DELIVERED') {
            confirm({
                title: "Mark as Delivered",
                message: "Are you sure this order has been delivered?",
                confirmText: "Yes, Delivered",
                type: "success",
                onConfirm: performToggle
            });
        } else {
            performToggle();
        }
    };

    const renderRightActions = (order: any) => {
        return (
            <View className="pl-4 mb-3 justify-center items-center flex-row gap-2">
                <TouchableOpacity
                    onPress={() => handleToggleStatus(order.id, order.status)}
                    className={`${order.status === 'DELIVERED' ? 'bg-orange-100' : 'bg-green-100'} justify-center items-center w-16 h-16 rounded-2xl`}
                >
                    <TickCircle size={24} color={order.status === 'DELIVERED' ? '#f97316' : '#16a34a'} variant="Bold" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => handleDelete(order.id, order.styleName)}
                    className="bg-red-500 justify-center items-center w-16 h-16 rounded-2xl"
                >
                    <Trash size={24} color="white" variant="Bold" />
                </TouchableOpacity>
            </View>
        );
    };

    const getVariantForOrder = (id: string): SurfaceVariant => {
        const variants: SurfaceVariant[] = ['peach', 'green', 'lavender', 'blue'];
        const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return variants[index % variants.length];
    };

    const getDarkVariantClass = (variant: SurfaceVariant) => {
        switch (variant) {
            case 'peach': return 'bg-orange-900/20';
            case 'green': return 'bg-green-900/20';
            case 'lavender': return 'bg-indigo-900/40';
            case 'blue': return 'bg-blue-900/40';
            default: return 'bg-surface-dark';
        }
    };

    const getVariantColor = (variant: SurfaceVariant) => {
        switch (variant) {
            case 'peach': return isDark ? '#fb923c' : '#c2410c';
            case 'green': return isDark ? '#4ade80' : '#15803d';
            case 'lavender': return isDark ? '#a5b4fc' : '#4f46e5';
            case 'blue': return isDark ? '#38bdf8' : '#0369a1';
            default: return isDark ? 'white' : 'black';
        }
    };

    const filteredOrders = useMemo(() => {
        let items = orders;
        if (activeTab !== 'All') {
            items = items.filter(o => o.status === activeTab.toUpperCase());
        }
        if (search) {
            const query = search.toLowerCase();
            items = items.filter(o =>
                (o.styleName || '').toLowerCase().includes(query) ||
                ((o as any).customerFullName || '').toLowerCase().includes(query)
            );
        }
        return items;
    }, [orders, activeTab, search]);

    const sortedOrders = useMemo(() => {
        const sorted = [...filteredOrders];
        switch (sortBy) {
            case 'recent':
                return sorted.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            case 'oldest':
                return sorted.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
            case 'due-soon':
                return sorted.sort((a, b) => {
                    const aDate = a.deliveryDate ? new Date(a.deliveryDate).getTime() : Infinity;
                    const bDate = b.deliveryDate ? new Date(b.deliveryDate).getTime() : Infinity;
                    return aDate - bDate;
                });
            case 'due-later':
                return sorted.sort((a, b) => {
                    const aDate = a.deliveryDate ? new Date(a.deliveryDate).getTime() : 0;
                    const bDate = b.deliveryDate ? new Date(b.deliveryDate).getTime() : 0;
                    return bDate - aDate;
                });
            default:
                return sorted;
        }
    }, [filteredOrders, sortBy]);

    useEffect(() => {
        if (!loading && sortedOrders.length > 0) {
            const timer = setTimeout(() => {
                showHelpAnimation();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [loading, sortedOrders.length === 0]);

    const currentSortLabel = SORT_OPTIONS.find(o => o.key === sortBy)?.label || 'Sort';

    return (
        <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-[#F2F2F7]'}`}>
            <View className={`px-6 pt-5 pb-4 ${isDark ? 'bg-zinc-900' : 'bg-white'}`}>
                {/* Header */}
                <View className="flex-row justify-between items-center mb-4">
                    <View className="flex-row items-center">
                        <Typography variant="h2" weight="bold" className="text-2xl">Orders</Typography>
                        {!isPro && (
                            <View className={`ml-3 px-2 py-0.5 rounded-md ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                                <Typography variant="caption" weight="bold" color="gray">
                                    {orderLimit.current}/{orderLimit.limit}
                                </Typography>
                            </View>
                        )}
                    </View>
                    <View className="flex-row items-center gap-2">
                        <TouchableOpacity onPress={() => router.push('/(tabs)/orders/invoices/new')} className={`flex-row items-center px-3 py-1.5 rounded-full ${isDark ? 'bg-indigo-900/40' : 'bg-indigo-50'}`}>
                            <DocumentText size={18} color="#6366f1" />
                            <Typography variant="small" weight="bold" className={`ml-1 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>Invoice</Typography>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/orders/new')} className={`flex-row items-center px-3 py-1.5 rounded-full ${isDark ? 'bg-indigo-900/40' : 'bg-indigo-50'}`}>
                            <Add size={20} color="#6366f1" />
                            <Typography variant="small" weight="bold" className={`ml-1 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>New</Typography>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search Bar & Filter */}
                <View className="flex-row items-center gap-3">
                    <Surface variant="muted" className={`flex-1 flex-row items-center px-3 h-11 border-0 ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`} rounded="xl">
                        <SearchNormal size={18} color="#8E8E93" />
                        <TextInput
                            className={`flex-1 ml-2 text-base ${isDark ? 'text-white' : 'text-black'}`}
                            placeholder="Search for an order..."
                            placeholderTextColor="#8E8E93"
                            value={search}
                            onChangeText={setSearch}
                        />
                    </Surface>
                    <TouchableOpacity onPress={() => setShowSortModal(true)} className={`w-11 h-11 items-center justify-center rounded-xl ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                        <FilterSearch size={22} color={isDark ? "#818cf8" : "#6366f1"} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tabs */}
            <View className="py-2">
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerClassName="px-6 py-4"
                >
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab;
                        const count = tab === 'All'
                            ? orders.length
                            : orders.filter(o => o.status === tab.toUpperCase()).length;

                        return (
                            <TouchableOpacity
                                key={tab}
                                activeOpacity={0.7}
                                onPress={() => setActiveTab(tab)}
                                className={`flex-row items-center px-5 py-2.5 rounded-full mr-3 ${isActive
                                    ? (isDark ? 'bg-zinc-100' : 'bg-zinc-900')
                                    : (isDark ? 'bg-zinc-900 border border-white/5' : 'bg-white shadow-sm')
                                    }`}
                            >
                                <Typography
                                    variant="small"
                                    weight={isActive ? 'bold' : 'medium'}
                                    className={isActive ? (isDark ? 'text-black' : 'text-white') : 'text-gray-500'}
                                >
                                    {tab}
                                </Typography>
                                <View className={`ml-2 px-1.5 py-0.5 rounded-md ${isActive ? (isDark ? 'bg-black/10' : 'bg-white/10') : (isDark ? 'bg-white/5' : 'bg-zinc-50')}`}>
                                    <Typography
                                        variant="small"
                                        weight="bold"
                                        className={`text-[10px] ${isActive ? (isDark ? 'text-black' : 'text-white') : 'text-gray-500'}`}
                                    >
                                        {count}
                                    </Typography>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color={isDark ? "white" : "#6366f1"} />
                </View>
            ) : (
                <FlatList
                    data={sortedOrders}
                    keyExtractor={(item) => item.id}
                    contentContainerClassName="p-4 pt-2 pb-32"
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
                    }
                    renderItem={({ item: order }) => (
                        <Swipeable
                            ref={ref => { swipeableRefs.current[order.id] = ref; }}
                            renderRightActions={() => renderRightActions(order)}
                            friction={2}
                            rightThreshold={40}
                        >
                            <Pressable onPress={() => router.push({ pathname: '/(tabs)/orders/[id]', params: { id: order.id } })}>
                                <Surface variant="white" className="flex-row items-center p-4 mb-3" rounded="2xl" hasShadow={!isDark}>
                                    <View className="relative mr-4 w-[54px] h-[54px] items-center justify-center">
                                        <View className="absolute">
                                            <ProgressSquare
                                                progress={getProgressValue(order)}
                                                size={54}
                                                strokeWidth={2.5}
                                                borderRadius={14}
                                                color={getProgressColors(order)}
                                                backgroundColor={isDark ? '#1F2937' : '#F3F4F6'}
                                            />
                                        </View>
                                        <Surface
                                            variant={(order.fabricImage || order.styleImage) ? 'white' : getVariantForOrder(order.id)}
                                            className={`w-11 h-11 items-center justify-center overflow-hidden ${(order.fabricImage || order.styleImage) ? (isDark ? 'bg-dark-800' : '') : (isDark ? getDarkVariantClass(getVariantForOrder(order.id)) : '')}`}
                                            rounded="xl"
                                        >
                                            {(order.fabricImage || order.styleImage) ? (
                                                <Image
                                                    source={{ uri: (order.fabricImage || order.styleImage) as string }}
                                                    className="w-full h-full"
                                                />
                                            ) : (
                                                <Box size={18} color={getVariantColor(getVariantForOrder(order.id))} variant="Bulk" />
                                            )}
                                        </Surface>
                                    </View>

                                    <View className="flex-1">
                                        <View className="flex-row justify-between items-start mb-1">
                                            <View>
                                                <Typography variant="body" weight="bold">{order.styleName}</Typography>
                                                <Typography variant="caption" color="gray" className="mt-0.5">{(order as any).customerFullName}</Typography>
                                            </View>
                                            <Typography variant="small" weight="bold" className="text-gray-400">#{order.id.slice(-4).toUpperCase()}</Typography>
                                        </View>

                                        <View className="flex-row justify-between items-center mt-1">
                                            <View className="flex-row items-center gap-2">
                                                <Typography variant="caption" color="gray">
                                                    {order.deliveryDate ? `Due ${new Date(order.deliveryDate).toLocaleDateString()}` : 'No due date'}
                                                </Typography>
                                                {(order.amount || 0) > 0 && (order.balance || 0) > 0 && (
                                                    <View className={`${isDark ? 'bg-red-900/20' : 'bg-red-50'} px-1.5 py-0.5 rounded`}>
                                                        <Typography variant="small" color="red" weight="bold" className="text-[9px]">
                                                            OWING
                                                        </Typography>
                                                    </View>
                                                )}
                                            </View>
                                            <View
                                                className={`px-2 py-0.5 rounded-md ${order.status === 'DELIVERED'
                                                    ? (isDark ? 'bg-green-900/20' : 'bg-green-50')
                                                    : (isDark ? 'bg-orange-900/20' : 'bg-orange-50')}`}
                                            >
                                                <Typography variant="small" weight="bold" className={`${order.status === 'DELIVERED' ? 'text-green-600' : 'text-orange-500'} text-[10px]`}>
                                                    {order.status}
                                                </Typography>
                                            </View>
                                        </View>
                                    </View>

                                </Surface>
                            </Pressable>
                        </Swipeable>
                    )}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20 px-10">
                            <Surface variant="muted" className="w-20 h-20 items-center justify-center mb-6" rounded="full">
                                <Box size={32} color="#8E8E93" variant="Bulk" />
                            </Surface>
                            <Typography variant="h3" weight="bold" className="text-center mb-2">No orders</Typography>
                            <Typography variant="body" color="gray" className="text-center">
                                {search ? "Try a different search term" : "Add your first order to get started"}
                            </Typography>
                        </View>
                    }
                />
            )}

            <ActionSheet
                visible={showSortModal}
                onClose={() => setShowSortModal(false)}
                title="Sort By"
                options={SORT_OPTIONS}
                selectedValue={sortBy}
                onSelect={setSortBy}
            />
        </View>
    );
}
