import React, { useState, useMemo, useCallback } from 'react';
import { View, ScrollView, Pressable, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, User, Box, SearchNormal1, TickCircle, AddCircle } from 'iconsax-react-native';
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
import { StoreReviewService } from '../../../../services/StoreReviewService';
import { CURRENCIES } from '../../../../constants/currencies';
import { usePostHog } from 'posthog-react-native';

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
    const posthog = usePostHog();
    const currency = user?.currency || 'NGN';
    const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || '₦';

    const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId || '');
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
    const [orderQuantities, setOrderQuantities] = useState<Record<string, number>>({});
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [limitModalData, setLimitModalData] = useState({
        allowed: true,
        currentCount: 0,
        limit: 10,
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

    const selectedOrdersData = useMemo(() => {
        return orders.filter(o => selectedOrderIds.includes(o.id));
    }, [orders, selectedOrderIds]);

    const totalAmount = useMemo(() => {
        return selectedOrdersData.reduce((sum, o) => sum + (o.amount || 0) * (orderQuantities[o.id] || 1), 0);
    }, [selectedOrdersData, orderQuantities]);

    // Reset selections when customer changes
    React.useEffect(() => {
        setSelectedOrderIds([]);
        setOrderQuantities({});
    }, [selectedCustomerId]);

    const toggleOrder = useCallback((orderId: string) => {
        setSelectedOrderIds(prev => {
            if (prev.includes(orderId)) {
                setOrderQuantities(q => {
                    const next = { ...q };
                    delete next[orderId];
                    return next;
                });
                return prev.filter(id => id !== orderId);
            } else {
                setOrderQuantities(q => ({ ...q, [orderId]: 1 }));
                return [...prev, orderId];
            }
        });
    }, []);

    const setOrderQty = useCallback((orderId: string, qty: number) => {
        setOrderQuantities(prev => ({ ...prev, [orderId]: Math.max(1, qty) }));
    }, []);

    const toggleAllOrders = useCallback(() => {
        if (!customerOrders.length) return;
        const allIds = customerOrders.map(o => o.id);
        const allSelected = allIds.every(id => selectedOrderIds.includes(id));
        if (allSelected) {
            setSelectedOrderIds([]);
            setOrderQuantities({});
        } else {
            setSelectedOrderIds(allIds);
            const qtys: Record<string, number> = {};
            allIds.forEach(id => { qtys[id] = 1; });
            setOrderQuantities(qtys);
        }
    }, [customerOrders, selectedOrderIds]);

    const handleCreate = async () => {
        if (!selectedCustomerId || selectedOrderIds.length === 0) {
            confirm({
                title: 'Error',
                message: 'Please select a customer and at least one order',
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
                orderIds: selectedOrderIds,
                orderQuantities,
                currency: user?.currency || 'NGN',
                notes
            });

            posthog.capture('invoice_created', {
                customer_name: selectedCustomer?.fullName || 'Unknown',
                order_count: selectedOrderIds.length,
                total_amount: totalAmount,
                currency: user?.currency || 'NGN',
            });

            Toast.show({
                type: 'success',
                text1: 'Invoice Created',
                text2: `Invoice ${invoice?.invoiceNumber} generated successfully`
            });

            // Auto-prompt for review after a short delay
            setTimeout(() => {
                StoreReviewService.requestReview().catch(console.error);
            }, 1500);

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
    const allSelected = customerOrders.length > 0 && customerOrders.every(o => selectedOrderIds.includes(o.id));

    return (
        <View className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-white'}`}>
            <View className={`px-6 py-4 flex-row items-center border-b ${isDark ? 'border-border-dark' : 'border-gray-50'}`}>
                <IconButton
                    icon={<ArrowLeft size={20} color={isDark ? "white" : "black"} />}
                    onPress={() => router.replace('/(tabs)/orders/invoices')}
                    variant="ghost"
                    className="-ml-2"
                />
                <Typography variant="h3" weight="bold" className="ml-2">Create Invoice</Typography>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView contentContainerClassName="p-6 pb-12" showsVerticalScrollIndicator={false}>
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
                            <View className="gap-0">
                                {filteredCustomers.slice(0, 5).map(customer => (
                                    <Pressable key={customer.id} onPress={() => setSelectedCustomerId(customer.id)}>
                                        <View className="flex-row items-center py-4 px-1">
                                            <Surface variant="lavender" className={`w-12 h-12 items-center justify-center mr-4 ${isDark ? 'bg-indigo-900/40' : 'bg-soft-lavender'}`} rounded="full">
                                                <Typography weight="bold" className={isDark ? 'text-indigo-300' : 'text-brand-primary'}>
                                                    {(customer.fullName || 'U').charAt(0).toUpperCase()}
                                                    {(customer.fullName || '').split(' ')[1]?.charAt(0).toUpperCase() || ''}
                                                </Typography>
                                            </Surface>
                                            <View className="flex-1">
                                                <Typography variant="body" weight="bold">{customer.fullName}</Typography>
                                                <Typography variant="caption" color="gray">{customer.phoneNumber || 'No phone number'}</Typography>
                                            </View>
                                        </View>
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
                                <Pressable onPress={() => { setSelectedCustomerId(''); setSelectedOrderIds([]); }}>
                                    <Typography variant="small" color="primary" weight="bold">Change</Typography>
                                </Pressable>
                            )}
                        </Surface>
                    )}
                    {/* Order Selection */}
                    {selectedCustomerId && (
                        <View className="mb-8">
                            <View className="flex-row items-center justify-between mb-4">
                                <Typography variant="caption" color="gray" weight="bold" className="uppercase tracking-widest ml-1">
                                    2. Select Orders
                                </Typography>
                                {customerOrders.length > 0 && (
                                    <Pressable onPress={toggleAllOrders} className={`flex-row items-center px-3 py-1.5 rounded-full ${isDark ? 'bg-indigo-900/40' : 'bg-indigo-50'}`}>
                                        <Typography variant="small" weight="bold" color="primary">
                                            {allSelected ? 'Deselect All' : 'Select All'}
                                        </Typography>
                                    </Pressable>
                                )}
                            </View>
                            {loadingOrders ? (
                                <ActivityIndicator color={isDark ? "white" : "black"} />
                            ) : customerOrders.length === 0 ? (
                                <Surface variant="muted" className={`p-6 items-center ${isDark ? 'bg-surface-muted-dark' : ''}`} rounded="2xl" hasBorder>
                                    <Typography variant="small" color="gray" className="text-center mb-4">No active orders found for this customer.</Typography>
                                    <Button
                                        onPress={() => router.push('/(tabs)/orders/new')}
                                        className={`h-12 px-6 rounded-full ${isDark ? 'bg-white' : 'bg-black'}`}
                                        textClassName={isDark ? 'text-black' : 'text-white'}
                                    >
                                        Create New Order
                                    </Button>
                                </Surface>
                            ) : (
                                <View className="gap-3">
                                    {customerOrders.map(order => {
                                        const isSelected = selectedOrderIds.includes(order.id);
                                        const orderImageUri = order.styleImage || order.fabricImage || '';
                                        return (
                                            <Pressable key={order.id} onPress={() => toggleOrder(order.id)}>
                                                <Surface
                                                    variant="white"
                                                    className={`py-3 px-3 border ${isSelected ? (isDark ? 'border-indigo-500' : 'border-[#FF5678]') : (isDark ? 'border-border-dark' : 'border-gray-100')} flex-row items-center`}
                                                    rounded="2xl"
                                                    hasBorder
                                                >
                                                    {isSelected ? (
                                                        <View className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${isDark ? 'bg-indigo-600' : 'bg-[#FF5678]'}`}>
                                                            <TickCircle size={22} color="white" variant="Bold" />
                                                        </View>
                                                    ) : orderImageUri ? (
                                                        <Image
                                                            source={{ uri: orderImageUri }}
                                                            className="w-12 h-12 rounded-lg mr-3"
                                                            resizeMode="cover"
                                                        />
                                                    ) : (
                                                        <View className={`w-12 h-12 rounded-lg items-center justify-center mr-3 ${isDark ? 'bg-dark-800' : 'bg-gray-100'}`}>
                                                            <Box size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                                                        </View>
                                                    )}
                                                    <View className="flex-1 mr-3">
                                                        <Typography weight="bold" numberOfLines={1} className="text-[14px]">{order.styleName}</Typography>
                                                        <Typography variant="caption" color="gray">
                                                            {order.status} · {currencySymbol}{(order.amount || 0).toLocaleString()}
                                                        </Typography>
                                                    </View>
                                                    {isSelected && (
                                                        <View className="flex-row items-center">
                                                            <Pressable
                                                                onPress={() => setOrderQty(order.id, (orderQuantities[order.id] || 1) - 1)}
                                                                className={`w-8 h-8 rounded-full items-center justify-center border ${isDark ? 'bg-dark-600 border-indigo-400/40' : 'bg-[#FFF0F3] border-[#FF5678]/30'} ${(orderQuantities[order.id] || 1) <= 1 ? 'opacity-40' : ''}`}
                                                                disabled={(orderQuantities[order.id] || 1) <= 1}
                                                            >
                                                                <Typography weight="extrabold" className={`text-base ${isDark ? 'text-indigo-300' : 'text-[#FF5678]'}`}>−</Typography>
                                                            </Pressable>
                                                            <View className={`min-w-[32px] items-center mx-2 px-2 py-1 rounded-lg ${isDark ? 'bg-dark-700' : 'bg-[#FFF0F3]'}`}>
                                                                <Typography weight="bold" className={`text-sm ${isDark ? 'text-white' : 'text-[#FF5678]'}`}>
                                                                    {orderQuantities[order.id] || 1}
                                                                </Typography>
                                                            </View>
                                                            <Pressable
                                                                onPress={() => setOrderQty(order.id, (orderQuantities[order.id] || 1) + 1)}
                                                                className={`w-8 h-8 rounded-full items-center justify-center border ${isDark ? 'bg-indigo-600 border-indigo-400/60' : 'bg-[#FF5678] border-[#FF5678]'}`}
                                                            >
                                                                <Typography weight="extrabold" className="text-base text-white">+</Typography>
                                                            </Pressable>
                                                        </View>
                                                    )}
                                                </Surface>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            )}

                            {/* Selected Summary */}
                            {selectedOrderIds.length > 0 && (
                                <Surface variant={"muted" as any} className={`mt-4 p-4 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`} rounded="2xl">
                                    <View className="flex-row justify-between items-center mb-3">
                                        <Typography variant="small" weight="bold" color="gray">
                                            {selectedOrderIds.length} order{selectedOrderIds.length !== 1 ? 's' : ''} selected
                                        </Typography>
                                        <Typography variant="body" weight="bold">
                                            {currencySymbol}{totalAmount.toLocaleString()}
                                        </Typography>
                                    </View>
                                    {selectedOrdersData.map(order => {
                                        const qty = orderQuantities[order.id] || 1;
                                        const subtotal = (order.amount || 0) * qty;
                                        return (
                                            <View key={order.id} className="flex-row justify-between py-1.5 border-t border-white/10">
                                                <Typography variant="small" className="flex-1" numberOfLines={1}>
                                                    {order.styleName}
                                                    {qty > 1 && `  ×${qty}`}
                                                </Typography>
                                                <Typography variant="small" weight="semibold">
                                                    {currencySymbol}{subtotal.toLocaleString()}
                                                </Typography>
                                            </View>
                                        );
                                    })}
                                </Surface>
                            )}
                        </View>
                    )}

                    {/* Additional Details */}
                    {selectedOrderIds.length > 0 && (
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
                </ScrollView>

                <View className={`px-6 pt-4 pb-8 ${isDark ? 'border-border-dark bg-background-dark' : 'border-gray-50 bg-white'}`}>
                    <Button
                        onPress={handleCreate}
                        isLoading={submitting}
                        disabled={!selectedCustomerId || selectedOrderIds.length === 0}
                        className={`h-16 rounded-full border-0 ${(!selectedCustomerId || selectedOrderIds.length === 0) ? (isDark ? 'bg-dark-800' : 'bg-gray-200') : (isDark ? 'bg-white' : 'bg-black')}`}
                        textClassName={`font-bold ${(!selectedCustomerId || selectedOrderIds.length === 0) ? "text-gray-400" : (isDark ? "text-black" : "text-white")}`}
                        size="lg"
                    >
                        {`Generate Invoice (${selectedOrderIds.length > 0 ? `${currencySymbol}${totalAmount.toLocaleString()}` : 'Select Orders'})`}
                    </Button>
                </View>
            </KeyboardAvoidingView>

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