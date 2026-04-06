import React, { useState } from 'react';
import {
    View,
    TextInput,
    ScrollView,
    Platform,
    Image,
    TouchableOpacity,
    KeyboardAvoidingView,
    Pressable
} from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Calendar, GalleryAdd, ArrowLeft, CloseSquare } from 'iconsax-react-native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useOrders } from '../../hooks/useOrders';
import { useAuth } from '../../contexts/AuthContext';
import { useSync } from '../../hooks/useSync';
import { uploadOrderImages } from '../../services/ImageUploadService';
import { IconButton } from '../../components/ui/IconButton';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import { Modal } from 'react-native';
import { TypingText } from '../../components/ui/TypingText';

export default function CreateFirstOrder() {
    const { state, updateState, nextStep, prevStep } = useOnboarding();
    const { addOrder } = useOrders();
    const { user } = useAuth();
    const { isOnline } = useSync();

    const [styleName, setStyleName] = useState(state.order?.styleName || '');
    const [amount, setAmount] = useState(state.order?.amount || '');
    const [amountPaid, setAmountPaid] = useState(state.order?.amountPaid || '');
    const [deliveryDate, setDeliveryDate] = useState(state.order?.deliveryDate ? new Date(state.order.deliveryDate) : new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [fabricImage, setFabricImage] = useState<string | null>(null);
    const [styleImage, setStyleImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const currencySymbol = user?.currency === 'USD' ? '$' : (user?.currency === 'GBP' ? '£' : '₦');

    const handleCreateOrder = async () => {
        if (!styleName.trim()) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'Please enter a style name' });
            return;
        }

        const parsedPrice = parseInt(amount.replace(/,/g, '')) || 0;
        const parsedDeposit = parseInt(amountPaid.replace(/,/g, '')) || 0;
        if (parsedDeposit > parsedPrice) {
            Toast.show({ type: 'error', text1: 'Invalid Deposit', text2: 'Deposit cannot be higher than order total amount' });
            return;
        }

        setIsLoading(true);
        try {
            let uploadedImages: { fabricImage?: string; styleImage?: string } = {};
            if (isOnline && (fabricImage || styleImage)) {
                uploadedImages = await uploadOrderImages(fabricImage, styleImage);
            }

            await addOrder({
                customerId: state.customer!.id!,
                styleName: styleName.trim(),
                amount: parseInt(amount.replace(/,/g, '')) || 0,
                amountPaid: parseInt(amountPaid.replace(/,/g, '')) || 0,
                status: 'PENDING',
                deliveryDate: deliveryDate,
                fabricImage: uploadedImages.fabricImage,
                styleImage: uploadedImages.styleImage,
            });

            updateState({
                order: {
                    styleName: styleName.trim(),
                    amount,
                    amountPaid,
                    deliveryDate: deliveryDate.toISOString()
                },
                step: 5
            });

            nextStep();
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to create order' });
        } finally {
            setIsLoading(false);
        }
    };

    const pickImage = async (type: 'fabric' | 'style') => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            if (type === 'fabric') setFabricImage(result.assets[0].uri);
            else setStyleImage(result.assets[0].uri);
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) setDeliveryDate(selectedDate);
    };

    const formatNumberWithCommas = (value: string): string => {
        const cleanValue = value.replace(/\D/g, '');
        return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const formatDate = (date: Date) => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const isFormValid = styleName.trim() && amount.trim();

    return (
        <View className="flex-1 bg-white">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">

                {/* Header */}
                <View className="px-6 pt-4 bg-white">
                    <IconButton
                        icon={<ArrowLeft size={24} color="#1F2937" />}
                        onPress={prevStep}
                        variant="ghost"
                        className="-ml-4"
                    />
                </View>

                <ScrollView
                    contentContainerClassName="p-6 pb-20 bg-white"
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="mb-8 mt-2">
                        <TypingText variant="h1" weight="bold" className="mb-2 text-gray-900" text="Create First Order" speed={30} />
                        <Typography color="gray" variant="subtitle" className="leading-5">
                            Let's get the details of {state.customer?.name}'s {state.template?.name || 'order'}.
                        </Typography>
                    </View>

                    {/* Group 1: Order Details */}
                    <View className="mb-6">
                        <Typography variant="caption" color="gray" weight="bold" className="ml-4 mb-2 uppercase tracking-wider text-[11px]">
                            Order Details
                        </Typography>
                        <View className="bg-white border border-gray-100 rounded-[24px] shadow-sm overflow-hidden">

                            {/* Style Name */}
                            <View className="flex-row items-center px-4 py-4 border-b border-gray-50">
                                <Typography weight="semibold" className="text-gray-900 w-1/3 text-[15px]">
                                    Style Name
                                </Typography>
                                <TextInput
                                    className="flex-1 text-right font-semibold text-gray-900 text-[16px]"
                                    placeholder="e.g. Red Traditional Suit"
                                    placeholderTextColor="#D1D5DB"
                                    value={styleName}
                                    onChangeText={setStyleName}
                                    returnKeyType="done"
                                />
                            </View>

                            {/* Delivery Date */}
                            <TouchableOpacity
                                onPress={() => setShowDatePicker(true)}
                                className="flex-row items-center justify-between px-4 py-4 active:bg-gray-50"
                            >
                                <Typography weight="semibold" className="text-gray-900 text-[15px]">
                                    Delivery Date
                                </Typography>
                                <View className="flex-row items-center bg-blue-50 px-3 py-1.5 rounded-lg">
                                    <Typography weight="bold" className="text-blue-600 mr-2">
                                        {formatDate(deliveryDate)}
                                    </Typography>
                                    <Calendar size={16} color="#2563EB" variant="Bulk" />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Group 2: Financials */}
                    <View className="mb-6">
                        <Typography variant="caption" color="gray" weight="bold" className="ml-4 mb-2 uppercase tracking-wider text-[11px]">
                            Payment Details
                        </Typography>
                        <View className="bg-white border border-gray-100 rounded-[24px] shadow-sm overflow-hidden">

                            {/* Total Price */}
                            <View className="flex-row items-center px-4 py-4 border-b border-gray-50">
                                <Typography weight="semibold" className="text-gray-900 w-1/3 text-[15px]">
                                    Total Price
                                </Typography>
                                <View className="flex-1 flex-row items-center justify-end">
                                    <Typography weight="bold" className="text-gray-400 mr-1">{currencySymbol}</Typography>
                                    <TextInput
                                        className="text-right font-bold text-gray-900 text-[18px] min-w-[60px]"
                                        placeholder="0"
                                        placeholderTextColor="#D1D5DB"
                                        keyboardType="numeric"
                                        value={amount}
                                        onChangeText={(val) => setAmount(formatNumberWithCommas(val))}
                                    />
                                </View>
                            </View>

                            {/* Deposit Paid */}
                            <View className="flex-row items-center px-4 py-4">
                                <Typography weight="semibold" className="text-gray-900 w-1/3 text-[15px]">
                                    Deposit Paid
                                </Typography>
                                <View className="flex-1 flex-row items-center justify-end">
                                    <Typography weight="bold" className="text-gray-400 mr-1">{currencySymbol}</Typography>
                                    <TextInput
                                        className="text-right font-bold text-blue-600 text-[18px] min-w-[60px]"
                                        placeholder="0"
                                        placeholderTextColor="#D1D5DB"
                                        keyboardType="numeric"
                                        value={amountPaid}
                                        onChangeText={(val) => setAmountPaid(formatNumberWithCommas(val))}
                                    />
                                </View>
                            </View>

                        </View>
                    </View>

                    {/* Group 3: Images */}
                    <View className="mb-6">
                        <Typography variant="caption" color="gray" weight="bold" className="ml-4 mb-2 uppercase tracking-wider text-[11px]">
                            References (Optional)
                        </Typography>
                        <View className="flex-row gap-4">

                            <TouchableOpacity
                                onPress={() => pickImage('fabric')}
                                className="flex-1 h-36 bg-gray-50 border border-gray-100 rounded-[24px] items-center justify-center overflow-hidden relative"
                            >
                                {fabricImage ? (
                                    <>
                                        <Image source={{ uri: fabricImage }} className="w-full h-full" resizeMode="cover" />
                                        <View className="absolute top-2 right-2 bg-black/40 rounded-full p-1">
                                            <CloseSquare size={20} color="white" variant="Bulk" onPress={() => setFabricImage(null)} />
                                        </View>
                                    </>
                                ) : (
                                    <View className="items-center">
                                        <View className="w-10 h-10 bg-white rounded-full items-center justify-center mb-2 shadow-sm border border-gray-50">
                                            <GalleryAdd size={20} color="#6B7280" variant="Bulk" />
                                        </View>
                                        <Typography weight="medium" color="gray" className="text-[13px]">Add Fabric</Typography>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => pickImage('style')}
                                className="flex-1 h-36 bg-gray-50 border border-gray-100 rounded-[24px] items-center justify-center overflow-hidden relative"
                            >
                                {styleImage ? (
                                    <>
                                        <Image source={{ uri: styleImage }} className="w-full h-full" resizeMode="cover" />
                                        <View className="absolute top-2 right-2 bg-black/40 rounded-full p-1">
                                            <CloseSquare size={20} color="white" variant="Bulk" onPress={() => setStyleImage(null)} />
                                        </View>
                                    </>
                                ) : (
                                    <View className="items-center">
                                        <View className="w-10 h-10 bg-white rounded-full items-center justify-center mb-2 shadow-sm border border-gray-50">
                                            <GalleryAdd size={20} color="#6B7280" variant="Bulk" />
                                        </View>
                                        <Typography weight="medium" color="gray" className="text-[13px]">Add Design</Typography>
                                    </View>
                                )}
                            </TouchableOpacity>

                        </View>
                    </View>

                </ScrollView>

                {/* Bottom Action Bar */}
                <View className="p-6 bg-white pt-2 border-t border-gray-50">
                    <Button
                        onPress={handleCreateOrder}
                        isLoading={isLoading}
                        disabled={!isFormValid}
                        className={`h-14 rounded-full border-0 ${!isFormValid ? 'bg-gray-200' : 'bg-blue-600'}`}
                        textClassName={`text-lg font-bold ${!isFormValid ? 'text-gray-400' : 'text-white'}`}
                    >
                        Complete Setup
                    </Button>

                    <View className="mt-5 items-center pb-2">
                        <Typography color="gray" variant="small" weight="medium">Step 5 of 5</Typography>
                    </View>
                </View>

                {/* Date Picker Overlay */}
                {showDatePicker && Platform.OS === 'ios' && (
                    <Modal
                        transparent={true}
                        animationType="slide"
                        visible={showDatePicker}
                    >
                        <View className="flex-1 justify-end">
                            <View className={`p-6 pb-12 rounded-t-[40px] shadow-2xl bg-white`}>
                                <View className="flex-row justify-between items-center mb-6">
                                    <Typography variant="h3" weight="bold">Due Date</Typography>
                                    <Pressable onPress={() => setShowDatePicker(false)} style={{ padding: 10 }}>
                                        <Typography variant="body" color="primary" weight="bold">Done</Typography>
                                    </Pressable>
                                </View>
                                <DateTimePicker
                                    testID="dateTimePicker"
                                    value={deliveryDate}
                                    mode="date"
                                    is24Hour={true}
                                    display="spinner"
                                    onChange={onDateChange}
                                    minimumDate={new Date()}
                                />
                            </View>
                        </View>
                    </Modal>
                )}

                {showDatePicker && Platform.OS !== 'ios' && (
                    <DateTimePicker
                        value={deliveryDate}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                        minimumDate={new Date()}
                    />
                )}
            </KeyboardAvoidingView>
        </View>
    );
}