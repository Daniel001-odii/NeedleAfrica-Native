import React, { useCallback, useMemo } from 'react';
import { View, ScrollView, Pressable, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Notification, Calendar, Box, ArrowRight, Wallet, People, Timer1, Add, Gallery, User, MagicStar, DocumentText, Ruler } from 'iconsax-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Surface } from '../../components/ui/Surface';
import { Typography } from '../../components/ui/Typography';
import { IconButton } from '../../components/ui/IconButton';
import { useSync } from '../../hooks/useSync';
import { useOrders } from '../../hooks/useOrders';
import { useCustomers } from '../../hooks/useCustomers';

export default function Home() {
    const { user } = useAuth();
    const router = useRouter();
    const { isSyncing, sync: performSync } = useSync();
    const { orders, loading: ordersLoading } = useOrders();
    const { customers, loading: customersLoading } = useCustomers();

    const onRefresh = useCallback(async () => {
        await performSync();
    }, [performSync]);

    // Stat Calculations
    const stats = useMemo(() => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));

        const pendingOrders = orders.filter(o => o.status === 'PENDING');
        const ordersToday = orders.filter(o => o.createdAt && new Date(o.createdAt) >= startOfDay);

        // Orders due this week (within 7 days)
        const dueThisWeek = pendingOrders.filter(o => {
            if (!o.deliveryDate) return false;
            const dueDate = new Date(o.deliveryDate);
            const diff = dueDate.getTime() - now.getTime();
            return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
        });

        // Revenue this week (delivered/completed value)
        const revenueThisWeek = orders
            .filter(o => {
                if (!o.updatedAt) return false;
                const updateDate = new Date(o.updatedAt);
                return o.status === 'DELIVERED' && updateDate >= startOfWeek;
            })
            .reduce((sum, o) => sum + (o.amount || 0), 0);

        // Total Debt (all pending orders balance)
        const totalDebt = pendingOrders.reduce((sum, o) => sum + (o.balance || 0), 0);

        // Next Deadline
        const nextOrderWithDeadline = [...pendingOrders]
            .filter(o => o.deliveryDate)
            .sort((a, b) => new Date(a.deliveryDate!).getTime() - new Date(b.deliveryDate!).getTime())[0];

        return {
            pendingCount: pendingOrders.length,
            newToday: ordersToday.length,
            dueSoon: dueThisWeek.length,
            totalCustomers: customers.length,
            revenue: revenueThisWeek,
            totalDebt,
            nextDeadline: nextOrderWithDeadline
        };
    }, [orders, customers]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const today = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    const isNewUser = !ordersLoading && !customersLoading && orders.length === 0 && customers.length === 0;

    return (
        <View className="flex-1 bg-white">
            <ScrollView
                contentContainerClassName="p-6 pb-12"
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isSyncing} onRefresh={onRefresh} />}
            >
                {/* Header */}
                <View className="flex-row justify-between items-center mb-6">
                    <View>
                        <Typography variant="h3" weight="bold" color="black">Hello, {user?.username || 'Tailor'}</Typography>
                        <Typography variant="caption" weight="bold" color="gray">Today {today}</Typography>
                    </View>
                </View>

                {isNewUser ? (
                    <EmptyStateHome router={router} />
                ) : (
                    <>
                        {/* Daily Activity Card */}
                        <Surface variant="lavender" className="p-6 mb-8 relative overflow-hidden" rounded="3xl">
                            <View className="z-10 w-2/3">
                                <Typography variant="h2" weight="bold" className="mb-1 leading-tight">Your Workshop Dashboard</Typography>
                                <Typography variant="caption" color="gray" className="mb-4">Live updates for your business</Typography>

                                <View className="flex-row items-center">
                                    <View className="flex-row items-center border border-brand-primary/20 bg-white/50 px-3 py-1.5 rounded-full">
                                        <Box size={14} color="#7c3aed" variant="Bold" className="mr-2" />
                                        <Typography variant="small" weight="bold" className="text-brand-primary">
                                            {stats.pendingCount} Ongoing Projects
                                        </Typography>
                                    </View>
                                </View>
                            </View>
                            <View className="absolute -right-4 -bottom-4 opacity-20">
                                <Box size={140} color="#7c3aed" variant="Bulk" />
                            </View>
                        </Surface>

                        {/* Quick Access */}
                        <View className="mb-8">
                            <Typography variant="h3" weight="bold" className="mb-4">Quick Actions</Typography>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-4 pr-6">
                                <QuickAccessItem
                                    icon={<Add size={24} color="white" />}
                                    label="Order"
                                    bg="bg-black"
                                    onPress={() => router.push('/(tabs)/orders/new')}
                                />
                                <QuickAccessItem
                                    icon={<Ruler size={24} color="black" />}
                                    label="Measurement"
                                    bg="bg-accent-lavender"
                                    onPress={() => router.push('/measurements/create')}
                                />
                                <QuickAccessItem
                                    icon={<People size={24} color="black" />}
                                    label="Client"
                                    bg="bg-accent-peach"
                                    onPress={() => router.push('/(tabs)/customers/new')}
                                />
                                <QuickAccessItem
                                    icon={<DocumentText size={24} color="black" />}
                                    label="Invoice"
                                    bg="bg-accent-blue"
                                    onPress={() => router.push('/(tabs)/orders/invoices/new')}
                                />
                            </ScrollView>
                        </View>

                        {/* Insights Grid */}
                        <Typography variant="h3" weight="bold" className="mb-4">Workshop Insights</Typography>
                        <View className="flex-row gap-4 mb-8">
                            {/* Left Column */}
                            <View className="flex-1 gap-4">
                                <Surface variant="peach" className="p-4 h-40 justify-between" rounded="3xl">
                                    <View className="flex-row justify-between items-start">
                                        <View className="w-9 h-9 bg-white/50 rounded-full items-center justify-center">
                                            <Box size={18} color="#EA580C" variant="Bulk" />
                                        </View>
                                        <Surface variant="white" className="px-2 py-0.5" rounded="full">
                                            <Typography variant="small" weight="bold" className="text-[9px] text-orange-700">+{stats.newToday} today</Typography>
                                        </Surface>
                                    </View>
                                    <View>
                                        <View className="flex-row items-end">
                                            <Typography variant="h1" weight="bold" className="leading-none">{stats.pendingCount}</Typography>
                                            <Typography variant="caption" color="gray" weight="bold" className="mb-1 ml-2">Active</Typography>
                                        </View>
                                        <View className="mt-1.5 flex-row items-center">
                                            <View className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-2" />
                                            <Typography variant="small" color="gray" className="text-[10px]">{stats.dueSoon} due this week</Typography>
                                        </View>
                                    </View>
                                </Surface>

                                <Surface variant="muted" className="p-4 h-28 justify-between" rounded="3xl">
                                    <View className="flex-row items-center justify-between">
                                        <View className="w-8 h-8 bg-white items-center justify-center rounded-xl shadow-sm">
                                            <Wallet size={16} color="#dc2626" variant="Bulk" />
                                        </View>
                                        <Typography variant="small" weight="bold" color="red" className="text-[10px] uppercase">Owed</Typography>
                                    </View>
                                    <View>
                                        <Typography variant="body" weight="bold" color="red" className="text-base">{formatCurrency(stats.totalDebt)}</Typography>
                                        <Typography variant="small" color="gray" weight="bold" className="text-[10px]">Total Debt</Typography>
                                    </View>
                                </Surface>

                                <Surface variant="muted" className="p-4 h-28 justify-between" rounded="3xl">
                                    <Pressable onPress={() => router.push('/(tabs)/customers/')} className="flex-1 justify-between">
                                        <View className="flex-row items-center justify-between">
                                            <View className="w-8 h-8 bg-white items-center justify-center rounded-xl shadow-sm">
                                                <People size={16} color="black" variant="Bulk" />
                                            </View>
                                            <Typography variant="small" weight="bold" color="gray" className="text-[10px] uppercase">Clients</Typography>
                                        </View>
                                        <View>
                                            <Typography variant="h3" weight="bold">{stats.totalCustomers}</Typography>
                                            <Typography variant="small" color="gray" weight="bold" className="text-[10px]">Active Base</Typography>
                                        </View>
                                    </Pressable>
                                </Surface>
                            </View>

                            {/* Right Column */}
                            <View className="flex-1 gap-4">
                                <Surface variant="blue" className="p-4 h-48 justify-between" rounded="3xl">
                                    <View className="flex-row items-center justify-between">
                                        <View className="w-9 h-9 bg-white/50 rounded-full items-center justify-center">
                                            <Wallet size={18} color="#3B82F6" variant="Bulk" />
                                        </View>
                                        <Typography variant="small" weight="bold" className="text-blue-700 text-[10px] uppercase">Earnings</Typography>
                                    </View>
                                    <View>
                                        <Typography variant="h2" weight="bold" className="text-2xl">{formatCurrency(stats.revenue)}</Typography>
                                        <Typography variant="small" color="gray" weight="bold" className="text-[10px]">This Week</Typography>
                                    </View>
                                </Surface>

                                <Surface variant="green" className="p-4 flex-1 justify-between" rounded="3xl">
                                    <View className="flex-row justify-between items-start">
                                        <View className="w-9 h-9 bg-white/50 rounded-full items-center justify-center">
                                            <Timer1 size={18} color="#15803d" variant="Bulk" />
                                        </View>
                                        {stats.nextDeadline && (
                                            <View className="bg-green-100 px-2 py-0.5 rounded-full">
                                                <Typography variant="small" weight="bold" className="text-[9px] text-green-800">NEXT</Typography>
                                            </View>
                                        )}
                                    </View>
                                    <View>
                                        {stats.nextDeadline ? (
                                            <>
                                                <Typography variant="small" weight="bold" className="leading-tight mb-1" numberOfLines={2}>
                                                    {stats.nextDeadline.styleName}
                                                </Typography>
                                                <Typography variant="small" color="gray" className="text-[10px]">
                                                    Due {new Date(stats.nextDeadline.deliveryDate!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </Typography>
                                            </>
                                        ) : (
                                            <Typography variant="small" color="gray" className="text-[10px]">No upcoming deadlines</Typography>
                                        )}
                                    </View>
                                </Surface>
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

function EmptyStateHome({ router }: { router: any }) {
    return (
        <View className="py-10">
            <Surface variant="muted" className="p-8 items-center mb-10" rounded="3xl">
                <View className="w-20 h-20 bg-white items-center justify-center mb-6 shadow-sm rounded-full">
                    <MagicStar size={40} color="#7c3aed" variant="Bulk" />
                </View>
                <Typography variant="h2" weight="bold" className="text-center mb-2">Welcome to Needle Africa</Typography>
                <Typography variant="body" color="gray" className="text-center px-4 leading-relaxed">
                    Your digital tailoring workspace is ready. Let's start by adding your first client or creating an order.
                </Typography>
            </Surface>

            <View className="gap-4">
                <Pressable onPress={() => router.push('/(tabs)/customers/new')}>
                    <Surface variant="white" className="p-5 flex-row items-center border border-gray-100" rounded="2xl">
                        <View className="w-12 h-12 bg-accent-peach items-center justify-center rounded-xl mr-4">
                            <People size={24} color="black" variant="Bulk" />
                        </View>
                        <View className="flex-1">
                            <Typography weight="bold">Add Your First Client</Typography>
                            <Typography variant="caption" color="gray">Build your customer database</Typography>
                        </View>
                        <ArrowRight size={20} color="#9CA3AF" />
                    </Surface>
                </Pressable>

                <Pressable onPress={() => router.push('/(tabs)/orders/new')}>
                    <Surface variant="white" className="p-5 flex-row items-center border border-gray-100" rounded="2xl">
                        <View className="w-12 h-12 bg-accent-lavender items-center justify-center rounded-xl mr-4">
                            <Box size={24} color="black" variant="Bulk" />
                        </View>
                        <View className="flex-1">
                            <Typography weight="bold">Create New Order</Typography>
                            <Typography variant="caption" color="gray">Start tracking your works</Typography>
                        </View>
                        <ArrowRight size={20} color="#9CA3AF" />
                    </Surface>
                </Pressable>
            </View>
        </View>
    );
}

function QuickAccessItem({ icon, label, bg, onPress }: any) {
    return (
        <Pressable className="items-center" onPress={onPress}>
            <View className={`w-14 h-14 ${bg} rounded-3xl items-center justify-center mb-2 border-2 border-gray-500/20`}>
                {icon}
            </View>
            <Typography variant="caption" weight="bold" className="text-dark">{label}</Typography>
        </Pressable>
    );
}
