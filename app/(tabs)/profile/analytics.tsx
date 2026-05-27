import React from 'react';
import { View, ScrollView, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Chart2, TrendUp, Activity, User, Money, DollarCircle, ShoppingBag, ReceiptItem, Wallet2, Chart } from 'iconsax-react-native';
import { Typography } from '../../../components/ui/Typography';
import { IconButton } from '../../../components/ui/IconButton';
import { useTheme } from '../../../contexts/ThemeContext';

export default function AnalyticsScreen() {
    const { isDark } = useTheme();
    const screenWidth = Dimensions.get('window').width;

    const bgColor = isDark ? 'bg-zinc-950' : 'bg-gray-50';
    const headerBgColor = isDark ? 'bg-zinc-950 border-b border-white/5' : 'bg-white border-b border-gray-50';
    const cardColor = isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-100 shadow-sm shadow-gray-100/50';
    const textColor = isDark ? 'text-white' : 'text-gray-900';
    const secondaryTextColor = isDark ? 'text-gray-400' : 'text-gray-500';

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
                {/* Summary Metrics Row 1 */}
                <Typography variant="caption" weight="bold" className={`mb-3 ml-1 uppercase tracking-wider ${secondaryTextColor} text-[11px]`}>
                    Financial Overview
                </Typography>
                
                <View className="flex-row justify-between mb-4">
                    <View className={`flex-1 rounded-[24px] p-5 mr-2 ${cardColor}`}>
                        <View className={`w-10 h-10 rounded-full mb-4 items-center justify-center ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                            <DollarCircle size={20} color="#3b82f6" variant="Bulk" />
                        </View>
                        <Typography variant="caption" className={`${secondaryTextColor} mb-1`}>
                            Total Revenue
                        </Typography>
                        <Typography variant="h2" weight="bold" className={`${textColor}`}>
                            $0.00
                        </Typography>
                    </View>
                    
                    <View className={`flex-1 rounded-[24px] p-5 ml-2 ${cardColor}`}>
                        <View className={`w-10 h-10 rounded-full mb-4 items-center justify-center ${isDark ? 'bg-green-900/30' : 'bg-green-50'}`}>
                            <Wallet2 size={20} color="#10B981" variant="Bulk" />
                        </View>
                        <Typography variant="caption" className={`${secondaryTextColor} mb-1`}>
                            Avg. Order Value
                        </Typography>
                        <Typography variant="h2" weight="bold" className={`${textColor}`}>
                            $0.00
                        </Typography>
                    </View>
                </View>

                {/* Summary Metrics Row 2 */}
                <Typography variant="caption" weight="bold" className={`mb-3 mt-4 ml-1 uppercase tracking-wider ${secondaryTextColor} text-[11px]`}>
                    Operational Metrics
                </Typography>

                <View className="flex-row justify-between mb-6">
                    <View className={`flex-1 rounded-[24px] p-5 mr-2 ${cardColor}`}>
                        <View className={`w-10 h-10 rounded-full mb-4 items-center justify-center ${isDark ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
                            <ShoppingBag size={20} color="#8B5CF6" variant="Bulk" />
                        </View>
                        <Typography variant="caption" className={`${secondaryTextColor} mb-1`}>
                            Total Orders
                        </Typography>
                        <Typography variant="h2" weight="bold" className={`${textColor}`}>
                            0
                        </Typography>
                    </View>
                    
                    <View className={`flex-1 rounded-[24px] p-5 ml-2 ${cardColor}`}>
                        <View className={`w-10 h-10 rounded-full mb-4 items-center justify-center ${isDark ? 'bg-orange-900/30' : 'bg-orange-50'}`}>
                            <User size={20} color="#F97316" variant="Bulk" />
                        </View>
                        <Typography variant="caption" className={`${secondaryTextColor} mb-1`}>
                            Total Customers
                        </Typography>
                        <Typography variant="h2" weight="bold" className={`${textColor}`}>
                            0
                        </Typography>
                    </View>
                </View>

                {/* Revenue Chart Placeholder */}
                <Typography variant="caption" weight="bold" className={`mb-3 ml-1 uppercase tracking-wider ${secondaryTextColor} text-[11px]`}>
                    Revenue Over Time
                </Typography>
                <View className={`rounded-[24px] p-5 mb-6 h-64 justify-center items-center ${cardColor}`}>
                    <Chart size={40} color={isDark ? "#52525B" : "#E5E7EB"} variant="Bulk" className="mb-4" />
                    <Typography weight="semibold" className={`${textColor} mb-1`}>
                        Chart data will appear here
                    </Typography>
                    <Typography variant="caption" className={`${secondaryTextColor} text-center max-w-[80%]`}>
                        Start tracking your orders to see your revenue trends over time.
                    </Typography>
                </View>

                {/* Top Selling Categories / Services Placeholder */}
                <Typography variant="caption" weight="bold" className={`mb-3 ml-1 uppercase tracking-wider ${secondaryTextColor} text-[11px]`}>
                    Top Services
                </Typography>
                <View className={`rounded-[24px] p-5 mb-6 h-56 justify-center items-center ${cardColor}`}>
                    <Activity size={40} color={isDark ? "#52525B" : "#E5E7EB"} variant="Bulk" className="mb-4" />
                    <Typography weight="semibold" className={`${textColor} mb-1`}>
                        Service breakdown empty
                    </Typography>
                    <Typography variant="caption" className={`${secondaryTextColor} text-center max-w-[80%]`}>
                        Create orders to see which of your services generate the most value.
                    </Typography>
                </View>

                {/* Customer Growth Placeholder */}
                <Typography variant="caption" weight="bold" className={`mb-3 ml-1 uppercase tracking-wider ${secondaryTextColor} text-[11px]`}>
                    Customer Growth
                </Typography>
                <View className={`rounded-[24px] p-5 h-48 justify-center items-center ${cardColor}`}>
                    <TrendUp size={40} color={isDark ? "#52525B" : "#E5E7EB"} variant="Bulk" className="mb-4" />
                    <Typography weight="semibold" className={`${textColor} mb-1`}>
                        No customer data yet
                    </Typography>
                    <Typography variant="caption" className={`${secondaryTextColor} text-center max-w-[80%]`}>
                        Add customers to start tracking growth.
                    </Typography>
                </View>

            </ScrollView>
        </View>
    );
}
