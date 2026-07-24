import React, { useMemo, useState, useEffect } from 'react';
import { View, ScrollView, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Chart2, TrendUp, Activity, User, Money, DollarCircle, ShoppingBag, ReceiptItem, Wallet2, Chart, Gallery, DocumentText, MagicStar, MessageText, People, DirectInbox, Eye, ArrowRight, Crown } from 'iconsax-react-native';
import { Typography } from '../../../components/ui/Typography';
import { IconButton } from '../../../components/ui/IconButton';
import { Surface } from '../../../components/ui/Surface';
import { useTheme } from '../../../contexts/ThemeContext';
import { useOrders } from '../../../hooks/useOrders';
import { useCustomers } from '../../../hooks/useCustomers';
import { useMeasurements } from '../../../hooks/useMeasurements';
import { useMeasurementTemplates } from '../../../hooks/useMeasurementTemplates';
import { useInvoices } from '../../../hooks/useInvoices';
import { useAuth } from '../../../contexts/AuthContext';
import { useRevenueCat } from '../../../hooks/useRevenueCat';
import { SubscriptionModal } from '../../../components/SubscriptionModal';
import axiosInstance from '../../../lib/axios';

const GateWrapper = ({ children, isLocked, title, onPressUnlock }: { children: React.ReactNode; isLocked: boolean; title?: string; onPressUnlock: () => void }) => {
    if (!isLocked) return <>{children}</>;
    return (
        <View className="relative">
            <View className="opacity-10" pointerEvents="none">
                {children}
            </View>
            <View className="absolute inset-0 items-center justify-center p-4">
                <View className="bg-zinc-950/90 p-4 items-center justify-center max-w-[240px]">
                    {/*   <Crown size={20} color="#FF5678" variant="Bold" className="mb-1.5" />
                    <Typography variant="body" weight="bold" className="text-white text-[12.5px] text-center mb-1">
                        Unlock {title || "Metric"}
                    </Typography> */}
                    <Typography variant="caption" className="text-zinc-400 text-[10px] text-center mb-3">
                        Upgrade to PRO to view this insight.
                    </Typography>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={onPressUnlock}
                        className="bg-indigo-500 px-4 py-1.5 rounded-full"
                    >
                        <Typography variant="caption" weight="bold" color="white" className="text-[10px]">Unlock PRO</Typography>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default function AnalyticsScreen() {
    const { isDark } = useTheme();
    const { orders } = useOrders();
    const { customers } = useCustomers();
    const { measurements } = useMeasurements();
    const { templates } = useMeasurementTemplates();
    const { invoices } = useInvoices();
    const { user } = useAuth();
    const { isPro } = useRevenueCat();
    const [isSubscriptionModalVisible, setIsSubscriptionModalVisible] = useState(false);

    // Storefront remote stats
    const [storefrontData, setStorefrontData] = useState<{
        catalogViews: number;
        catalogItemViews: number;
        topCatalogItems: Array<{ id: string; name: string; price: number; views: number; images: string[] }>;
        orderRequestsTotal: number;
        orderRequestsPending: number;
    } | null>(null);
    const [loadingStorefront, setLoadingStorefront] = useState(true);

    useEffect(() => {
        const fetchStorefrontAnalytics = async () => {
            try {
                const response = await axiosInstance.get('/catalog/analytics');
                setStorefrontData(response.data);
            } catch (error) {
                console.error('Error fetching storefront analytics:', error);
            } finally {
                setLoadingStorefront(false);
            }
        };

        fetchStorefrontAnalytics();
    }, []);

    const bgColor = isDark ? 'bg-black' : 'bg-white';
    const headerBgColor = isDark ? 'bg-black border-b border-white/5' : 'bg-white border-b border-gray-50';
    const cardColor = isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-100 shadow-sm shadow-gray-100/50';
    const textColor = isDark ? 'text-white' : 'text-gray-900';
    const secondaryTextColor = isDark ? 'text-gray-400' : 'text-gray-500';

    const formatCurrencyVal = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: user?.currency || 'NGN',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Calculate local WatermelonDB metrics
    const metrics = useMemo(() => {
        const activeOrders = orders.filter(o => !o.deletedAt);
        const totalOrders = activeOrders.length;

        const pendingOrders = activeOrders.filter(o => o.status === 'PENDING').length;
        const completedOrders = activeOrders.filter(o => o.status === 'DELIVERED').length;

        const totalEarned = activeOrders.reduce((sum, o) => sum + (o.amountPaid || 0), 0);
        const totalBooked = activeOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
        const totalOutstanding = activeOrders.reduce((sum, o) => sum + o.balance, 0);

        const avgOrderValue = totalOrders > 0 ? totalBooked / totalOrders : 0;

        // Gender breakdown
        const totalClients = customers.length;
        const femaleClients = customers.filter(c => c.gender?.toLowerCase() === 'female').length;
        const maleClients = customers.filter(c => c.gender?.toLowerCase() === 'male').length;
        const otherClients = totalClients - femaleClients - maleClients;

        // Service breakdown (top styles ordered)
        const servicesMap: Record<string, number> = {};
        activeOrders.forEach(o => {
            const name = (o.styleName || 'Unspecified').trim();
            servicesMap[name] = (servicesMap[name] || 0) + 1;
        });
        const topServices = Object.entries(servicesMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Monthly Earnings (last 6 months)
        const monthlyEarnings: Record<string, number> = {};
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        // Initialize last 6 months with 0
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
            monthlyEarnings[key] = 0;
        }

        activeOrders.forEach(o => {
            if (!o.createdAt) return;
            const date = new Date(o.createdAt);
            const key = `${monthNames[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
            if (monthlyEarnings[key] !== undefined) {
                monthlyEarnings[key] += o.amountPaid || 0;
            }
        });

        const monthlyData = Object.entries(monthlyEarnings).map(([month, value]) => ({
            month,
            value
        }));

        const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

        // Speed tracking: duration between createdAt and updatedAt for DELIVERED orders
        const completedOrdersList = activeOrders.filter(o => o.status === 'DELIVERED' && o.createdAt && o.updatedAt);
        const speedDurations = completedOrdersList.map(o => {
            const created = new Date(o.createdAt).getTime();
            const updated = new Date(o.updatedAt).getTime();
            const diffMs = updated - created;
            const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
            return diffDays;
        });

        const totalCompleted = speedDurations.length;
        const avgSpeedDays = totalCompleted > 0 ? (speedDurations.reduce((sum, d) => sum + d, 0) / totalCompleted) : 0;
        const fastestDays = totalCompleted > 0 ? Math.min(...speedDurations) : 0;

        const expressCount = speedDurations.filter(d => d <= 3).length; // 0-3 days
        const standardCount = speedDurations.filter(d => d > 3 && d <= 7).length; // 4-7 days
        const extendedCount = speedDurations.filter(d => d > 7).length; // 8+ days

        return {
            totalOrders,
            pendingOrders,
            completedOrders,
            totalEarned,
            totalBooked,
            totalOutstanding,
            avgOrderValue,
            totalClients,
            femaleClients,
            maleClients,
            otherClients,
            topServices,
            monthlyData,
            totalMeasurements: measurements.length,
            totalTemplates: templates.length,
            totalInvoices: invoices.length,
            totalInvoiced,
            avgSpeedDays,
            fastestDays,
            totalCompleted,
            speedDistribution: {
                express: expressCount,
                standard: standardCount,
                extended: extendedCount
            }
        };
    }, [orders, customers, measurements, templates, invoices]);

    // Graph heights helper
    const maxEarningsVal = useMemo(() => {
        const vals = metrics.monthlyData.map(d => d.value);
        return Math.max(...vals, 1000); // fallback of 1000 to avoid division issues
    }, [metrics.monthlyData]);

    return (
        <View className={`flex-1 ${bgColor} relative`}>
            {/* Header */}
            <View className={`px-4 pt-2 pb-2 flex-row items-center justify-between ${headerBgColor}`}>
                <View className="flex-row items-center">
                    <IconButton icon={<ArrowLeft size={22} color={isDark ? 'white' : 'black'} />} onPress={() => router.back()} variant="ghost" />
                    <Typography variant="h3" weight="bold" className="ml-2">Business Analytics</Typography>
                </View>
            </View>

            <View className="flex-1 relative">
                <ScrollView
                    contentContainerClassName="p-5 pb-12"
                    showsVerticalScrollIndicator={false}
                >
                    {/* 1. FINANCIAL CARDS */}
                    <Typography variant="caption" weight="bold" className={`mb-3 ml-1 uppercase tracking-wider ${secondaryTextColor} text-[11px]`}>
                        Financial Overview
                    </Typography>

                    <View className="flex-row justify-between mb-3">
                        <Surface variant="white" className={`flex-1 p-4 mr-2 ${cardColor}`} rounded="2xl">
                            <View className={`w-8 h-8 rounded-full mb-3 items-center justify-center ${isDark ? 'bg-green-500/10' : 'bg-green-50'}`}>
                                <DollarCircle size={18} color="#10B981" variant="Bulk" />
                            </View>
                            <Typography variant="caption" className={`${secondaryTextColor} text-[11px] mb-0.5`}>
                                Total Revenue
                            </Typography>
                            <Typography variant="body" weight="bold" className={`${textColor} text-[16px]`}>
                                {formatCurrencyVal(metrics.totalEarned)}
                            </Typography>
                        </Surface>

                        <Surface variant="white" className={`flex-1 p-4 ml-2 ${cardColor}`} rounded="2xl">
                            <View className={`w-8 h-8 rounded-full mb-3 items-center justify-center ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
                                <TrendUp size={18} color="#EF4444" variant="Bulk" style={{ transform: [{ rotate: '180deg' }] }} />
                            </View>
                            <Typography variant="caption" className={`${secondaryTextColor} text-[11px] mb-0.5`}>
                                Outstanding debt
                            </Typography>
                            <Typography variant="body" weight="bold" className={`${isDark ? 'text-red-400' : 'text-red-600'} text-[16px]`}>
                                {formatCurrencyVal(metrics.totalOutstanding)}
                            </Typography>
                        </Surface>
                    </View>

                    <View className="flex-row justify-between mb-6">
                        <Surface variant="white" className={`flex-1 p-4 mr-2 ${cardColor}`} rounded="2xl">
                            <View className={`w-8 h-8 rounded-full mb-3 items-center justify-center ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                                <Wallet2 size={18} color="#3B82F6" variant="Bulk" />
                            </View>
                            <Typography variant="caption" className={`${secondaryTextColor} text-[11px] mb-0.5`}>
                                Avg. Order Value
                            </Typography>
                            <Typography variant="body" weight="bold" className={`${textColor} text-[16px]`}>
                                {formatCurrencyVal(metrics.avgOrderValue)}
                            </Typography>
                        </Surface>

                        <Surface variant="white" className={`flex-1 p-4 ml-2 ${cardColor}`} rounded="2xl">
                            <View className={`w-8 h-8 rounded-full mb-3 items-center justify-center ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                                <ReceiptItem size={18} color="#6366F1" variant="Bulk" />
                            </View>
                            <Typography variant="caption" className={`${secondaryTextColor} text-[11px] mb-0.5`}>
                                Total Invoiced
                            </Typography>
                            <Typography variant="body" weight="bold" className={`${textColor} text-[16px]`}>
                                {formatCurrencyVal(metrics.totalInvoiced)}
                            </Typography>
                        </Surface>
                    </View>

                    {/* 2. REVENUE TREND CHART */}
                    <Typography variant="caption" weight="bold" className={`mb-3 ml-1 uppercase tracking-wider ${secondaryTextColor} text-[11px]`}>
                        Revenue Over Time (Last 6 Months)
                    </Typography>
                    <GateWrapper isLocked={!isPro} title="Revenue Chart" onPressUnlock={() => setIsSubscriptionModalVisible(true)}>
                        <Surface variant="white" className={`p-5 mb-6 ${cardColor}`} rounded="3xl">
                            <View className="h-44 flex-row items-end justify-between px-2 pt-4">
                                {metrics.monthlyData.map((d, index) => {
                                    const pct = Math.max((d.value / maxEarningsVal) * 100, 3); // min height of 3%
                                    return (
                                        <View key={index} className="items-center flex-1">
                                            {d.value > 0 && (
                                                <Typography variant="small" weight="bold" className={`text-[8px] mb-1 ${textColor}`} numberOfLines={1}>
                                                    {d.value >= 1000 ? `${(d.value / 1000).toFixed(0)}k` : d.value}
                                                </Typography>
                                            )}
                                            <View
                                                style={{ height: `${pct}%` }}
                                                className="w-7 rounded-t-lg bg-indigo-500 dark:bg-indigo-600"
                                            />
                                            <Typography variant="caption" className={`text-[9px] mt-2 ${secondaryTextColor}`}>
                                                {d.month.split(' ')[0]}
                                            </Typography>
                                        </View>
                                    );
                                })}
                            </View>
                        </Surface>
                    </GateWrapper>

                    {/* 3. STOREFRONT WEB ANALYTICS */}
                    <Typography variant="caption" weight="bold" className={`mb-3 ml-1 uppercase tracking-wider ${secondaryTextColor} text-[11px]`}>
                        Storefront Web Performance
                    </Typography>
                    <GateWrapper isLocked={!isPro} title="Storefront Analytics" onPressUnlock={() => setIsSubscriptionModalVisible(true)}>
                        {loadingStorefront ? (
                            <View className={`rounded-[28px] p-8 mb-6 items-center justify-center ${cardColor}`}>
                                <ActivityIndicator color={isDark ? "#ffffff" : "#000000"} />
                                <Typography variant="caption" className={`mt-2 ${secondaryTextColor}`}>Loading online storefront analytics...</Typography>
                            </View>
                        ) : storefrontData ? (
                            <View className="mb-6">
                                <View className="flex-row justify-between mb-3">
                                    <Surface variant="white" className={`flex-1 p-4 mr-2 ${cardColor}`} rounded="2xl">
                                        <View className={`w-8 h-8 rounded-full mb-3 items-center justify-center ${isDark ? 'bg-orange-500/10' : 'bg-orange-50'}`}>
                                            <Eye size={18} color="#F97316" variant="Bulk" />
                                        </View>
                                        <Typography variant="caption" className={`${secondaryTextColor} text-[11px] mb-0.5`}>
                                            Storefront views
                                        </Typography>
                                        <Typography variant="h3" weight="bold" className={`${textColor}`}>
                                            {storefrontData.catalogViews}
                                        </Typography>
                                    </Surface>

                                    <Surface variant="white" className={`flex-1 p-4 ml-2 ${cardColor}`} rounded="2xl">
                                        <View className={`w-8 h-8 rounded-full mb-3 items-center justify-center ${isDark ? 'bg-violet-500/10' : 'bg-violet-50'}`}>
                                            <Gallery size={18} color="#8B5CF6" variant="Bulk" />
                                        </View>
                                        <Typography variant="caption" className={`${secondaryTextColor} text-[11px] mb-0.5`}>
                                            Product views
                                        </Typography>
                                        <Typography variant="h3" weight="bold" className={`${textColor}`}>
                                            {storefrontData.catalogItemViews}
                                        </Typography>
                                    </Surface>
                                </View>

                                <Surface variant="white" className={`p-5 ${cardColor}`} rounded="3xl">
                                    <View className="flex-row items-center justify-between mb-4">
                                        <View className="flex-row items-center">
                                            <DirectInbox size={20} color="#FF5678" variant="Bulk" />
                                            <Typography weight="bold" className={`ml-2 ${textColor}`}>Incoming Requests</Typography>
                                        </View>
                                        <View className="bg-red-500 px-2 py-0.5 rounded-full">
                                            <Typography variant="caption" weight="bold" color="white" className="text-[10px]">
                                                {storefrontData.orderRequestsPending} Pending
                                            </Typography>
                                        </View>
                                    </View>
                                    <Typography variant="caption" className={`${secondaryTextColor} text-center mb-4 text-[13px] leading-[18px]`}>
                                        You have received {storefrontData.orderRequestsTotal} total request(s) directly from your online web store catalog.
                                    </Typography>

                                    {storefrontData.topCatalogItems.length > 0 ? (
                                        <View className="border-t border-gray-100 dark:border-zinc-800 pt-4">
                                            <Typography variant="caption" weight="bold" className={`mb-3 uppercase ${secondaryTextColor} text-[10px]`}>
                                                Top Viewed Catalog Styles
                                            </Typography>
                                            {storefrontData.topCatalogItems.map((item, index) => (
                                                <View key={item.id} className="flex-row items-center justify-between py-2 border-b border-gray-50 dark:border-zinc-800/40 last:border-0">
                                                    <View className="flex-row items-center">
                                                        <Typography variant="body" weight="bold" className={`text-sm mr-2 ${secondaryTextColor}`}>{index + 1}</Typography>
                                                        <Typography variant="body" weight="semibold" className={textColor}>{item.name}</Typography>
                                                    </View>
                                                    <View className="flex-row items-center">
                                                        <Eye size={14} color="#9CA3AF" className="mr-1" />
                                                        <Typography variant="small" className={`${secondaryTextColor} text-[12px]`}>{item.views} views</Typography>
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    ) : (
                                        <Typography variant="caption" color="gray" className="text-center py-2">
                                            Add items and publish your catalog to start tracking item clicks!
                                        </Typography>
                                    )}
                                </Surface>
                            </View>
                        ) : (
                            <View className={`rounded-[28px] p-6 mb-6 items-center ${cardColor}`}>
                                <Typography variant="caption" color="gray" className="text-center">
                                    Could not connect to fetch online catalog stats. Ensure you are online.
                                </Typography>
                            </View>
                        )}
                    </GateWrapper>

                    {/* 4. OPERATIONAL GRID */}
                    <Typography variant="caption" weight="bold" className={`mb-3 ml-1 uppercase tracking-wider ${secondaryTextColor} text-[11px]`}>
                        Operational Metrics
                    </Typography>
                    <View className="flex-row justify-between mb-3">
                        <Surface variant="white" className={`flex-1 p-4 mr-2 ${cardColor}`} rounded="2xl">
                            <View className={`w-8 h-8 rounded-full mb-3 items-center justify-center ${isDark ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                                <ShoppingBag size={18} color="#8B5CF6" variant="Bulk" />
                            </View>
                            <Typography variant="caption" className={`${secondaryTextColor} text-[11px] mb-0.5`}>
                                Total Orders
                            </Typography>
                            <Typography variant="h3" weight="bold" className={`${textColor} mb-1`}>
                                {metrics.totalOrders}
                            </Typography>
                            <Typography variant="caption" className={`text-[10px] ${secondaryTextColor}`}>
                                {metrics.completedOrders} Delivered • {metrics.pendingOrders} Pending
                            </Typography>
                        </Surface>

                        <Surface variant="white" className={`flex-1 p-4 ml-2 ${cardColor}`} rounded="2xl">
                            <View className={`w-8 h-8 rounded-full mb-3 items-center justify-center ${isDark ? 'bg-orange-500/10' : 'bg-orange-50'}`}>
                                <People size={18} color="#F97316" variant="Bulk" />
                            </View>
                            <Typography variant="caption" className={`${secondaryTextColor} text-[11px] mb-0.5`}>
                                Active Clients
                            </Typography>
                            <Typography variant="h3" weight="bold" className={`${textColor} mb-1`}>
                                {metrics.totalClients}
                            </Typography>
                            <Typography variant="caption" className={`text-[10px] ${secondaryTextColor}`}>
                                Added to client list
                            </Typography>
                        </Surface>
                    </View>

                    <View className="flex-row justify-between mb-6">
                        <Surface variant="white" className={`flex-1 p-4 mr-2 ${cardColor}`} rounded="2xl">
                            <View className={`w-8 h-8 rounded-full mb-3 items-center justify-center ${isDark ? 'bg-teal-500/10' : 'bg-teal-50'}`}>
                                <Activity size={18} color="#14B8A6" variant="Bulk" />
                            </View>
                            <Typography variant="caption" className={`${secondaryTextColor} text-[11px] mb-0.5`}>
                                Client Measurements
                            </Typography>
                            <Typography variant="h3" weight="bold" className={`${textColor} mb-1`}>
                                {metrics.totalMeasurements}
                            </Typography>
                            <Typography variant="caption" className={`text-[10px] ${secondaryTextColor}`}>
                                Measurements recorded
                            </Typography>
                        </Surface>

                        <Surface variant="white" className={`flex-1 p-4 ml-2 ${cardColor}`} rounded="2xl">
                            <View className={`w-8 h-8 rounded-full mb-3 items-center justify-center ${isDark ? 'bg-rose-500/10' : 'bg-rose-50'}`}>
                                <ReceiptItem size={18} color="#F43F5E" variant="Bulk" />
                            </View>
                            <Typography variant="caption" className={`${secondaryTextColor} text-[11px] mb-0.5`}>
                                Templates Created
                            </Typography>
                            <Typography variant="h3" weight="bold" className={`${textColor} mb-1`}>
                                {metrics.totalTemplates}
                            </Typography>
                            <Typography variant="caption" className={`text-[10px] ${secondaryTextColor}`}>
                                Custom drafts saved
                            </Typography>
                        </Surface>
                    </View>

                    {/* 5. TOP SERVICES */}
                    <Typography variant="caption" weight="bold" className={`mb-3 ml-1 uppercase tracking-wider ${secondaryTextColor} text-[11px]`}>
                        Top Services / Styles Demand
                    </Typography>
                    <Surface variant="white" className={`p-5 mb-6 ${cardColor}`} rounded="3xl">
                        {metrics.topServices.length > 0 ? (
                            <View>
                                {metrics.topServices.map((service, index) => {
                                    const maxCount = metrics.topServices[0].count;
                                    const barPct = `${(service.count / maxCount) * 100}%`;
                                    return (
                                        <View key={index} className="mb-4 last:mb-0">
                                            <View className="flex-row justify-between mb-1">
                                                <Typography variant="body" weight="semibold" className={`text-[14px] ${textColor}`}>{service.name}</Typography>
                                                <Typography variant="caption" weight="bold" className={secondaryTextColor}>{service.count} order(s)</Typography>
                                            </View>
                                            <View className="h-2 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <View style={{ width: barPct }} className="h-full bg-indigo-500 dark:bg-indigo-600 rounded-full" />
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        ) : (
                            <View className="items-center py-6">
                                <Activity size={32} color={isDark ? "#52525B" : "#E5E7EB"} variant="Bulk" className="mb-2" />
                                <Typography variant="caption" className={secondaryTextColor}>No order style data. Create orders to view metrics.</Typography>
                            </View>
                        )}
                    </Surface>

                    {/* Order Turnaround Speed */}
                    <Typography variant="caption" weight="bold" className={`mb-3 ml-1 uppercase tracking-wider ${secondaryTextColor} text-[11px]`}>
                        Order Turnaround Speed
                    </Typography>
                    <GateWrapper isLocked={!isPro} title="Turnaround Analytics" onPressUnlock={() => setIsSubscriptionModalVisible(true)}>
                        <Surface variant="white" className={`p-5 mb-6 ${cardColor}`} rounded="3xl">
                            <View className="flex-row items-center justify-between mb-4">
                                <View className="flex-row items-center">
                                    <Activity size={18} color="#FF5678" variant="Bulk" />
                                    <Typography weight="bold" className={`ml-2 ${textColor}`}>Delivery Timelines</Typography>
                                </View>
                                <Typography variant="caption" className={secondaryTextColor}>{metrics.totalCompleted} Completed</Typography>
                            </View>

                            {metrics.totalCompleted > 0 ? (
                                <View>
                                    {/* Avg / Fastest Stats */}
                                    <View className="flex-row justify-between mb-6">
                                        <View className="items-center flex-1">
                                            <Typography variant="caption" className={secondaryTextColor}>Avg. Speed</Typography>
                                            <Typography variant="h2" weight="bold" className={`mt-1 ${textColor}`}>
                                                {metrics.avgSpeedDays.toFixed(1)} <Typography variant="small" color="gray" weight="semibold">days</Typography>
                                            </Typography>
                                        </View>
                                        <View className="w-[1px] h-10 bg-gray-100 dark:bg-zinc-800 self-center" />
                                        <View className="items-center flex-1">
                                            <Typography variant="caption" className={secondaryTextColor}>Fastest Delivery</Typography>
                                            <Typography variant="h2" weight="bold" className={`mt-1 ${textColor}`}>
                                                {metrics.fastestDays} <Typography variant="small" color="gray" weight="semibold">days</Typography>
                                            </Typography>
                                        </View>
                                    </View>

                                    {/* Speed Distribution Segments */}
                                    <View className="h-3 w-full bg-gray-100 dark:bg-zinc-800 rounded-full flex-row overflow-hidden mb-4">
                                        {metrics.speedDistribution.express > 0 && (
                                            <View style={{ flex: metrics.speedDistribution.express }} className="h-full bg-green-400" />
                                        )}
                                        {metrics.speedDistribution.standard > 0 && (
                                            <View style={{ flex: metrics.speedDistribution.standard }} className="h-full bg-indigo-400" />
                                        )}
                                        {metrics.speedDistribution.extended > 0 && (
                                            <View style={{ flex: metrics.speedDistribution.extended }} className="h-full bg-amber-400" />
                                        )}
                                    </View>

                                    {/* Legends */}
                                    <View className="flex-row justify-between">
                                        <View className="items-center">
                                            <View className="flex-row items-center">
                                                <View className="w-2.5 h-2.5 rounded-full bg-green-400 mr-1.5" />
                                                <Typography variant="small" className={`${secondaryTextColor} text-[11px]`}>Express (0-3d)</Typography>
                                            </View>
                                            <Typography variant="body" weight="bold" className={`${textColor} text-[13px] mt-0.5`}>
                                                {((metrics.speedDistribution.express / metrics.totalCompleted) * 100).toFixed(0)}% ({metrics.speedDistribution.express})
                                            </Typography>
                                        </View>

                                        <View className="items-center">
                                            <View className="flex-row items-center">
                                                <View className="w-2.5 h-2.5 rounded-full bg-indigo-400 mr-1.5" />
                                                <Typography variant="small" className={`${secondaryTextColor} text-[11px]`}>Standard (4-7d)</Typography>
                                            </View>
                                            <Typography variant="body" weight="bold" className={`${textColor} text-[13px] mt-0.5`}>
                                                {((metrics.speedDistribution.standard / metrics.totalCompleted) * 100).toFixed(0)}% ({metrics.speedDistribution.standard})
                                            </Typography>
                                        </View>

                                        <View className="items-center">
                                            <View className="flex-row items-center">
                                                <View className="w-2.5 h-2.5 rounded-full bg-amber-400 mr-1.5" />
                                                <Typography variant="small" className={`${secondaryTextColor} text-[11px]`}>Extended (8d+)</Typography>
                                            </View>
                                            <Typography variant="body" weight="bold" className={`${textColor} text-[13px] mt-0.5`}>
                                                {((metrics.speedDistribution.extended / metrics.totalCompleted) * 100).toFixed(0)}% ({metrics.speedDistribution.extended})
                                            </Typography>
                                        </View>
                                    </View>
                                </View>
                            ) : (
                                <View className="items-center py-4">
                                    <Typography variant="caption" className={secondaryTextColor}>Complete and deliver orders to start tracking your turnaround speed.</Typography>
                                </View>
                            )}
                        </Surface>
                    </GateWrapper>

                    {/* 6. GENDER DEMOGRAPHICS */}
                    <Typography variant="caption" weight="bold" className={`mb-3 ml-1 uppercase tracking-wider ${secondaryTextColor} text-[11px]`}>
                        Client Demographics
                    </Typography>
                    <GateWrapper isLocked={!isPro} title="Client Demographics" onPressUnlock={() => setIsSubscriptionModalVisible(true)}>
                        <Surface variant="white" className={`p-5 ${cardColor}`} rounded="3xl">
                            <View className="flex-row items-center justify-between mb-4">
                                <View className="flex-row items-center">
                                    <User size={18} color="#3B82F6" variant="Bulk" />
                                    <Typography weight="bold" className={`ml-2 ${textColor}`}>Gender Split</Typography>
                                </View>
                                <Typography variant="caption" className={secondaryTextColor}>{metrics.totalClients} Total Clients</Typography>
                            </View>

                            {metrics.totalClients > 0 ? (
                                <View>
                                    {/* Segmented color bar */}
                                    <View className="h-3 w-full bg-gray-100 dark:bg-zinc-800 rounded-full flex-row overflow-hidden mb-4">
                                        {metrics.femaleClients > 0 && (
                                            <View style={{ flex: metrics.femaleClients }} className="h-full bg-rose-400" />
                                        )}
                                        {metrics.maleClients > 0 && (
                                            <View style={{ flex: metrics.maleClients }} className="h-full bg-blue-400" />
                                        )}
                                        {metrics.otherClients > 0 && (
                                            <View style={{ flex: metrics.otherClients }} className="h-full bg-orange-400" />
                                        )}
                                    </View>

                                    {/* Legends */}
                                    <View className="flex-row justify-between">
                                        <View className="items-center">
                                            <View className="flex-row items-center">
                                                <View className="w-2.5 h-2.5 rounded-full bg-rose-400 mr-1.5" />
                                                <Typography variant="small" className={`${secondaryTextColor} text-[11px]`}>Female</Typography>
                                            </View>
                                            <Typography variant="body" weight="bold" className={`${textColor} text-[13px] mt-0.5`}>
                                                {((metrics.femaleClients / metrics.totalClients) * 100).toFixed(0)}% ({metrics.femaleClients})
                                            </Typography>
                                        </View>

                                        <View className="items-center">
                                            <View className="flex-row items-center">
                                                <View className="w-2.5 h-2.5 rounded-full bg-blue-400 mr-1.5" />
                                                <Typography variant="small" className={`${secondaryTextColor} text-[11px]`}>Male</Typography>
                                            </View>
                                            <Typography variant="body" weight="bold" className={`${textColor} text-[13px] mt-0.5`}>
                                                {((metrics.maleClients / metrics.totalClients) * 100).toFixed(0)}% ({metrics.maleClients})
                                            </Typography>
                                        </View>

                                        <View className="items-center">
                                            <View className="flex-row items-center">
                                                <View className="w-2.5 h-2.5 rounded-full bg-orange-400 mr-1.5" />
                                                <Typography variant="small" className={`${secondaryTextColor} text-[11px]`}>Other</Typography>
                                            </View>
                                            <Typography variant="body" weight="bold" className={`${textColor} text-[13px] mt-0.5`}>
                                                {((metrics.otherClients / metrics.totalClients) * 100).toFixed(0)}% ({metrics.otherClients})
                                            </Typography>
                                        </View>
                                    </View>
                                </View>
                            ) : (
                                <View className="items-center py-4">
                                    <Typography variant="caption" className={secondaryTextColor}>No clients added. Add clients to see statistics.</Typography>
                                </View>
                            )}
                        </Surface>
                    </GateWrapper>

                </ScrollView>

                <SubscriptionModal
                    visible={isSubscriptionModalVisible}
                    onClose={() => setIsSubscriptionModalVisible(false)}
                />
            </View>
        </View>
    );
}
