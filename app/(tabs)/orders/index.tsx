import React, { useState } from 'react';
import { View, ScrollView, Animated, Pressable, RefreshControl, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../../components/ui/Typography';
import { Surface } from '../../../components/ui/Surface';
import { IconButton } from '../../../components/ui/IconButton';
import { Box, FilterSearch, Sort, Add } from 'iconsax-react-native';
import { useRouter } from 'expo-router';

const TABS = ['All', 'Pending', 'Delivered'] as const;
type TabType = typeof TABS[number];

type SurfaceVariant = 'white' | 'lavender' | 'peach' | 'blue' | 'green' | 'muted' | 'dark';

interface Order {
    id: string;
    title: string;
    status: string;
    client: string;
    variant: SurfaceVariant;
}

export default function Orders() {
    const [activeTab, setActiveTab] = useState<TabType>('All');
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const router = useRouter();

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        // Simulate a network request
        setTimeout(() => {
            setRefreshing(false);
        }, 1500);
    }, []);

    const onLoadMore = React.useCallback(() => {
        if (loadingMore) return;
        setLoadingMore(true);
        // Simulate loading more data
        setTimeout(() => {
            setLoadingMore(false);
        }, 1500);
    }, [loadingMore]);

    // Mock data
    const orders: Order[] = [
        { id: '1', title: 'Senator Suit', status: 'Pending', client: 'John Doe', variant: 'peach' },
        { id: '2', title: 'Agbada (Silk)', status: 'Delivered', client: 'Sarah K.', variant: 'green' },
        { id: '3', title: 'Wedding Gown', status: 'Pending', client: 'Adeola B.', variant: 'lavender' },
        { id: '4', title: 'Fitting Session', status: 'Pending', client: 'Mike O.', variant: 'blue' },
        { id: '5', title: 'Office Suit', status: 'Delivered', client: 'Zainab A.', variant: 'green' },
        { id: '6', title: 'Office Suit2', status: 'Delivered', client: 'Zainab A.', variant: 'green' },
        { id: '7', title: 'Office Suit3', status: 'Delivered', client: 'Zainab A.', variant: 'green' },
        { id: '8', title: 'Office Suit4', status: 'Delivered', client: 'Zainab A.', variant: 'green' },
    ];

    const filteredOrders = activeTab === 'All'
        ? orders
        : orders.filter(o => o.status === activeTab);

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <View className="flex-1">
                <View className="p-6 pb-0">
                    {/* Header */}
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

                    {/* Filter Chips */}
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
                                : orders.filter(o => o.status === tab).length;

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

                <FlatList
                    data={filteredOrders}
                    keyExtractor={(item) => item.id}
                    contentContainerClassName="px-6 pb-32"
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    onEndReached={onLoadMore}
                    onEndReachedThreshold={0.1}
                    ListFooterComponent={
                        loadingMore ? (
                            <View className="py-6 items-center">
                                <ActivityIndicator color="black" />
                                <Typography variant="caption" color="gray" className="mt-2">Loading more orders...</Typography>
                            </View>
                        ) : null
                    }
                    renderItem={({ item: order }) => (
                        <Pressable onPress={() => router.push({ pathname: '/(tabs)/orders/[id]', params: { id: order.id } })}>
                            <Surface
                                variant="white"
                                className="p-4 mb-3 border border-gray-100 flex-row items-center"
                                rounded="2xl"
                            >
                                <Surface
                                    variant={order.variant}
                                    className="w-14 h-14 items-center justify-center mr-4"
                                    rounded="2xl"
                                >
                                    <Box size={24} color="black" variant="Bulk" />
                                </Surface>

                                <View className="flex-1">
                                    <View className="flex-row justify-between items-start mb-1">
                                        <Typography variant="body" weight="bold">{order.title}</Typography>
                                        <Typography variant="small" weight="bold" className="text-gray-400">#00{order.id}</Typography>
                                    </View>

                                    <View className="flex-row justify-between items-center">
                                        <Typography variant="caption" color="gray">{order.client}</Typography>
                                        <Surface
                                            variant={order.status === 'Delivered' ? 'green' : 'peach'}
                                            className="px-3 py-1"
                                            rounded="full"
                                        >
                                            <Typography variant="small" weight="bold" className={order.status === 'Delivered' ? 'text-green-700' : 'text-orange-700'}>
                                                {order.status}
                                            </Typography>
                                        </Surface>
                                    </View>
                                </View>
                            </Surface>
                        </Pressable>
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
                                    ? "You haven't placed any orders yet. Start by adding a new order to your list."
                                    : `It looks like there are no orders currently marked as ${activeTab.toLowerCase()}.`
                                }
                            </Typography>

                            {activeTab !== 'All' && (
                                <Pressable
                                    onPress={() => setActiveTab('All')}
                                    className="mt-8 bg-muted px-6 py-3 rounded-2xl"
                                >
                                    <Typography variant="small" weight="bold">View all orders</Typography>
                                </Pressable>
                            )}
                        </View>
                    }
                />
            </View>
        </SafeAreaView>
    );
}
