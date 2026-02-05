import React, { useState } from 'react';
import { View, ScrollView, Pressable, RefreshControl, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../../components/ui/Typography';
import { Surface } from '../../../components/ui/Surface';
import { IconButton } from '../../../components/ui/IconButton';
import { Box, FilterSearch, Add, Trash, TickCircle } from 'iconsax-react-native';
import { useRouter } from 'expo-router';
import { useOrders } from '../../../hooks/useOrders';
import { useSync } from '../../../hooks/useSync';
import Toast from 'react-native-toast-message';

const TABS = ['All', 'Pending', 'Delivered'] as const;
type TabType = typeof TABS[number];

type SurfaceVariant = 'white' | 'lavender' | 'peach' | 'blue' | 'green' | 'muted' | 'dark';

import { Swipeable } from 'react-native-gesture-handler';
import { Alert } from 'react-native';

export default function Orders() {
    const [activeTab, setActiveTab] = useState<TabType>('All');
    const [refreshing, setRefreshing] = useState(false);
    const { orders, loading, refresh, deleteOrder, updateOrderStatus } = useOrders();
    const router = useRouter();
    const { sync: performSync } = useSync();

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    }, [refresh]);

    const handleDelete = (id: string, name: string) => {
        Alert.alert(
            "Delete Order",
            `Are you sure you want to delete the order "${name}"? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => deleteOrder(id)
                }
            ]
        );
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
        // Deterministic variation based on ID
        const variants: SurfaceVariant[] = ['peach', 'green', 'lavender', 'blue'];
        const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return variants[index % variants.length];
    };

    const filteredOrders = activeTab === 'All'
        ? orders
        : orders.filter(o => o.status === activeTab.toUpperCase());

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <View className="flex-1">
                <View className="p-6 pb-0">
                    <View className="flex-row justify-between items-center mb-6">
                        <Typography variant="h2" weight="bold">Orders</Typography>
                        <View className="flex-row gap-2">
                            <Pressable className="w-10 h-10 bg-muted rounded-full items-center justify-center">
                                <FilterSearch size={20} color="black" />
                            </Pressable>
                            <IconButton
                                icon={<Add size={24} color="white" />}
                                variant="dark"
                                onPress={() => router.push('/(tabs)/orders/new')}
                            />
                        </View>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="mb-8"
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
                                        : 'bg-white border-gray-100'
                                        }`}
                                >
                                    <Typography
                                        variant="small"
                                        weight={isActive ? 'bold' : 'medium'}
                                        color={isActive ? 'white' : 'gray'}
                                    >
                                        {tab}
                                    </Typography>
                                    <View className={`ml-2 px-1.5 py-0.5 rounded-md ${isActive ? 'bg-white/20' : 'bg-muted'}`}>
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
                        <ActivityIndicator color="black" />
                    </View>
                ) : (
                    <FlatList
                        data={filteredOrders}
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
                                    <Surface
                                        variant="white"
                                        className="p-4 mb-3 border border-gray-100 flex-row items-center"
                                        rounded="2xl"
                                    >
                                        <Surface
                                            variant={getVariantForOrder(order.id)}
                                            className="w-14 h-14 items-center justify-center mr-4"
                                            rounded="2xl"
                                        >
                                            <Box size={24} color="black" variant="Bulk" />
                                        </Surface>

                                        <View className="flex-1">
                                            <View className="flex-row justify-between items-start mb-1">
                                                <Typography variant="body" weight="bold">{order.styleName}</Typography>
                                                <Typography variant="small" weight="bold" className="text-gray-400">#{order.id.slice(-4).toUpperCase()}</Typography>
                                            </View>

                                            <View className="flex-row justify-between items-center">
                                                <Typography variant="caption" color="gray">Order Detail</Typography>
                                                <Surface
                                                    variant={order.status === 'DELIVERED' ? 'green' : 'peach'}
                                                    className="px-3 py-1"
                                                    rounded="full"
                                                >
                                                    <Typography variant="small" weight="bold" className={order.status === 'DELIVERED' ? 'text-green-700' : 'text-orange-700'}>
                                                        {order.status}
                                                    </Typography>
                                                </Surface>
                                            </View>
                                        </View>
                                    </Surface>
                                </Pressable>
                            </Swipeable>
                        )}
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
        </SafeAreaView>
    );
}
