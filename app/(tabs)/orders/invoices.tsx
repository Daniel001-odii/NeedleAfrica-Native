import React, { useState } from 'react';
import { View, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Add, DocumentText, SearchNormal1 } from 'iconsax-react-native';
import { Typography } from '../../../components/ui/Typography';
import { Surface } from '../../../components/ui/Surface';
import { IconButton } from '../../../components/ui/IconButton';
import { useInvoices } from '../../../hooks/useInvoices';
import { useAuth } from '../../../contexts/AuthContext';

export default function InvoicesScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { invoices, loading, refresh } = useInvoices();
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <View className="px-6 py-4 flex-row justify-between items-center border-b border-gray-50">
                <View className="flex-row items-center">
                    <IconButton
                        icon={<ArrowLeft size={20} color="black" />}
                        onPress={() => router.back()}
                        variant="ghost"
                        className="-ml-2"
                    />
                    <Typography variant="h3" weight="bold" className="ml-2">Invoices</Typography>
                </View>
                <IconButton
                    icon={<Add size={24} color="white" />}
                    variant="dark"
                    onPress={() => router.push('/invoices/create')}
                />
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color="black" />
                </View>
            ) : (
                <FlatList
                    data={invoices}
                    keyExtractor={(item) => item.id}
                    contentContainerClassName="p-6 pb-32"
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    renderItem={({ item: invoice }) => (
                        <Pressable onPress={() => router.push(`/(tabs)/orders/invoices/${invoice.id}`)}>
                            <Surface variant="white" className="p-4 mb-3 border border-gray-100 flex-row items-center" rounded="2xl" hasBorder>
                                <Surface variant="lavender" className="w-12 h-12 items-center justify-center mr-4" rounded="xl">
                                    <DocumentText size={24} color="black" variant="Bulk" />
                                </Surface>
                                <View className="flex-1">
                                    <View className="flex-row justify-between items-center mb-1">
                                        <Typography variant="body" weight="bold">{invoice.invoiceNumber}</Typography>
                                        <Typography variant="body" weight="bold">
                                            {user?.currency || 'NGN'} {invoice.amount.toLocaleString()}
                                        </Typography>
                                    </View>
                                    <View className="flex-row justify-between items-center">
                                        <Typography variant="caption" color="gray">
                                            {new Date(invoice.createdAt).toLocaleDateString()}
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
                            <Surface variant="muted" className="w-20 h-20 items-center justify-center mb-6" rounded="full">
                                <DocumentText size={32} color="#9CA3AF" variant="Bulk" />
                            </Surface>
                            <Typography variant="h3" weight="bold" className="text-center mb-2">No Invoices Yet</Typography>
                            <Typography variant="body" color="gray" className="text-center leading-relaxed">
                                Create your first invoice by linking a customer and an order.
                            </Typography>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
