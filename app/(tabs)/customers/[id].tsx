import { View, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { ArrowLeft, Call, Message, User, InfoCircle, Edit2, Trash, TickCircle, CloseCircle, ShoppingCart, Box } from 'iconsax-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { Add } from 'iconsax-react-native';
import Toast from 'react-native-toast-message';
import { useState, useEffect } from 'react';
import PhoneInput from 'react-phone-number-input/react-native-input';

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

    const [isEditing, setIsEditing] = useState(false);

    // Find customer from existing list
    const customer = customers.find(c => c.id === id);

    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [gender, setGender] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (customer) {
            setFullName(customer.fullName || '');
            setPhoneNumber(customer.phoneNumber || '');
            setGender(customer.gender || '');
            setNotes(customer.notes || '');
        }
    }, [customer, isEditing]);

    if (!customer) {
        return (
            <View className={`flex-1 items-center justify-center ${isDark ? 'bg-background-dark' : 'bg-white'}`}>
                <Typography variant="body" color="gray">Customer not found</Typography>
                <Button onPress={() => router.back()} className="mt-4">Go Back</Button>
            </View>
        );
    }

    const handleUpdate = async () => {
        if (!fullName.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Required',
                text2: 'Customer name is required'
            });
            return;
        }

        try {
            // OPTIMISTIC UPDATE: Write to local DB and close edit mode immediately
            updateCustomer(id as string, {
                fullName,
                phoneNumber,
                gender,
                notes
            });

            setIsEditing(false);

            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Saved to device'
            });

            // Trigger sync in background
            performSync().catch(console.error);
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Update Failed',
                text2: 'Could not update customer locally'
            });
        }
    };

    const handleDelete = () => {
        confirm({
            title: 'Delete Customer',
            message: 'Are you sure you want to delete this customer? This will also remove all their measurements and orders.',
            confirmText: 'Delete',
            type: 'danger',
            onConfirm: async () => {
                try {
                    // OPTIMISTIC DELETE: Remove locally and navigate back immediately
                    deleteCustomer(id as string);

                    router.back();

                    Toast.show({
                        type: 'success',
                        text1: 'Deleted',
                        text2: 'Removed from device'
                    });

                    // Trigger sync in background
                    performSync().catch(console.error);
                } catch (error) {
                    Toast.show({
                        type: 'error',
                        text1: 'Delete Failed',
                        text2: 'Could not remove customer'
                    });
                }
            }
        });
    };

    const initials = (fullName || '??')
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <View className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-white'}`}>
            {/* Header */}
            <View className={`px-6 py-4 flex-row justify-between items-center border-b ${isDark ? 'border-border-dark' : 'border-gray-50'}`}>
                <IconButton
                    icon={<ArrowLeft size={20} color={isDark ? "white" : "black"} />}
                    onPress={() => isEditing ? setIsEditing(false) : router.back()}
                    variant="ghost"
                    className="-ml-2"
                />
                <Typography variant="h3" weight="bold">
                    {isEditing ? 'Edit Profile' : 'Customer Profile'}
                </Typography>
                <View className="flex-row items-center gap-1">
                    {!isEditing ? (
                        <IconButton
                            icon={<Trash size={20} color="#EF4444" variant="Linear" />}
                            onPress={handleDelete}
                            variant="ghost"
                        />
                    ) : (
                        <IconButton
                            icon={<CloseCircle size={20} color="#EF4444" />}
                            onPress={() => setIsEditing(false)}
                            variant="ghost"
                            className="-mr-2"
                        />
                    )}
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    contentContainerClassName="p-6 pb-20"
                    showsVerticalScrollIndicator={false}
                >
                    {!isEditing ? (
                        <>
                            {/* View Mode: Compact Social Media Style Header */}
                            <View className="py-2 mb-4">
                                <View className="flex-row items-center mb-6">
                                    {/* Smaller Avatar */}
                                    <View className={`w-16 h-16 items-center justify-center rounded-full ${isDark ? 'bg-indigo-900/30' : 'bg-blue-50'}`}>
                                        <Typography variant="h2" weight="bold" className={isDark ? 'text-indigo-300' : 'text-blue-600'}>
                                            {initials}
                                        </Typography>
                                    </View>

                                    <View className="ml-4 flex-1">
                                        {/* Name and Pill-style gender */}
                                        <Typography variant="h2" weight="bold" className="text-xl mb-1.5">{customer?.fullName}</Typography>
                                        <View className={`px-3 py-0.5 self-start rounded-full ${isDark ? 'bg-indigo-400/10' : 'bg-blue-50'}`}>
                                            <Typography variant="caption" weight="bold" color="primary" className="capitalize">{customer?.gender || 'Customer'}</Typography>
                                        </View>
                                    </View>

                                    {/* Edit action remains in header for quick access */}
                                    <View className="flex-row gap-2">
                                        <TouchableOpacity
                                            onPress={() => setIsEditing(true)}
                                            className={`w-10 h-10 items-center justify-center rounded-xl ${isDark ? 'bg-dark-800' : 'bg-gray-100'}`}
                                        >
                                            <Edit2 size={18} color={isDark ? "white" : "black"} variant="Bold" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Conspicuous Call & Message row */}
                                <View className="flex-row gap-3 mb-6">
                                    <TouchableOpacity
                                        onPress={() => customer?.phoneNumber && Linking.openURL(`tel:${customer.phoneNumber}`)}
                                        className={`flex-1 flex-row h-12 items-center justify-center rounded-2xl bg-blue-500`}
                                    >
                                        <Call size={20} color="white" variant="Bold" />
                                        <Typography variant="body" weight="bold" color="white" className="ml-2">Call Client</Typography>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => customer?.phoneNumber && Linking.openURL(`sms:${customer.phoneNumber}`)}
                                        className={`flex-1 flex-row h-12 items-center justify-center rounded-2xl ${isDark ? 'bg-indigo-900/30' : 'bg-indigo-50'} border border-indigo-100 dark:border-indigo-800`}
                                    >
                                        <Message size={20} color={isDark ? "#818CF8" : "#4F46E5"} variant="Bold" />
                                        <Typography variant="body" weight="bold" color={isDark ? "white" : "primary"} className="ml-2">Message</Typography>
                                    </TouchableOpacity>
                                </View>

                                {/* Stats Row: Measurements, Orders - More Compact */}
                                <View className="flex-row items-center border-y border-gray-50 dark:border-border-dark py-4 w-full">
                                    <View className="flex-1 flex-row justify-center items-center border-r border-gray-50 dark:border-border-dark">
                                        <Typography variant="body" weight="bold">{measurements.length}</Typography>
                                        <Typography variant="caption" color="gray" weight="bold" className="uppercase tracking-widest text-[9px] ml-2">Measurements</Typography>
                                    </View>
                                    <View className="flex-1 flex-row justify-center items-center">
                                        <Typography variant="body" weight="bold">{orders.length}</Typography>
                                        <Typography variant="caption" color="gray" weight="bold" className="uppercase tracking-widest text-[9px] ml-2">Orders</Typography>
                                    </View>
                                </View>
                            </View>

                            {/* Info Sections */}
                            <View className="gap-4">
                                <View className="mb-8">
                                    <Typography variant="caption" color="gray" weight="bold" className="mb-2 uppercase ml-1 tracking-widest">About</Typography>
                                    <View className="px-1">
                                        <Typography variant="body" weight="medium" className="leading-relaxed">
                                            {customer?.notes || "No additional information recorded for this customer yet."}
                                        </Typography>
                                        <View className="flex-row items-center mt-6">
                                            <Call size={14} color="#9CA3AF" variant="Linear" />
                                            <Typography variant="small" color="gray" className="ml-2 font-bold">{customer?.phoneNumber || 'No phone number'}</Typography>
                                        </View>
                                    </View>
                                </View>

                                <View>
                                    <View className="flex-row justify-between items-center mb-4 mt-2 ml-1">
                                        <Typography variant="caption" color="gray" weight="bold" className="uppercase tracking-widest">Measurements</Typography>
                                        <TouchableOpacity
                                            onPress={() => router.push({ pathname: '/measurements/create', params: { customerId: customer?.id } })}
                                            className="px-4 py-1.5 rounded-full bg-blue-500"
                                        >
                                            <Typography variant="caption" weight="bold" color="white">Add New</Typography>
                                        </TouchableOpacity>
                                    </View>

                                    {loadingMeasurements ? (
                                        <Typography color="gray" className="text-center py-4">Loading measurements...</Typography>
                                    ) : measurements.length === 0 ? (
                                        <Surface variant="muted" className={`p-6 items-center justify-center border border-dashed ${isDark ? 'bg-surface-muted-dark border-gray-700' : 'border-gray-300'}`} rounded="2xl">
                                            <Typography color="gray" variant="small" className="text-center mb-2">No measurements added yet.</Typography>
                                            <Typography color="gray" variant="small" className="text-center">Use templates to quickly add measurements.</Typography>
                                        </Surface>
                                    ) : (
                                        <View className="gap-3">
                                            {measurements.map(m => (
                                                <Pressable key={m.id} onPress={() => router.push({ pathname: '/measurements/edit', params: { measurementId: m.id, customerId: customer?.id } })}>
                                                    <View className={`py-4 border-b ${isDark ? 'border-border-dark' : 'border-gray-50'}`}>
                                                        <View className="flex-row justify-between items-center mb-2">
                                                            <Typography variant="body" weight="bold">{m.title}</Typography>
                                                            <Typography variant="caption" color="gray">{new Date(m.createdAt || 0).toLocaleDateString()}</Typography>
                                                        </View>
                                                        <View className="flex-row flex-wrap gap-x-4 gap-y-1">
                                                            {Object.entries(m.values).map(([key, value]) => (
                                                                <Typography key={key} variant="caption" color="gray">
                                                                    <Typography weight="bold" className={isDark ? 'text-indigo-300' : 'text-blue-600'}>{key}: </Typography>
                                                                    <Typography weight="medium" className={isDark ? 'text-gray-300' : 'text-gray-700'}>{value as any}{user?.measurementUnit || 'in'}</Typography>
                                                                </Typography>
                                                            )).slice(0, 6)}
                                                            {Object.entries(m.values).length > 6 && (
                                                                <Typography variant="caption" color="gray">...</Typography>
                                                            )}
                                                        </View>
                                                    </View>
                                                </Pressable>
                                            ))}
                                        </View>
                                    )}
                                </View>

                                {/* Customer Orders Section */}
                                <View>
                                    <View className="flex-row justify-between items-center mb-2 ml-1">
                                        <Typography variant="caption" color="gray" weight="bold" className="uppercase tracking-widest">Recent Orders</Typography>
                                    </View>

                                    {loadingOrders ? (
                                        <Typography color="gray" className="text-center py-4">Loading orders...</Typography>
                                    ) : orders.length === 0 ? (
                                        <Surface variant="muted" className={`p-6 items-center justify-center border border-dashed ${isDark ? 'bg-surface-muted-dark border-gray-700' : 'border-gray-300'}`} rounded="2xl">
                                            <Typography color="gray" variant="small" className="text-center mb-2">No orders created yet.</Typography>
                                            <Typography color="gray" variant="small" className="text-center">Create an order to track their outfits.</Typography>
                                        </Surface>
                                    ) : (
                                        <View className="gap-3">
                                            {orders.map(order => (
                                                <Pressable key={order.id} onPress={() => router.push({ pathname: '/(tabs)/orders/[id]', params: { id: order.id } })}>
                                                    <View className={`py-4 border-b ${isDark ? 'border-border-dark' : 'border-gray-50'}`}>
                                                        <View className="flex-row justify-between items-center">
                                                            <View className="flex-row items-center flex-1">
                                                                <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${isDark ? 'bg-indigo-900/20' : 'bg-indigo-50'}`}>
                                                                    <Box size={20} color={isDark ? "#818CF8" : "#4F46E5"} variant="Bulk" />
                                                                </View>
                                                                <View>
                                                                    <Typography variant="body" weight="bold">{order.styleName}</Typography>
                                                                    <Typography variant="caption" color="gray">
                                                                        {order.deliveryDate ? `Due ${new Date(order.deliveryDate).toLocaleDateString()}` : 'No due date'}
                                                                    </Typography>
                                                                </View>
                                                            </View>
                                                            <View
                                                                className={`px-3 py-1 rounded-full ${order.status === 'DELIVERED'
                                                                    ? (isDark ? 'bg-green-900/20' : 'bg-soft-green')
                                                                    : (isDark ? 'bg-orange-900/20' : 'bg-soft-peach')}`}
                                                            >
                                                                <Typography variant="small" weight="bold" className={order.status === 'DELIVERED' ? 'text-green-600' : (isDark ? 'text-orange-400' : 'text-orange-700')}>
                                                                    {order.status}
                                                                </Typography>
                                                            </View>
                                                        </View>
                                                    </View>
                                                </Pressable>
                                            ))}
                                        </View>
                                    )}
                                </View>


                                {/* Create Order Button */}
                                <View className="mt-8 border-t border-gray-100 pt-8 dark:border-border-dark">
                                    <Button
                                        onPress={() => router.push({ pathname: '/(tabs)/orders/new', params: { customerId: customer?.id } })}
                                        className={`h-16 rounded-full bg-blue-600 shadow-none`}
                                        textClassName="text-white"
                                        style={{ borderWidth: 0 }}
                                    >
                                        <View className="flex-row items-center justify-center">
                                            <ShoppingCart size={22} color="white" variant="Bold" />
                                            <Typography variant="body" weight="bold" className="ml-3 text-white">Create New Order</Typography>
                                        </View>
                                    </Button>
                                </View>
                            </View>
                        </>
                    ) : (
                        <View className="gap-6">
                            {/* Edit Mode: Form Fields */}
                            <View>
                                <View className="flex-row items-center mb-2 ml-1">
                                    <User size={16} color={isDark ? "#9CA3AF" : "#6B7280"} variant="Bulk" />
                                    <Typography variant="caption" color="gray" weight="medium" className="ml-2 uppercase tracking-widest">Full Name</Typography>
                                </View>
                                <Surface variant="muted" rounded="2xl" className={`p-1 px-4 border ${isDark ? 'bg-surface-muted-dark border-border-dark' : 'border-gray-100'}`}>
                                    <TextInput
                                        className={`h-14 font-semibold ${isDark ? 'text-white' : 'text-dark'}`}
                                        placeholder="E.g. Jane Doe"
                                        placeholderTextColor="#9CA3AF"
                                        value={fullName}
                                        onChangeText={setFullName}
                                    />
                                </Surface>
                            </View>

                            <View>
                                <View className="flex-row items-center mb-2 ml-1">
                                    <Call size={16} color={isDark ? "#9CA3AF" : "#6B7280"} variant="Bulk" />
                                    <Typography variant="caption" color="gray" weight="medium" className="ml-2 uppercase tracking-widest">Phone Number</Typography>
                                </View>
                                <Surface variant="muted" rounded="2xl" className={`px-4 border ${isDark ? 'bg-surface-muted-dark border-border-dark' : 'border-gray-100'} h-16 justify-center`}>
                                    <PhoneInput
                                        style={{ flex: 1, color: isDark ? 'white' : 'black', fontWeight: 'bold' }}
                                        placeholder="+123 800 000 0000"
                                        placeholderTextColor="#9CA3AF"
                                        defaultCountry="NG"
                                        value={phoneNumber}
                                        onChange={(val) => setPhoneNumber(val || '')}
                                    />
                                </Surface>
                            </View>

                            <View>
                                <Typography variant="caption" color="gray" weight="medium" className="ml-1 mb-4 uppercase tracking-widest">Gender</Typography>
                                <View className="flex-row flex-wrap gap-3">
                                    {['female', 'male', 'other'].map((g) => {
                                        const isActive = gender === g;
                                        return (
                                            <TouchableOpacity
                                                key={g}
                                                onPress={() => setGender(g)}
                                                activeOpacity={0.7}
                                                className={`px-8 py-3 rounded-full border ${isActive
                                                    ? 'bg-brand-primary border-brand-primary'
                                                    : isDark ? 'bg-dark-800 border-border-dark' : 'bg-white border-gray-100'
                                                    }`}
                                            >
                                                <Typography variant="small" weight="bold" color={isActive ? 'white' : (isDark ? 'gray' : 'black')} className="capitalize">
                                                    {g}
                                                </Typography>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            <View>
                                <View className="flex-row items-center mb-2 ml-1">
                                    <InfoCircle size={16} color={isDark ? "#9CA3AF" : "#6B7280"} variant="Bulk" />
                                    <Typography variant="caption" color="gray" weight="medium" className="ml-2 uppercase tracking-widest">Measurements & Notes</Typography>
                                </View>
                                <Surface variant="muted" rounded="2xl" className={`p-4 border ${isDark ? 'bg-surface-muted-dark border-border-dark' : 'border-gray-100'} min-h-[140px]`}>
                                    <TextInput
                                        className={`font-medium flex-1 ${isDark ? 'text-white' : 'text-dark'}`}
                                        placeholder="Add notes..."
                                        placeholderTextColor="#9CA3AF"
                                        value={notes}
                                        onChangeText={setNotes}
                                        multiline
                                        textAlignVertical="top"
                                    />
                                </Surface>
                            </View>

                            <Button
                                onPress={handleUpdate}
                                className={`h-16 rounded-full mt-4 ${isDark ? 'bg-white' : 'bg-dark'}`}
                                textClassName={isDark ? 'text-dark' : 'text-white'}
                            >
                                Save Changes
                            </Button>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
