import React, { useState } from 'react';
import { View, TextInput, ScrollView, Platform, Pressable, KeyboardAvoidingView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Add, TickCircle, ArrowDown2, Box } from 'iconsax-react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Typography } from '../../../components/ui/Typography';
import { Surface } from '../../../components/ui/Surface';
import { IconButton } from '../../../components/ui/IconButton';
import { Button } from '../../../components/ui/Button';
import { useCustomers, Customer } from '../../../hooks/useCustomers';
import { useOrders } from '../../../hooks/useOrders';
import { useResourceLimits } from '../../../hooks/useResourceLimits';
import { useSubscription } from '../../../hooks/useSubscription';
import { useSync } from '../../../hooks/useSync';
import { ResourceLimitModal } from '../../../components/ResourceLimitModal';
import { Modal, FlatList } from 'react-native';
import { SearchNormal1, CloseCircle as CloseCircleIcon, User } from 'iconsax-react-native';
import { uploadOrderImages } from '../../../services/ImageUploadService';
import Toast from 'react-native-toast-message';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { TypingText } from '../../../components/ui/TypingText';
import { CURRENCIES } from '../../../constants/currencies';

export default function NewOrder() {
    const router = useRouter();
    const { customers } = useCustomers();
    const { addOrder } = useOrders();
    const { canCreate, counts } = useResourceLimits();
    const { isFree } = useSubscription();
    const { isOnline } = useSync();
    const { isDark } = useTheme();
    const { user } = useAuth();
    const posthog = usePostHog();
    const currency = user?.currency || 'NGN';
    const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || '₦';

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

    const { customerId } = useLocalSearchParams<{ customerId: string }>();

    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showCustomerModal, setShowCustomerModal] = useState(true);
    const [customerSearch, setCustomerSearch] = useState('');

    const [dressType, setDressType] = useState('');
    const [notes, setNotes] = useState('');
    const [price, setPrice] = useState('');
    const [amountPaid, setAmountPaid] = useState('');
    const [dueDate, setDueDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [fabricImage, setFabricImage] = useState<string | null>(null);
    const [styleImage, setStyleImage] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

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

    React.useEffect(() => {
        if (customerId && customers.length > 0) {
            const preSelected = customers.find(c => c.id === customerId);
            if (preSelected) {
                setSelectedCustomer(preSelected);
                setShowCustomerModal(false);
            }
        }
    }, [customerId, customers]);

    const filteredCustomers = customers.filter(c =>
        (c.fullName || '').toLowerCase().includes(customerSearch.toLowerCase())
    );

    const handleCreateOrder = async () => {
        if (!selectedCustomer) {
            alert('Please select a client');
            return;
        }
        if (!dressType) {
            alert('Please enter a dress type');
            return;
        }

        const parsedPrice = parseInt(price.replace(/,/g, '')) || 0;
        const parsedDeposit = parseInt(amountPaid.replace(/,/g, '')) || 0;
        if (parsedDeposit > parsedPrice) {
            Toast.show({ type: 'error', text1: 'Invalid Deposit', text2: 'Deposit cannot be higher than order total amount' });
            return;
        }

        // Check resource limits for free tier
        if (isFree) {
            const limitCheck = canCreate('orders');
            if (!limitCheck.allowed && !proceedAnyway) {
                setLimitModalData(limitCheck);
                setShowLimitModal(true);
                return;
            }
        }

        setIsCreating(true);

        try {
            // Upload images to Cloudinary first
            let uploadedImages: { fabricImage?: string; styleImage?: string } = {};

            if (fabricImage || styleImage) {
                Toast.show({ type: 'info', text1: 'Uploading images...' });
                uploadedImages = await uploadOrderImages(fabricImage, styleImage);
            }

            await addOrder({
                customerId: selectedCustomer.id,
                styleName: dressType,
                amount: parseInt(price.replace(/,/g, '')) || 0,
                amountPaid: parseInt(amountPaid.replace(/,/g, '')) || 0,
                status: 'PENDING',
                notes: notes,
                deliveryDate: dueDate,
                fabricImage: uploadedImages.fabricImage || undefined,
                styleImage: uploadedImages.styleImage || undefined,
            });

            // Track order creation
            posthog.capture('order_created', {
                dress_type: dressType,
                amount: parseInt(price.replace(/,/g, '')) || 0,
                deposit: parseInt(amountPaid.replace(/,/g, '')) || 0,
                has_fabric_image: !!fabricImage,
                has_style_image: !!styleImage,
                has_notes: !!notes
            });

            Toast.show({ type: 'success', text1: 'Order created!' });
            router.replace('/(tabs)/orders');
        } catch (error) {
            console.error('Failed to create order:', error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to create order' });
        } finally {
            setIsCreating(false);
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || dueDate;
        setShowDatePicker(Platform.OS === 'ios');
        setDueDate(currentDate);
        if (Platform.OS !== 'ios') {
            setShowDatePicker(false);
        }
    };

    const pickImage = async (type: 'fabric' | 'style') => {
        if (!isOnline) {
            Toast.show({
                type: 'info',
                text1: 'Offline Mode',
                text2: 'Image upload is disabled while offline'
            });
            return;
        }

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

    const formatDate = (date: Date) => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-[#F2F2F7]'}`}>
            {/* <SafeAreaView className="flex-1" edges={['top', 'bottom']}> */}
            <View className={`px-4 pt-2 pb-2 ${isDark ? 'bg-black' : 'bg-[#F2F2F7]'}`}>
                <IconButton
                    icon={<ArrowLeft size={22} color={isDark ? "white" : "black"} />}
                    onPress={() => router.back()}
                    variant="ghost"
                />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    contentContainerClassName="p-6 pb-10"
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="mb-10 mt-2">
                        <TypingText
                            variant="h1"
                            weight="bold"
                            className={`mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
                            text="New Order"
                            speed={30}
                        />
                        <Typography color="gray" variant="subtitle" className="leading-5">
                            Start a new project by filling in the details below.
                        </Typography>
                    </View>

                    {/* Group 1: Identity */}
                    <View className="mb-8">
                        <Typography variant="caption" color="gray" weight="bold" className="ml-5 mb-2 uppercase tracking-wider text-[11px] opacity-50">
                            Order Identity
                        </Typography>
                        <Surface variant="white" className={`overflow-hidden ${isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm shadow-gray-200/50'}`} rounded="3xl">
                            {/* Dress Type */}
                            <View className={`flex-row items-center px-5 py-5 border-b ${isDark ? 'border-white/5' : 'border-gray-50'}`}>
                                <View className={`w-8 h-8 rounded-lg items-center justify-center mr-3 ${isDark ? 'bg-[#007AFF]/10' : 'bg-blue-50'}`}>
                                    <Box size={18} color={isDark ? "#0A84FF" : "#007AFF"} variant="Bulk" />
                                </View>
                                <TextInput
                                    className={`flex-1 text-[17px] font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}
                                    placeholder="Dress Type (e.g. Senator Suit)"
                                    placeholderTextColor={isDark ? "#4B5563" : "#9CA3AF"}
                                    value={dressType}
                                    onChangeText={setDressType}
                                />
                            </View>

                            {/* Client Selection */}
                            <TouchableOpacity
                                onPress={() => setShowCustomerModal(true)}
                                className={`flex-row items-center justify-between px-5 py-5 ${isDark ? 'active:bg-white/5' : 'active:bg-gray-50'}`}
                            >
                                <View className="flex-row items-center">
                                    <View className={`w-8 h-8 rounded-lg items-center justify-center mr-3 ${isDark ? 'bg-[#FF9500]/10' : 'bg-orange-50'}`}>
                                        <User size={18} color={isDark ? "#FF9F0A" : "#FF9500"} variant="Bulk" />
                                    </View>
                                    <Typography weight="bold" className={`text-[17px] ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                                        {selectedCustomer ? selectedCustomer.fullName : "Select Client"}
                                    </Typography>
                                </View>
                                <ArrowDown2 size={16} color="#C7C7CC" />
                            </TouchableOpacity>
                        </Surface>
                    </View>

                    {/* Group 2: Schedule & Financials */}
                    <View className="mb-8">
                        <Typography variant="caption" color="gray" weight="bold" className="ml-5 mb-2 uppercase tracking-wider text-[11px] opacity-50">
                            Schedule & Billing
                        </Typography>
                        <Surface variant="white" className={`overflow-hidden ${isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm shadow-gray-200/50'}`} rounded="3xl">
                            {/* Date */}
                            <TouchableOpacity
                                onPress={() => setShowDatePicker(true)}
                                className={`flex-row items-center justify-between px-5 py-5 border-b ${isDark ? 'border-white/5' : 'border-gray-50'} ${isDark ? 'active:bg-white/5' : 'active:bg-gray-50'}`}
                            >
                                <View className="flex-row items-center">
                                    <View className={`w-8 h-8 rounded-lg items-center justify-center mr-3 ${isDark ? 'bg-[#5856D6]/10' : 'bg-indigo-50'}`}>
                                        <Calendar size={18} color={isDark ? "#5E5CE6" : "#5856D6"} variant="Bulk" />
                                    </View>
                                    <Typography weight="bold" className={`text-[17px] ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                                        Delivery Date
                                    </Typography>
                                </View>
                                <View className="flex-row items-center">
                                    <Typography weight="bold" color="primary" className="mr-1">{formatDate(dueDate)}</Typography>
                                    <ArrowDown2 size={14} color={isDark ? "#0A84FF" : "#007AFF"} />
                                </View>
                            </TouchableOpacity>

                            {/* Total Price */}
                            <View className={`flex-row items-center px-5 py-5 border-b ${isDark ? 'border-white/5' : 'border-gray-50'}`}>
                                <Typography weight="bold" className={`flex-1 text-[17px] ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                                    Total Price ({currencySymbol})
                                </Typography>
                                <TextInput
                                    className={`flex-1 text-right text-[18px] font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}
                                    placeholder="0"
                                    placeholderTextColor="#C7C7CC"
                                    keyboardType="numeric"
                                    value={price}
                                    onChangeText={(value) => handleAmountInput(value, setPrice)}
                                />
                            </View>

                            {/* Deposit */}
                            <View className="flex-row items-center px-5 py-5">
                                <Typography weight="bold" className={`flex-1 text-[17px] ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                                    Initial Deposit ({currencySymbol})
                                </Typography>
                                <TextInput
                                    className={`flex-1 text-right text-[18px] font-bold ${isDark ? 'text-[#30D158]' : 'text-[#34C759]'}`}
                                    placeholder="0"
                                    placeholderTextColor="#C7C7CC"
                                    keyboardType="numeric"
                                    value={amountPaid}
                                    onChangeText={(value) => handleAmountInput(value, setAmountPaid)}
                                />
                            </View>
                        </Surface>
                    </View>

                    {/* Group 3: Media & Notes */}
                    <View className="mb-8">
                        <Typography variant="caption" color="gray" weight="bold" className="ml-5 mb-2 uppercase tracking-wider text-[11px] opacity-50">
                            Design & Fabric
                        </Typography>
                        <View className="flex-row gap-4 mb-6">
                            <TouchableOpacity onPress={() => pickImage('fabric')} className="flex-1">
                                <Surface variant="white" className={`h-40 items-center justify-center border-2 border-dashed ${isDark ? 'border-white/10 bg-[#1C1C1E]' : 'border-blue-100 bg-white shadow-sm shadow-gray-200/50'} overflow-hidden`} rounded="3xl">
                                    {fabricImage ? (
                                        <Image source={{ uri: fabricImage }} className="w-full h-full" resizeMode="cover" />
                                    ) : (
                                        <View className="items-center">
                                            <View className={`w-10 h-10 rounded-full items-center justify-center mb-2 ${isDark ? 'bg-[#007AFF]/20' : 'bg-blue-50'}`}>
                                                <Add size={22} color={isDark ? "#0A84FF" : "#007AFF"} />
                                            </View>
                                            <Typography variant="caption" color="gray" weight="bold">Fabric</Typography>
                                        </View>
                                    )}
                                </Surface>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => pickImage('style')} className="flex-1">
                                <Surface variant="white" className={`h-40 items-center justify-center border-2 border-dashed ${isDark ? 'border-white/10 bg-[#1C1C1E]' : 'border-blue-100 bg-white shadow-sm shadow-gray-200/50'} overflow-hidden`} rounded="3xl">
                                    {styleImage ? (
                                        <Image source={{ uri: styleImage }} className="w-full h-full" resizeMode="cover" />
                                    ) : (
                                        <View className="items-center">
                                            <View className={`w-10 h-10 rounded-full items-center justify-center mb-2 ${isDark ? 'bg-[#007AFF]/20' : 'bg-blue-50'}`}>
                                                <Add size={22} color={isDark ? "#0A84FF" : "#007AFF"} />
                                            </View>
                                            <Typography variant="caption" color="gray" weight="bold">Design</Typography>
                                        </View>
                                    )}
                                </Surface>
                            </TouchableOpacity>
                        </View>

                        <Surface variant="white" className={`overflow-hidden ${isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm shadow-gray-200/50'}`} rounded="3xl">
                            <View className="px-5 py-5">
                                <TextInput
                                    className={`text-[16px] font-bold min-h-[120px] ${isDark ? 'text-white' : 'text-zinc-900'}`}
                                    placeholder="Add specific notes or requirements..."
                                    placeholderTextColor="#C7C7CC"
                                    multiline
                                    textAlignVertical="top"
                                    value={notes}
                                    onChangeText={setNotes}
                                />
                            </View>
                        </Surface>
                    </View>

                    <View className="mb-12">
                        <Button
                            onPress={handleCreateOrder}
                            className={`h-16 rounded-[18px] ${isDark ? 'bg-white' : 'bg-zinc-900'} shadow-lg shadow-black/10`}
                            textClassName={isDark ? 'text-black font-bold text-lg' : 'text-white font-bold text-lg'}
                            isLoading={isCreating}
                            disabled={isCreating}
                        >
                            Create Order
                        </Button>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
            {/* </SafeAreaView> */}

            {/* Modals */}
            {showDatePicker && Platform.OS === 'ios' && (
                <Modal
                    transparent={true}
                    animationType="slide"
                    visible={showDatePicker}
                >
                    <View className="flex-1 justify-end">
                        <View className={`p-6 pb-12 rounded-t-[40px] shadow-2xl ${isDark ? 'bg-surface-dark border-t border-border-dark' : 'bg-white'}`}>
                            <View className="flex-row justify-between items-center mb-6">
                                <Typography variant="h3" weight="bold">Due Date</Typography>
                                <Pressable onPress={() => setShowDatePicker(false)}>
                                    <Typography variant="body" color="primary" weight="bold">Done</Typography>
                                </Pressable>
                            </View>
                            <DateTimePicker
                                testID="dateTimePicker"
                                value={dueDate}
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

            {showDatePicker && Platform.OS !== 'ios' && (
                <DateTimePicker
                    testID="dateTimePicker"
                    value={dueDate}
                    mode="date"
                    is24Hour={true}
                    display="default"
                    onChange={onDateChange}
                />
            )}

            <Modal
                visible={showCustomerModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCustomerModal(false)}
            >
                <View className="flex-1 bg-black/40 justify-end">
                    <Surface variant="white" className={`h-[85%] rounded-t-[32px] p-6 pb-12 ${isDark ? 'bg-[#1C1C1E]' : 'bg-[#F2F2F7]'}`} rounded="none">
                        <View className="flex-row items-center justify-between mb-6">
                            <Typography variant="h2" weight="bold" className="text-2xl">Select Client</Typography>

                            <TouchableOpacity onPress={() => setShowCustomerModal(false)} className={`w-8 h-8 rounded-full items-center justify-center ${isDark ? 'bg-white/10' : 'bg-black/5'}`}>
                                <Svg width="20" height="20" viewBox="0 0 24 24">
                                    <Path
                                        fill="none"
                                        stroke={isDark ? "white" : "black"}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M18 6L6 18m12 0L6 6"
                                    />
                                </Svg>
                            </TouchableOpacity>
                        </View>

                        <Surface variant="white" className={`flex-row items-center px-4 h-12 mb-6 ${isDark ? 'bg-white/5' : 'bg-black/5'}`} rounded="xl">
                            <SearchNormal1 size={18} color="#8E8E93" />
                            <TextInput
                                className={`ml-3 flex-1 font-bold ${isDark ? 'text-white' : 'text-zinc-900'} text-[16px]`}
                                placeholder="Search clients..."
                                placeholderTextColor="#8E8E93"
                                value={customerSearch}
                                onChangeText={setCustomerSearch}
                            />
                        </Surface>

                        <FlatList
                            data={filteredCustomers}
                            keyExtractor={(item) => item.id}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <Pressable
                                    onPress={() => {
                                        setSelectedCustomer(item);
                                        setShowCustomerModal(false);
                                        setCustomerSearch('');
                                    }}
                                    className={`mb-2 rounded-2xl overflow-hidden ${isDark ? 'active:bg-white/5' : 'active:bg-white'}`}
                                >
                                    <View className={`flex-row items-center py-4 px-4 ${isDark ? 'bg-white/5' : 'bg-white shadow-sm shadow-gray-200/20'}`}>
                                        <View className={`w-12 h-12 items-center justify-center mr-4 rounded-full ${isDark ? 'bg-zinc-800' : 'bg-indigo-50'}`}>
                                            <Typography weight="bold" color="primary" className="text-sm">
                                                {(item.fullName || 'U').charAt(0).toUpperCase()}
                                                {(item.fullName || '').split(' ')[1]?.charAt(0).toUpperCase() || ''}
                                            </Typography>
                                        </View>
                                        <View className="flex-1">
                                            <Typography variant="body" weight="bold" className="text-[16px]">{item.fullName}</Typography>
                                            <Typography variant="caption" color="gray" weight="medium" className="mt-0.5">{item.phoneNumber || 'No phone number'}</Typography>
                                        </View>
                                        {selectedCustomer?.id === item.id && (
                                            <TickCircle size={24} color={isDark ? "#0A84FF" : "#007AFF"} variant="Bold" />
                                        )}
                                    </View>
                                </Pressable>
                            )}
                            ListEmptyComponent={() => (
                                <View className="items-center py-10">
                                    <Typography color="gray" className="text-center mb-4">No clients found</Typography>
                                    <Button
                                        onPress={() => {
                                            setShowCustomerModal(false);
                                            router.push('/(tabs)/customers/new');
                                        }}
                                        className={`h-12 px-6 rounded-full ${isDark ? 'bg-white' : 'bg-black'}`}
                                        textClassName={isDark ? 'text-black' : 'text-white'}
                                    >
                                        Create New Client
                                    </Button>
                                </View>
                            )}
                        />
                    </Surface>
                </View>
            </Modal>

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
                    // Small delay to let state update before trying again
                    setTimeout(() => handleCreateOrder(), 100);
                }}
                resource="orders"
                currentCount={limitModalData.currentCount}
                limit={limitModalData.limit}
                isOffline={!isOnline}
            />
        </View>
    );
}
