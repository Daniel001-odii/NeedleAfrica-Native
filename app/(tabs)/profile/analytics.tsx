import React, { useMemo, useState, useEffect } from 'react';
import { View, ScrollView, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import {
    ArrowLeft, Chart2, TrendUp, Activity, User, DollarCircle,
    ShoppingBag, ReceiptItem, People, DirectInbox, Eye
} from 'iconsax-react-native';
import { Typography } from '../../../components/ui/Typography';
import { IconButton } from '../../../components/ui/IconButton';
import { SectionCard } from '../../../components/ui/SectionCard';
import { useTheme } from '../../../contexts/ThemeContext';
import { useOrders } from '../../../hooks/useOrders';
import { useCustomers } from '../../../hooks/useCustomers';
import { useMeasurements } from '../../../hooks/useMeasurements';
import { useMeasurementTemplates } from '../../../hooks/useMeasurementTemplates';
import { useInvoices } from '../../../hooks/useInvoices';
import { useAuth } from '../../../contexts/AuthContext';
import axiosInstance from '../../../lib/axios';

export default function AnalyticsScreen() {
    const { isDark } = useTheme();
    const { orders } = useOrders();
    const { customers } = useCustomers();
    const { measurements } = useMeasurements();
    const { templates } = useMeasurementTemplates();
    const { invoices } = useInvoices();
    const { user } = useAuth();

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
        const totalOutstanding = activeOrders.reduce((sum, o) => sum + (o.balance || 0), 0);

        const avgOrderValue = totalOrders > 0 ? totalBooked / totalOrders : 0;

        // Pipeline Breakdown
        const activeStatuses: Record<string, number> = {
            DELIVERED: 0,
            IN_PROGRESS: 0,
            PENDING: 0,
            CANCELLED: 0,
        };
        activeOrders.forEach(o => {
            const st = (o.status || 'PENDING').toUpperCase();
            if (st === 'DELIVERED') activeStatuses.DELIVERED++;
            else if (['IN_PROGRESS', 'CUTTING', 'SEWING', 'FITTING', 'COMPLETED'].includes(st)) activeStatuses.IN_PROGRESS++;
            else if (st === 'CANCELLED') activeStatuses.CANCELLED++;
            else activeStatuses.PENDING++;
        });

        // Collection & Completion Rates
        const totalBilled = totalEarned + totalOutstanding;
        const collectionRate = totalBilled > 0 ? (totalEarned / totalBilled) * 100 : 0;
        const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

        // Customer Retention & Repeat Clients
        const totalClients = customers.length;
        const customerNameMap: Record<string, string> = {};
        customers.forEach(c => {
            customerNameMap[c.id] = c.fullName || 'Client';
        });

        const customerOrderMap: Record<string, { count: number; spend: number; name: string }> = {};
        activeOrders.forEach(o => {
            const cId = o.customerId || 'unknown';
            const cName = customerNameMap[cId] || 'Client';
            if (!customerOrderMap[cId]) {
                customerOrderMap[cId] = { count: 0, spend: 0, name: cName };
            }
            customerOrderMap[cId].count++;
            customerOrderMap[cId].spend += o.amountPaid || o.amount || 0;
        });

        const clientOrderCounts = Object.values(customerOrderMap);
        const repeatClientsCount = clientOrderCounts.filter(c => c.count > 1).length;
        const singleOrderClientsCount = clientOrderCounts.filter(c => c.count === 1).length;
        const repeatRate = totalClients > 0
            ? (repeatClientsCount / totalClients) * 100
            : (clientOrderCounts.length > 0 ? (repeatClientsCount / clientOrderCounts.length) * 100 : 0);

        // Top VIP Clients by spend
        const vipClients = [...clientOrderCounts]
            .filter(c => c.name !== 'Client' && c.name !== 'unknown')
            .sort((a, b) => b.spend - a.spend)
            .slice(0, 4);

        // Gender breakdown
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

        // Turnaround speed: duration between createdAt and updatedAt for DELIVERED orders
        const completedOrdersList = activeOrders.filter(o => o.status === 'DELIVERED' && o.createdAt && o.updatedAt);
        const speedDurations = completedOrdersList.map(o => {
            const created = o.createdAt ? new Date(o.createdAt).getTime() : 0;
            const updated = o.updatedAt ? new Date(o.updatedAt).getTime() : 0;
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
            totalBilled,
            collectionRate,
            completionRate,
            activeStatuses,
            totalClients,
            femaleClients,
            maleClients,
            otherClients,
            repeatClientsCount,
            singleOrderClientsCount,
            repeatRate,
            vipClients,
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
        return Math.max(...vals, 1000);
    }, [metrics.monthlyData]);

    return (
        <View className={`flex-1 ${bgColor}`}>
            {/* Header */}
            <View className={`px-4 pt-2 pb-2 flex-row items-center justify-between ${headerBgColor}`}>
                <View className="flex-row items-center">
                    <IconButton icon={<ArrowLeft size={22} color={isDark ? 'white' : 'black'} />} onPress={() => router.back()} variant="ghost" />
                    <Typography variant="h3" weight="bold" className="ml-2">Business Analytics</Typography>
                </View>
            </View>

            <ScrollView
                contentContainerClassName="p-5 pb-12"
                showsVerticalScrollIndicator={false}
            >
                {/* 1. FINANCIAL OVERVIEW */}
                <SectionCard
                    icon={DollarCircle}
                    title="Financial Overview"
                    innerClassName="p-4"
                    className="mb-4"
                >
                    <View className="flex-row items-center justify-between pb-3.5 border-b border-gray-100 dark:border-zinc-700/50">
                        <View className="flex-1 pr-2">
                            <Typography variant="caption" color="gray" className="text-[11px] uppercase tracking-wider mb-0.5">Total Revenue</Typography>
                            <Typography variant="h3" weight="bold" className="text-emerald-600 dark:text-emerald-400 text-[18px]">
                                {formatCurrencyVal(metrics.totalEarned)}
                            </Typography>
                        </View>
                        <View className="flex-1 pl-3 border-l border-gray-100 dark:border-zinc-700/50">
                            <Typography variant="caption" color="gray" className="text-[11px] uppercase tracking-wider mb-0.5">Outstanding</Typography>
                            <Typography variant="h3" weight="bold" className="text-red-500 dark:text-red-400 text-[18px]">
                                {formatCurrencyVal(metrics.totalOutstanding)}
                            </Typography>
                        </View>
                    </View>

                    <View className="flex-row items-center justify-between pt-3.5">
                        <View className="flex-1 pr-2">
                            <Typography variant="caption" color="gray" className="text-[11px] uppercase tracking-wider mb-0.5">Avg Order Value</Typography>
                            <Typography variant="h3" weight="bold" className={`${textColor} text-[18px]`}>
                                {formatCurrencyVal(metrics.avgOrderValue)}
                            </Typography>
                        </View>
                        <View className="flex-1 pl-3 border-l border-gray-100 dark:border-zinc-700/50">
                            <Typography variant="caption" color="gray" className="text-[11px] uppercase tracking-wider mb-0.5">Total Invoiced</Typography>
                            <Typography variant="h3" weight="bold" className={`${textColor} text-[18px]`}>
                                {formatCurrencyVal(metrics.totalInvoiced)}
                            </Typography>
                        </View>
                    </View>

                    {/* Collection Rate Bar */}
                    <View className="mt-4 pt-3.5 border-t border-gray-100 dark:border-zinc-700/50">
                        <View className="flex-row items-center justify-between mb-1.5">
                            <Typography variant="caption" color="gray" className="text-[12px] font-medium">Payment Collection Rate</Typography>
                            <Typography variant="small" weight="bold" className="text-emerald-600 dark:text-emerald-400 text-[12px]">
                                {metrics.collectionRate.toFixed(0)}%
                            </Typography>
                        </View>
                        <View className="h-2 w-full bg-gray-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                            <View style={{ width: `${Math.min(100, Math.max(metrics.collectionRate, 0))}%` }} className="h-full bg-emerald-500 rounded-full" />
                        </View>
                    </View>
                </SectionCard>

                {/* 2. REVENUE TREND OVER TIME */}
                <SectionCard
                    icon={TrendUp}
                    title="Revenue Over Time (Last 6 Months)"
                    innerClassName="p-4"
                    className="mb-4"
                >
                    <View className="h-44 flex-row items-end justify-between px-2 pt-4">
                        {metrics.monthlyData.map((d, index) => {
                            const pct = Math.max((d.value / maxEarningsVal) * 100, 4);
                            return (
                                <View key={index} className="items-center flex-1">
                                    {d.value > 0 ? (
                                        <Typography variant="small" weight="bold" className={`text-[8px] mb-1 ${textColor}`} numberOfLines={1}>
                                            {d.value >= 1000 ? `${(d.value / 1000).toFixed(0)}k` : d.value}
                                        </Typography>
                                    ) : (
                                        <Typography variant="small" className="text-[8px] mb-1 opacity-0">0</Typography>
                                    )}
                                    <View
                                        style={{ height: `${pct}%` }}
                                        className="w-6 rounded-t-md bg-blue-600 dark:bg-blue-500"
                                    />
                                    <Typography variant="caption" className={`text-[10px] mt-2 ${secondaryTextColor}`}>
                                        {d.month.split(' ')[0]}
                                    </Typography>
                                </View>
                            );
                        })}
                    </View>
                </SectionCard>

                {/* 3. ORDER PIPELINE & FULFILLMENT */}
                <SectionCard
                    icon={ShoppingBag}
                    title="Order Pipeline & Fulfillment"
                    innerClassName="p-4"
                    className="mb-4"
                >
                    <View className="flex-row items-center justify-between mb-4">
                        <View>
                            <Typography variant="caption" color="gray" className="text-[11px] uppercase tracking-wider">Total Orders</Typography>
                            <Typography variant="h2" weight="bold" className={`mt-0.5 ${textColor}`}>{metrics.totalOrders}</Typography>
                        </View>
                        <View className="items-end">
                            <Typography variant="caption" color="gray" className="text-[11px] uppercase tracking-wider">Fulfillment Rate</Typography>
                            <Typography variant="h2" weight="bold" className="mt-0.5 text-blue-600 dark:text-blue-400">
                                {metrics.completionRate.toFixed(0)}%
                            </Typography>
                        </View>
                    </View>

                    {/* Segmented Pipeline Bar */}
                    <View className="h-3 w-full bg-gray-100 dark:bg-zinc-700 rounded-full flex-row overflow-hidden mb-3">
                        {metrics.activeStatuses.DELIVERED > 0 && (
                            <View style={{ flex: metrics.activeStatuses.DELIVERED }} className="h-full bg-emerald-500" />
                        )}
                        {metrics.activeStatuses.IN_PROGRESS > 0 && (
                            <View style={{ flex: metrics.activeStatuses.IN_PROGRESS }} className="h-full bg-blue-500" />
                        )}
                        {metrics.activeStatuses.PENDING > 0 && (
                            <View style={{ flex: metrics.activeStatuses.PENDING }} className="h-full bg-amber-500" />
                        )}
                        {metrics.activeStatuses.CANCELLED > 0 && (
                            <View style={{ flex: metrics.activeStatuses.CANCELLED }} className="h-full bg-zinc-400" />
                        )}
                    </View>

                    {/* Pipeline Legends */}
                    <View className="flex-row flex-wrap justify-between pt-1 gap-y-2">
                        <View className="flex-row items-center mr-2">
                            <View className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5" />
                            <Typography variant="small" color="gray" className="text-[11px]">Delivered ({metrics.activeStatuses.DELIVERED})</Typography>
                        </View>
                        <View className="flex-row items-center mr-2">
                            <View className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-1.5" />
                            <Typography variant="small" color="gray" className="text-[11px]">In Progress ({metrics.activeStatuses.IN_PROGRESS})</Typography>
                        </View>
                        <View className="flex-row items-center mr-2">
                            <View className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-1.5" />
                            <Typography variant="small" color="gray" className="text-[11px]">Pending ({metrics.activeStatuses.PENDING})</Typography>
                        </View>
                        {metrics.activeStatuses.CANCELLED > 0 && (
                            <View className="flex-row items-center">
                                <View className="w-2.5 h-2.5 rounded-full bg-zinc-400 mr-1.5" />
                                <Typography variant="small" color="gray" className="text-[11px]">Cancelled ({metrics.activeStatuses.CANCELLED})</Typography>
                            </View>
                        )}
                    </View>
                </SectionCard>

                {/* 4. TURNAROUND SPEED */}
                <SectionCard
                    icon={Activity}
                    title="Order Turnaround Speed"
                    rightElement={
                        <Typography variant="caption" color="gray" className="text-[11px]">
                            {metrics.totalCompleted} Completed
                        </Typography>
                    }
                    innerClassName="p-4"
                    className="mb-4"
                >
                    {metrics.totalCompleted > 0 ? (
                        <View>
                            <View className="flex-row justify-between mb-4">
                                <View className="items-center flex-1">
                                    <Typography variant="caption" className={secondaryTextColor}>Avg. Speed</Typography>
                                    <Typography variant="h2" weight="bold" className={`mt-0.5 ${textColor}`}>
                                        {metrics.avgSpeedDays.toFixed(1)} <Typography variant="small" color="gray" weight="semibold">days</Typography>
                                    </Typography>
                                </View>
                                <View className="w-[1px] h-10 bg-gray-100 dark:bg-zinc-700 self-center" />
                                <View className="items-center flex-1">
                                    <Typography variant="caption" className={secondaryTextColor}>Fastest Delivery</Typography>
                                    <Typography variant="h2" weight="bold" className={`mt-0.5 ${textColor}`}>
                                        {metrics.fastestDays} <Typography variant="small" color="gray" weight="semibold">days</Typography>
                                    </Typography>
                                </View>
                            </View>

                            <View className="h-3 w-full bg-gray-100 dark:bg-zinc-700 rounded-full flex-row overflow-hidden mb-3">
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

                            <View className="flex-row justify-between">
                                <View className="items-center">
                                    <View className="flex-row items-center">
                                        <View className="w-2 h-2 rounded-full bg-green-400 mr-1" />
                                        <Typography variant="small" className={`${secondaryTextColor} text-[10px]`}>Express (0-3d)</Typography>
                                    </View>
                                    <Typography variant="body" weight="bold" className={`${textColor} text-[12px] mt-0.5`}>
                                        {((metrics.speedDistribution.express / metrics.totalCompleted) * 100).toFixed(0)}% ({metrics.speedDistribution.express})
                                    </Typography>
                                </View>

                                <View className="items-center">
                                    <View className="flex-row items-center">
                                        <View className="w-2 h-2 rounded-full bg-indigo-400 mr-1" />
                                        <Typography variant="small" className={`${secondaryTextColor} text-[10px]`}>Standard (4-7d)</Typography>
                                    </View>
                                    <Typography variant="body" weight="bold" className={`${textColor} text-[12px] mt-0.5`}>
                                        {((metrics.speedDistribution.standard / metrics.totalCompleted) * 100).toFixed(0)}% ({metrics.speedDistribution.standard})
                                    </Typography>
                                </View>

                                <View className="items-center">
                                    <View className="flex-row items-center">
                                        <View className="w-2 h-2 rounded-full bg-amber-400 mr-1" />
                                        <Typography variant="small" className={`${secondaryTextColor} text-[10px]`}>Extended (8d+)</Typography>
                                    </View>
                                    <Typography variant="body" weight="bold" className={`${textColor} text-[12px] mt-0.5`}>
                                        {((metrics.speedDistribution.extended / metrics.totalCompleted) * 100).toFixed(0)}% ({metrics.speedDistribution.extended})
                                    </Typography>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View className="items-center py-4">
                            <Typography variant="caption" className={secondaryTextColor}>Complete and deliver orders to track your turnaround speed.</Typography>
                        </View>
                    )}
                </SectionCard>

                {/* 5. CLIENT RETENTION & VIP CLIENTS */}
                <SectionCard
                    icon={People}
                    title="Client Retention & Loyalty"
                    innerClassName="p-4"
                    className="mb-4"
                >
                    <View className="flex-row items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-700/50">
                        <View className="flex-1 pr-2">
                            <Typography variant="caption" color="gray" className="text-[11px] uppercase tracking-wider mb-0.5">Total Clients</Typography>
                            <Typography variant="h3" weight="bold" className={`${textColor} text-[18px]`}>{metrics.totalClients}</Typography>
                        </View>
                        <View className="flex-1 pl-3 border-l border-gray-100 dark:border-zinc-700/50">
                            <Typography variant="caption" color="gray" className="text-[11px] uppercase tracking-wider mb-0.5">Repeat Rate</Typography>
                            <Typography variant="h3" weight="bold" className="text-blue-600 dark:text-blue-400 text-[18px]">
                                {metrics.repeatRate.toFixed(0)}%
                            </Typography>
                        </View>
                    </View>

                    <View className="py-2.5">
                        <Typography variant="small" color="gray" className="text-[12px]">
                            {metrics.repeatClientsCount} Repeat Clients • {metrics.singleOrderClientsCount} First-time Clients
                        </Typography>
                    </View>

                    {metrics.vipClients.length > 0 && (
                        <View className="pt-3 border-t border-gray-100 dark:border-zinc-700/50">
                            <Typography variant="caption" weight="bold" className={`mb-2.5 uppercase ${secondaryTextColor} text-[10px]`}>
                                Top VIP Clients by Spend
                            </Typography>
                            {metrics.vipClients.map((client, idx) => (
                                <View key={idx} className="flex-row items-center justify-between py-2 border-b border-gray-50 dark:border-zinc-800/40 last:border-0">
                                    <View className="flex-row items-center flex-1 mr-3">
                                        <View className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/30 items-center justify-center mr-2 shrink-0">
                                            <Typography variant="small" weight="bold" className="text-[10px] text-blue-600 dark:text-blue-400">{idx + 1}</Typography>
                                        </View>
                                        <Typography variant="body" weight="semibold" numberOfLines={1} ellipsizeMode="tail" className={`text-[13px] flex-1 ${textColor}`}>{client.name}</Typography>
                                    </View>
                                    <View className="items-end shrink-0">
                                        <Typography variant="small" weight="bold" className="text-[12px] text-emerald-600 dark:text-emerald-400">
                                            {formatCurrencyVal(client.spend)}
                                        </Typography>
                                        <Typography variant="caption" color="gray" className="text-[10px]">{client.count} order(s)</Typography>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </SectionCard>

                {/* 6. TOP SERVICES / STYLES DEMAND */}
                <SectionCard
                    icon={Chart2}
                    title="Top Styles & Demand"
                    innerClassName="p-4"
                    className="mb-4"
                >
                    {metrics.topServices.length > 0 ? (
                        <View>
                            {metrics.topServices.map((service, index) => {
                                const maxCount = metrics.topServices[0].count;
                                const barPct = `${(service.count / maxCount) * 100}%`;
                                return (
                                    <View key={index} className="mb-3.5 last:mb-0">
                                        <View className="flex-row items-center justify-between mb-1.5">
                                            <Typography
                                                variant="body"
                                                weight="semibold"
                                                numberOfLines={1}
                                                ellipsizeMode="tail"
                                                className={`text-[13px] flex-1 mr-3 ${textColor}`}
                                            >
                                                {service.name}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                weight="bold"
                                                className={`shrink-0 ${secondaryTextColor}`}
                                            >
                                                {service.count} order(s)
                                            </Typography>
                                        </View>
                                        <View className="h-2 w-full bg-gray-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                                            <View style={{ width: barPct as any }} className="h-full bg-blue-600 dark:bg-blue-500 rounded-full" />
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    ) : (
                        <View className="items-center py-4">
                            <Typography variant="caption" className={secondaryTextColor}>No style orders yet. Create orders to view metrics.</Typography>
                        </View>
                    )}
                </SectionCard>

                {/* 7. CLIENT DEMOGRAPHICS */}
                <SectionCard
                    icon={User}
                    title="Client Demographics"
                    rightElement={
                        <Typography variant="caption" color="gray" className="text-[11px]">
                            {metrics.totalClients} Total
                        </Typography>
                    }
                    innerClassName="p-4"
                    className="mb-4"
                >
                    {metrics.totalClients > 0 ? (
                        <View>
                            <View className="h-3 w-full bg-gray-100 dark:bg-zinc-700 rounded-full flex-row overflow-hidden mb-3">
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

                            <View className="flex-row justify-between">
                                <View className="items-center">
                                    <View className="flex-row items-center">
                                        <View className="w-2 h-2 rounded-full bg-rose-400 mr-1" />
                                        <Typography variant="small" className={`${secondaryTextColor} text-[11px]`}>Female</Typography>
                                    </View>
                                    <Typography variant="body" weight="bold" className={`${textColor} text-[12px] mt-0.5`}>
                                        {((metrics.femaleClients / metrics.totalClients) * 100).toFixed(0)}% ({metrics.femaleClients})
                                    </Typography>
                                </View>

                                <View className="items-center">
                                    <View className="flex-row items-center">
                                        <View className="w-2 h-2 rounded-full bg-blue-400 mr-1" />
                                        <Typography variant="small" className={`${secondaryTextColor} text-[11px]`}>Male</Typography>
                                    </View>
                                    <Typography variant="body" weight="bold" className={`${textColor} text-[12px] mt-0.5`}>
                                        {((metrics.maleClients / metrics.totalClients) * 100).toFixed(0)}% ({metrics.maleClients})
                                    </Typography>
                                </View>

                                <View className="items-center">
                                    <View className="flex-row items-center">
                                        <View className="w-2 h-2 rounded-full bg-orange-400 mr-1" />
                                        <Typography variant="small" className={`${secondaryTextColor} text-[11px]`}>Other</Typography>
                                    </View>
                                    <Typography variant="body" weight="bold" className={`${textColor} text-[12px] mt-0.5`}>
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
                </SectionCard>

                {/* 8. WORKSHOP PRODUCTIVITY */}
                <SectionCard
                    icon={ReceiptItem}
                    title="Workshop Assets & Records"
                    innerClassName="p-4"
                    className="mb-4"
                >
                    <View className="flex-row items-center justify-between">
                        <View className="items-center flex-1">
                            <Typography variant="caption" color="gray" className="text-[10px] uppercase tracking-wider mb-0.5">Measurements</Typography>
                            <Typography variant="h3" weight="bold" className={`${textColor}`}>{metrics.totalMeasurements}</Typography>
                            <Typography variant="caption" color="gray" className="text-[10px]">Profiles</Typography>
                        </View>
                        <View className="w-[1px] h-10 bg-gray-100 dark:bg-zinc-700 self-center" />
                        <View className="items-center flex-1">
                            <Typography variant="caption" color="gray" className="text-[10px] uppercase tracking-wider mb-0.5">Templates</Typography>
                            <Typography variant="h3" weight="bold" className={`${textColor}`}>{metrics.totalTemplates}</Typography>
                            <Typography variant="caption" color="gray" className="text-[10px]">Drafts</Typography>
                        </View>
                        <View className="w-[1px] h-10 bg-gray-100 dark:bg-zinc-700 self-center" />
                        <View className="items-center flex-1">
                            <Typography variant="caption" color="gray" className="text-[10px] uppercase tracking-wider mb-0.5">Invoices</Typography>
                            <Typography variant="h3" weight="bold" className={`${textColor}`}>{metrics.totalInvoices}</Typography>
                            <Typography variant="caption" color="gray" className="text-[10px]">Generated</Typography>
                        </View>
                    </View>
                </SectionCard>

                {/* 9. STOREFRONT WEB PERFORMANCE */}
                <SectionCard
                    icon={Eye}
                    title="Storefront Web Performance"
                    innerClassName="p-4"
                    className="mb-6"
                >
                    {loadingStorefront ? (
                        <View className="items-center justify-center py-6">
                            <ActivityIndicator color={isDark ? "#ffffff" : "#000000"} />
                            <Typography variant="caption" className={`mt-2 ${secondaryTextColor}`}>Loading online storefront analytics...</Typography>
                        </View>
                    ) : storefrontData ? (
                        <View>
                            <View className="flex-row items-center justify-between pb-3.5 border-b border-gray-100 dark:border-zinc-700/50">
                                <View className="flex-1 pr-2">
                                    <Typography variant="caption" color="gray" className="text-[11px] uppercase tracking-wider mb-0.5">Storefront Views</Typography>
                                    <Typography variant="h3" weight="bold" className={`${textColor} text-[18px]`}>{storefrontData.catalogViews}</Typography>
                                </View>
                                <View className="flex-1 pl-3 border-l border-gray-100 dark:border-zinc-700/50">
                                    <Typography variant="caption" color="gray" className="text-[11px] uppercase tracking-wider mb-0.5">Product Views</Typography>
                                    <Typography variant="h3" weight="bold" className={`${textColor} text-[18px]`}>{storefrontData.catalogItemViews}</Typography>
                                </View>
                            </View>

                            <View className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-zinc-700/50">
                                <View className="flex-row items-center">
                                    <DirectInbox size={18} color="#FF5678" variant="Bulk" />
                                    <Typography weight="semibold" className={`ml-2 text-[13px] ${textColor}`}>Incoming Requests</Typography>
                                </View>
                                <View className="bg-red-500/10 px-2.5 py-0.5 rounded-full">
                                    <Typography variant="caption" weight="bold" className="text-red-500 text-[11px]">
                                        {storefrontData.orderRequestsPending} Pending ({storefrontData.orderRequestsTotal} total)
                                    </Typography>
                                </View>
                            </View>

                            {storefrontData.topCatalogItems.length > 0 ? (
                                <View className="pt-3">
                                    <Typography variant="caption" weight="bold" className={`mb-2.5 uppercase ${secondaryTextColor} text-[10px]`}>
                                        Top Viewed Catalog Styles
                                    </Typography>
                                    {storefrontData.topCatalogItems.map((item, index) => (
                                        <View key={item.id} className="flex-row items-center justify-between py-2 border-b border-gray-50 dark:border-zinc-800/40 last:border-0">
                                            <View className="flex-row items-center flex-1 mr-3">
                                                <Typography variant="body" weight="bold" className={`text-[12px] mr-2 shrink-0 ${secondaryTextColor}`}>{index + 1}</Typography>
                                                <Typography variant="body" weight="semibold" numberOfLines={1} ellipsizeMode="tail" className={`text-[13px] flex-1 ${textColor}`}>{item.name}</Typography>
                                            </View>
                                            <View className="flex-row items-center shrink-0">
                                                <Eye size={13} color="#9CA3AF" style={{ marginRight: 4 }} />
                                                <Typography variant="small" className={`${secondaryTextColor} text-[11px]`}>{item.views} views</Typography>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <Typography variant="caption" color="gray" className="text-center py-2 text-[11px]">
                                    Add items and publish your catalog to start tracking item clicks!
                                </Typography>
                            )}
                        </View>
                    ) : (
                        <View className="items-center py-4">
                            <Typography variant="caption" color="gray" className="text-center text-[12px]">
                                Could not connect to fetch online catalog stats. Ensure you are online.
                            </Typography>
                        </View>
                    )}
                </SectionCard>
            </ScrollView>
        </View>
    );
}
