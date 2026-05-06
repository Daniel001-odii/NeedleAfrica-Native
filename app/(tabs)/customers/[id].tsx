import React, { useState, useEffect } from 'react';
import { View, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { ArrowLeft, Call, Message, User, InfoCircle, Edit2, Trash, ShoppingCart, Box, ArrowRight2 } from 'iconsax-react-native';
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
import Toast from 'react-native-toast-message';
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
        <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-[#F2F2F7]'}`}>
            {/* Standard Refined Header */}
            <View className={`px-4 pt-2 pb-2 flex-row items-center justify-between ${isDark ? 'bg-zinc-950 border-b border-white/5' : 'bg-white border-b border-gray-50'}`}>
                <View className="flex-row items-center">
                    <IconButton
                        icon={<ArrowLeft size={22} color={isDark ? 'white' : 'black'} />}
                        onPress={() => isEditing ? setIsEditing(false) : router.back()}
                        variant="ghost"
                    />
                    <Typography variant="h3" weight="bold" className="ml-2">
                        {isEditing ? 'Edit Profile' : 'Customer'}
                    </Typography>
                </View>
                <TouchableOpacity onPress={() => isEditing ? handleUpdate() : setIsEditing(true)}>
                    <Typography color="primary" weight="bold">
                        {isEditing ? 'Done' : 'Edit'}
                    </Typography>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView contentContainerClassName="py-6" showsVerticalScrollIndicator={false}>
                    {!isEditing ? (
                        <>
                            {/* Profile Header Row */}
                            <View className="flex-row items-center mb-8 px-5 pt-4">
                                <View className={`w-24 h-24 items-center justify-center rounded-full mr-5 ${isDark ? 'bg-zinc-900 border border-white/5' : 'bg-white shadow-sm shadow-gray-200/50'}`}>
                                    <Typography weight="bold" color="primary" className="text-3xl">{initials}</Typography>
                                </View>
                                <View className="flex-1">
                                    <View>
                                        <Typography variant="h2" weight="bold" className="text-2xl">{customer.fullName}</Typography>
                                        <Typography color="gray" variant="body" className="capitalize mt-0.5 font-semibold opacity-70">{customer.gender || 'Client'}</Typography>
                                    </View>

                                    {/* Action Chips */}
                                    <View className="flex-row mt-5 gap-3">
                                        <TouchableOpacity
                                            onPress={() => customer?.phoneNumber && Linking.openURL(`tel:${customer.phoneNumber}`)}
                                            className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${isDark ? 'bg-[#007AFF]/20' : 'bg-[#007AFF]/10'}`}
                                        >
                                            <Call size={16} color={isDark ? "#0A84FF" : "#007AFF"} variant="Bold" />
                                            <Typography variant="small" weight="bold" className={`ml-2 ${isDark ? 'text-[#0A84FF]' : 'text-[#007AFF]'}`}>Call</Typography>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => customer?.phoneNumber && Linking.openURL(`sms:${customer.phoneNumber}`)}
                                            className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${isDark ? 'bg-[#34C759]/20' : 'bg-[#34C759]/10'}`}
                                        >
                                            <Message size={16} color={isDark ? "#30D158" : "#34C759"} variant="Bold" />
                                            <Typography variant="small" weight="bold" className={`ml-2 ${isDark ? 'text-[#30D158]' : 'text-[#34C759]'}`}>Text</Typography>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            {/* Stats Summary */}
                            <View className="px-4 mb-6">
                                <Surface variant="white" className={`flex-row py-4 ${isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm shadow-gray-200/50'}`} rounded="2xl">
                                    <View className={`flex-1 items-center ${isDark ? 'border-r border-white/5' : 'border-r border-gray-100'}`}>
                                        <Typography variant="h3" weight="bold">{measurements.length}</Typography>
                                        <Typography variant="caption" color="gray" weight="semibold" className="text-[10px] uppercase opacity-60">Measurements</Typography>
                                    </View>
                                    <View className="flex-1 items-center">
                                        <Typography variant="h3" weight="bold">{orders.length}</Typography>
                                        <Typography variant="caption" color="gray" weight="semibold" className="text-[10px] uppercase opacity-60">Orders</Typography>
                                    </View>
                                </Surface>
                            </View>

                            {/* Notes Section */}
                            <SectionLabel>About & Notes</SectionLabel>
                            <View className="px-4 mb-6">
                                <Surface variant="white" className={`p-4 ${isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm shadow-gray-200/50'}`} rounded="2xl">
                                    <Typography className={`${isDark ? 'text-zinc-400' : 'text-zinc-600'} leading-6 font-medium text-[14px]`}>
                                        {customer.notes || "No additional notes for this customer."}
                                    </Typography>
                                </Surface>
                            </View>

                            {/* Measurements Section */}
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
                                <Surface variant="white" rounded="2xl" className={`overflow-hidden ${isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm shadow-gray-200/50'}`}>
                                    {measurements.length === 0 ? (
                                        <View className="p-8 items-center"><Typography color="gray" variant="small">No measurements yet</Typography></View>
                                    ) : (
                                        measurements.map((m, idx) => (
                                            <Pressable
                                                key={m.id}
                                                onPress={() => router.push({ pathname: '/measurements/edit', params: { measurementId: m.id, customerId: id } })}
                                                className={`p-4 flex-row items-center justify-between ${idx !== measurements.length - 1 ? (isDark ? 'border-b border-white/5' : 'border-b border-gray-50') : ''}`}
                                            >
                                                <View>
                                                    <Typography weight="bold" className="text-[15px]">{m.title}</Typography>
                                                    <Typography variant="caption" color="gray" className="mt-0.5">{new Date(m.createdAt || 0).toLocaleDateString()}</Typography>
                                                </View>
                                                <ArrowRight2 size={18} color="#D1D1D6" />
                                            </Pressable>
                                        ))
                                    )}
                                </Surface>
                            </View>

                            {/* Recent Orders Section */}
                            <SectionLabel>Recent Orders</SectionLabel>
                            <View className="px-4 mb-6">
                                <Surface variant="white" rounded="2xl" className={`overflow-hidden ${isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm shadow-gray-200/50'}`}>
                                    {orders.length === 0 ? (
                                        <View className="p-8 items-center"><Typography color="gray" variant="small">No orders yet</Typography></View>
                                    ) : (
                                        orders.slice(0, 3).map((order, idx) => (
                                            <Pressable
                                                key={order.id}
                                                onPress={() => router.push({ pathname: '/(tabs)/orders/[id]', params: { id: order.id } })}
                                                className={`p-4 flex-row items-center justify-between ${idx !== orders.length - 1 ? (isDark ? 'border-b border-white/5' : 'border-b border-gray-50') : ''}`}
                                            >
                                                <View className="flex-row items-center">
                                                    <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${order.status === 'DELIVERED' ? (isDark ? 'bg-[#34C759]/10' : 'bg-[#34C759]/10') : (isDark ? 'bg-[#FF9500]/10' : 'bg-[#FF9500]/10')}`}>
                                                        <Box size={18} color={order.status === 'DELIVERED' ? (isDark ? '#30D158' : '#34C759') : (isDark ? '#FF9F0A' : '#FF9500')} variant="Bulk" />
                                                    </View>
                                                    <View>
                                                        <Typography weight="bold" className="text-[14px]">{order.styleName}</Typography>
                                                        <Typography variant="caption" color="gray" weight="semibold" className="uppercase text-[9px] mt-0.5 opacity-60">{order.status}</Typography>
                                                    </View>
                                                </View>
                                                <ArrowRight2 size={18} color="#D1D1D6" />
                                            </Pressable>
                                        ))
                                    )}
                                </Surface>
                            </View>

                            <View className="px-4 mt-4 mb-10">
                                <Button
                                    onPress={() => router.push({ pathname: '/(tabs)/orders/new', params: { customerId: customer?.id } })}
                                    className="h-16 bg-[#007AFF] rounded-[18px] border-none shadow-lg shadow-blue-500/30"
                                    textClassName="font-bold text-[17px]"
                                    style={{ borderWidth: 0 }}
                                >
                                    <ShoppingCart size={20} color="white" variant="Bold" />
                                    <Typography weight="bold" color="white" className="ml-2">Create New Order</Typography>
                                </Button>
                            </View>
                        </>
                    ) : (
                        <View className="px-4">
                            <SectionLabel>Profile Details</SectionLabel>
                            <Surface variant="white" rounded="2xl" className={`mb-6 overflow-hidden ${isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm shadow-gray-200/50'}`}>
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
                            <Surface variant="white" rounded="2xl" className={`p-4 mb-10 ${isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm shadow-gray-200/50'}`}>
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
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}