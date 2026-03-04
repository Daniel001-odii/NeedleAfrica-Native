import React, { useState, useMemo } from 'react';
import { View, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, User, Box, SearchNormal1, TickCircle } from 'iconsax-react-native';
import { Typography } from '../../../../components/ui/Typography';
import { Surface } from '../../../../components/ui/Surface';
import { IconButton } from '../../../../components/ui/IconButton';
import { Button } from '../../../../components/ui/Button';
import { useCustomers } from '../../../../hooks/useCustomers';
import { useOrders } from '../../../../hooks/useOrders';
import { useInvoices } from '../../../../hooks/useInvoices';
import { useAuth } from '../../../../contexts/AuthContext';
import { useResourceLimits } from '../../../../hooks/useResourceLimits';
import { useSubscription } from '../../../../hooks/useSubscription';
import { useSync } from '../../../../hooks/useSync';
import { ResourceLimitModal } from '../../../../components/ResourceLimitModal';
import Toast from 'react-native-toast-message';
import { useConfirm } from '../../../../contexts/ConfirmContext';
import { useTheme } from '../../../../contexts/ThemeContext';

export default function CreateInvoiceScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { isDark } = useTheme();
    const { customerId: initialCustomerId } = useLocalSearchParams<{ customerId: string }>();
    const { customers, loading: loadingCustomers } = useCustomers();
    const { orders, loading: loadingOrders } = useOrders();
    const { createInvoice } = useInvoices();
    const { canCreate } = useResourceLimits();
    const { isFree } = useSubscription();
    const { isOnline } = useSync();
    const { confirm } = useConfirm();

    const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId || '');
    const [selectedOrderId, setSelectedOrderId] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [limitModalData, setLimitModalData] = useState({
        allowed: true,
        currentCount: 0,
        limit: 5,
        message: '',
        isAtLimit: false,
        isNearLimit: false,
    });
    const [proceedAnyway, setProceedAnyway] = useState(false);

    const filteredCustomers = useMemo(() => {
        return customers.filter(c =>
            (c.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.phoneNumber?.includes(searchQuery)
        );
    }, [customers, searchQuery]);

    const customerOrders = useMemo(() => {
        if (!selectedCustomerId) return [];
        return orders.filter(o => o.customerId === selectedCustomerId && o.deletedAt === null);
    }, [orders, selectedCustomerId]);

    const selectedOrder = useMemo(() => {
        return orders.find(o => o.id === selectedOrderId);
    }, [orders, selectedOrderId]);

    const handleCreate = async () => {
        if (!selectedCustomerId || !selectedOrderId) {
            confirm({
                title: 'Error',
                message: 'Please select both a customer and an order',
                confirmText: 'OK',
                onConfirm: () => { }
            });
            return;
        }

        // Check resource limits for free tier
        if (isFree) {
            const limitCheck = canCreate('invoices');
            if (!limitCheck.allowed && !proceedAnyway) {
                setLimitModalData(limitCheck);
                setShowLimitModal(true);
                return;
            }
        }

        setSubmitting(true);
        try {
            const invoice = await createInvoice({
                customerId: selectedCustomerId,
                orderId: selectedOrderId,
                amount: selectedOrder?.amount || 0,
                currency: user?.currency || 'NGN',
                notes
            });

            Toast.show({
                type: 'success',
                text1: 'Invoice Created',
                text2: `Invoice ${invoice?.invoiceNumber} generated successfully`
            });

            router.navigate(`/(tabs)/orders/invoices/`);
        } catch (error) {
            console.error(error);
            confirm({
                title: 'Error',
                message: 'Failed to create invoice',
                confirmText: 'OK',
                onConfirm: () => { }
            });
        } finally {
            setSubmitting(false);
        }
    };

    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

    return (
        <View className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-white'}`}>
            <View className={`px-6 py-4 flex-row items-center border-b ${isDark ? 'border-border-dark' : 'border-gray-50'}`}>
                <IconButton
                    icon={<ArrowLeft size={20} color={isDark ? "white" : "black"} />}
                    onPress={() => router.back()}
                    variant="ghost"
                    className="-ml-2"
                />
                <Typography variant="h3" weight="bold" className="ml-2">Create Invoice</Typography>
            </View>

            <ScrollView contentContainerClassName="p-6 pb-20" showsVerticalScrollIndicator={false}>
                {/* Customer Selection */}
                <Typography variant="caption" color="gray" weight="bold" className="mb-4 uppercase tracking-widest ml-1">1. Select Customer</Typography>

                {!selectedCustomerId ? (
                    <View className="mb-8">
                        <Surface variant="muted" rounded="2xl" className={`flex-row items-center px-4 h-14 mb-4 border ${isDark ? 'border-border-dark bg-surface-muted-dark' : 'border-gray-100'}`}>
                            <SearchNormal1 size={18} color={isDark ? "#9CA3AF" : "#6B7280"} />
                            <TextInput
                                className={`ml-3 flex-1 font-semibold ${isDark ? 'text-white' : 'text-dark'}`}
                                placeholder="Search customers..."
                                placeholderTextColor="#9CA3AF"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </Surface>
                        <View className="gap-3">
                            {filteredCustomers.slice(0, 5).map(customer => (
                                <Pressable key={customer.id} onPress={() => setSelectedCustomerId(customer.id)}>
                                    <Surface variant="white" className={`p-4 border ${isDark ? 'border-border-dark' : 'border-gray-100'} flex-row items-center`} rounded="2xl" hasBorder>
                                        <View className={`w-10 h-10 ${isDark ? 'bg-indigo-600' : 'bg-blue-500'} rounded-full items-center justify-center mr-4`}>
                                            <Typography weight="bold" color="white">{(customer.fullName || 'C')[0].toUpperCase()}</Typography>
                                        </View>
                                        <Typography weight="bold">{customer.fullName}</Typography>
                                    </Surface>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                ) : (
                    <Surface variant={isDark ? "dark" : "lavender"} className={`p-4 mb-8 flex-row items-center justify-between border ${isDark ? 'border-indigo-500/30' : 'border-transparent'}`} rounded="2xl">
                        <View className="flex-row items-center">
                            <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${isDark ? 'bg-white/10' : 'bg-white'}`}>
                                <User size={20} color={isDark ? "white" : "black"} variant="Bulk" />
                            </View>
                            <View>
                                <Typography weight="bold">{selectedCustomer?.fullName}</Typography>
                                <Typography variant="caption" color="gray">{selectedCustomer?.phoneNumber}</Typography>
                            </View>
                        </View>
                        {!initialCustomerId && (
                            <Pressable onPress={() => { setSelectedCustomerId(''); setSelectedOrderId(''); }}>
                                <Typography variant="small" color="primary" weight="bold">Change</Typography>
                            </Pressable>
                        )}
                    </Surface>
                )}

                {/* Order Selection */}
                {selectedCustomerId && (
                    <View className="mb-8">
                        <Typography variant="caption" color="gray" weight="bold" className="mb-4 uppercase tracking-widest ml-1">2. Select Order</Typography>
                        {loadingOrders ? (
                            <ActivityIndicator color={isDark ? "white" : "black"} />
                        ) : customerOrders.length === 0 ? (
                            <Surface variant="muted" className={`p-6 items-center ${isDark ? 'bg-surface-muted-dark' : ''}`} rounded="2xl" hasBorder>
                                <Typography variant="small" color="gray">No active orders found for this customer.</Typography>
                            </Surface>
                        ) : (
                            <View className="gap-3">
                                {customerOrders.map(order => (
                                    <Pressable key={order.id} onPress={() => setSelectedOrderId(order.id)}>
                                        <Surface
                                            variant="white"
                                            className={`p-4 border ${selectedOrderId === order.id ? (isDark ? 'border-indigo-500' : 'border-[#4F46E5]') : (isDark ? 'border-border-dark' : 'border-gray-100')} flex-row items-center`}
                                            rounded="2xl"
                                            hasBorder
                                        >
                                            <View className={`w-10 h-10 ${selectedOrderId === order.id ? (isDark ? 'bg-indigo-600' : 'bg-[#4F46E5]') : (isDark ? 'bg-dark-800' : 'bg-gray-100')} rounded-full items-center justify-center mr-4`}>
                                                <Box size={20} color={selectedOrderId === order.id ? 'white' : (isDark ? '#9CA3AF' : 'black')} variant="Bulk" />
                                            </View>
                                            <View className="flex-1">
                                                <Typography weight="bold">{order.styleName}</Typography>
                                                <Typography variant="caption" color="gray">
                                                    {user?.currency || 'NGN'} {(order.amount || 0).toLocaleString()}
                                                </Typography>
                                            </View>
                                            {selectedOrderId === order.id && <TickCircle size={24} color={isDark ? "#818CF8" : "#4F46E5"} variant="Bold" />}
                                        </Surface>
                                    </Pressable>
                                ))}
                            </View>
                        )}
                    </View>
                )}

                {/* Additional Details */}
                {selectedOrderId && (
                    <View className="mb-8">
                        <Typography variant="caption" color="gray" weight="bold" className="mb-4 uppercase tracking-widest ml-1">3. Invoice Details</Typography>
                        <Surface variant="muted" rounded="2xl" className={`p-4 border ${isDark ? 'border-border-dark bg-surface-muted-dark' : 'border-gray-100'} min-h-[100px]`}>
                            <TextInput
                                className={`font-medium flex-1 ${isDark ? 'text-white' : 'text-dark'}`}
                                placeholder="Add notes to the invoice (optional)..."
                                placeholderTextColor="#9CA3AF"
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                textAlignVertical="top"
                            />
                        </Surface>
                    </View>
                )}

                <Button
                    onPress={handleCreate}
                    isLoading={submitting}
                    disabled={!selectedCustomerId || !selectedOrderId}
                    className={`h-16 rounded-full mt-4 border-0 ${(!selectedCustomerId || !selectedOrderId) ? (isDark ? 'bg-gray-800' : 'bg-gray-200') : (isDark ? 'bg-white' : 'bg-black')}`}
                >
                    <Typography
                        weight="bold"
                        color={(!selectedCustomerId || !selectedOrderId) ? "gray" : (isDark ? "white" : "white")}
                        className={(!selectedCustomerId || !selectedOrderId) ? "" : (isDark ? "text-black" : "text-white")}
                    >
                        Generate Invoice
                    </Typography>
                </Button>
            </ScrollView>

            <ResourceLimitModal
                visible={showLimitModal}
                onClose={() => setShowLimitModal(false)}
                onUpgrade={() => {
                    setShowLimitModal(false);
                    router.push('/(tabs)/profile/subscription');
                }}
                onContinueAnyway={() => {
                    setShowLimitModal(false);
                    setProceedAnyway(true);
                    setTimeout(() => handleCreate(), 100);
                }}
                resource="invoices"
                currentCount={limitModalData.currentCount}
                limit={limitModalData.limit}
                isOffline={!isOnline}
            />
        </View>
    );
}
