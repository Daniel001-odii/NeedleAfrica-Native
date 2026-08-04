import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView, Pressable, Image, RefreshControl, TouchableOpacity, Animated } from 'react-native';
import { Notification, Calendar, Box, ArrowRight, Wallet, People, Timer1, Add, Gallery, User, MagicStar, DocumentText, Ruler, Eye, EyeSlash, MoneyRecive, MoneySend, TickCircle, Task, DollarCircle, MessageText, InfoCircle } from 'iconsax-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';
import { Surface } from '../../components/ui/Surface';
import { Typography } from '../../components/ui/Typography';
import { IconButton } from '../../components/ui/IconButton';
import { useSync } from '../../hooks/useSync';
import { useOrders } from '../../hooks/useOrders';
import { useCustomers } from '../../hooks/useCustomers';
import { useTheme } from '../../contexts/ThemeContext';
import { database } from '../../database/watermelon/index.native';
import { OnboardingChecklist } from '../../components/OnboardingChecklist';
import RevenueHeroCard from '../../components/RevenueHeroCard';
import { useCatalog } from '../../hooks/useCatalog';
import { useTodoChecklist, CHECKLIST_ITEMS } from '../../hooks/useTodoChecklist';
import { CatalogVisibilityModal } from '../../components/CatalogVisibilityModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUnreadOrderRequests } from '../../hooks/useUnreadOrderRequests';
import { usePostHog } from 'posthog-react-native';

export default function Home() {
    const { user } = useAuth();
    const { isSyncing, sync: performSync } = useSync();
    const { orders, loading: ordersLoading } = useOrders();
    const { customers, loading: customersLoading } = useCustomers();
    const { isDark } = useTheme();
    const { needsVisibility, isActivated, catalog, loading: catalogLoading } = useCatalog();
    const [balanceVisible, setBalanceVisible] = useState(true);
    const [catalogBannerVisible, setCatalogBannerVisible] = useState(false);
    const [catalogModalVisible, setCatalogModalVisible] = useState(false);

    const { unreadCount } = useUnreadOrderRequests();
    const totalUnread = unreadCount + (needsVisibility ? 1 : 0);

    const posthog = usePostHog();
    const todoChecklist = useTodoChecklist();

    // Track dashboard view on mount
    useEffect(() => {
        posthog.capture('dashboard_viewed');
    }, []);

    // Animated waving hand
    const waveAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(waveAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(waveAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, []);
    const waveRotation = waveAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['-20deg', '20deg'],
    });

    // Determine if user is on freemium plan
    const isFreemium =
        !user?.subscriptionPlan ||
        user.subscriptionPlan === 'FREE';

    // Check if catalog modal should be shown
    // Conditions: freemium plan, catalog exists, catalog NOT enabled
    useEffect(() => {
        const checkModal = async () => {
            if (catalogLoading) return;

            // Only show for freemium users who have a catalog but haven't enabled visibility
            const shouldShow =
                isFreemium &&
                isActivated &&
                !catalog?.catalogEnabled;

            if (shouldShow) {
                setCatalogModalVisible(true);
            }
        };

        checkModal();
    }, [catalogLoading, isFreemium, isActivated, catalog?.catalogEnabled]);

    const onDismissCatalogModal = () => {
        setCatalogModalVisible(false);
    };

    const onDontShowCatalogModalAgain = async () => {
        try {
            await AsyncStorage.setItem('catalog_visibility_modal_dismissed', 'true');
        } catch { }
        setCatalogModalVisible(false);
    };

    const onRefresh = useCallback(async () => {
        await performSync();
        todoChecklist.refresh();
    }, [performSync, todoChecklist.refresh]);

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

    const daysSinceLastOrder = useMemo(() => {
        const activeOrders = orders.filter(o => !o.deletedAt);
        if (activeOrders.length === 0) return null;

        const dates = activeOrders.map(o => o.createdAt ? new Date(o.createdAt).getTime() : 0).filter(d => d > 0);
        if (dates.length === 0) return null;

        const latestDate = Math.max(...dates);
        const diffTime = Date.now() - latestDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }, [orders]);

    const nudgeContent = useMemo(() => {
        if (daysSinceLastOrder === null || daysSinceLastOrder < 5) return null;

        const name = user?.username ? user.username.split(" ")[0] : 'Tailor';

        if (daysSinceLastOrder <= 7) {
            return {
                title: `Unleash your creativity, ${name}! 🧵`,
                message: `It's been ${daysSinceLastOrder} days since your last order. A lot can happen in a week! Did you take on new client projects? Log them now to keep your queue organized.`,
                action: "Record New Order"
            };
        } else if (daysSinceLastOrder <= 14) {
            return {
                title: `Let's stay on top of things, ${name}! 📈`,
                message: `You haven't logged an order in ${daysSinceLastOrder} days. Recording orders helps you automatically track fabric photos, delivery dates, and pending payments.`,
                action: "Add Recent Work"
            };
        } else {
            return {
                title: `Bring the magic back, ${name}! ✨`,
                message: `It's been ${daysSinceLastOrder} days since your last entry. Consistent record-keeping is the secret to scaling your tailoring business. Let's get back in the flow!`,
                action: "Start Recording"
            };
        }
    }, [daysSinceLastOrder, user]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: user?.currency || 'NGN',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const hasNoCatalog = !catalogLoading && !isActivated;
    const hasNoClients = !customersLoading && customers.length === 0;
    const hasNoOrders = !ordersLoading && orders.length === 0;
    const showTodo = hasNoClients && hasNoOrders;

    return (
        <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'}`}>
            <ScrollView
                contentContainerClassName="p-5 pb-12"
                showsVerticalScrollIndicator={false}
                // refreshControl={<RefreshControl refreshing={isSyncing} onRefresh={onRefresh} tintColor={isDark ? '#FFFFFF' : '#3B82F6'} />}
                refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={isDark ? '#FFFFFF' : '#3B82F6'} />}
            >
                {/* Header */}
                <View className="flex-row justify-between items-center mb-6">
                    <View>
                        <Typography variant="h3" weight="bold" className={isDark ? 'text-white' : 'text-black'}>
                            Hi, {user?.username.split(" ")[0] || 'Tailor'}{' '}
                            <Animated.Text style={{ transform: [{ rotate: waveRotation }] }}>
                                👋
                            </Animated.Text>
                        </Typography>
                        <Typography variant="caption" weight="bold" color="gray">
                            {getGreeting()}.
                        </Typography>
                    </View>

                    <View className="flex-row items-center gap-2">
                        <IconButton
                            icon={<InfoCircle size={25} color={isDark ? 'white' : 'black'} variant="Linear" />}
                            onPress={() => router.push('/(tabs)/profile/learn')}
                            variant="ghost"
                            className='bg-gray-300/20 p-3'
                        />
                        <IconButton
                            icon={<Gallery size={25} color={isDark ? 'white' : 'black'} variant="Linear" />}
                            onPress={() => router.push('/extras/catalog-gallery')}
                            variant="ghost"
                            className='bg-gray-300/20 p-3'
                        />
                        <View>
                            <IconButton
                                icon={<MessageText size={25} color={isDark ? 'white' : 'black'} variant="Linear" />}
                                onPress={() => router.push('/notifications')}
                                variant="ghost"
                                className='bg-gray-300/20 p-3'
                            />
                            {(totalUnread > 0) && (
                                <View className="absolute top-0 right-0 min-w-[18px] h-[18px] rounded-full bg-red-500 items-center justify-center px-1 border-2 border-white dark:border-black">
                                    <Typography variant="small" weight="bold" color="white" className="text-[10px] leading-tight">
                                        {totalUnread > 99 ? '99+' : totalUnread}
                                    </Typography>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* 1. Wallet Hero Card (The "Balance") */}
                <RevenueHeroCard
                    isDark={isDark}
                    stats={stats}
                    balanceVisible={balanceVisible}
                    setBalanceVisible={setBalanceVisible}
                    formatCurrency={formatCurrency}
                />

                {/* App Feature Banner: Free Business Website */}
                {catalogBannerVisible && (
                    <View className="mb-6">
                        <View
                            style={{
                                backgroundColor: '#FF5678',
                                borderRadius: 10,
                                padding: 15,
                                borderWidth: isDark ? 1 : 0,
                                borderColor: '#374151',
                                shadowColor: '#FF5678',
                                shadowOffset: { width: 0, height: 10 },
                                shadowOpacity: isDark ? 0.3 : 0.4,
                                shadowRadius: 20,
                                elevation: 10,
                                overflow: 'hidden'
                            }}
                        >
                            <View className="flex-row items-center relative z-10 px-1">
                                <View className="flex-1">
                                    <View className="flex-row items-center mb-1">
                                        <Typography variant="body" weight="bold" color="white" className="text-[17px] mr-2">Free website for your business! </Typography>
                                        <View className="bg-[#FFD700] px-2 py-0.5 rounded-full">
                                            <Typography variant="small" weight="black" color="black" className="text-[9px] uppercase tracking-tighter">NEW</Typography>
                                        </View>
                                    </View>
                                    <Typography variant="small" color="white" className="opacity-80 text-[13px] leading-[19px] font-medium">
                                        Get your professional storefront in seconds. Share your link and start taking orders now.
                                    </Typography>
                                </View>

                                <TouchableOpacity
                                    onPress={() => router.push('/(tabs)/profile/catalog')}
                                    className="bg-white/20 w-10 h-10 rounded-full items-center justify-center ml-3"
                                >
                                    <ArrowRight size={20} color="white" variant="Linear" />
                                </TouchableOpacity>
                            </View>

                            {/* Sleek Background Glow Effect */}
                            <View className="absolute -bottom-16 -right-16 w-48 h-48 bg-white/10 rounded-full" />
                            <View className="absolute -top-16 -left-16 w-48 h-48 bg-white/5 rounded-full" />
                        </View>
                    </View>
                )}

                {/* Business Analytics Announcement Banner */}
                <TouchableOpacity
                    onPress={() => {
                        posthog.capture('home_analytics_banner_clicked');
                        router.push('/(tabs)/profile/analytics');
                    }}
                >

                    <View
                        style={{
                            borderRadius: 10,
                            padding: 8,
                            borderWidth: 1,
                            height: 95,
                            borderColor: isDark ? '#2C2C2E' : '#F3F4F6',
                            shadowColor: '#000000',
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: isDark ? 0.3 : 0.06,
                            shadowRadius: 16,
                            elevation: 4,
                            overflow: 'hidden'
                        }}
                        className="mb-6 bg-blue-500"
                    >
                        <View className="flex-row items-center relative z-10">
                            <View className="flex-1 ml-3 pr-3">
                                <View className="flex-row items-center mb-1.5">
                                    <Typography variant="body" weight="bold" className={`text-[15px] text-white`}>
                                        Business Analytics
                                    </Typography>
                                    <View className="bg-[#FF5678] px-2 py-0.5 rounded-full ml-2">
                                        <Typography variant="small" weight="black" className="text-[8px] text-white uppercase tracking-tighter">NEW</Typography>
                                    </View>
                                </View>
                                <Typography variant="small" className={`leading-[17px] text-white mb-3.5 text-[12px]`}>
                                    Track your orders, delivery speed, and storefront views in one dashboard.
                                </Typography>

                            </View>

                            <Image
                                source={require('../../assets/images/analytics_banner.png')}
                                style={{ width: 85, height: 85 }}
                                resizeMode="contain"
                            />
                        </View>
                        {/* Background glow lines */}
                        <View className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500/5 rounded-full" />
                    </View>
                </TouchableOpacity>


                {/* Learn Banner: Not sure how to use NeedleX? - Temporarily Commented */}
                {/* 
                <TouchableOpacity
                    onPress={() => router.push('/(tabs)/profile/learn')}
                    activeOpacity={0.9}
                    className="mb-6"
                >
                    <View
                        style={{
                            backgroundColor: '#10B981',
                            borderRadius: 10,
                            padding: 15,
                            shadowColor: '#10B981',
                            shadowOffset: { width: 0, height: 10 },
                            shadowOpacity: isDark ? 0.3 : 0.4,
                            shadowRadius: 20,
                            elevation: 10,
                            overflow: 'hidden'
                        }}
                    >
                        <View className="flex-row items-center relative z-10 px-1">
                            <View className="flex-1">
                                <View className="flex-row items-center mb-1">
                                    <Typography variant="body" weight="bold" color="white" className="text-[17px] mr-2">Not sure how to use NeedleX? </Typography>
                                    <View className="bg-[#FFD700] px-2 py-0.5 rounded-full">
                                        <Typography variant="small" weight="black" color="black" className="text-[9px] uppercase tracking-tighter">GUIDES</Typography>
                                    </View>
                                </View>
                                <Typography variant="small" color="white" className="opacity-80 text-[13px] leading-[19px] font-medium">
                                    Watch tutorials, read guides, and get the most out of your tailoring business.
                                </Typography>
                            </View>

                            <View className="bg-white/20 w-10 h-10 rounded-full items-center justify-center ml-3">
                                <ArrowRight size={20} color="white" variant="Linear" />
                            </View>
                        </View>

                        <View className="absolute -bottom-16 -right-16 w-48 h-48 bg-white/10 rounded-full" />
                        <View className="absolute -top-16 -left-16 w-48 h-48 bg-white/5 rounded-full" />
                    </View>
                </TouchableOpacity>
                */}

                {/* 2. Quick Actions Strip */}
                <View className="mb-6">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-4">
                        <QuickActionPill icon={<Add size={22} color="white" />} label="New Order" bg="bg-black dark:bg-zinc-800" onPress={() => { posthog.capture('quick_action_tapped', { action: 'new_order' }); posthog.capture('clicked_quick_create_order'); router.push('/(tabs)/orders/new'); }} />
                        <QuickActionPill icon={<Ruler size={22} color="#FF5678" variant="Bulk" />} label="Measure" bg="bg-indigo-50 dark:bg-indigo-900/20" onPress={() => { posthog.capture('quick_action_tapped', { action: 'measure' }); router.push('/measurements/create'); }} />
                        <QuickActionPill icon={<Task size={22} color="#8b5cf6" variant="Bulk" />} label="New Template" bg="bg-violet-50 dark:bg-violet-900/20" onPress={() => { posthog.capture('quick_action_tapped', { action: 'new_template' }); router.push('/measurement-templates/create'); }} />
                        <QuickActionPill icon={<People size={22} color="#f97316" variant="Bulk" />} label="Add Client" bg="bg-orange-50 dark:bg-orange-900/20" onPress={() => { posthog.capture('quick_action_tapped', { action: 'add_client' }); router.push('/(tabs)/customers/new'); }} />
                        <QuickActionPill icon={<DocumentText size={22} color="#3b82f6" variant="Bulk" />} label="Invoice" bg="bg-blue-50 dark:bg-blue-900/20" onPress={() => { posthog.capture('quick_action_tapped', { action: 'invoice' }); router.push('/(tabs)/orders/invoices/new'); }} />
                    </ScrollView>
                </View>


                {/* Getting Started To-Do (shown when no clients or orders) */}
                {
                    showTodo ? (
                        <View className={`mb-6 rounded-[24px] overflow-hidden ${isDark ? 'bg-[#1C1C1E] border border-zinc-800' : 'bg-white shadow-sm shadow-gray-200'}`}>
                            <View className={`px-5 py-3 ${isDark ? 'border-b border-zinc-800' : 'border-b border-gray-100'}`}>
                                <Typography weight="bold" className={`text-[13px] ${isDark ? 'text-zinc-300' : 'text-gray-900'}`}>Getting Started</Typography>
                            </View>
                            {hasNoCatalog && (
                                <TouchableOpacity
                                    onPress={() => router.push('/catalog-explainer/step1')}
                                    className={`flex-row items-center px-5 py-4 ${(hasNoClients || hasNoOrders) ? (isDark ? 'border-b border-zinc-800' : 'border-b border-gray-50') : ''}`}
                                    activeOpacity={0.6}
                                >
                                    <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${isDark ? 'bg-green-500/15' : 'bg-green-50'}`}>
                                        <Gallery size={16} color="#10B981" variant="Bulk" />
                                    </View>
                                    <View className="flex-1">
                                        <Typography weight="bold" className="text-[14px]">Create your storefront</Typography>
                                        <Typography variant="small" color="gray" className="text-[12px]">Launch your free online storefront</Typography>
                                    </View>
                                    <ArrowRight size={14} color="#9CA3AF" />
                                </TouchableOpacity>
                            )}
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
                                        <Box size={16} color="#FF5678" variant="Bulk" />
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
                            {/* 3. Metrics Row (compact height) */}
                            <View className="flex-row gap-3 mb-3">
                                <View className={`flex-1 p-4 rounded-[28px] border border-gray-200 dark:border-zinc-800 ${isDark ? 'bg-[#1C1C1E]' : 'bg-white'}`}>
                                    <View className="flex-row items-center justify-between mb-2">
                                        <View className={`w-8 h-8 rounded-2xl items-center justify-center ${isDark ? 'bg-orange-500/20' : 'bg-orange-50'}`}>
                                            <Box size={16} color="#f97316" variant="Bulk" />
                                        </View>
                                        <Typography color="gray" weight="bold" className="text-[10px] uppercase">Active</Typography>
                                    </View>
                                    <Typography variant="h2" weight="bold" className="text-2xl">{stats.pendingCount}</Typography>
                                    <Typography variant="small" color="gray" weight="medium" className="text-[10px]">+{stats.newToday} today</Typography>
                                </View>

                                <View className={`flex-1 p-4 rounded-[28px] border border-gray-200 dark:border-zinc-800 ${isDark ? 'bg-[#1C1C1E]' : 'bg-white'}`}>
                                    <View className="flex-row items-center justify-between mb-2">
                                        <View className={`w-8 h-8 rounded-2xl items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
                                            <DollarCircle size={16} color="#3b82f6" variant="Bulk" />
                                        </View>
                                        <Typography color="gray" weight="bold" className="text-[10px] uppercase">/ Week</Typography>
                                    </View>
                                    <Typography variant="h3" weight="bold" className="text-lg">{formatCurrency(stats.revenue)}</Typography>
                                    <Typography variant="small" color="gray" weight="medium" className="text-[10px]">Income</Typography>
                                </View>
                            </View>

                            {/* 4. Strategic Cards (same row) */}
                            <View className="flex-row gap-3 mb-3">
                                <Pressable
                                    onPress={() => router.push('/(tabs)/orders/')}
                                    className={`flex-1 p-5 rounded-[28px] border border-gray-200 dark:border-zinc-800 ${isDark ? 'bg-[#1C1C1E]' : 'bg-white'}`}
                                >
                                    <View className="flex-row items-start justify-between mb-3">
                                        <View className={`w-10 h-10 rounded-full items-center justify-center ${isDark ? 'bg-indigo-900/40' : 'bg-indigo-50'}`}>
                                            <Timer1 size={20} color="#FF5678" variant="Bulk" />
                                        </View>
                                        <ArrowRight size={16} color="#9CA3AF" variant="Linear" style={{ transform: [{ rotate: '-45deg' }] }} />
                                    </View>
                                    <Typography variant="small" color="gray" weight="bold" className="text-[10px] uppercase mb-0.5">Next Deadline</Typography>
                                    <Typography variant="body" weight="bold" numberOfLines={1}>
                                        {stats.nextDeadline ? stats.nextDeadline.styleName : 'All clear'}
                                    </Typography>
                                    <Typography variant="small" color={stats.dueSoon > 0 ? 'red' : 'gray'} weight="semibold" className="text-[11px] mt-0.5">
                                        {stats.nextDeadline ? `Due ${new Date(stats.nextDeadline.deliveryDate!).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}` : 'No deadlines'}
                                    </Typography>
                                </Pressable>

                                <Pressable
                                    onPress={() => router.push('/(tabs)/customers/')}
                                    className={`flex-1 p-5 rounded-[28px] border border-gray-200 dark:border-zinc-800 ${isDark ? 'bg-[#1C1C1E]' : 'bg-white'}`}
                                >
                                    <View className="flex-row items-start justify-between mb-3">
                                        <View className={`w-10 h-10 rounded-full items-center justify-center ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                                            <People size={20} color="#6B7280" variant="Bulk" />
                                        </View>
                                        <ArrowRight size={16} color="#9CA3AF" variant="Linear" style={{ transform: [{ rotate: '-45deg' }] }} />
                                    </View>
                                    <Typography variant="h2" weight="bold" className="text-2xl mb-0.5">{stats.totalCustomers}</Typography>
                                    <Typography variant="small" color="gray" weight="medium">Active Clients</Typography>
                                </Pressable>
                            </View>
                        </>

                    )
                }




            </ScrollView>

            {/* Catalog Visibility Modal for Freemium Users */}
            <CatalogVisibilityModal
                visible={catalogModalVisible}
                onClose={onDismissCatalogModal}
                onSuccess={onDismissCatalogModal}
                onDontShowAgain={onDontShowCatalogModalAgain}
            />
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