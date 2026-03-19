import React, { useCallback, useMemo, useState } from 'react';
import { View, ScrollView, Pressable, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Notification, Calendar, Box, ArrowRight, Wallet, People, Timer1, Add, Gallery, User, MagicStar, DocumentText, Ruler, Eye, EyeSlash, MoneyRecive, MoneySend } from 'iconsax-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Surface } from '../../components/ui/Surface';
import { Typography } from '../../components/ui/Typography';
import { IconButton } from '../../components/ui/IconButton';
import { useSync } from '../../hooks/useSync';
import { useOrders } from '../../hooks/useOrders';
import { useCustomers } from '../../hooks/useCustomers';
import { useTheme } from '../../contexts/ThemeContext';
import { database } from '../../database/watermelon';
import Svg, { Path } from 'react-native-svg';

export default function Home() {
    const { user } = useAuth();
    const router = useRouter();
    const { isSyncing, sync: performSync } = useSync();
    const { orders, loading: ordersLoading } = useOrders();
    const { customers, loading: customersLoading } = useCustomers();
    const { isDark } = useTheme();
    const [balanceVisible, setBalanceVisible] = useState(true);

    const onRefresh = useCallback(async () => {
        await performSync();
    }, [performSync]);



    // Add inside the component, after hooks:
    React.useEffect(() => {
        (async () => {
            const customers = await database.get('customers').query().fetch();
            const orders = await database.get('orders').query().fetch();
            console.log('=== DB DUMP ===');
            console.log(`Customers (${customers.length}):`, customers.map((c: any) => ({ id: c.id, name: c.fullName, phone: c.phoneNumber })));
            console.log(`Orders (${orders.length}):`, orders.map((o: any) => ({ id: o.id, style: o.styleName, status: o.status, amount: o.amount })));
            console.log('=== END ===');
        })();
    }, []);


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
        <View className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-white'}`}>
            <ScrollView
                contentContainerClassName="p-6 pb-12"
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isSyncing} onRefresh={onRefresh} />}
            >
                {/* Header */}
                <View className="flex-row justify-between items-center mb-6">
                    <View>
                        <Typography variant="h3" weight="bold" className={isDark ? 'text-white' : 'text-black'}>Hello, {user?.username || 'Tailor'}</Typography>
                        <Typography variant="caption" weight="bold" color="gray">Today {today}</Typography>
                    </View>
                </View>

                {isNewUser ? (
                    <EmptyStateHome router={router} />
                ) : (
                    <>
                        {/* Balance Section */}
                        <View className="mb-8">
                            <View className={`rounded-3xl overflow-hidden ${isDark ? 'bg-blue-900/20 border border-blue-500/20' : 'bg-blue-500 shadow-xl shadow-blue-100'}`} style={{ padding: 20 }}>
                                {/* Header Row: Label + Eye Toggle */}
                                <View className="flex-row items-center justify-between mb-3">
                                    <View className="flex-row items-center">
                                        <View className={`w-6 h-6 rounded-full ${isDark ? 'bg-blue-400/20' : 'bg-white/20'} items-center justify-center mr-2`}>
                                            <MoneyRecive size={12} color={isDark ? "#60A5FA" : "#E0F2FE"} variant="Bold" />
                                        </View>
                                        <Typography variant="small" weight="medium" color="white" className="opacity-80">Total Earned</Typography>
                                    </View>
                                    <Pressable
                                        onPress={() => setBalanceVisible(!balanceVisible)}
                                        hitSlop={12}
                                        className="p-1"
                                    >
                                        {balanceVisible ? (
                                            <Eye size={18} color="rgba(255,255,255,0.7)" variant="Bulk" />
                                        ) : (
                                            <EyeSlash size={18} color="rgba(255,255,255,0.7)" variant="Bulk" />
                                        )}
                                    </Pressable>
                                </View>

                                {/* Amount */}
                                <Typography variant="h2" weight="bold" color="white" className="text-3xl mb-3 tracking-tight">
                                    {balanceVisible ? formatCurrency(stats.totalEarned) : '\u2022\u2022\u2022\u2022\u2022\u2022'}
                                </Typography>

                                {/* Divider */}
                                <View className="h-px bg-white/10 mb-4" />

                                {/* Bottom Row: Outstanding + Pending Count */}
                                <View className="flex-row items-center justify-between">
                                    <View>
                                        <View className="flex-row items-center mb-0.5">
                                            <View className="w-4 h-4 rounded-full bg-red-400/20 items-center justify-center mr-1.5">
                                                <MoneySend size={9} color="#FECACA" variant="Bold" />
                                            </View>
                                            <Typography variant="small" weight="medium" color="white" className="opacity-70 text-[11px]">Outstanding</Typography>
                                        </View>
                                        <Typography variant="body" weight="bold" color="white" className="text-lg">
                                            {balanceVisible ? formatCurrency(stats.totalDebt) : '\u2022\u2022\u2022\u2022\u2022\u2022'}
                                        </Typography>
                                    </View>
                                    <View className="bg-white/10 px-4 py-2 rounded-2xl">
                                        <Typography variant="small" weight="bold" color="white" className="text-[11px]">
                                            {stats.pendingCount} Ongoing
                                        </Typography>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Quick Access */}
                        <View className="mb-8">
                            <Typography variant="h3" weight="bold" className="mb-4">Quick Actions</Typography>
                            <View className="flex-row gap-6">
                                <QuickAccessItem
                                    icon={<Add size={24} color={isDark ? 'black' : 'white'} />}
                                    label="Order"
                                    bg={isDark ? 'bg-white' : 'bg-black'}
                                    onPress={() => router.push('/(tabs)/orders/new')}
                                />
                                <QuickAccessItem
                                    icon={<Ruler size={24} color={isDark ? '#C5C1FF' : '#6366f1'} />}
                                    label="Measure"
                                    bg={isDark ? 'bg-indigo-900/30' : 'bg-accent-lavender'}
                                    borderClass={isDark ? 'border-indigo-500/30' : ''}
                                    onPress={() => router.push('/measurements/create')}
                                />
                                <QuickAccessItem
                                    icon={<People size={24} color={isDark ? '#FBBF24' : '#D97706'} />}
                                    label="Client"
                                    bg={isDark ? 'bg-orange-900/30' : 'bg-accent-peach'}
                                    borderClass={isDark ? 'border-orange-500/30' : ''}
                                    onPress={() => router.push('/(tabs)/customers/new')}
                                />
                                <QuickAccessItem
                                    icon={<DocumentText size={24} color={isDark ? '#93C5FD' : '#2563EB'} />}
                                    label="Invoice"
                                    bg={isDark ? 'bg-blue-900/30' : 'bg-accent-blue'}
                                    borderClass={isDark ? 'border-blue-500/30' : ''}
                                    onPress={() => router.push('/(tabs)/orders/invoices/new')}
                                />
                            </View>
                        </View>

                        {/* Insights Grid */}
                        <Typography variant="h3" weight="bold" className="mb-4">Workshop Insights</Typography>
                        <View className="flex-row gap-4 mb-8">
                            {/* Left Column */}
                            <View className="flex-1 gap-4">
                                <View className={`p-4 h-40 justify-between rounded-3xl border ${isDark ? 'bg-orange-900/20 border-orange-500/30' : 'bg-soft-peach border-transparent'}`}>
                                    <View className="flex-row justify-between items-start">
                                        <View className={`w-9 h-9 ${isDark ? 'bg-white/10' : 'bg-white/50'} rounded-full items-center justify-center`}>
                                            <Box size={18} color={isDark ? '#FB923C' : '#EA580C'} variant="Bulk" />
                                        </View>
                                        <View className={`px-2 py-0.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-white/70'}`}>
                                            <Typography variant="small" weight="bold" className={`text-[9px] ${isDark ? 'text-orange-400' : 'text-orange-700'}`}>+{stats.newToday} today</Typography>
                                        </View>
                                    </View>
                                    <View>
                                        <View className="flex-row items-end">
                                            <Typography variant="h1" weight="bold" className={`leading-none ${isDark ? 'text-white' : 'text-black'}`}>{stats.pendingCount}</Typography>
                                            <Typography variant="caption" color="gray" weight="bold" className="mb-1 ml-2">Active</Typography>
                                        </View>
                                        <View className="mt-1.5 flex-row items-center">
                                            <View className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-2" />
                                            <Typography variant="small" color="gray" className="text-[10px]">{stats.dueSoon} due this week</Typography>
                                        </View>
                                    </View>
                                </View>

                                <View className={`p-4 h-28 justify-between rounded-3xl border ${isDark ? 'bg-red-900/20 border-red-500/30' : 'bg-surface-muted border-transparent'}`}>
                                    <View className="flex-row items-center justify-between">
                                        <View className={`w-8 h-8 ${isDark ? 'bg-white/10' : 'bg-white'} items-center justify-center rounded-xl`}>
                                            <Wallet size={16} color="#dc2626" variant="Bulk" />
                                        </View>
                                        <Typography variant="small" weight="bold" color="red" className="text-[10px] uppercase">Owed</Typography>
                                    </View>
                                    <View>
                                        <Typography variant="body" weight="bold" color="red" className="text-base">{formatCurrency(stats.totalDebt)}</Typography>
                                        <Typography variant="small" color="gray" weight="bold" className="text-[10px]">Total Debt</Typography>
                                    </View>
                                </View>

                                <View className={`p-4 h-28 justify-between rounded-3xl border ${isDark ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-surface-muted border-transparent'}`}>
                                    <Pressable onPress={() => router.push('/(tabs)/customers/')} className="flex-1 justify-between">
                                        <View className="flex-row items-center justify-between">
                                            <View className={`w-8 h-8 ${isDark ? 'bg-white/10' : 'bg-white'} items-center justify-center rounded-xl`}>
                                                <People size={16} color={isDark ? '#818CF8' : 'black'} variant="Bulk" />
                                            </View>
                                            <Typography variant="small" weight="bold" color="gray" className="text-[10px] uppercase">Clients</Typography>
                                        </View>
                                        <View>
                                            <Typography variant="h3" weight="bold">{stats.totalCustomers}</Typography>
                                            <Typography variant="small" color="gray" weight="bold" className="text-[10px]">Active Base</Typography>
                                        </View>
                                    </Pressable>
                                </View>
                            </View>

                            {/* Right Column */}
                            <View className="flex-1 gap-4">
                                <View className={`p-4 h-48 justify-between rounded-3xl border ${isDark ? 'bg-blue-900/20 border-blue-500/30' : 'bg-soft-blue border-transparent'}`}>
                                    <View className="flex-row items-center justify-between">
                                        <View className={`w-9 h-9 ${isDark ? 'bg-white/10' : 'bg-white/50'} rounded-full items-center justify-center`}>
                                            <Wallet size={18} color={isDark ? '#60A5FA' : '#3B82F6'} variant="Bulk" />
                                        </View>
                                        <Typography variant="small" weight="bold" className={`text-[10px] uppercase ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>Earnings</Typography>
                                    </View>
                                    <View>
                                        <Typography variant="h2" weight="bold" className={`text-2xl ${isDark ? 'text-white' : 'text-black'}`}>{formatCurrency(stats.revenue)}</Typography>
                                        <Typography variant="small" color="gray" weight="bold" className="text-[10px]">This Week</Typography>
                                    </View>
                                </View>

                                <View className={`p-4 flex-1 justify-between rounded-3xl border ${isDark ? 'bg-green-900/20 border-green-500/30' : 'bg-soft-green border-transparent'}`}>
                                    <View className="flex-row justify-between items-start">
                                        <View className={`w-9 h-9 ${isDark ? 'bg-white/10' : 'bg-white/50'} rounded-full items-center justify-center`}>
                                            <Timer1 size={18} color={isDark ? '#4ADE80' : '#15803d'} variant="Bulk" />
                                        </View>
                                        {stats.nextDeadline && (
                                            <View className={`px-2 py-0.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-green-100'}`}>
                                                <Typography variant="small" weight="bold" className={`text-[9px] ${isDark ? 'text-green-400' : 'text-green-800'}`}>NEXT</Typography>
                                            </View>
                                        )}
                                    </View>
                                    <View>
                                        {stats.nextDeadline ? (
                                            <>
                                                <Typography variant="small" weight="bold" className={`leading-tight mb-1 ${isDark ? 'text-white' : 'text-black'}`} numberOfLines={2}>
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
                                </View>
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

function EmptyStateHome({ router }: { router: any }) {
    const { isDark } = useTheme();

    return (
        <View className="py-10">
            {/* <Surface variant="muted" className="p-8 items-center mb-10" rounded="3xl"> */}
            <View className="items-center">
                <View className={`w-20 h-20 ${isDark ? 'bg-surface-muted-dark' : 'bg-white'} items-center justify-center mb-6 rounded-full`}>
                    {/* <MagicStar size={40} color="#7c3aed" variant="Bulk" /> */}

                    <Svg fontSize={40} color="#7c3aed" viewBox="0 0 24 24">{/* Icon from Solar by 480 Design - https://creativecommons.org/licenses/by/4.0/ */}
                        <Path fill="currentColor" d="M15.252 10.689c-.987-1.18-1.48-1.77-2.048-1.68c-.567.091-.832.803-1.362 2.227l-.138.368c-.15.405-.226.607-.373.756c-.146.149-.348.228-.75.386l-.367.143c-1.417.555-2.126.833-2.207 1.4s.52 1.049 1.721 2.011l.31.25c.342.273.513.41.611.597c.1.187.115.404.146.837l.029.394c.11 1.523.166 2.285.683 2.545s1.154-.155 2.427-.983l.329-.215c.362-.235.543-.353.75-.387c.208-.033.42.022.841.132l.385.1c1.485.386 2.228.58 2.629.173s.193-1.144-.221-2.62l-.108-.38c-.117-.42-.176-.63-.147-.837c.03-.208.145-.39.374-.756l.21-.332c.807-1.285 1.21-1.927.94-2.438c-.269-.511-1.033-.553-2.562-.635l-.396-.022c-.434-.023-.652-.035-.841-.13c-.19-.095-.33-.263-.61-.599z" /><Path fill="currentColor" d="M10.331 4.252c1.316-1.574 1.974-2.361 2.73-2.24s1.11 1.07 1.817 2.969l.183.491c.201.54.302.81.497 1.008c.196.199.464.304 1.001.514l.489.192c1.89.74 2.835 1.11 2.942 1.866c.108.757-.693 1.398-2.294 2.682l-.414.332c-.455.365-.683.547-.815.797s-.152.538-.194 1.115l-.038.526c-.148 2.031-.222 3.047-.911 3.393c-.69.347-1.538-.206-3.236-1.311l-.439-.286c-.482-.314-.723-.47-1-.515s-.558.028-1.121.175l-.513.133c-1.98.516-2.971.773-3.505.231s-.258-1.526.295-3.492l.142-.509c.157-.559.236-.838.197-1.115c-.04-.277-.193-.52-.499-1.008l-.278-.443C4.29 8.044 3.752 7.187 4.11 6.507c.36-.682 1.379-.737 3.418-.848l.527-.028c.58-.031.869-.047 1.122-.174c.252-.127.439-.35.813-.798z" opacity=".5" />
                    </Svg>

                </View>
                <Typography variant="h2" weight="bold" className="text-center mb-2">Welcome to NeedleX</Typography>
                <Typography variant="body" color="gray" className="text-center px-4 leading-relaxed">
                    Your digital tailoring workspace is ready. Let's start by adding your first client or creating an order.
                </Typography>
            </View>
            {/* </Surface> */}

            <View className="flex-row flex-wrap justify-between mt-12 gap-y-4">
                <Pressable onPress={() => router.push('/(tabs)/customers/new')} className="w-[48%]">
                    <Surface variant="white" className={`p-5 items-center justify-center ${isDark ? 'border-border-dark' : 'border-gray-100'}`} rounded="2xl" hasBorder>
                        <View className="w-12 h-12 bg-accent-peach items-center justify-center rounded-xl mb-3">
                            <People size={24} color="black" variant="Bulk" />
                        </View>
                        <Typography weight="bold" className="text-center text-sm mb-1">Add Client</Typography>
                        <Typography variant="caption" color="gray" className="text-center text-xs">Build database</Typography>
                    </Surface>
                </Pressable>

                <Pressable onPress={() => router.push('/(tabs)/orders/new')} className="w-[48%]">
                    <Surface variant="white" className={`p-5 items-center justify-center ${isDark ? 'border-border-dark' : 'border-gray-100'}`} rounded="2xl" hasBorder>
                        <View className="w-12 h-12 bg-accent-lavender items-center justify-center rounded-xl mb-3">
                            <Box size={24} color="black" variant="Bulk" />
                        </View>
                        <Typography weight="bold" className="text-center text-sm mb-1">Create Order</Typography>
                        <Typography variant="caption" color="gray" className="text-center text-xs">Start tracking</Typography>
                    </Surface>
                </Pressable>

                <Pressable onPress={() => router.push('/(tabs)/orders/invoices/new')} className="w-[48%]">
                    <Surface variant="white" className={`p-5 items-center justify-center ${isDark ? 'border-border-dark' : 'border-gray-100'}`} rounded="2xl" hasBorder>
                        <View className="w-12 h-12 bg-accent-blue items-center justify-center rounded-xl mb-3">
                            <DocumentText size={24} color="black" variant="Bulk" />
                        </View>
                        <Typography weight="bold" className="text-center text-sm mb-1">Create Invoice</Typography>
                        <Typography variant="caption" color="gray" className="text-center text-xs">Get paid fast</Typography>
                    </Surface>
                </Pressable>

                <Pressable onPress={() => router.push('/(tabs)/extras/pantone')} className="w-[48%]">
                    <Surface variant="white" className={`p-5 items-center justify-center ${isDark ? 'border-border-dark' : 'border-gray-100'}`} rounded="2xl" hasBorder>
                        <View className="w-12 h-12 bg-[#FCE7F3] items-center justify-center rounded-xl mb-3">
                            <Gallery size={24} color="black" variant="Bulk" />
                        </View>
                        <Typography weight="bold" className="text-center text-sm mb-1">View Pantone</Typography>
                        <Typography variant="caption" color="gray" className="text-center text-xs">Color guide</Typography>
                    </Surface>
                </Pressable>
            </View>
        </View>
    );
}

function QuickAccessItem({ icon, label, bg, borderClass, onPress }: any) {
    const { isDark } = useTheme();

    return (
        <Pressable className="items-center" onPress={onPress}>
            <View className={`w-14 h-14 ${bg} rounded-3xl items-center justify-center mb-2 border ${borderClass || (isDark ? 'border-white/10' : 'border-gray-500/20')}`}>
                {icon}
            </View>
            <Typography variant="caption" weight="bold" className={isDark ? 'text-white' : 'text-black'}>{label}</Typography>
        </Pressable>
    );
}
