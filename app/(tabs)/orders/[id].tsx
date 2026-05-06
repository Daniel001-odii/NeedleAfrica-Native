import React, { useState, useEffect } from 'react';
import { View, ScrollView, Image, TextInput, Platform, KeyboardAvoidingView, Pressable, TouchableOpacity, Modal, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Edit2, Timer1, DocumentText, Money, Call, User, CloseCircle, Add, ArrowRight2 } from 'iconsax-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Typography } from '../../../components/ui/Typography';
import { Surface } from '../../../components/ui/Surface';
import { IconButton } from '../../../components/ui/IconButton';
import { Button } from '../../../components/ui/Button';
import { useOrders } from '../../../hooks/useOrders';
import { useCustomers } from '../../../hooks/useCustomers';
import { useSync } from '../../../hooks/useSync';
import { useConfirm } from '../../../contexts/ConfirmContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { uploadOrderImages } from '../../../services/ImageUploadService';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { CURRENCIES } from '../../../constants/currencies';
import * as StoreReview from 'expo-store-review';
import { StoreReviewService } from '../../../services/StoreReviewService';

const isLocalUri = (uri: string | null) => uri && (uri.startsWith('file://') || uri.startsWith('content://'));

export default function OrderDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { orders, updateOrder, updateOrderStatus, deleteOrder } = useOrders();
    const { customers } = useCustomers();
    const { sync: performSync } = useSync();
    const { confirm } = useConfirm();
    const { isDark } = useTheme();
    const { user } = useAuth();

    const currency = user?.currency || 'NGN';
    const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || '₦';

    const [isEditing, setIsEditing] = useState(false);

    // Find order from existing list
    const order = orders.find(o => o.id === id);
    const customer = customers.find(c => c.id === order?.customerId);

    const [styleName, setStyleName] = useState('');
    const [amount, setAmount] = useState('');
    const [amountPaid, setAmountPaid] = useState('');
    const [notes, setNotes] = useState('');
    const [deliveryDate, setDeliveryDate] = useState<Date | null>(null);
    const [fabricImage, setFabricImage] = useState<string | null>(null);
    const [styleImage, setStyleImage] = useState<string | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Full screen image view
    const [viewerVisible, setViewerVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState<{ uri: string, label: string } | null>(null);

    const openViewer = (uri: string, label: string) => {
        setSelectedImage({ uri, label });
        setViewerVisible(true);
    };

    // Helper function to format number with commas
    const formatNumberWithCommas = (value: string): string => {
        // Remove all non-digit characters
        const cleanValue = value.replace(/\D/g, '');
        // Format with commas
        return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    // Helper function to handle amount input with formatting and character limit
    const handleAmountInput = (value: string, setter: (value: string) => void, maxLength: number = 9) => {
        // Remove commas and non-digit characters for processing
        const cleanValue = value.replace(/\D/g, '');
        // Limit to maxLength characters
        const limitedValue = cleanValue.slice(0, maxLength);
        // Format with commas for display
        const formattedValue = formatNumberWithCommas(limitedValue);
        setter(formattedValue);
    };

    useEffect(() => {
        if (order) {
            setStyleName(order.styleName || '');
            setAmount(formatNumberWithCommas(order.amount?.toString() || ''));
            setAmountPaid(formatNumberWithCommas(order.amountPaid?.toString() || '0'));
            setNotes(order.notes || '');
            setDeliveryDate(order.deliveryDate ? new Date(order.deliveryDate) : null);
            setFabricImage(order.fabricImage || null);
            setStyleImage(order.styleImage || null);
        }
    }, [order, isEditing]);

    const [isUpdating, setIsUpdating] = useState(false);

    if (!order) {
        return (
            <View className={`flex-1 items-center justify-center ${isDark ? 'bg-background-dark' : 'bg-white'}`}>
                <Typography variant="body" color="gray">Order not found</Typography>
                <Button onPress={() => router.replace('/(tabs)/orders')} className="mt-4">Go Back</Button>
            </View>
        );
    }

    const handleUpdate = async () => {
        if (!styleName.trim()) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'Style name is required' });
            return;
        }

        setIsUpdating(true);

        try {
            let finalFabricImage = fabricImage;
            let finalStyleImage = styleImage;

            // Only upload if they are local URIs (newly picked)
            const needsFabricUpload = isLocalUri(fabricImage);
            const needsStyleUpload = isLocalUri(styleImage);

            if (needsFabricUpload || needsStyleUpload) {
                Toast.show({ type: 'info', text1: 'Uploading new images...' });
                const uploaded = await uploadOrderImages(
                    needsFabricUpload ? fabricImage : null,
                    needsStyleUpload ? styleImage : null
                );

                if (needsFabricUpload && uploaded.fabricImage) finalFabricImage = uploaded.fabricImage;
                if (needsStyleUpload && uploaded.styleImage) finalStyleImage = uploaded.styleImage;
            }

            await updateOrder(id as string, {
                styleName,
                amount: parseFloat(amount.replace(/,/g, '')) || 0,
                amountPaid: parseFloat(amountPaid.replace(/,/g, '')) || 0,
                notes,
                deliveryDate: deliveryDate,
                fabricImage: finalFabricImage || undefined,
                styleImage: finalStyleImage || undefined
            });

            setIsEditing(false);
            Toast.show({ type: 'success', text1: 'Success', text2: 'Saved and synced' });
            performSync().catch(console.error);
        } catch (error) {
            console.error('Update error:', error);
            Toast.show({ type: 'error', text1: 'Update Failed', text2: 'Could not update order' });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = () => {
        confirm({
            title: 'Delete Order',
            message: 'Are you sure you want to delete this order?',
            confirmText: 'Delete',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await deleteOrder(id as string);
                    router.back();
                    Toast.show({ type: 'success', text1: 'Deleted', text2: 'Removed from device' });
                    performSync().catch(console.error);
                } catch (error) {
                    Toast.show({ type: 'error', text1: 'Delete Failed', text2: 'Could not remove order' });
                }
            }
        });
    };

    const pickImage = async (type: 'fabric' | 'style') => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            if (type === 'fabric') {
                setFabricImage(result.assets[0].uri);
            } else {
                setStyleImage(result.assets[0].uri);
            }
        }
    };

    const handleStatusToggle = async () => {
        const newStatus = order.status === 'DELIVERED' ? 'PENDING' : 'DELIVERED';

        const performToggle = async () => {
            try {
                await updateOrderStatus(id as string, newStatus);
                Toast.show({
                    type: 'success',
                    text1: newStatus === 'DELIVERED' ? 'Order Delivered' : 'Order Reopened',
                    text2: `Status updated to ${newStatus}`
                });
                performSync().catch(console.error);

                if (newStatus === 'DELIVERED') {
                    setTimeout(() => {
                        StoreReviewService.requestReview().catch(console.error);
                    }, 1500);
                }
            } catch (error) {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update status' });
            }
        };

        if (newStatus === 'DELIVERED') {
            confirm({
                title: 'Mark as Delivered',
                message: 'Are you sure this order has been delivered to the client?',
                confirmText: 'Yes, Delivered',
                type: 'success',
                onConfirm: performToggle
            });
        } else {
            performToggle();
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || deliveryDate || new Date();
        setShowDatePicker(Platform.OS === 'ios');
        setDeliveryDate(currentDate);
        if (Platform.OS !== 'ios') {
            setShowDatePicker(false);
        }
    };

    const SectionLabel = ({ children, rightAction }: { children: string, rightAction?: React.ReactNode }) => (
        <View className="flex-row justify-between items-center ml-5 mb-2 mr-5 mt-4">
            <Typography variant="caption" color="gray" weight="bold" className="uppercase tracking-wider opacity-50 text-[11px]">
                {children}
            </Typography>
            {rightAction}
        </View>
    );

    const formatDateShort = (date: Date | null) => {
        if (!date) return 'Not set';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-[#F2F2F7]'}`}>
            <View className={`px-4 pt-2 pb-2 flex-row justify-between items-center border-b ${isDark ? 'bg-zinc-950 border-white/5' : 'bg-white border-gray-50'}`}>
                <IconButton
                    icon={<ArrowLeft size={22} color={isDark ? "white" : "black"} />}
                    onPress={() => isEditing ? setIsEditing(false) : router.replace('/(tabs)/orders')}
                    variant="ghost"
                />
                <Typography variant="h3" weight="bold">
                    {isEditing ? 'Edit Order' : 'Order Details'}
                </Typography>
                <TouchableOpacity onPress={() => isEditing ? handleUpdate() : setIsEditing(true)}>
                    <Typography color="primary" weight="bold">
                        {isEditing ? 'Done' : 'Edit'}
                    </Typography>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView contentContainerClassName="py-6 pb-24" showsVerticalScrollIndicator={false}>
                    {!isEditing ? (
                        <>
                            {/* Order Basics */}
                            <SectionLabel>Order Basics</SectionLabel>
                            <View className="px-4 mb-6">
                                <Surface variant="white" className={`${isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm shadow-gray-200/50'}`} rounded="2xl">
                                    <View className={`p-4 border-b ${isDark ? 'border-white/5' : 'border-gray-50'}`}>
                                        <Typography variant="h2" weight="bold" className="text-2xl">{order.styleName}</Typography>
                                        <Typography color="gray" variant="caption" weight="bold" className="opacity-50 mt-1">ID: #{order.id.slice(-8).toUpperCase()}</Typography>
                                    </View>
                                    <View className={`p-4 flex-row justify-between items-center`}>
                                        <Typography weight="semibold">Status</Typography>
                                        <Surface variant={order.status === 'DELIVERED' ? 'green' : 'peach'} className={`px-3 py-1 ${isDark ? (order.status === 'DELIVERED' ? 'bg-[#34C759]/20' : 'bg-[#FF9500]/20') : ''}`} rounded="full">
                                            <Typography variant="small" weight="bold" className={order.status === 'DELIVERED' ? (isDark ? 'text-[#30D158]' : 'text-[#34C759]') : (isDark ? 'text-[#FF9F0A]' : 'text-[#FF9500]')}>
                                                {order.status}
                                            </Typography>
                                        </Surface>
                                    </View>
                                </Surface>
                            </View>

                            {/* Client Section */}
                            {customer && (
                                <>
                                    <SectionLabel>Client</SectionLabel>
                                    <View className="px-4 mb-6">
                                        <Surface variant="white" className={`${isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm shadow-gray-200/50'}`} rounded="2xl">
                                            <TouchableOpacity
                                                onPress={() => router.push({ pathname: '/(tabs)/customers/[id]', params: { id: customer.id } })}
                                                className={`p-4 flex-row items-center border-b ${isDark ? 'border-white/5' : 'border-gray-50'}`}
                                            >
                                                <View className={`w-12 h-12 items-center justify-center rounded-full mr-4 ${isDark ? 'bg-zinc-800' : 'bg-indigo-50'}`}>
                                                    <Typography weight="bold" color="primary">
                                                        {(customer.fullName || '??').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                    </Typography>
                                                </View>
                                                <View className="flex-1">
                                                    <Typography weight="bold" className="text-[16px]">{customer.fullName}</Typography>
                                                    <Typography variant="caption" color="gray" className="mt-0.5">{customer.phoneNumber}</Typography>
                                                </View>
                                            </TouchableOpacity>

                                            <View className="p-3 flex-row gap-3">
                                                <TouchableOpacity
                                                    onPress={() => customer?.phoneNumber && Linking.openURL(`tel:${customer.phoneNumber}`)}
                                                    className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${isDark ? 'bg-[#007AFF]/20' : 'bg-[#007AFF]/10'}`}
                                                >
                                                    <Call size={16} color={isDark ? "#0A84FF" : "#007AFF"} variant="Bold" />
                                                    <Typography variant="small" weight="bold" className={`ml-2 ${isDark ? 'text-[#0A84FF]' : 'text-[#007AFF]'}`}>Call Client</Typography>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => customer?.phoneNumber && Linking.openURL(`sms:${customer.phoneNumber}`)}
                                                    className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${isDark ? 'bg-[#34C759]/20' : 'bg-[#34C759]/10'}`}
                                                >
                                                    <Timer1 size={16} color={isDark ? "#30D158" : "#34C759"} variant="Bold" />
                                                    <Typography variant="small" weight="bold" className={`ml-2 ${isDark ? 'text-[#30D158]' : 'text-[#34C759]'}`}>Text Client</Typography>
                                                </TouchableOpacity>
                                            </View>
                                        </Surface>
                                    </View>
                                </>
                            )}

                            {/* Logistics & Payment */}
                            <SectionLabel>Logistics & Billing</SectionLabel>
                            <View className="px-4 mb-6">
                                <Surface variant="white" className={`${isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm shadow-gray-200/50'}`} rounded="2xl">
                                    <View className={`p-4 flex-row justify-between items-center border-b ${isDark ? 'border-white/5' : 'border-gray-50'}`}>
                                        <Typography weight="semibold" color="gray">Delivery Date</Typography>
                                        <Typography weight="bold" color="primary">{formatDateShort(deliveryDate)}</Typography>
                                    </View>
                                    <View className={`p-4 flex-row justify-between items-center border-b ${isDark ? 'border-white/5' : 'border-gray-50'}`}>
                                        <Typography weight="semibold" color="gray">Total Amount</Typography>
                                        <Typography weight="bold" className="text-lg">{currencySymbol}{order.amount?.toLocaleString()}</Typography>
                                    </View>
                                    <View className={`p-4 flex-row justify-between items-center border-b ${isDark ? 'border-white/5' : 'border-gray-50'}`}>
                                        <Typography weight="semibold" color="gray">Amount Paid</Typography>
                                        <Typography weight="bold" className="text-lg text-[#34C759]">{currencySymbol}{order.amountPaid?.toLocaleString()}</Typography>
                                    </View>
                                    <View className="p-4">
                                        <View className="flex-row justify-between items-center mb-3">
                                            <Typography weight="semibold" color="gray">Balance Due</Typography>
                                            <Typography weight="bold" className={`text-lg ${(order.balance || 0) > 0 ? 'text-[#FF9500]' : 'text-[#34C759]'}`}>
                                                {currencySymbol}{order.balance?.toLocaleString()}
                                            </Typography>
                                        </View>
                                        <View className={`${isDark ? 'bg-white/5' : 'bg-gray-100'} h-2 rounded-full overflow-hidden`}>
                                            <View
                                                className={`h-full ${(order.balance || 0) > 0 ? 'bg-[#FF9500]' : 'bg-[#34C759]'}`}
                                                style={{ width: `${Math.min(100, ((order.amountPaid || 0) / (order.amount || 1)) * 100)}%` }}
                                            />
                                        </View>
                                    </View>
                                </Surface>
                            </View>

                            {/* Reference Images */}
                            <SectionLabel>Design References</SectionLabel>
                            <View className="px-4 mb-6">
                                <Surface variant="white" className={`p-2 flex-row gap-2 ${isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm shadow-gray-200/50'}`} rounded="2xl">
                                    <TouchableOpacity
                                        className="flex-1 aspect-square rounded-xl overflow-hidden bg-gray-100"
                                        onPress={() => fabricImage && openViewer(fabricImage, 'Fabric')}
                                    >
                                        {fabricImage ? (
                                            <Image source={{ uri: fabricImage }} className="w-full h-full" />
                                        ) : (
                                            <View className="w-full h-full items-center justify-center">
                                                <Typography variant="caption" color="gray">No Fabric</Typography>
                                            </View>
                                        )}
                                        <View className="absolute bottom-2 left-2 bg-black/50 px-2 py-0.5 rounded-md">
                                            <Typography variant="caption" color="white" weight="bold">Fabric</Typography>
                                        </View>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        className="flex-1 aspect-square rounded-xl overflow-hidden bg-gray-100"
                                        onPress={() => styleImage && openViewer(styleImage, 'Style')}
                                    >
                                        {styleImage ? (
                                            <Image source={{ uri: styleImage }} className="w-full h-full" />
                                        ) : (
                                            <View className="w-full h-full items-center justify-center">
                                                <Typography variant="caption" color="gray">No Style</Typography>
                                            </View>
                                        )}
                                        <View className="absolute bottom-2 left-2 bg-black/50 px-2 py-0.5 rounded-md">
                                            <Typography variant="caption" color="white" weight="bold">Style</Typography>
                                        </View>
                                    </TouchableOpacity>
                                </Surface>
                            </View>

                            {/* Notes */}
                            <SectionLabel>Special Notes</SectionLabel>
                            <View className="px-4 mb-8">
                                <Surface variant="white" className={`p-4 ${isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm shadow-gray-200/50'}`} rounded="2xl">
                                    <Typography className={`${isDark ? 'text-zinc-400' : 'text-zinc-600'} leading-6 font-medium`}>
                                        {order.notes || "No additional notes for this order."}
                                    </Typography>
                                </Surface>
                            </View>

                            <View className="px-4 mb-12">
                                <Button
                                    onPress={handleStatusToggle}
                                    className={`h-16 rounded-2xl ${order.status === 'DELIVERED' ? 'bg-[#FF9500]' : 'bg-[#34C759]'} border-0`}
                                    textClassName="text-white font-bold"
                                >
                                    {order.status === 'DELIVERED' ? 'Reopen Order' : 'Mark as Delivered'}
                                </Button>
                            </View>
                        </>
                    ) : (
                        <View className="px-4">
                            {/* Edit Mode Header */}
                            <SectionLabel>Order Information</SectionLabel>
                            <Surface variant="white" rounded="2xl" className={`mb-6 overflow-hidden ${isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm shadow-gray-200/50'}`}>
                                <View className={`flex-row items-center px-4 border-b ${isDark ? 'border-white/5' : 'border-gray-50'}`}>
                                    <Typography weight="medium" color="gray" className="w-24 text-[14px]">Style Name</Typography>
                                    <TextInput
                                        value={styleName}
                                        onChangeText={setStyleName}
                                        className={`flex-1 h-14 font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}
                                        placeholder="Senator Suit..."
                                    />
                                </View>

                                <View className={`flex-row items-center px-4 border-b ${isDark ? 'border-white/5' : 'border-gray-50'}`}>
                                    <Typography weight="medium" color="gray" className="w-24 text-[14px]">Total ({currencySymbol})</Typography>
                                    <TextInput
                                        value={amount}
                                        onChangeText={(v) => handleAmountInput(v, setAmount)}
                                        keyboardType="numeric"
                                        className={`flex-1 h-14 font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}
                                        placeholder="0"
                                    />
                                </View>

                                <View className={`flex-row items-center px-4 border-b ${isDark ? 'border-white/5' : 'border-gray-50'}`}>
                                    <Typography weight="medium" color="gray" className="w-24 text-[14px]">Paid ({currencySymbol})</Typography>
                                    <TextInput
                                        value={amountPaid}
                                        onChangeText={(v) => handleAmountInput(v, setAmountPaid)}
                                        keyboardType="numeric"
                                        className={`flex-1 h-14 font-bold ${isDark ? 'text-white' : 'text-[#34C759]'}`}
                                        placeholder="0"
                                    />
                                </View>

                                <Pressable
                                    onPress={() => setShowDatePicker(true)}
                                    className={`flex-row items-center px-4 h-14`}
                                >
                                    <Typography weight="medium" color="gray" className="w-24 text-[14px]">Due Date</Typography>
                                    <Typography weight="bold" color="primary" className="flex-1">{formatDateShort(deliveryDate)}</Typography>
                                    <ArrowRight2 size={16} color="#C7C7CC" />
                                </Pressable>
                            </Surface>

                            <SectionLabel>Images</SectionLabel>
                            <View className="flex-row gap-4 mb-6">
                                <TouchableOpacity onPress={() => pickImage('fabric')} className="flex-1">
                                    <Surface variant="white" className={`h-36 items-center justify-center border-2 border-dashed ${isDark ? 'border-white/10 bg-[#1C1C1E]' : 'border-blue-100 bg-white shadow-sm'} overflow-hidden`} rounded="2xl">
                                        {fabricImage ? (
                                            <Image source={{ uri: fabricImage }} className="w-full h-full" />
                                        ) : (
                                            <View className="items-center">
                                                <View className={`w-10 h-10 rounded-full items-center justify-center mb-1 ${isDark ? 'bg-zinc-800' : 'bg-blue-50'}`}>
                                                    <Add size={20} color="#007AFF" />
                                                </View>
                                                <Typography variant="caption" color="gray" weight="bold">Fabric</Typography>
                                            </View>
                                        )}
                                    </Surface>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => pickImage('style')} className="flex-1">
                                    <Surface variant="white" className={`h-36 items-center justify-center border-2 border-dashed ${isDark ? 'border-white/10 bg-[#1C1C1E]' : 'border-blue-100 bg-white shadow-sm'} overflow-hidden`} rounded="2xl">
                                        {styleImage ? (
                                            <Image source={{ uri: styleImage }} className="w-full h-full" />
                                        ) : (
                                            <View className="items-center">
                                                <View className={`w-10 h-10 rounded-full items-center justify-center mb-1 ${isDark ? 'bg-zinc-800' : 'bg-blue-50'}`}>
                                                    <Add size={20} color="#007AFF" />
                                                </View>
                                                <Typography variant="caption" color="gray" weight="bold">Design</Typography>
                                            </View>
                                        )}
                                    </Surface>
                                </TouchableOpacity>
                            </View>

                            <SectionLabel>Notes</SectionLabel>
                            <Surface variant="white" rounded="2xl" className={`p-4 mb-10 ${isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm shadow-gray-200/50'}`}>
                                <TextInput
                                    value={notes}
                                    onChangeText={setNotes}
                                    multiline
                                    placeholder="Add styling details or measurements..."
                                    className={`min-h-[120px] font-medium text-[15px] ${isDark ? 'text-white' : 'text-zinc-800'}`}
                                    textAlignVertical="top"
                                />
                            </Surface>

                            <Button onPress={handleDelete} variant="ghost" className="h-14 mb-10 bg-red-500/10 rounded-2xl" textClassName="text-[#FF3B30] font-bold">
                                Delete Order
                            </Button>

                            {showDatePicker && Platform.OS !== 'ios' && (
                                <DateTimePicker
                                    value={deliveryDate || new Date()}
                                    mode="date"
                                    display="default"
                                    onChange={onDateChange}
                                />
                            )}
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Modals */}
            {showDatePicker && Platform.OS === 'ios' && (
                <Modal
                    transparent={true}
                    animationType="slide"
                    visible={showDatePicker}
                >
                    <View className="flex-1 justify-end">
                        <View className={`p-6 pb-12 rounded-t-[40px] shadow-2xl ${isDark ? 'bg-[#1C1C1E] border-t border-white/5' : 'bg-white'}`}>
                            <View className="flex-row justify-between items-center mb-6">
                                <Typography variant="h3" weight="bold">Due Date</Typography>
                                <Pressable onPress={() => setShowDatePicker(false)}>
                                    <Typography variant="body" color="primary" weight="bold">Done</Typography>
                                </Pressable>
                            </View>
                            <DateTimePicker
                                testID="dateTimePicker"
                                value={deliveryDate || new Date()}
                                mode="date"
                                is24Hour={true}
                                display="spinner"
                                onChange={onDateChange}
                                textColor={isDark ? 'white' : 'black'}
                            />
                        </View>
                    </View>
                </Modal>
            )}

            {/* Image Viewer Modal */}
            <Modal
                visible={viewerVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setViewerVisible(false)}
            >
                <View className="flex-1 bg-black justify-center items-center">
                    <SafeAreaView className="absolute top-0 left-0 right-0 z-10 p-6 flex-row justify-between items-center">
                        <Typography variant="body" weight="bold" color="white">{selectedImage?.label}</Typography>
                        <TouchableOpacity
                            onPress={() => setViewerVisible(false)}
                            className="bg-white/10 p-2 rounded-full"
                        >
                            <CloseCircle size={28} color="white" />
                        </TouchableOpacity>
                    </SafeAreaView>

                    {selectedImage?.uri && (
                        <Image
                            source={{ uri: selectedImage.uri }}
                            className="w-full h-full"
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>
        </View>
    );
}
