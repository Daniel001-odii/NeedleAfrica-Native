import React, { useState } from 'react';
import { View, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Add, DocumentText, SearchNormal1 } from 'iconsax-react-native';
import { Typography } from '../../../../components/ui/Typography';
import { Surface } from '../../../../components/ui/Surface';
import { IconButton } from '../../../../components/ui/IconButton';
import { Button } from '../../../../components/ui/Button';
import { useInvoices } from '../../../../hooks/useInvoices';
import { useAuth } from '../../../../contexts/AuthContext';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useResourceLimits } from '../../../../hooks/useResourceLimits';

export default function InvoicesScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { isDark } = useTheme();
    const { invoices, loading, refresh } = useInvoices();
    const [refreshing, setRefreshing] = useState(false);
    const { getLimitStatus } = useResourceLimits();

    const isPro = user?.subscriptionPlan === 'PRO' || user?.subscriptionPlan === 'STUDIO_AI';
    const invoiceLimit = getLimitStatus('invoices');

    const onRefresh = async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    };

    return (
        <View className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-white'}`}>
            <View className={`px-6 py-4 flex-row justify-between items-center border-b ${isDark ? 'border-border-dark' : 'border-gray-50'}`}>
                <View className="flex-row items-center">
                    <IconButton
                        icon={<ArrowLeft size={20} color={isDark ? "white" : "black"} />}
                        onPress={() => router.back()}
                        variant="ghost"
                        className="-ml-2"
                    />
                    <Typography variant="h3" weight="bold" className="ml-2">Invoices</Typography>
                    {!isPro && (
                        <View className={`ml-3 px-2 py-0.5 rounded-lg ${isDark ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}>
                            <Typography variant="small" weight="bold" className={isDark ? 'text-indigo-400' : 'text-indigo-600'}>
                                {invoiceLimit.current}/{invoiceLimit.limit}
                            </Typography>
                        </View>
                    )}
                </View>
                <IconButton
                    icon={<Add size={24} color={isDark ? "white" : "black"} />}
                    variant="glass"
                    onPress={() => router.push('/(tabs)/orders/invoices/new')}
                />
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color={isDark ? "white" : "black"} />
                </View>
            ) : (
                <FlatList
                    data={invoices}
                    keyExtractor={(item) => item.id}
                    contentContainerClassName="p-6 pb-32"
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={isDark ? "white" : "black"}
                            colors={isDark ? ["white"] : ["black"]}
                        />
                    }
                    renderItem={({ item: invoice }) => (
                        <Pressable onPress={() => router.push(`/(tabs)/orders/invoices/${invoice.id}`)}>
                            <Surface
                                variant="white"
                                className={`p-4 mb-3 border ${isDark ? 'bg-surface-dark border-border-dark' : 'border-gray-100'} flex-row items-center`}
                                rounded="2xl"
                                hasBorder
                            >
                                <Surface variant={isDark ? "muted" : "lavender"} className={`w-12 h-12 items-center justify-center mr-4 ${isDark ? 'bg-dark-700' : ''}`} rounded="xl">
                                    <DocumentText size={24} color={isDark ? "#818CF8" : "black"} variant="Bulk" />
                                </Surface>
                                <View className="flex-1">
                                    <View className="flex-row justify-between items-center mb-1">
                                        <Typography variant="body" weight="bold">{invoice.invoiceNumber}</Typography>
                                        <Typography variant="body" weight="bold">
                                            {user?.currency || 'NGN'} {(invoice.amount || 0).toLocaleString()}
                                        </Typography>
                                    </View>
                                    <View className="flex-row justify-between items-center">
                                        <Typography variant="caption" color="gray">
                                            {new Date(invoice.createdAt || 0).toLocaleDateString()}
                                        </Typography>
                                        <Surface variant="muted" className="px-2 py-0.5" rounded="full">
                                            <Typography variant="small" weight="bold" className="text-[10px]">PAID</Typography>
                                        </Surface>
                                    </View>
                                </View>
                            </Surface>
                        </Pressable>
                    )}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20 px-10">
                            <Surface variant="muted" className={`w-24 h-24 items-center justify-center mb-6 ${isDark ? 'bg-surface-muted-dark border border-border-dark' : 'bg-gray-50'}`} rounded="full">
                                <DocumentText size={36} color="#9CA3AF" variant="Bulk" />
                            </Surface>
                            <Typography variant="h3" weight="bold" className="text-center mb-2">No Invoices Yet</Typography>
                            <Typography variant="body" color="gray" className="text-center leading-relaxed mb-8">
                                Create your first professional invoice by linking a customer and an order to track payments.
                            </Typography>
                            <Button
                                onPress={() => router.push('/(tabs)/orders/invoices/new')}
                                className={`px-8 h-14 rounded-full ${isDark ? 'bg-white' : 'bg-dark'}`}
                                textClassName={isDark ? 'text-dark' : 'text-white'}
                            >
                                <View className="flex-row items-center">
                                    <Add size={20} color={isDark ? "black" : "white"} className="mr-2" />
                                    <Typography weight="bold" className={isDark ? 'text-dark' : 'text-white'}>New Invoice</Typography>
                                </View>
                            </Button>
                        </View>
                    }
                />
            )}
        </View>
    );
}
