import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView, Pressable, Image, RefreshControl, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Notification, Calendar, Box, ArrowRight, Wallet, People, Timer1, Add, Gallery, User, MagicStar, DocumentText, Ruler, Eye, EyeSlash, MoneyRecive, MoneySend, TickCircle, Task, DollarCircle, MessageText, InfoCircle, Gift, Award, GalleryAdd, Notification1, NotificationBing, NotificationCircle, NotificationFavorite } from 'iconsax-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { router, useFocusEffect } from 'expo-router';
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
import { ReferralModal } from '../../components/ReferralModal';
import { SurveyModal } from '../../components/SurveyModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUnreadOrderRequests } from '../../hooks/useUnreadOrderRequests';
import { usePostHog, useFeatureFlag } from 'posthog-react-native';
import axiosInstance from '../../lib/axios';

export default function Home() {
    const { user, refreshUser } = useAuth();
    const posthog = usePostHog();
    const inAppSurveyFlag = useFeatureFlag('in_app_survey');
    const isSurveyFeatureEnabled = Boolean(inAppSurveyFlag ?? posthog?.isFeatureEnabled('in_app_survey'));
    const { isSyncing, sync: performSync } = useSync();
    const { orders, loading: ordersLoading } = useOrders();
    const { customers, loading: customersLoading } = useCustomers();
    const { isDark } = useTheme();
    const { needsVisibility, isActivated, catalog, loading: catalogLoading } = useCatalog();
    const [balanceVisible, setBalanceVisible] = useState(true);
    const [catalogBannerVisible, setCatalogBannerVisible] = useState(false);
    const [catalogModalVisible, setCatalogModalVisible] = useState(false);
    const [isReferralModalVisible, setIsReferralModalVisible] = useState(false);
    const [isSurveyModalVisible, setIsSurveyModalVisible] = useState(false);
    const [isSurveyCompleted, setIsSurveyCompleted] = useState(user?.hasCompletedSurvey || false);
    const [isSurveyEligible, setIsSurveyEligible] = useState<boolean>(() => {
        if (!user?.createdAt) return false;
        const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;
        return Date.now() - new Date(user.createdAt).getTime() >= FIFTEEN_DAYS_MS;
    });
    const [surveyDraftStep, setSurveyDraftStep] = useState<number | null>(null);
    const [activeSlide, setActiveSlide] = useState(0);
    const carouselRef = useRef<ScrollView>(null);

    // Set user properties for feature flag targeting and reload flags
    useEffect(() => {
        if (user?.email && posthog) {
            posthog.setPersonPropertiesForFlags({ email: user.email });
        }
    }, [user?.email, posthog]);

    // Check survey status directly from backend API (guarded by feature flag)
    const checkSurveyStatus = useCallback(async () => {
        if (!user?.id || !isSurveyFeatureEnabled) return;
        try {
            // Remove legacy local device flag if previously set
            await AsyncStorage.removeItem('survey_completed');

            // Query authoritative survey status from backend API
            const response = await axiosInstance.get('/survey/status');
            const completed = Boolean(response.data?.hasCompletedSurvey ?? user?.hasCompletedSurvey);
            setIsSurveyCompleted(completed);

            const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;
            const eligible = response.data?.isEligible !== undefined
                ? Boolean(response.data.isEligible)
                : (user?.createdAt ? (Date.now() - new Date(user.createdAt).getTime() >= FIFTEEN_DAYS_MS) : false);
            setIsSurveyEligible(eligible);

            if (completed || !eligible) {
                setSurveyDraftStep(null);
                if (completed) {
                    await AsyncStorage.multiRemove(['survey_draft_step', 'survey_draft_answers']);
                }
                return;
            }

            // Check if user has an active survey draft
            const draftStepStr = await AsyncStorage.getItem('survey_draft_step');
            if (draftStepStr) {
                const stepNum = parseInt(draftStepStr, 10);
                if (!isNaN(stepNum) && stepNum >= 1 && stepNum <= 11) {
                    setSurveyDraftStep(stepNum);
                } else {
                    setSurveyDraftStep(null);
                }
            } else {
                setSurveyDraftStep(null);
            }

            // If not completed and eligible, check 48hr throttle for auto-pop up
            const lastDismissed = await AsyncStorage.getItem('survey_last_dismissed_at');
            if (!lastDismissed) {
                setTimeout(() => setIsSurveyModalVisible(true), 1000);
                return;
            }

            const timeSinceDismissed = Date.now() - parseInt(lastDismissed, 10);
            const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
            if (timeSinceDismissed >= FORTY_EIGHT_HOURS) {
                setTimeout(() => setIsSurveyModalVisible(true), 1000);
            }
        } catch (e) {
            console.error('Failed to check survey status from API:', e);
            if (user?.hasCompletedSurvey) {
                setIsSurveyCompleted(true);
            }
        }
    }, [user?.id, user?.hasCompletedSurvey, user?.createdAt, isSurveyFeatureEnabled]);

    // Check on screen focus
    useFocusEffect(
        useCallback(() => {
            checkSurveyStatus();
        }, [checkSurveyStatus])
    );

    // Watch feature flag change to evaluate survey or dismiss modal if disabled
    useEffect(() => {
        if (isSurveyFeatureEnabled) {
            checkSurveyStatus();
        } else {
            setIsSurveyModalVisible(false);
        }
    }, [isSurveyFeatureEnabled, checkSurveyStatus]);

    // Auto-scroll the promo banner carousel every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            const nextSlide = activeSlide === 0 ? 1 : 0;
            const containerWidth = Dimensions.get('window').width - 32;
            carouselRef.current?.scrollTo({
                x: nextSlide * containerWidth,
                animated: true
            });
            setActiveSlide(nextSlide);
        }, 5000);
        return () => clearInterval(interval);
    }, [activeSlide]);

    const { unreadCount } = useUnreadOrderRequests();
    const totalUnread = unreadCount + (needsVisibility ? 1 : 0);

    const todoChecklist = useTodoChecklist();

    // Track dashboard view on mount
    useEffect(() => {
        posthog?.capture('dashboard_viewed');
    }, [posthog]);

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
        await refreshUser();
        await checkSurveyStatus();
    }, [performSync, todoChecklist.refresh, refreshUser, checkSurveyStatus]);

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

        // Most Recent Order (by createdAt descending)
        const sortedActive = [...activeOrders].sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeB - timeA;
        });
        const latestOrder = sortedActive[0] || null;
        const recentOrder = latestOrder ? {
            id: latestOrder.id,
            amount: Number(latestOrder.amount) || Number(latestOrder.amountPaid) || 0,
            customerName: (latestOrder as any).customerFullName || customers.find(c => c.id === latestOrder.customerId)?.fullName || 'Customer',
            styleName: latestOrder.styleName,
            createdAt: latestOrder.createdAt,
        } : null;

        return {
            pendingCount: pendingOrders.length,
            newToday: ordersToday.length,
            dueSoon: dueThisWeek.length,
            totalCustomers: customers.length,
            revenue: revenueThisWeek,
            totalEarned,
            totalDebt,
            nextDeadline: nextOrderWithDeadline,
            recentOrder
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
                        {/*  <IconButton
                            icon={<InfoCircle size={25} color={isDark ? 'white' : 'black'} variant="Linear" />}
                            onPress={() => router.push('/(tabs)/profile/learn')}
                            variant="ghost"
                            className='bg-gray-300/20 p-3'
                        /> */}
                        <IconButton
                            icon={<GalleryAdd size={25} color={isDark ? 'white' : 'black'} variant="Linear" />}
                            onPress={() => router.push('/extras/catalog-gallery')}
                            variant="ghost"
                            className='bg-gray-300/20 p-3'
                        />
                        <View>
                            <IconButton
                                icon={<Notification size={25} color={isDark ? 'white' : 'black'} variant="Linear" />}
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
                    recentOrder={stats.recentOrder}
                    onPressRecentOrder={() => {
                        if (stats.recentOrder?.id) {
                            router.push(`/(tabs)/orders/${stats.recentOrder.id}`);
                        }
                    }}
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
                <View className="mb-6  mt-4 flex-row items-start justify-between">
                    <QuickActionPill icon={<Add size={22} color="white" />} label="New Order" bg="bg-black dark:bg-zinc-800" onPress={() => { posthog.capture('quick_action_tapped', { action: 'new_order' }); posthog.capture('clicked_quick_create_order'); router.push('/(tabs)/orders/new'); }} />
                    <QuickActionPill icon={<Ruler size={22} color="#FF5678" variant="Bulk" />} label="Measure" bg="bg-indigo-50 dark:bg-indigo-900/20" onPress={() => { posthog.capture('quick_action_tapped', { action: 'measure' }); router.push('/measurements/create'); }} />
                    <QuickActionPill icon={<Task size={22} color="#8b5cf6" variant="Bulk" />} label="New Template" bg="bg-violet-50 dark:bg-violet-900/20" onPress={() => { posthog.capture('quick_action_tapped', { action: 'new_template' }); router.push('/measurement-templates/create'); }} />
                    <QuickActionPill icon={<People size={22} color="#f97316" variant="Bulk" />} label="Add Client" bg="bg-orange-50 dark:bg-orange-900/20" onPress={() => { posthog.capture('quick_action_tapped', { action: 'add_client' }); router.push('/(tabs)/customers/new'); }} />
                    <QuickActionPill icon={<DocumentText size={22} color="#3b82f6" variant="Bulk" />} label="Invoice" bg="bg-blue-50 dark:bg-blue-900/20" onPress={() => { posthog.capture('quick_action_tapped', { action: 'invoice' }); router.push('/(tabs)/orders/invoices/new'); }} />
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

                {/* Promo Banner / Carousel - Survey Banner shown only for eligible users (>=15 days) who haven't completed survey */}
                {isSurveyFeatureEnabled && isSurveyEligible && !isSurveyCompleted && !user?.hasCompletedSurvey ? (
                    /* Survey Promo Banner (Active when in_app_survey flag is enabled and user is eligible) */
                    <View className="mb-6">
                        {surveyDraftStep && surveyDraftStep >= 1 ? (
                            <TouchableOpacity
                                onPress={() => {
                                    posthog?.capture('home_survey_banner_clicked', { resume: true, step: surveyDraftStep });
                                    setIsSurveyModalVisible(true);
                                }}
                                activeOpacity={0.85}
                            >
                                <View
                                    style={{
                                        borderRadius: 24,
                                        padding: 16,
                                        height: 110,
                                        overflow: 'hidden'
                                    }}
                                    className="bg-brand-primary flex-row items-center justify-between shadow-sm"
                                >
                                    <View className="flex-1 pr-2">
                                        <View className="flex-row items-center mb-1">
                                            <Typography variant="body" weight="bold" color="white" className="text-[15px]">
                                                Complete Your Survey
                                            </Typography>
                                            <View className="bg-[#FF5678] px-2 py-0.5 rounded-full ml-2 flex-row items-center gap-1">
                                                <Typography variant="small" weight="black" color="white" className="text-[8px] uppercase tracking-tighter">
                                                    CONTINUE (+10 PTS)
                                                </Typography>
                                            </View>
                                        </View>
                                        <Typography variant="small" color="white" className="leading-[16px] opacity-90 text-[12px]">
                                            Earn 10pts to get 5 new customer records to your limit! Pick up right where you left off.
                                        </Typography>
                                    </View>
                                    <View className="w-14 h-14 rounded-2xl bg-white/10 items-center justify-center border border-white/10">
                                        <Award size={30} color="#FFFFFF" variant="Bulk" />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                onPress={() => {
                                    posthog?.capture('home_survey_banner_clicked', { resume: false });
                                    setIsSurveyModalVisible(true);
                                }}
                                activeOpacity={0.85}
                            >
                                <View
                                    style={{
                                        borderRadius: 24,
                                        padding: 16,
                                        height: 110,
                                        overflow: 'hidden'
                                    }}
                                    className="bg-brand-primary flex-row items-center justify-between shadow-sm"
                                >
                                    <View className="flex-1 pr-2">
                                        <View className="flex-row items-center mb-1">
                                            <Typography variant="body" weight="bold" color="white" className="text-[15px]">
                                                Help Shape NeedleX
                                            </Typography>
                                            <View className="bg-[#FF5678] px-2 py-0.5 rounded-full ml-2 flex-row items-center gap-1">
                                                <Typography variant="small" weight="black" color="white" className="text-[8px] uppercase tracking-tighter">
                                                    +10 PTS
                                                </Typography>
                                            </View>
                                        </View>
                                        <Typography variant="small" color="white" className="leading-[16px] opacity-90 text-[12px]">
                                            Earn 10pts to get 5 new customer records to your limit! Take a 2-minute survey to help us improve.
                                        </Typography>
                                    </View>
                                    <View className="w-14 h-14 rounded-2xl bg-white/10 items-center justify-center border border-white/10">
                                        <Gift size={30} color="#FFFFFF" variant="Bulk" />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    /* Home Promo Carousel (Business Analytics & Refer & Earn) - Active when in_app_survey flag is disabled, user is <15 days old, or user completed survey */
                    <View className="mb-6 -mr-2" style={{ height: 92, position: 'relative' }}>
                        <ScrollView
                            ref={carouselRef}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onScroll={(e) => {
                                const contentOffsetX = e.nativeEvent.contentOffset.x;
                                const idx = Math.round(contentOffsetX / (Dimensions.get('window').width - 32));
                                setActiveSlide(idx);
                            }}
                            scrollEventThrottle={16}
                            style={{ width: Dimensions.get('window').width - 32, height: 92 }}
                        >
                            {/* Slide 1: Business Analytics */}
                            <TouchableOpacity
                                onPress={() => {
                                    posthog.capture('home_analytics_banner_clicked');
                                    router.push('/(tabs)/profile/analytics');
                                }}
                                activeOpacity={0.85}
                                style={{ width: Dimensions.get('window').width - 30, height: 92 }}
                            >
                                <View
                                    style={{
                                        borderRadius: 22,
                                        paddingVertical: 12,
                                        paddingHorizontal: 14,
                                        height: 92,
                                        overflow: 'hidden'
                                    }}
                                    className="bg-blue-600 mr-2 flex-row items-center justify-between"
                                >
                                    {/* Left: Image */}
                                    <Image
                                        source={require('../../assets/images/analytics_banner.png')}
                                        style={{ width: 48, height: 48 }}
                                        resizeMode="contain"
                                        className="mr-3"
                                    />

                                    {/* Center: Content */}
                                    <View className="flex-1 pr-2.5 justify-center">
                                        <Typography variant="body" weight="bold" color="white" className="text-[13.5px] leading-tight mb-0.5">
                                            Business Analytics
                                        </Typography>
                                        <Typography variant="small" color="white" className="leading-[14px] opacity-85 text-[11px]" numberOfLines={2}>
                                            Track your orders, delivery speed, and store performance.
                                        </Typography>
                                    </View>

                                    {/* Right: CTA Button */}
                                    <View className="bg-white px-3 py-1.5 rounded-full flex-row items-center">
                                        <Typography variant="small" weight="bold" className="text-blue-600 text-[11px] mr-1">
                                            View
                                        </Typography>
                                        <ArrowRight size={11} color="#2563EB" />
                                    </View>
                                </View>
                            </TouchableOpacity>

                            {/* Slide 2: Refer & Earn Rewards */}
                            <TouchableOpacity
                                onPress={() => {
                                    posthog.capture('home_referral_banner_clicked');
                                    setIsReferralModalVisible(true);
                                }}
                                activeOpacity={0.85}
                                style={{ width: Dimensions.get('window').width - 32, height: 92 }}
                            >
                                <View
                                    style={{
                                        borderRadius: 22,
                                        paddingVertical: 12,
                                        paddingHorizontal: 14,
                                        height: 92,
                                        overflow: 'hidden'
                                    }}
                                    className="bg-[#1C1C1E] dark:bg-[#1C1C1E] mr-2 flex-row items-center justify-between border border-white/5"
                                >
                                    {/* Left: Image */}
                                    <Image
                                        source={require('../../assets/images/referral_bg.png')}
                                        style={{ width: 48, height: 48, borderRadius: 12 }}
                                        resizeMode="cover"
                                        className="mr-3"
                                    />

                                    {/* Center: Content */}
                                    <View className="flex-1 pr-2.5 justify-center">
                                        <Typography variant="body" weight="bold" color="white" className="text-[13.5px] leading-tight mb-0.5">
                                            Refer & Earn
                                        </Typography>
                                        <Typography variant="small" color="white" className="leading-[14px] opacity-85 text-[11px]" numberOfLines={2}>
                                            Invite tailors, earn points, and unlock upgraded capacity.
                                        </Typography>
                                    </View>

                                    {/* Right: CTA Button */}
                                    <View className="bg-[#FF5678] px-3 py-1.5 rounded-full flex-row items-center">
                                        <Typography variant="small" weight="bold" color="white" className="text-[11px] mr-1">
                                            Invite
                                        </Typography>
                                        <ArrowRight size={11} color="white" />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </ScrollView>

                        {/* Overlapping Carousel Indicator at bottom of slides */}
                        <View
                            pointerEvents="none"
                            style={{
                                position: 'absolute',
                                bottom: 5,
                                left: 0,
                                right: 8,
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                zIndex: 10,
                            }}
                        >
                            <View className={`h-1 rounded-full ${activeSlide === 0 ? 'bg-white w-3' : 'bg-white/40 w-1'}`} style={{ marginHorizontal: 2.5 }} />
                            <View className={`h-1 rounded-full ${activeSlide === 1 ? 'bg-white w-3' : 'bg-white/40 w-1'}`} style={{ marginHorizontal: 2.5 }} />
                        </View>
                    </View>
                )}




            </ScrollView>

            {/* Catalog Visibility Modal for Freemium Users */}
            <CatalogVisibilityModal
                visible={catalogModalVisible}
                onClose={onDismissCatalogModal}
                onSuccess={onDismissCatalogModal}
                onDontShowAgain={onDontShowCatalogModalAgain}
            />
            <ReferralModal
                visible={isReferralModalVisible}
                onClose={() => setIsReferralModalVisible(false)}
            />
            {isSurveyFeatureEnabled && (
                <SurveyModal
                    visible={isSurveyModalVisible}
                    onClose={async () => {
                        setIsSurveyModalVisible(false);
                        const draftStepStr = await AsyncStorage.getItem('survey_draft_step');
                        if (draftStepStr) {
                            const stepNum = parseInt(draftStepStr, 10);
                            if (!isNaN(stepNum) && stepNum >= 1 && stepNum <= 11) {
                                setSurveyDraftStep(stepNum);
                            } else {
                                setSurveyDraftStep(null);
                            }
                        } else {
                            setSurveyDraftStep(null);
                        }
                    }}
                    onCompleted={async () => {
                        setIsSurveyCompleted(true);
                        setSurveyDraftStep(null);
                        await refreshUser();
                        await checkSurveyStatus();
                    }}
                />
            )}
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