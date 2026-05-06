import React, { useCallback, useMemo, useState } from 'react';
import { View, ScrollView, Pressable, Image, RefreshControl, TouchableOpacity } from 'react-native';
import { Notification, Calendar, Box, ArrowRight, Wallet, People, Timer1, Add, Gallery, User, MagicStar, DocumentText, Ruler, Eye, EyeSlash, MoneyRecive, MoneySend, TickCircle, Task } from 'iconsax-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';
import { Surface } from '../../components/ui/Surface';
import { Typography } from '../../components/ui/Typography';
import { IconButton } from '../../components/ui/IconButton';
import { useSync } from '../../hooks/useSync';
import { useOrders } from '../../hooks/useOrders';
import { useCustomers } from '../../hooks/useCustomers';
import { useTheme } from '../../contexts/ThemeContext';
import { database } from '../../database/watermelon';
import Svg, { Path } from 'react-native-svg';
import { OnboardingChecklist } from '../../components/OnboardingChecklist';
import RevenueHeroCard from '../../components/RevenueHeroCard';



export default function Home() {
    const { user } = useAuth();
    const { isSyncing, sync: performSync } = useSync();
    const { orders, loading: ordersLoading } = useOrders();
    const { customers, loading: customersLoading } = useCustomers();
    const { isDark } = useTheme();
    const [balanceVisible, setBalanceVisible] = useState(true);
    const [catalogBannerVisible, setCatalogBannerVisible] = useState(true);

    const onRefresh = useCallback(async () => {
        await performSync();
    }, [performSync]);

    // Stat Calculations
    const stats = useMemo(() => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Calculate week range without mutating 'now'
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        // Filter out deleted orders (though query should handle this, double check here)
        const activeOrders = orders.filter(o => !o.deletedAt);

        const pendingOrders = activeOrders.filter(o => o.status === 'PENDING');
        const ordersToday = activeOrders.filter(o => o.createdAt && new Date(o.createdAt) >= startOfDay);

        // Orders due this week
        const dueThisWeek = pendingOrders.filter(o => {
            if (!o.deliveryDate) return false;
            const dueDate = new Date(o.deliveryDate);
            return dueDate >= startOfWeek && dueDate <= endOfWeek;
        });

        // Revenue this week (Total value of orders DELIVERED this week)
        const revenueThisWeek = activeOrders
            .filter(o => {
                if (!o.updatedAt) return false;
                const updateDate = new Date(o.updatedAt);
                return o.status === 'DELIVERED' && updateDate >= startOfWeek && updateDate <= endOfWeek;
            })
            .reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

        // Total Revenue (Sum of all 'amountPaid' across ALL user's orders)
        const totalEarned = activeOrders.reduce((sum, o) => {
            const paid = Number(o.amountPaid) || 0;
            return sum + paid;
        }, 0);

        // Total Outstanding (Sum of all balances across ALL user's orders)
        const totalDebt = activeOrders.reduce((sum, o) => {
            const bal = Number(o.balance) || 0;
            return sum + bal;
        }, 0);

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
            totalEarned,
            totalDebt,
            nextDeadline: nextOrderWithDeadline
        };
    }, [orders, customers]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: user?.currency || 'NGN',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const today = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    const hasNoClients = !customersLoading && customers.length === 0;
    const hasNoOrders = !ordersLoading && orders.length === 0;
    const showTodo = hasNoClients || hasNoOrders;

    return (
        <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-[#F2F2F7]'}`}>
            <ScrollView
                contentContainerClassName="p-5 pb-12"
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isSyncing} onRefresh={onRefresh} tintColor={isDark ? '#FFFFFF' : '#3B82F6'} />}
            >
                {/* Header */}
                <View className="flex-row justify-between items-center mb-6">
                    <View>
                        <Typography variant="h3" weight="bold" className={isDark ? 'text-white' : 'text-black'}>Hello, {user?.username?.split(' ')[0] || 'Tailor'}</Typography>
                        <Typography variant="caption" weight="bold" color="gray">{today}</Typography>
                    </View>

                    <IconButton
                        icon={<Notification size={20} color={isDark ? 'white' : 'black'} variant="Linear" />}
                        onPress={() => router.push('/notifications')}
                        variant="glass"
                    />
                </View>

                {/* 1. Wallet Hero Card (The "Balance") */}
                <RevenueHeroCard
                    isDark={isDark}
                    stats={stats}
                    balanceVisible={balanceVisible}
                    setBalanceVisible={setBalanceVisible}
                    formatCurrency={formatCurrency}
                />

                {/* App Feature Banner: Free Fashion Website */}
                {catalogBannerVisible && (
                    <View className="mb-6">
                        <Pressable
                            onPress={() => router.push('/(tabs)/profile/catalog')}
                            style={{
                                backgroundColor: isDark ? '#1C1C1E' : '#4F46E5', // Indigo for light mode, dark surface for dark mode
                                borderRadius: 32,
                                padding: 15,
                                borderWidth: isDark ? 1 : 0,
                                borderColor: '#374151',
                                shadowColor: '#4F46E5',
                                shadowOffset: { width: 0, height: 10 },
                                shadowOpacity: isDark ? 0.3 : 0.4,
                                shadowRadius: 20,
                                elevation: 10,
                                overflow: 'hidden'
                            }}
                        >
                            <View className="flex-row items-center relative z-10">
                                <View className={`w-14 h-14 rounded-[20px] ${isDark ? 'bg-indigo-500/20' : 'bg-white/20'} items-center justify-center mr-4`}>
                                    <MagicStar size={26} color="#FFFFFF" variant="Bulk" />
                                </View>
                                <View className="flex-1 pr-4">
                                    <View className="flex-row items-center mb-1">
                                        <Typography variant="body" weight="bold" color="white" className="text-[17px] mr-2">Free Business Website!</Typography>
                                        <View className="bg-[#FFD700] px-2 py-0.5 rounded-full">
                                            <Typography variant="small" weight="black" color="black" className="text-[9px] uppercase tracking-tighter">NEW</Typography>
                                        </View>
                                    </View>
                                    <Typography variant="small" color="white" className="opacity-80 text-[13px] leading-[19px] font-medium">
                                        Get your professional storefront in seconds. Share your link and start taking orders now.
                                    </Typography>
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={() => setCatalogBannerVisible(false)}
                                hitSlop={{ top: 20, right: 20, bottom: 20, left: 20 }}
                                className="absolute top-4 right-4 bg-white/10 w-7 h-7 rounded-full items-center justify-center z-20"
                            >
                                <Typography color="white" className="text-[12px] opacity-80" weight="bold">✕</Typography>
                            </TouchableOpacity>

                            {/* Sleek Background Glow Effect */}
                            <View className="absolute -bottom-16 -right-16 w-48 h-48 bg-white/10 rounded-full" />
                            <View className="absolute -top-16 -left-16 w-48 h-48 bg-white/5 rounded-full" />
                        </Pressable>
                    </View>
                )}


                {/* 2. Quick Actions Strip */}
                <View className="mb-6">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-4">
                        <QuickActionPill icon={<Add size={22} color="white" />} label="New Order" bg="bg-black dark:bg-zinc-800" onPress={() => router.push('/(tabs)/orders/new')} />
                        <QuickActionPill icon={<Ruler size={22} color="#6366f1" variant="Bulk" />} label="Measure" bg="bg-indigo-50 dark:bg-indigo-900/20" onPress={() => router.push('/measurements/create')} />
                        <QuickActionPill icon={<Task size={22} color="#8b5cf6" variant="Bulk" />} label="New Template" bg="bg-violet-50 dark:bg-violet-900/20" onPress={() => router.push('/measurement-templates/create')} />
                        <QuickActionPill icon={<People size={22} color="#f97316" variant="Bulk" />} label="Add Client" bg="bg-orange-50 dark:bg-orange-900/20" onPress={() => router.push('/(tabs)/customers/new')} />
                        <QuickActionPill icon={<DocumentText size={22} color="#3b82f6" variant="Bulk" />} label="Invoice" bg="bg-blue-50 dark:bg-blue-900/20" onPress={() => router.push('/(tabs)/orders/invoices/new')} />
                        <QuickActionPill icon={<Gallery size={22} color="#ec4899" variant="Bulk" />} label="Catalog" bg="bg-pink-50 dark:bg-pink-900/20" onPress={() => router.push('/(tabs)/profile/catalog')} />
                    </ScrollView>
                </View>

                {!user?.onboardingCompleted && <OnboardingChecklist />}



                {/* Getting Started To-Do (shown when no clients or orders) */}
                {/*   {showTodo && (
                    
                )} */}

                {
                    showTodo ? (
                        <View className={`mb-6 rounded-[24px] overflow-hidden ${isDark ? 'bg-[#1C1C1E] border border-zinc-800' : 'bg-white shadow-sm shadow-gray-200'}`}>
                            <View className={`px-5 py-3 ${isDark ? 'border-b border-zinc-800' : 'border-b border-gray-100'}`}>
                                <Typography weight="bold" className={`text-[13px] ${isDark ? 'text-zinc-300' : 'text-gray-900'}`}>Getting Started</Typography>
                            </View>
                            {hasNoClients && (
                                <TouchableOpacity
                                    onPress={() => router.push('/(tabs)/customers/new')}
                                    className={`flex-row items-center px-5 py-4 ${hasNoOrders ? (isDark ? 'border-b border-zinc-800' : 'border-b border-gray-50') : ''}`}
                                    activeOpacity={0.6}
                                >
                                    <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${isDark ? 'bg-orange-500/15' : 'bg-orange-50'}`}>
                                        <People size={16} color="#f97316" variant="Bulk" />
                                    </View>
                                    <View className="flex-1">
                                        <Typography weight="bold" className="text-[14px]">Add your first client</Typography>
                                        <Typography variant="small" color="gray" className="text-[12px]">Save their details & measurements</Typography>
                                    </View>
                                    <ArrowRight size={14} color="#9CA3AF" />
                                </TouchableOpacity>
                            )}
                            {hasNoOrders && (
                                <TouchableOpacity
                                    onPress={() => router.push('/(tabs)/orders/new')}
                                    className="flex-row items-center px-5 py-4"
                                    activeOpacity={0.6}
                                >
                                    <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${isDark ? 'bg-indigo-500/15' : 'bg-indigo-50'}`}>
                                        <Box size={16} color="#6366f1" variant="Bulk" />
                                    </View>
                                    <View className="flex-1">
                                        <Typography weight="bold" className="text-[14px]">Create your first order</Typography>
                                        <Typography variant="small" color="gray" className="text-[12px]">Start tracking deliveries & payments</Typography>
                                    </View>
                                    <ArrowRight size={14} color="#9CA3AF" />
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        <>
                            {/* 3. Operational Grid (High Density) */}
                            <View className="flex-row gap-3 mb-3">
                                <View className={`flex-1 p-5 rounded-[28px] justify-between h-40 ${isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm shadow-gray-200'}`}>
                                    <View className={`w-9 h-9 rounded-2xl items-center justify-center ${isDark ? 'bg-orange-500/20' : 'bg-orange-50'}`}>
                                        <Box size={18} color="#f97316" variant="Bulk" />
                                    </View>
                                    <View>
                                        <View className="flex-row items-baseline">
                                            <Typography variant="h2" weight="bold" className="text-3xl">{stats.pendingCount}</Typography>
                                            <Typography color="gray" weight="bold" className="ml-1 text-[10px] uppercase">Active</Typography>
                                        </View>
                                        <Typography variant="small" color="gray" weight="medium" className="text-[10px]">+{stats.newToday} since morning</Typography>
                                    </View>
                                </View>

                                <View className={`flex-1 p-5 rounded-[28px] justify-between h-40 ${isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm shadow-gray-200'}`}>
                                    <View className={`w-9 h-9 rounded-2xl items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
                                        <MagicStar size={18} color="#3b82f6" variant="Bulk" />
                                    </View>
                                    <View>
                                        <Typography variant="h3" weight="bold" className="text-lg">{formatCurrency(stats.revenue)}</Typography>
                                        <Typography color="gray" weight="bold" className="text-[10px] uppercase">Income / Week</Typography>
                                    </View>
                                </View>
                            </View>

                            {/* 4. Strategic Cards (Full Width) */}
                            <View className="gap-3">
                                <Pressable
                                    onPress={() => router.push('/(tabs)/orders/')}
                                    className={`flex-row items-center p-5 rounded-[28px] ${isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm shadow-gray-200'}`}
                                >
                                    <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${isDark ? 'bg-indigo-900/40' : 'bg-indigo-50'}`}>
                                        <Timer1 size={22} color="#6366f1" variant="Bulk" />
                                    </View>
                                    <View className="flex-1">
                                        <Typography variant="small" color="gray" weight="bold" className="text-[10px] uppercase mb-0.5">Next Deadline</Typography>
                                        <Typography variant="body" weight="bold" numberOfLines={1}>
                                            {stats.nextDeadline ? stats.nextDeadline.styleName : 'No pending tasks'}
                                        </Typography>
                                        <Typography variant="small" color={stats.dueSoon > 0 ? 'red' : 'gray'} weight="semibold" className="text-[11px]">
                                            {stats.nextDeadline ? `Due ${new Date(stats.nextDeadline.deliveryDate!).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}` : 'Free schedule'}
                                        </Typography>
                                    </View>
                                    <ArrowRight size={16} color="#9CA3AF" />
                                </Pressable>

                                <Pressable
                                    onPress={() => router.push('/(tabs)/customers/')}
                                    className={`flex-row items-center p-5 rounded-[28px] ${isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm shadow-gray-200'}`}
                                >
                                    <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                                        <People size={22} color="#6B7280" variant="Bulk" />
                                    </View>
                                    <View className="flex-1">
                                        <Typography variant="body" weight="bold">{stats.totalCustomers} Active Clients</Typography>
                                        <Typography variant="small" color="gray" weight="medium">Maintain your measurement base</Typography>
                                    </View>
                                    <ArrowRight size={16} color="#9CA3AF" />
                                </Pressable>
                            </View>
                        </>

                    )
                }




            </ScrollView>
        </View>
    );
}

function QuickActionPill({ icon, label, bg, onPress }: any) {
    const { isDark } = useTheme();
    return (
        <Pressable className="items-center" onPress={onPress}>
            <View className={`w-14 h-14 ${bg} rounded-[22px] items-center justify-center mb-1.5`}>
                {icon}
            </View>
            <Typography variant="small" weight="bold" className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-gray-900'}`}>
                {label}
            </Typography>
        </Pressable>
    );
}

