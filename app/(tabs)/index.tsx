import React, { useCallback, useMemo, useState } from 'react';
import { View, ScrollView, Pressable, Image, RefreshControl } from 'react-native';
import { Notification, Calendar, Box, ArrowRight, Wallet, People, Timer1, Add, Gallery, User, MagicStar, DocumentText, Ruler, Eye, EyeSlash, MoneyRecive, MoneySend } from 'iconsax-react-native';
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

export default function Home() {
    const { user } = useAuth();
    const { isSyncing, sync: performSync } = useSync();
    const { orders, loading: ordersLoading } = useOrders();
    const { customers, loading: customersLoading } = useCustomers();
    const { isDark } = useTheme();
    const [balanceVisible, setBalanceVisible] = useState(true);

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

        // Total earned (Actual cash collected across all orders)
        const totalEarned = orders.reduce((sum, o) => sum + (o.amountPaid || 0), 0);

        // Total Debt (Outstandings across all orders)
        const totalDebt = orders.reduce((sum, o) => sum + (o.balance || 0), 0);

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
    const isNewUser = !ordersLoading && !customersLoading && orders.length === 0 && customers.length === 0;

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
                        icon={<Notification size={22} color={isDark ? 'white' : 'black'} variant="Linear" />} 
                        onPress={() => router.push('/notifications')} 
                        variant="ghost" 
                    />
                </View>

                {isNewUser ? (
                    <EmptyStateHome router={router} />
                ) : (
                    <>
                        {/* 1. Wallet Hero Card (The "Balance") */}
                        <View className="mb-6">
                            <View style={{ borderRadius: 28, overflow: 'hidden', backgroundColor: isDark ? '#1C1C1E' : '#3B82F6', padding: 22, borderWidth: isDark ? 1 : 0, borderColor: '#374151', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 }}>
                                <View className="flex-row items-center mb-4">
                                    <View className="flex-row items-center flex-1">
                                        <View className={`w-6 h-6 rounded-full ${isDark ? 'bg-blue-400/20' : 'bg-white/20'} items-center justify-center mr-2`}>
                                            <Wallet size={12} color={isDark ? "#60A5FA" : "white"} variant="Bold" />
                                        </View>
                                        <Typography variant="small" weight="bold" color="white" className="opacity-80 mr-2">Total Revenue</Typography>
                                        <Pressable onPress={() => setBalanceVisible(!balanceVisible)} hitSlop={12}>
                                            {balanceVisible ? <Eye size={16} color="white" variant="Bulk" className="opacity-60" /> : <EyeSlash size={16} color="white" variant="Bulk" className="opacity-60" />}
                                        </Pressable>
                                    </View>
                                </View>

                                <Typography variant="h1" weight="bold" color="white" className="text-3xl mb-4 tracking-tighter">
                                    {balanceVisible ? formatCurrency(stats.totalEarned) : '••••••'}
                                </Typography>

                                <View className="flex-row items-center justify-between pt-4 border-t border-white/10">
                                    <View>
                                        <Typography variant="small" color="white" className="opacity-60 mb-0.5" weight="bold">Outstanding</Typography>
                                        <Typography variant="body" weight="bold" color="white">{balanceVisible ? formatCurrency(stats.totalDebt) : '••••'}</Typography>
                                    </View>
                                    <View className="bg-white/20 px-3 py-2 rounded-[14px]">
                                        <Typography variant="small" weight="bold" color="white" className="text-[11px]">{stats.pendingCount} Ongoing</Typography>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* 2. Quick Actions Strip (Horizontal Scroll for zero-vertical height consumption) */}
                        <View className="mb-8">
                             <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-4">
                                <QuickActionPill icon={<Add size={22} color="white" />} label="New Order" bg="bg-black dark:bg-zinc-800" onPress={() => router.push('/(tabs)/orders/new')} />
                                <QuickActionPill icon={<Ruler size={22} color="#6366f1" variant="Bulk" />} label="Measure" bg="bg-indigo-50 dark:bg-indigo-900/20" onPress={() => router.push('/measurements/create')} />
                                <QuickActionPill icon={<People size={22} color="#f97316" variant="Bulk" />} label="Add Client" bg="bg-orange-50 dark:bg-orange-900/20" onPress={() => router.push('/(tabs)/customers/new')} />
                                <QuickActionPill icon={<DocumentText size={22} color="#3b82f6" variant="Bulk" />} label="Invoice" bg="bg-blue-50 dark:bg-blue-900/20" onPress={() => router.push('/(tabs)/orders/invoices/new')} />
                                <QuickActionPill icon={<Gallery size={22} color="#ec4899" variant="Bulk" />} label="Catalog" bg="bg-pink-50 dark:bg-pink-900/20" onPress={() => router.push('/(tabs)/profile/catalog')} />
                             </ScrollView>
                        </View>

                        {!user?.onboardingCompleted && <OnboardingChecklist />}

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
                )}
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

function EmptyStateHome({ router }: { router: any }) {
    const { isDark } = useTheme();

    return (
        <View className="py-10">
            <View className="items-center">
                <View className={`w-20 h-20 ${isDark ? 'bg-zinc-900' : 'bg-white'} items-center justify-center mb-6 rounded-full shadow-sm`}>
                    <MagicStar size={40} color="#6366f1" variant="Bulk" />
                </View>
                <Typography variant="h2" weight="bold" className="text-center mb-2">Welcome to Needle Africa</Typography>
                <Typography variant="body" color="gray" className="text-center px-4 leading-relaxed">
                    Your digital tailoring workspace is ready. Let's start by adding your first client or creating an order.
                </Typography>
            </View>

            <View className="flex-row flex-wrap justify-between mt-12 gap-y-4">
                <Pressable onPress={() => router.push('/(tabs)/customers/new')} className="w-[48%]">
                    <Surface variant="white" className={`p-5 items-center justify-center ${isDark ? 'border-border-dark' : 'border-gray-100'}`} rounded="2xl" hasBorder>
                        <View className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 items-center justify-center rounded-xl mb-3">
                            <People size={24} color="#f97316" variant="Bulk" />
                        </View>
                        <Typography weight="bold" className="text-center text-sm mb-1">Add Client</Typography>
                        <Typography variant="caption" color="gray" className="text-center text-xs">Build database</Typography>
                    </Surface>
                </Pressable>

                <Pressable onPress={() => router.push('/(tabs)/orders/new')} className="w-[48%]">
                    <Surface variant="white" className={`p-5 items-center justify-center ${isDark ? 'border-border-dark' : 'border-gray-100'}`} rounded="2xl" hasBorder>
                        <View className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 items-center justify-center rounded-xl mb-3">
                            <Box size={24} color="#6366f1" variant="Bulk" />
                        </View>
                        <Typography weight="bold" className="text-center text-sm mb-1">Create Order</Typography>
                        <Typography variant="caption" color="gray" className="text-center text-xs">Start tracking</Typography>
                    </Surface>
                </Pressable>
            </View>
        </View>
    );
}
