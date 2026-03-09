import React, { useState, useMemo } from 'react';
import { View, ScrollView, Pressable, RefreshControl, FlatList, ActivityIndicator, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../../components/ui/Typography';
import { Surface } from '../../../components/ui/Surface';
import { IconButton } from '../../../components/ui/IconButton';
import { Box, FilterSearch, Add, Trash, TickCircle, CloseCircle, DocumentText } from 'iconsax-react-native';
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

export default function Orders() {
    const [activeTab, setActiveTab] = useState<TabType>('All');
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
        return '#3b82f6'; // Safe Blue
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
            message: `Are you sure you want to delete the order "${name}"? This action cannot be undone.`,
            confirmText: "Delete",
            type: "danger",
            onConfirm: () => deleteOrder(id)
        });
    };

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'DELIVERED' ? 'PENDING' : 'DELIVERED';
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

    const renderRightActions = (order: any) => {
        return (
            <View className="pl-4 mb-3 justify-center flex-row gap-2">
                <Pressable
                    onPress={() => handleToggleStatus(order.id, order.status)}
                    className={`${order.status === 'DELIVERED' ? 'bg-orange-100' : 'bg-green-100'} justify-center items-center w-16 h-16 rounded-3xl shadow-sm`}
                >
                    <TickCircle size={24} color={order.status === 'DELIVERED' ? '#f97316' : '#16a34a'} variant="Bold" />
                </Pressable>
                <Pressable
                    onPress={() => handleDelete(order.id, order.styleName)}
                    className="bg-red-50 justify-center items-center w-16 h-16 rounded-3xl shadow-sm"
                >
                    <Trash size={24} color="red" variant="Bold" />
                </Pressable>
            </View>
        );
    };

    const getVariantForOrder = (id: string): SurfaceVariant => {
        const variants: SurfaceVariant[] = ['peach', 'green', 'lavender', 'blue'];
        const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return variants[index % variants.length];
    };

    const filteredOrders = activeTab === 'All'
        ? orders
        : orders.filter(o => o.status === activeTab.toUpperCase());

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

    const currentSortLabel = SORT_OPTIONS.find(o => o.key === sortBy)?.label || 'Sort';

    return (
        <View className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-background-default'}`}>
            <View className="flex-1">
                <View className="p-6 pb-0">
                    <View className="flex-row justify-between items-center mb-6">
                        <View className="flex-row items-center">
                            <Typography variant="h2" weight="bold">Orders</Typography>
                            {!isPro && (
                                <View className={`ml-3 px-2 py-0.5 rounded-lg ${isDark ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}>
                                    <Typography variant="small" weight="bold" className={isDark ? 'text-indigo-400' : 'text-indigo-600'}>
                                        {orderLimit.current}/{orderLimit.limit}
                                    </Typography>
                                </View>
                            )}
                        </View>
                        <View className="flex-row gap-2">
                            <Pressable
                                className={`h-10 rounded-full items-center justify-center flex-row gap-2 px-3 ${isDark ? 'bg-surface-muted-dark' : 'bg-muted'}`}
                                onPress={() => router.push('/(tabs)/orders/invoices/')}
                            >
                                <DocumentText size={20} color={isDark ? "white" : "black"} />
                                <Typography variant="body" weight="bold">Invoices</Typography>
                            </Pressable>
                            <IconButton
                                icon={<FilterSearch size={20} color={isDark ? "white" : "black"} />}
                                variant="glass"
                                onPress={() => setShowSortModal(true)}
                            />
                            <IconButton
                                icon={<Add size={24} color={isDark ? "white" : "black"} />}
                                variant="glass"
                                onPress={() => router.push('/(tabs)/orders/new')}
                            />
                        </View>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="mb-6"
                        contentContainerClassName="pr-6"
                    >
                        {TABS.map((tab) => {
                            const isActive = activeTab === tab;
                            const count = tab === 'All'
                                ? orders.length
                                : orders.filter(o => o.status === tab.toUpperCase()).length;

                            return (
                                <Pressable
                                    key={tab}
                                    onPress={() => setActiveTab(tab)}
                                    className={`flex-row items-center px-5 py-2.5 rounded-full mr-3 border ${isActive
                                        ? 'bg-dark border-dark'
                                        : isDark ? 'bg-surface-dark border-border-dark' : 'bg-white border-gray-100'
                                        }`}
                                >
                                    <Typography
                                        variant="small"
                                        weight={isActive ? 'bold' : 'medium'}
                                        color={isActive ? 'white' : 'gray'}
                                    >
                                        {tab}
                                    </Typography>
                                    <View className={`ml-2 px-1.5 py-0.5 rounded-md ${isActive ? 'bg-white/20' : (isDark ? 'bg-surface-muted-dark' : 'bg-muted')}`}>
                                        <Typography
                                            variant="small"
                                            weight="bold"
                                            color={isActive ? 'white' : 'black'}
                                            className="text-[10px]"
                                        >
                                            {count}
                                        </Typography>
                                    </View>
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator color={isDark ? "white" : "black"} />
                    </View>
                ) : (
                    <FlatList
                        data={sortedOrders}
                        keyExtractor={(item) => item.id}
                        contentContainerClassName="px-6 pb-32"
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                        renderItem={({ item: order }) => (
                            <Swipeable
                                renderRightActions={() => renderRightActions(order)}
                                friction={2}
                                rightThreshold={40}
                            >
                                <Pressable onPress={() => router.push({ pathname: '/(tabs)/orders/[id]', params: { id: order.id } })}>
                                    <View
                                        className={`py-4 mb-3 flex-row items-center`}
                                    >
                                        <View className="relative mr-5 w-[54px] h-[54px] items-center justify-center">
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
                                                className={`w-11 h-11 items-center justify-center overflow-hidden ${(order.fabricImage || order.styleImage) && isDark ? 'bg-dark-800' : ''}`}
                                                rounded="xl"
                                            >
                                                {(order.fabricImage || order.styleImage) ? (
                                                    <Image
                                                        source={{ uri: (order.fabricImage || order.styleImage) as string }}
                                                        className="w-full h-full"
                                                    />
                                                ) : (
                                                    <Box size={18} color={isDark ? "white" : "black"} variant="Bulk" />
                                                )}
                                            </Surface>
                                        </View>

                                        <View className="flex-1">
                                            <View className="flex-row justify-between items-start mb-1">
                                                <View>
                                                    <Typography variant="body" weight="bold">{order.styleName}</Typography>
                                                    <Typography variant="small" color="gray" className="mt-0.5">{(order as any).customerFullName}</Typography>
                                                </View>
                                                <View className="items-end">
                                                    <Typography variant="small" weight="bold" className="text-gray-400">#{order.id.slice(-4).toUpperCase()}</Typography>
                                                    {(order.amount || 0) > 0 && (order.balance || 0) > 0 && (
                                                        <View className={`${isDark ? 'bg-red-900/20' : 'bg-red-50'} px-1.5 py-0.5 rounded mt-0.5`}>
                                                            <Typography variant="small" color="red" weight="bold" className="text-[9px]">
                                                                OWING: {formatCurrency(order.balance || 0)}
                                                            </Typography>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>

                                            <View className="flex-row justify-between items-center">
                                                <View className="flex-row items-center">
                                                    <Typography variant="caption" color="gray">
                                                        {order.deliveryDate ? `Due ${new Date(order.deliveryDate).toLocaleDateString()}` : 'No due date'}
                                                    </Typography>
                                                </View>
                                                <View
                                                    className={`px-3 py-1 rounded-full ${order.status === 'DELIVERED'
                                                        ? (isDark ? 'bg-green-900/20' : 'bg-soft-green')
                                                        : (isDark ? 'bg-orange-900/20' : 'bg-soft-peach')}`}
                                                >
                                                    <Typography variant="small" weight="bold" className={order.status === 'DELIVERED' ? 'text-green-600' : (isDark ? 'text-orange-400' : 'text-orange-700')}>
                                                        {order.status}
                                                    </Typography>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                </Pressable>
                            </Swipeable>
                        )
                        }
                        ListEmptyComponent={
                            <View className="items-center justify-center py-20 px-10">
                                <Surface
                                    variant="muted"
                                    className="w-24 h-24 items-center justify-center mb-6"
                                    rounded="full"
                                >
                                    <Box size={40} color="#9CA3AF" variant="Bulk" />
                                </Surface>
                                <Typography variant="h3" weight="bold" className="text-center mb-2">
                                    No {activeTab === 'All' ? '' : activeTab.toLowerCase()} orders found
                                </Typography>
                                <Typography
                                    variant="body"
                                    color="gray"
                                    className="text-center leading-relaxed"
                                >
                                    {activeTab === 'All'
                                        ? "You haven't added any orders yet. Start by adding a new order to your list."
                                        : `It looks like there are no orders currently marked as ${activeTab.toLowerCase()}.`
                                    }
                                </Typography>
                            </View>
                        }
                    />
                )}
            </View>

            {/* Sort Modal */}
            <Modal
                visible={showSortModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowSortModal(false)}
            >
                <Pressable
                    className="flex-1 bg-black/50 justify-end"
                    onPress={() => setShowSortModal(false)}
                >
                    <Pressable onPress={() => { }} className={`${isDark ? 'bg-surface-dark' : 'bg-white'} rounded-t-3xl p-6`}>
                        <View className="flex-row justify-between items-center mb-6">
                            <Typography variant="h3" weight="bold">Sort Orders By</Typography>
                            <IconButton
                                icon={<CloseCircle size={24} color="#9CA3AF" variant="Bold" />}
                                variant="ghost"
                                onPress={() => setShowSortModal(false)}
                            />
                        </View>
                        <View className="gap-2">
                            {SORT_OPTIONS.map((option) => (
                                <Pressable
                                    key={option.key}
                                    onPress={() => {
                                        setSortBy(option.key);
                                        setShowSortModal(false);
                                    }}
                                    className={`flex-row items-center justify-between p-4 rounded-2xl ${sortBy === option.key ? (isDark ? 'bg-dark-700' : 'bg-lavender') : (isDark ? 'bg-dark-800' : 'bg-gray-50')}`}
                                >
                                    <Typography
                                        weight={sortBy === option.key ? 'bold' : 'medium'}
                                        color={sortBy === option.key ? 'primary' : 'black'}
                                    >
                                        {option.label}
                                    </Typography>
                                    {sortBy === option.key && (
                                        <TickCircle size={20} color="#4F46E5" variant="Bold" />
                                    )}
                                </Pressable>
                            ))}
                        </View>
                        <View className="h-8" />
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}
