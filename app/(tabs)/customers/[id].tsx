import React, { useState, useEffect } from 'react';
import { View, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { ArrowLeft, Call, Message, User, InfoCircle, Edit2, Trash, ShoppingCart, Box, ArrowRight2, Ruler, DocumentText } from 'iconsax-react-native';
import { Typography } from '../../../components/ui/Typography';
import { Surface } from '../../../components/ui/Surface';
import { IconButton } from '../../../components/ui/IconButton';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../contexts/AuthContext';
import { useConfirm } from '../../../contexts/ConfirmContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useCustomers } from '../../../hooks/useCustomers';
import { useSync } from '../../../hooks/useSync';
import { useCustomerMeasurements } from '../../../hooks/useMeasurement';
import { useOrders } from '../../../hooks/useOrders';
import { useInvoices } from '../../../hooks/useInvoices';
import { CURRENCIES } from '../../../constants/currencies';
import Toast from 'react-native-toast-message';
import PhoneInput from 'react-phone-number-input/react-native-input';
import WhatsAppIcon from '../../../assets/icons/WhatsAppIcon';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';

export default function CustomerDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const { confirm } = useConfirm();
    const { isDark } = useTheme();
    const { customers, updateCustomer, deleteCustomer } = useCustomers();
    const { sync: performSync } = useSync();
    const { measurements, loading: loadingMeasurements } = useCustomerMeasurements(id as string);
    const { orders, loading: loadingOrders } = useOrders(id as string);
    const { invoices, loading: loadingInvoices } = useInvoices(id as string);

    type TabType = 'measurements' | 'orders' | 'payments';
    const [activeTab, setActiveTab] = useState<TabType>('measurements');

    const currency = user?.currency || 'NGN';
    const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || '₦';

    const [isEditing, setIsEditing] = useState(false);
    const customer = customers.find(c => c.id === id);

    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [gender, setGender] = useState('');
    const [notes, setNotes] = useState('');

    const scrollY = useSharedValue(0);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    const defaultTitleStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollY.value,
            [35, 65],
            [1, 0],
            Extrapolation.CLAMP
        );
        const translateY = interpolate(
            scrollY.value,
            [35, 65],
            [0, -8],
            Extrapolation.CLAMP
        );
        return {
            opacity,
            transform: [{ translateY }],
        };
    });

    const customerNameTitleStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollY.value,
            [45, 75],
            [0, 1],
            Extrapolation.CLAMP
        );
        const translateY = interpolate(
            scrollY.value,
            [45, 75],
            [8, 0],
            Extrapolation.CLAMP
        );
        return {
            opacity,
            transform: [{ translateY }],
        };
    });

    const headerBorderStyle = useAnimatedStyle(() => {
        const borderOpacity = interpolate(
            scrollY.value,
            [15, 45],
            [0, 1],
            Extrapolation.CLAMP
        );
        return {
            borderBottomColor: isDark
                ? `rgba(255, 255, 255, ${borderOpacity * 0.08})`
                : `rgba(0, 0, 0, ${borderOpacity * 0.06})`,
        };
    });

    useEffect(() => {
        if (customer) {
            setFullName(customer.fullName || '');
            setPhoneNumber(customer.phoneNumber || '');
            setGender(customer.gender || '');
            setNotes(customer.notes || '');
        }
    }, [customer, isEditing]);

    if (!customer) return null;

    const handleUpdate = async () => {
        if (!fullName.trim()) {
            Toast.show({ type: 'error', text1: 'Name is required' });
            return;
        }
        updateCustomer(id as string, { fullName, phoneNumber, gender, notes });
        setIsEditing(false);
        performSync().catch(console.error);
    };

    const handleDelete = () => {
        confirm({
            title: 'Delete Customer',
            message: 'All measurements and orders for this customer will be permanently removed.',
            confirmText: 'Delete',
            type: 'danger',
            onConfirm: async () => {
                deleteCustomer(id as string);
                router.back();
                performSync().catch(console.error);
            }
        });
    };

    const handleWhatsApp = async () => {
        if (!customer?.phoneNumber) {
            Toast.show({ type: 'info', text1: 'No phone number available' });
            return;
        }
        const cleanPhone = customer.phoneNumber.replace(/\D/g, '');
        const url = `whatsapp://send?phone=${cleanPhone}`;
        const webUrl = `https://wa.me/${cleanPhone}`;
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                await Linking.openURL(webUrl);
            }
        } catch {
            Linking.openURL(webUrl);
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

    const initials = (fullName || '??').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'}`}>
            {/* Standard Refined Header */}
            <Animated.View
                style={headerBorderStyle}
                className={`px-4 pt-2 pb-2 flex-row items-center justify-between border-b ${isDark ? 'bg-black' : 'bg-white'}`}
            >
                <View className="flex-row items-center flex-1 mr-2">
                    <IconButton
                        icon={<ArrowLeft size={22} color={isDark ? 'white' : 'black'} />}
                        onPress={() => isEditing ? setIsEditing(false) : router.back()}
                        variant="ghost"
                    />
                    {isEditing ? (
                        <Typography variant="h3" weight="bold" className="ml-2">
                            Edit Profile
                        </Typography>
                    ) : (
                        <View className="ml-2 flex-1 justify-center h-8 overflow-hidden">
                            {/* Default "Customer" Title */}
                            <Animated.View
                                pointerEvents="none"
                                style={[{ position: 'absolute', left: 0, right: 0 }, defaultTitleStyle]}
                            >
                                <Typography variant="h3" weight="bold">
                                    Customer
                                </Typography>
                            </Animated.View>

                            {/* Customer Full Name Title (Slickly revealed when scrolled) */}
                            <Animated.View
                                pointerEvents="none"
                                style={[{ position: 'absolute', left: 0, right: 0 }, customerNameTitleStyle]}
                            >
                                <Typography
                                    variant="h3"
                                    weight="bold"
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                >
                                    {customer.fullName}
                                </Typography>
                            </Animated.View>
                        </View>
                    )}
                </View>
                <TouchableOpacity onPress={() => isEditing ? handleUpdate() : setIsEditing(true)}>
                    <Typography color="primary" weight="bold">
                        {isEditing ? 'Done' : 'Edit'}
                    </Typography>
                </TouchableOpacity>
            </Animated.View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <Animated.ScrollView
                    onScroll={scrollHandler}
                    scrollEventThrottle={16}
                    contentContainerClassName="py-6"
                    showsVerticalScrollIndicator={false}
                >
                    {!isEditing ? (
                        <>
                            {/* Profile Header Row */}
                            <View className="flex-row items-center mb-8 px-5 pt-4">
                                <View className={`w-24 h-24 items-center justify-center rounded-full mr-5 ${isDark ? 'bg-zinc-900 border border-white/5' : 'bg-gray-100 shadow-gray-200/50'}`}>
                                    <Typography weight="bold" color="primary" className="text-3xl">{initials}</Typography>
                                </View>
                                <View className="flex-1">
                                    <View>
                                        <Typography variant="h2" weight="bold" className="text-2xl">{customer.fullName}</Typography>
                                        <Typography color="gray" variant="body" className="capitalize mt-0.5 font-semibold opacity-70 text-sm">{customer.gender || 'Client'}  {customer.phoneNumber}</Typography>

                                    </View>

                                    {/* Action Chips */}
                                    <View className="flex-row mt-4 gap-2">
                                        <TouchableOpacity
                                            onPress={handleWhatsApp}
                                            // style={{
                                            //     backgroundColor: "#25D366"
                                            // }}
                                            className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${isDark ? 'bg-[#34C759]/20' : 'bg-[#34C759]/10'}`}
                                        >
                                            <WhatsAppIcon size={16} color={isDark ? "#30D158" : "#34C759"} />
                                            <Typography
                                                variant="small"
                                                weight="bold"
                                                numberOfLines={1}
                                                color="white"
                                                className="ml-1.5"
                                                style={{ color: isDark ? '#30D158' : '#34C759' }}
                                            >
                                                WhatsApp
                                            </Typography>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => customer?.phoneNumber ? Linking.openURL(`tel:${customer.phoneNumber}`) : Toast.show({ type: 'info', text1: 'No phone number available' })}
                                            className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${isDark ? 'bg-[#007AFF]/20' : 'bg-[#007AFF]/10'}`}
                                        >
                                            <Call size={15} color={isDark ? "#0A84FF" : "#007AFF"} variant="Bold" />
                                            <Typography
                                                variant="small"
                                                weight="bold"
                                                numberOfLines={1}
                                                className="ml-1.5"
                                                style={{ color: isDark ? '#0A84FF' : '#007AFF' }}
                                            >
                                                Call
                                            </Typography>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => customer?.phoneNumber ? Linking.openURL(`sms:${customer.phoneNumber}`) : Toast.show({ type: 'info', text1: 'No phone number available' })}
                                            className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${isDark ? 'bg-[#34C759]/20' : 'bg-[#34C759]/10'}`}
                                        >
                                            <Message size={15} color={isDark ? "#30D158" : "#34C759"} variant="Bold" />
                                            <Typography
                                                variant="small"
                                                weight="bold"
                                                numberOfLines={1}
                                                className="ml-1.5"
                                                style={{ color: isDark ? '#30D158' : '#34C759' }}
                                            >
                                                Text
                                            </Typography>
                                        </TouchableOpacity>


                                    </View>
                                </View>
                            </View>

                            {/* Stats Summary */}
                            <View className="px-4 mb-6">
                                {/* <Surface variant="white" className="flex-row py-4" rounded="2xl"> */}
                                <View className="flex-row py-4">
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={() => setActiveTab('measurements')}
                                        className={`flex-1 items-center ${isDark ? 'border-r border-white/5' : 'border-r border-gray-100'}`}
                                    >
                                        <Typography variant="h3" weight="bold" color={activeTab === 'measurements' ? 'primary' : undefined}>
                                            {measurements.length}
                                        </Typography>
                                        <Typography variant="caption" color="gray" weight="semibold" className="text-[10px] uppercase opacity-60">
                                            Measurements
                                        </Typography>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={() => setActiveTab('orders')}
                                        className={`flex-1 items-center ${isDark ? 'border-r border-white/5' : 'border-r border-gray-100'}`}
                                    >
                                        <Typography variant="h3" weight="bold" color={activeTab === 'orders' ? 'primary' : undefined}>
                                            {orders.length}
                                        </Typography>
                                        <Typography variant="caption" color="gray" weight="semibold" className="text-[10px] uppercase opacity-60">
                                            Orders
                                        </Typography>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={() => setActiveTab('payments')}
                                        className="flex-1 items-center"
                                    >
                                        <Typography variant="h3" weight="bold" color={activeTab === 'payments' ? 'primary' : undefined}>
                                            {invoices.length}
                                        </Typography>
                                        <Typography variant="caption" color="gray" weight="semibold" className="text-[10px] uppercase opacity-60">
                                            Payments
                                        </Typography>
                                    </TouchableOpacity>
                                </View>
                                {/* </Surface> */}
                            </View>

                            {/* Notes Section */}
                            <SectionLabel>About & Notes</SectionLabel>
                            <View className="px-5 mb-12">
                                {/* <Surface variant="white" className="p-4" rounded="2xl"> */}
                                <Typography className={`${isDark ? 'text-zinc-400' : 'text-zinc-600'} leading-6 font-medium text-[14px]`}>
                                    {customer.notes || "No additional notes for this customer."}
                                </Typography>
                                {/* </Surface> */}
                            </View>

                            {/* Tabs Controller */}
                            <View className="px-4 mb-4">
                                <View className={`flex-row p-1 rounded-full ${isDark ? 'bg-zinc-900 border border-white/5' : 'bg-gray-100'}`}>
                                    {(
                                        [
                                            { id: 'measurements', label: 'Measurements', count: measurements.length },
                                            { id: 'orders', label: 'Orders', count: orders.length },
                                            { id: 'payments', label: 'Payments', count: invoices.length },
                                        ] as const
                                    ).map((tab) => {
                                        const isActive = activeTab === tab.id;
                                        return (
                                            <TouchableOpacity
                                                key={tab.id}
                                                activeOpacity={0.7}
                                                onPress={() => setActiveTab(tab.id)}
                                                className={`flex-1 flex-row items-center justify-center py-2.5 rounded-full ${isActive
                                                    ? (isDark ? 'bg-zinc-700' : 'bg-black')
                                                    : 'bg-transparent'
                                                    }`}
                                            >
                                                <Typography
                                                    variant="small"
                                                    weight={isActive ? 'bold' : 'medium'}
                                                    className={isActive ? 'text-white' : (isDark ? 'text-zinc-400' : 'text-gray-500')}
                                                >
                                                    {tab.label}
                                                </Typography>
                                                {tab.count > 0 && (
                                                    <View
                                                        className={`ml-1.5 px-1.5 py-0.2 rounded-full ${isActive
                                                            ? (isDark ? 'bg-zinc-600' : 'bg-white/20')
                                                            : (isDark ? 'bg-zinc-800' : 'bg-gray-200')
                                                            }`}
                                                    >
                                                        <Typography
                                                            variant="caption"
                                                            weight="bold"
                                                            className={`text-[10px] ${isActive
                                                                ? 'text-white'
                                                                : (isDark ? 'text-zinc-300' : 'text-gray-600')
                                                                }`}
                                                        >
                                                            {tab.count}
                                                        </Typography>
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Active Tab Records */}
                            {activeTab === 'measurements' && (
                                <>
                                    <SectionLabel
                                        rightAction={
                                            <TouchableOpacity onPress={() => router.push({ pathname: '/measurements/create', params: { customerId: customer?.id } })}>
                                                <Typography variant="small" weight="bold" color="primary">Add New</Typography>
                                            </TouchableOpacity>
                                        }
                                    >
                                        Measurements
                                    </SectionLabel>
                                    <View className="px-4 mb-6">
                                        <Surface variant="white" rounded="2xl" className="overflow-hidden">
                                            {measurements.length === 0 ? (
                                                <View className="p-8 items-center justify-center">
                                                    <View className={`w-12 h-12 rounded-full items-center justify-center mb-3 ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                                                        <Ruler size={22} color={isDark ? '#9CA3AF' : '#6B7280'} />
                                                    </View>
                                                    <Typography color="gray" variant="body" weight="medium" className="mb-3">No measurements yet</Typography>
                                                    <TouchableOpacity
                                                        onPress={() => router.push({ pathname: '/measurements/create', params: { customerId: customer?.id } })}
                                                        className="px-4 py-2 bg-[#007AFF]/10 rounded-full"
                                                    >
                                                        <Typography variant="small" weight="bold" className="text-[#007AFF]">Record Measurement</Typography>
                                                    </TouchableOpacity>
                                                </View>
                                            ) : (
                                                measurements.map((m, idx) => (
                                                    <Pressable
                                                        key={m.id}
                                                        onPress={() => router.push({ pathname: '/measurements/edit', params: { measurementId: m.id, customerId: id } })}
                                                        className={`p-4 flex-row items-center justify-between ${idx !== measurements.length - 1 ? (isDark ? 'border-b border-white/5' : 'border-b border-gray-50') : ''}`}
                                                    >
                                                        <View className="flex-row items-center flex-1 mr-2">
                                                            <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${isDark ? 'bg-indigo-900/20' : 'bg-indigo-50'}`}>
                                                                <Ruler size={18} color="#6366F1" />
                                                            </View>
                                                            <View className="flex-1">
                                                                <Typography weight="bold" className="text-[15px]">{m.title}</Typography>
                                                                <Typography variant="caption" color="gray" className="mt-0.5">{new Date(m.createdAt || 0).toLocaleDateString()}</Typography>
                                                            </View>
                                                        </View>
                                                        <ArrowRight2 size={18} color="#D1D1D6" />
                                                    </Pressable>
                                                ))
                                            )}
                                        </Surface>
                                    </View>
                                </>
                            )}

                            {activeTab === 'orders' && (
                                <>
                                    <SectionLabel
                                        rightAction={
                                            <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/orders/new', params: { customerId: customer?.id } })}>
                                                <Typography variant="small" weight="bold" color="primary">Add New</Typography>
                                            </TouchableOpacity>
                                        }
                                    >
                                        Orders
                                    </SectionLabel>
                                    <View className="px-4 mb-6">
                                        <Surface variant="white" rounded="2xl" className="overflow-hidden">
                                            {orders.length === 0 ? (
                                                <View className="p-8 items-center justify-center">
                                                    <View className={`w-12 h-12 rounded-full items-center justify-center mb-3 ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                                                        <Box size={22} color={isDark ? '#9CA3AF' : '#6B7280'} />
                                                    </View>
                                                    <Typography color="gray" variant="body" weight="medium" className="mb-3">No orders yet</Typography>
                                                    <TouchableOpacity
                                                        onPress={() => router.push({ pathname: '/(tabs)/orders/new', params: { customerId: customer?.id } })}
                                                        className="px-4 py-2 bg-[#007AFF]/10 rounded-full"
                                                    >
                                                        <Typography variant="small" weight="bold" className="text-[#007AFF]">Create Order</Typography>
                                                    </TouchableOpacity>
                                                </View>
                                            ) : (
                                                orders.map((order, idx) => {
                                                    const isDelivered = order.status === 'DELIVERED';
                                                    const statusBg = isDelivered ? (isDark ? 'bg-[#34C759]/20' : 'bg-[#34C759]/10') : (isDark ? 'bg-[#FF9500]/20' : 'bg-[#FF9500]/10');
                                                    const statusColor = isDelivered ? (isDark ? '#30D158' : '#34C759') : (isDark ? '#FF9F0A' : '#FF9500');

                                                    return (
                                                        <Pressable
                                                            key={order.id}
                                                            onPress={() => router.push({ pathname: '/(tabs)/orders/[id]', params: { id: order.id } })}
                                                            className={`p-4 flex-row items-center justify-between ${idx !== orders.length - 1 ? (isDark ? 'border-b border-white/5' : 'border-b border-gray-50') : ''}`}
                                                        >
                                                            <View className="flex-row items-center flex-1 mr-2">
                                                                <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${statusBg}`}>
                                                                    <Box size={18} color={statusColor} variant="Bulk" />
                                                                </View>
                                                                <View className="flex-1">
                                                                    <Typography weight="bold" className="text-[14px]">{order.styleName}</Typography>
                                                                    <View className="flex-row items-center mt-1 gap-2 flex-wrap">
                                                                        <View className={`px-2 py-0.5 rounded-full ${statusBg}`}>
                                                                            <Typography variant="caption" weight="bold" className="text-[9px] uppercase" style={{ color: statusColor }}>
                                                                                {order.status}
                                                                            </Typography>
                                                                        </View>
                                                                        {order.deliveryDate && (
                                                                            <Typography variant="caption" color="gray" className="text-[11px]">
                                                                                Due {new Date(order.deliveryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                            </Typography>
                                                                        )}
                                                                    </View>
                                                                </View>
                                                            </View>
                                                            <View className="items-end mr-2">
                                                                <Typography weight="bold" className="text-[13px]">
                                                                    {currencySymbol}{(order.amount || 0).toLocaleString()}
                                                                </Typography>
                                                                {order.amountPaid !== undefined && (
                                                                    <Typography variant="caption" color="gray" className="text-[10px]">
                                                                        Paid: {currencySymbol}{(order.amountPaid || 0).toLocaleString()}
                                                                    </Typography>
                                                                )}
                                                            </View>
                                                            <ArrowRight2 size={18} color="#D1D1D6" />
                                                        </Pressable>
                                                    );
                                                })
                                            )}
                                        </Surface>
                                    </View>
                                </>
                            )}

                            {activeTab === 'payments' && (
                                <>
                                    <SectionLabel
                                        rightAction={
                                            <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/orders/invoices/new', params: { customerId: customer?.id } })}>
                                                <Typography variant="small" weight="bold" color="primary">Add New</Typography>
                                            </TouchableOpacity>
                                        }
                                    >
                                        Invoices & Payments
                                    </SectionLabel>
                                    <View className="px-4 mb-6">
                                        <Surface variant="white" rounded="2xl" className="overflow-hidden">
                                            {invoices.length === 0 ? (
                                                <View className="p-8 items-center justify-center">
                                                    <View className={`w-12 h-12 rounded-full items-center justify-center mb-3 ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                                                        <DocumentText size={22} color={isDark ? '#9CA3AF' : '#6B7280'} />
                                                    </View>
                                                    <Typography color="gray" variant="body" weight="medium" className="mb-3">No payments or invoices yet</Typography>
                                                    <TouchableOpacity
                                                        onPress={() => router.push({ pathname: '/(tabs)/orders/invoices/new', params: { customerId: customer?.id } })}
                                                        className="px-4 py-2 bg-[#007AFF]/10 rounded-full"
                                                    >
                                                        <Typography variant="small" weight="bold" className="text-[#007AFF]">Create Invoice</Typography>
                                                    </TouchableOpacity>
                                                </View>
                                            ) : (
                                                invoices.map((inv, idx) => (
                                                    <Pressable
                                                        key={inv.id}
                                                        onPress={() => router.push(`/(tabs)/orders/invoices/${inv.id}`)}
                                                        className={`p-4 flex-row items-center justify-between ${idx !== invoices.length - 1 ? (isDark ? 'border-b border-white/5' : 'border-b border-gray-50') : ''}`}
                                                    >
                                                        <View className="flex-row items-center flex-1 mr-2">
                                                            <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${isDark ? 'bg-[#34C759]/20' : 'bg-[#34C759]/10'}`}>
                                                                <DocumentText size={18} color={isDark ? '#30D158' : '#34C759'} variant="Bulk" />
                                                            </View>
                                                            <View className="flex-1">
                                                                <Typography weight="bold" className="text-[14px]">{inv.invoiceNumber}</Typography>
                                                                <Typography variant="caption" color="gray" className="mt-0.5">
                                                                    {new Date(inv.createdAt || 0).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                                </Typography>
                                                            </View>
                                                        </View>
                                                        <View className="items-end mr-2">
                                                            <Typography weight="bold" className="text-[14px]">
                                                                {currencySymbol}{(inv.amount || 0).toLocaleString()}
                                                            </Typography>
                                                            <View className={`mt-0.5 px-2 py-0.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                                                                <Typography variant="caption" weight="bold" className="text-[9px] uppercase opacity-70">
                                                                    PAID
                                                                </Typography>
                                                            </View>
                                                        </View>
                                                        <ArrowRight2 size={18} color="#D1D1D6" />
                                                    </Pressable>
                                                ))
                                            )}
                                        </Surface>
                                    </View>
                                </>
                            )}

                            <View className="px-4 mt-2 mb-10">
                                <Button
                                    onPress={() => {
                                        if (activeTab === 'measurements') {
                                            router.push({ pathname: '/measurements/create', params: { customerId: customer?.id } });
                                        } else if (activeTab === 'payments') {
                                            router.push({ pathname: '/(tabs)/orders/invoices/new', params: { customerId: customer?.id } });
                                        } else {
                                            router.push({ pathname: '/(tabs)/orders/new', params: { customerId: customer?.id } });
                                        }
                                    }}
                                    className="h-16 bg-[#007AFF] rounded-full border-none shadow-none!"
                                    textClassName="font-bold text-[17px]"
                                    style={{ borderWidth: 0, boxShadow: 'none' }}
                                >
                                    <Typography weight="bold" color="white" className="ml-2">
                                        {activeTab === 'measurements' ? 'Add Measurement' : activeTab === 'payments' ? 'Create New Invoice' : 'Create New Order'}
                                    </Typography>
                                </Button>
                            </View>
                        </>
                    ) : (
                        <View className="px-4">
                            <SectionLabel>Profile Details</SectionLabel>
                            <Surface variant="white" rounded="2xl" className={`mb-6 overflow-hidden ${isDark ? 'bg-[#1C1C1E]' : 'bg-soft-pink'}`}>
                                <View className={`flex-row items-center px-4 border-b ${isDark ? 'border-white/5' : 'border-gray-50'}`}>
                                    <Typography weight="medium" color="gray" className="w-24 text-[14px]">Full Name</Typography>
                                    <TextInput value={fullName} onChangeText={setFullName} className={`flex-1 h-14 font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`} />
                                </View>
                                <View className="flex-row items-center px-4">
                                    <Typography weight="medium" color="gray" className="w-24 text-[14px]">Phone</Typography>
                                    <View className="flex-1 h-14 justify-center">
                                        <PhoneInput
                                            style={{ color: isDark ? 'white' : 'black', fontWeight: 'bold' }}
                                            defaultCountry="NG"
                                            value={phoneNumber}
                                            onChange={(val) => setPhoneNumber(val || '')}
                                        />
                                    </View>
                                </View>
                            </Surface>

                            <SectionLabel>Gender</SectionLabel>
                            <Surface variant="white" rounded="2xl" className={`p-1 mb-6 flex-row ${isDark ? 'bg-[#1C1C1E]' : 'bg-gray-200/50 shadow-sm'}`}>
                                {['female', 'male', 'other'].map((g) => {
                                    const isActive = gender === g;
                                    return (
                                        <TouchableOpacity
                                            key={g}
                                            onPress={() => setGender(g)}
                                            className={`flex-1 py-2.5 rounded-xl items-center ${isActive ? (isDark ? 'bg-zinc-700' : 'bg-white shadow-sm') : ''}`}
                                        >
                                            <Typography variant="small" weight={isActive ? "bold" : "medium"} className={`capitalize ${isActive ? (isDark ? 'text-white' : 'text-zinc-900') : 'text-zinc-400'}`}>
                                                {g}
                                            </Typography>
                                        </TouchableOpacity>
                                    );
                                })}
                            </Surface>

                            <SectionLabel>Notes</SectionLabel>
                            <Surface variant="white" rounded="2xl" className={`p-4 mb-10 ${isDark ? 'bg-[#1C1C1E]' : 'bg-soft-pink'}`}>
                                <TextInput
                                    value={notes}
                                    onChangeText={setNotes}
                                    multiline
                                    placeholder="Add measurements or preferences..."
                                    className={`min-h-[120px] font-medium text-[15px] ${isDark ? 'text-white' : 'text-zinc-800'}`}
                                    textAlignVertical="top"
                                />
                            </Surface>

                            <Button onPress={handleDelete} variant="ghost" className="h-14 mb-10 bg-red-500/10 rounded-2xl" textClassName="text-[#FF3B30] font-bold">
                                Delete Customer
                            </Button>
                        </View>
                    )}
                </Animated.ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}