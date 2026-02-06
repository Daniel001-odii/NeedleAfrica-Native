import React, { useState, useEffect } from 'react';
import { View, ScrollView, Image, TextInput, Alert, Platform, KeyboardAvoidingView, Pressable, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Edit2, Timer1, DocumentText, Money, Call, User, CloseCircle, Add } from 'iconsax-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Typography } from '../../../components/ui/Typography';
import { Surface } from '../../../components/ui/Surface';
import { IconButton } from '../../../components/ui/IconButton';
import { Button } from '../../../components/ui/Button';
import { useOrders } from '../../../hooks/useOrders';
import { useCustomers } from '../../../hooks/useCustomers';
import { useSync } from '../../../hooks/useSync';
import DateTimePicker from '@react-native-community/datetimepicker';
import { uploadOrderImages } from '../../../services/ImageUploadService';
import Toast from 'react-native-toast-message';

const isLocalUri = (uri: string | null) => uri && (uri.startsWith('file://') || uri.startsWith('content://'));

export default function OrderDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { orders, updateOrder, updateOrderStatus, deleteOrder } = useOrders();
    const { customers } = useCustomers();
    const { sync: performSync } = useSync();

    const [isEditing, setIsEditing] = useState(false);

    // Find order from existing list
    const order = orders.find(o => o.id === id);
    const customer = customers.find(c => c.id === order?.customerId);

    const [styleName, setStyleName] = useState('');
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [deliveryDate, setDeliveryDate] = useState<Date | null>(null);
    const [fabricImage, setFabricImage] = useState<string | null>(null);
    const [styleImage, setStyleImage] = useState<string | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        if (order) {
            setStyleName(order.styleName || '');
            setAmount(order.amount?.toString() || '');
            setNotes(order.notes || '');
            setDeliveryDate(order.deliveryDate ? new Date(order.deliveryDate) : null);
            setFabricImage(order.fabricImage || null);
            setStyleImage(order.styleImage || null);
        }
    }, [order, isEditing]);

    if (!order) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center" edges={['top']}>
                <Typography variant="body" color="gray">Order not found</Typography>
                <Button onPress={() => router.back()} className="mt-4">Go Back</Button>
            </SafeAreaView>
        );
    }

    const [isUpdating, setIsUpdating] = useState(false);

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
                amount: parseFloat(amount) || 0,
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
        Alert.alert(
            'Delete Order',
            'Are you sure you want to delete this order?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteOrder(id as string);
                            router.back();
                            Toast.show({ type: 'success', text1: 'Deleted', text2: 'Removed from device' });
                            performSync().catch(console.error);
                        } catch (error) {
                            Toast.show({ type: 'error', text1: 'Delete Failed', text2: 'Could not remove order' });
                        }
                    }
                }
            ]
        );
    };

    const pickImage = async (type: 'fabric' | 'style') => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
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
        try {
            await updateOrderStatus(id as string, newStatus);
            Toast.show({
                type: 'success',
                text1: newStatus === 'DELIVERED' ? 'Order Delivered' : 'Order Reopened',
                text2: `Status updated to ${newStatus}`
            });
            performSync().catch(console.error);
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update status' });
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) setDeliveryDate(selectedDate);
    };

    const formatDate = (date: Date | null) => {
        if (!date) return 'Not set';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <View className="px-6 py-4 flex-row justify-between items-center border-b border-gray-50">
                <IconButton
                    icon={<ArrowLeft size={20} color="black" />}
                    onPress={() => isEditing ? setIsEditing(false) : router.back()}
                    variant="ghost"
                    className="-ml-2"
                />
                <Typography variant="h3" weight="bold">
                    {isEditing ? 'Edit Order' : 'Order Details'}
                </Typography>
                <IconButton
                    icon={isEditing ? <CloseCircle size={20} color="#EF4444" /> : <Edit2 size={20} color="black" />}
                    onPress={() => setIsEditing(!isEditing)}
                    variant="ghost"
                    className="-mr-2"
                />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView contentContainerClassName="p-6 pb-24" showsVerticalScrollIndicator={false}>
                    {!isEditing ? (
                        <>
                            {/* View Mode */}
                            <View className="flex-row justify-between items-start mb-6">
                                <View className="flex-1">
                                    <Typography variant="h1" weight="bold" className="mb-2 leading-tight">{order.styleName}</Typography>
                                    <View className="flex-row items-center">
                                        <Surface variant={order.status === 'DELIVERED' ? 'green' : 'peach'} className="px-3 py-1 mr-2" rounded="full">
                                            <Typography variant="small" weight="bold" className={order.status === 'DELIVERED' ? 'text-green-700' : 'text-orange-700'}>
                                                {order.status}
                                            </Typography>
                                        </Surface>
                                        <Typography variant="caption" color="gray">#{order.id.slice(-6).toUpperCase()}</Typography>
                                    </View>
                                </View>
                                <Surface variant="muted" className="w-16 h-16 items-center justify-center" rounded="2xl">
                                    <Calendar size={24} color="#6B7280" variant="Bulk" />
                                </Surface>
                            </View>

                            {/* Client Info Card */}
                            {customer && (
                                <Surface variant="white" className="p-4 mb-6 border border-gray-100 flex-row items-center" rounded="2xl">
                                    <View className="w-12 h-12 bg-lavender items-center justify-center rounded-xl mr-4">
                                        <Typography weight="bold" className="text-brand-primary">
                                            {customer.fullName.charAt(0).toUpperCase()}{customer.fullName.charAt(1).toUpperCase()}
                                        </Typography>
                                    </View>
                                    <View className="flex-1">
                                        <Typography weight="bold">{customer.fullName}</Typography>
                                        <Typography variant="small" color="gray">{customer.phoneNumber || 'No phone number'}</Typography>
                                    </View>
                                    <IconButton icon={<Call size={20} color="black" />} variant="ghost" />
                                </Surface>
                            )}

                            {/* Grid Info */}
                            <View className="flex-row gap-4 mb-6">
                                <Surface variant="blue" className="flex-1 p-4" rounded="3xl">
                                    <View className="flex-row items-center mb-2 opacity-60">
                                        <Timer1 size={16} color="black" className="mr-2" />
                                        <Typography variant="small" weight="bold">Due Date</Typography>
                                    </View>
                                    <Typography variant="h3" weight="bold">{formatDate(deliveryDate)}</Typography>
                                </Surface>
                                <Surface variant="green" className="flex-1 p-4" rounded="3xl">
                                    <View className="flex-row items-center mb-2 opacity-60">
                                        <Money size={16} color="black" className="mr-2" />
                                        <Typography variant="small" weight="bold">Price</Typography>
                                    </View>
                                    <Typography variant="h3" weight="bold">₦{order.amount?.toLocaleString() || '0'}</Typography>
                                </Surface>
                            </View>

                            {/* Reference Images */}
                            <Typography variant="caption" weight="bold" color="gray" className="mb-3 uppercase ml-1">References</Typography>
                            <View className="flex-row gap-4 mb-8 h-48">
                                <Surface variant="muted" className="flex-1 overflow-hidden h-full items-center justify-center" rounded="3xl">
                                    {fabricImage ? (
                                        <Image source={{ uri: fabricImage }} className="w-full h-full" resizeMode="cover" />
                                    ) : (
                                        <Typography variant="caption" color="gray">No Fabric Photo</Typography>
                                    )}
                                    <View className="absolute bottom-3 left-3 bg-white/80 px-2 py-1 rounded-lg">
                                        <Typography variant="small" weight="bold">Fabric</Typography>
                                    </View>
                                </Surface>
                                <Surface variant="muted" className="flex-1 overflow-hidden h-full items-center justify-center" rounded="3xl">
                                    {styleImage ? (
                                        <Image source={{ uri: styleImage }} className="w-full h-full" resizeMode="cover" />
                                    ) : (
                                        <Typography variant="caption" color="gray">No Style Photo</Typography>
                                    )}
                                    <View className="absolute bottom-3 left-3 bg-white/80 px-2 py-1 rounded-lg">
                                        <Typography variant="small" weight="bold">Style</Typography>
                                    </View>
                                </Surface>
                            </View>

                            {/* Notes */}
                            <View className="mb-10">
                                <View className="flex-row items-center mb-3">
                                    <DocumentText size={20} color="#6B7280" variant="Bulk" />
                                    <Typography variant="caption" weight="bold" color="gray" className="uppercase ml-2">Notes</Typography>
                                </View>
                                <Surface variant="muted" className="p-5" rounded="2xl">
                                    <Typography variant="body" className="leading-relaxed">
                                        {order.notes || "No additional notes for this order."}
                                    </Typography>
                                </Surface>
                            </View>

                            <Button
                                onPress={handleStatusToggle}
                                className={`h-16 rounded-full ${order.status === 'DELIVERED' ? 'bg-green-600' : 'bg-dark'}`}
                                textClassName="text-white"
                            >
                                {order.status === 'DELIVERED' ? 'Order Delivered' : 'Mark as Delivered'}
                            </Button>
                        </>
                    ) : (
                        <View className="gap-6">
                            {/* Edit Mode */}
                            <View>
                                <Typography variant="caption" color="gray" weight="medium" className="ml-1 mb-2 uppercase">Dress Type</Typography>
                                <Surface variant="muted" rounded="2xl" className="p-1 px-4 border border-gray-100">
                                    <TextInput
                                        className="h-14 font-semibold text-dark"
                                        placeholder="E.g. Senator Suit"
                                        value={styleName}
                                        onChangeText={setStyleName}
                                    />
                                </Surface>
                            </View>

                            {/* Image Pickers in Edit Mode */}
                            <View className="flex-row gap-4">
                                <View className="flex-1">
                                    <Typography variant="caption" color="gray" weight="medium" className="ml-1 mb-2 uppercase">Fabric</Typography>
                                    <Pressable onPress={() => pickImage('fabric')}>
                                        <Surface variant="white" className="h-40 items-center justify-center border-2 border-dashed border-blue-200 overflow-hidden" rounded="3xl">
                                            {fabricImage ? (
                                                <Image source={{ uri: fabricImage }} className="w-full h-full" resizeMode="cover" />
                                            ) : (
                                                <>
                                                    <Add size={24} color="#3B82F6" />
                                                    <Typography variant="caption" color="gray" weight="bold" className="mt-1">Add Fabric</Typography>
                                                </>
                                            )}
                                        </Surface>
                                    </Pressable>
                                </View>
                                <View className="flex-1">
                                    <Typography variant="caption" color="gray" weight="medium" className="ml-1 mb-2 uppercase">Style</Typography>
                                    <Pressable onPress={() => pickImage('style')}>
                                        <Surface variant="white" className="h-40 items-center justify-center border-2 border-dashed border-blue-200 overflow-hidden" rounded="3xl">
                                            {styleImage ? (
                                                <Image source={{ uri: styleImage }} className="w-full h-full" resizeMode="cover" />
                                            ) : (
                                                <>
                                                    <Add size={24} color="#3B82F6" />
                                                    <Typography variant="caption" color="gray" weight="bold" className="mt-1">Add Style</Typography>
                                                </>
                                            )}
                                        </Surface>
                                    </Pressable>
                                </View>
                            </View>

                            <View>
                                <Typography variant="caption" color="gray" weight="medium" className="ml-1 mb-2 uppercase">Amount (₦)</Typography>
                                <Surface variant="muted" rounded="2xl" className="p-1 px-4 border border-gray-100">
                                    <TextInput
                                        className="h-14 font-semibold text-dark"
                                        placeholder="E.g. 5000"
                                        value={amount}
                                        onChangeText={setAmount}
                                        keyboardType="numeric"
                                    />
                                </Surface>
                            </View>

                            <View>
                                <Typography variant="caption" color="gray" weight="medium" className="ml-1 mb-2 uppercase">Due Date</Typography>
                                <Pressable onPress={() => setShowDatePicker(true)}>
                                    <Surface variant="muted" rounded="2xl" className="p-4 h-14 justify-center border border-gray-100">
                                        <Typography weight="semibold">{formatDate(deliveryDate)}</Typography>
                                    </Surface>
                                </Pressable>
                                {showDatePicker && (
                                    <DateTimePicker
                                        value={deliveryDate || new Date()}
                                        mode="date"
                                        display="default"
                                        onChange={onDateChange}
                                    />
                                )}
                            </View>

                            <View>
                                <Typography variant="caption" color="gray" weight="medium" className="ml-1 mb-2 uppercase">Notes</Typography>
                                <Surface variant="muted" rounded="2xl" className="p-4 border border-gray-100 min-h-[140px]">
                                    <TextInput
                                        className="font-medium text-dark flex-1"
                                        placeholder="Add details..."
                                        value={notes}
                                        onChangeText={setNotes}
                                        multiline
                                        textAlignVertical="top"
                                    />
                                </Surface>
                            </View>

                            <View className="flex-row gap-4 mt-4">
                                <Button onPress={handleDelete} className="flex-1 h-16 rounded-full bg-red-50 border-0" textClassName="text-red-500">
                                    Delete
                                </Button>
                                <Button
                                    onPress={handleUpdate}
                                    className="flex-[2] h-16 rounded-full bg-dark"
                                    textClassName="text-white"
                                    isLoading={isUpdating}
                                    disabled={isUpdating}
                                >
                                    {isUpdating ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </View>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
