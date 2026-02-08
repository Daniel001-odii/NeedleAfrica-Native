import React, { useState } from 'react';
import { View, TextInput, ScrollView, Platform, Pressable, KeyboardAvoidingView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Add, TickCircle, ArrowDown2 } from 'iconsax-react-native';
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

export default function NewOrder() {
    const router = useRouter();
    const { customers } = useCustomers();
    const { addOrder } = useOrders();
    const { canCreate, counts } = useResourceLimits();
    const { isFree } = useSubscription();
    const { isOnline } = useSync();
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

    const { customerId } = useLocalSearchParams<{ customerId: string }>();

    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showCustomerModal, setShowCustomerModal] = useState(true);
    const [customerSearch, setCustomerSearch] = useState('');

    const [dressType, setDressType] = useState('');
    const [notes, setNotes] = useState('');
    const [price, setPrice] = useState('');
    const [dueDate, setDueDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [fabricImage, setFabricImage] = useState<string | null>(null);
    const [styleImage, setStyleImage] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

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
        c.fullName.toLowerCase().includes(customerSearch.toLowerCase())
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
                amount: parseInt(price) || 0,
                status: 'PENDING',
                notes: notes,
                deliveryDate: dueDate,
                fabricImage: uploadedImages.fabricImage || undefined,
                styleImage: uploadedImages.styleImage || undefined,
            });

            Toast.show({ type: 'success', text1: 'Order created!' });
            router.back();
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

    const formatDate = (date: Date) => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <View className="px-6 py-4 flex-row items-center border-b border-gray-50">
                <IconButton
                    icon={<ArrowLeft size={20} color="black" />}
                    onPress={() => router.back()}
                    variant="ghost"
                    className="-ml-2"
                />
                <View className="flex-1 ml-2">
                    <Typography variant="body" color="gray" className="text-xs uppercase tracking-widest font-bold">New Order</Typography>
                    <TouchableOpacity onPress={() => setShowCustomerModal(true)} className="flex-row items-center">
                        <Typography variant="h3" weight="bold" className={!selectedCustomer ? "opacity-50" : ""}>
                            {selectedCustomer ? `For ${selectedCustomer.fullName}` : "Select Client"}
                        </Typography>
                        <ArrowDown2 size={16} color="black" className="ml-1" />
                    </TouchableOpacity>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView contentContainerClassName="p-6 pb-20" showsVerticalScrollIndicator={false}>

                    {/* Header Input */}
                    <View className="mb-6">
                        <Typography variant="h2" weight="bold" color="gray" className="mb-2 text-center opacity-40">Enter dress type</Typography>
                        <TextInput
                            className="text-center text-3xl font-bold text-dark"
                            placeholder="e.g. Kaftan"
                            placeholderTextColor="#E5E7EB"
                            value={dressType}
                            onChangeText={setDressType}
                        />
                    </View>

                    {/* Grid Layout */}
                    <View className="flex-row gap-4 mb-4">
                        <View className="flex-1 gap-4">
                            <Pressable onPress={() => setShowDatePicker(true)}>
                                <Surface variant="blue" className="p-4 h-32 justify-between bg-blue-500" rounded="3xl">
                                    <View className="flex-row justify-between items-start">
                                        <View className="w-8 h-8 bg-white/30 rounded-full items-center justify-center">
                                            <Calendar size={18} color="white" variant="Bold" />
                                        </View>
                                        <ArrowDown2 size={16} color="white" />
                                    </View>
                                    <View>
                                        <Typography variant="caption" color="white" className="opacity-80">Choose due date</Typography>
                                        <Typography variant="h3" weight="bold" color="white">{formatDate(dueDate)}</Typography>
                                    </View>
                                </Surface>
                            </Pressable>
                            {showDatePicker && (
                                <DateTimePicker
                                    testID="dateTimePicker"
                                    value={dueDate}
                                    mode="date"
                                    is24Hour={true}
                                    display="default"
                                    onChange={onDateChange}
                                />
                            )}

                            <Surface variant="muted" className="p-4 h-48" rounded="3xl">
                                <Typography variant="caption" weight="bold" color="gray" className="mb-2 uppercase">Notes...</Typography>
                                <TextInput
                                    className="flex-1 font-medium text-dark text-base leading-6"
                                    placeholder="Add specific details..."
                                    placeholderTextColor="#9CA3AF"
                                    multiline
                                    value={notes}
                                    onChangeText={setNotes}
                                    textAlignVertical="top"
                                />
                            </Surface>
                        </View>

                        <View className="flex-1 gap-4">
                            <Pressable onPress={() => pickImage('fabric')} className="flex-1">
                                <Surface variant="white" className="h-56 items-center justify-center border-2 border-dashed border-blue-200 overflow-hidden relative" rounded="3xl">
                                    {fabricImage ? (
                                        <Image source={{ uri: fabricImage }} className="w-full h-full" resizeMode="cover" />
                                    ) : (
                                        <>
                                            <View className="w-12 h-12 bg-blue-50 rounded-xl items-center justify-center mb-3">
                                                <Add size={24} color="#3B82F6" />
                                            </View>
                                            <Typography variant="caption" color="gray" weight="bold">Fabric image</Typography>
                                        </>
                                    )}
                                </Surface>
                            </Pressable>

                            <Surface variant="muted" className="p-4 h-24 justify-center" rounded="3xl">
                                <View className="flex-row items-center justify-center">
                                    <Typography variant="h3" color="gray" className="mr-1">$</Typography>
                                    <TextInput
                                        className="font-bold text-dark text-xl min-w-[60px] text-center"
                                        placeholder="Price"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="numeric"
                                        value={price}
                                        onChangeText={setPrice}
                                    />
                                </View>
                            </Surface>
                        </View>
                    </View>

                    <View className="flex-row gap-4 mb-8">
                        <Pressable className="flex-[3]" onPress={() => pickImage('style')}>
                            <Surface variant="white" className="h-20 flex-row items-center justify-center border-2 border-dashed border-blue-200 space-x-3 overflow-hidden" rounded="3xl">
                                {styleImage ? (
                                    <Image source={{ uri: styleImage }} className="w-full h-full absolute" resizeMode="cover" />
                                ) : (
                                    <>
                                        <Add size={20} color="#3B82F6" />
                                        <Typography variant="caption" color="gray" weight="bold">Styles image</Typography>
                                    </>
                                )}
                            </Surface>
                        </Pressable>
                    </View>

                    <Button
                        onPress={handleCreateOrder}
                        className="h-16 rounded-full bg-black border-0 shadow-xl shadow-brand-primary/30"
                        textClassName="text-white text-lg"
                        isLoading={isCreating}
                        disabled={isCreating}
                    >
                        {isCreating ? 'Creating...' : 'Create order'}
                    </Button>

                </ScrollView>
            </KeyboardAvoidingView>

            <Modal
                visible={showCustomerModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCustomerModal(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <Surface variant="white" className="h-[85%] rounded-t-[40px] p-6 pb-12" rounded="none">
                        <View className="flex-row items-center justify-between mb-6">
                            <Typography variant="h2" weight="bold">Select Client</Typography>
                            <IconButton
                                icon={<CloseCircleIcon size={24} color="black" />}
                                onPress={() => setShowCustomerModal(false)}
                                variant="ghost"
                            />
                        </View>

                        <Surface variant="muted" rounded="2xl" className="flex-row items-center px-4 h-14 mb-6 border border-gray-100">
                            <SearchNormal1 size={18} color="#6B7280" />
                            <TextInput
                                className="ml-3 flex-1 font-semibold text-dark"
                                placeholder="Search clients..."
                                placeholderTextColor="#9CA3AF"
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
                                    className="mb-3"
                                >
                                    <Surface
                                        variant={selectedCustomer?.id === item.id ? 'white' : 'muted'}
                                        className={`p-4 flex-row items-center border ${selectedCustomer?.id === item.id ? 'border-black' : 'border-transparent'}`}
                                        rounded="2xl"
                                    >
                                        <View className="w-12 h-12 items-center justify-center bg-white rounded-xl mr-4 shadow-sm">
                                            <User size={20} color="black" variant="Bulk" />
                                        </View>
                                        <View className="flex-1">
                                            <Typography weight="bold">{item.fullName}</Typography>
                                            <Typography variant="small" color="gray">{item.phoneNumber || 'No phone'}</Typography>
                                        </View>
                                        {selectedCustomer?.id === item.id && (
                                            <TickCircle size={24} color="black" variant="Bold" />
                                        )}
                                    </Surface>
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
                                        className="h-12 px-6 rounded-full bg-black"
                                        textClassName="text-white"
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
        </SafeAreaView>
    );
}
