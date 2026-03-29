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
        <View className="flex-row justify-between items-center ml-4 mb-2 mr-4">
            <Typography variant="caption" color="gray" weight="bold" className="uppercase tracking-widest opacity-60">
                {children}
            </Typography>
            {rightAction}
        </View>
    );

    const initials = (fullName || '??').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <View className={`flex-1 ${isDark ? 'bg-zinc-950' : 'bg-gray-50'}`}>
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
                            <View className="flex-row items-start mb-8 px-4">
                                <View className={`w-20 h-20 items-center justify-center rounded-full mr-5 ${isDark ? 'bg-zinc-800' : 'bg-white shadow-sm'}`}>
                                    <Typography weight="bold" color="primary" className="text-2xl">{initials}</Typography>
                                </View>
                                <View className="flex-1">
                                    <View>
                                        <Typography variant="h2" weight="bold">{customer.fullName}</Typography>
                                        <Typography color="gray" variant="body" className="capitalize -mt-1 font-medium">{customer.gender || 'Client'}</Typography>
                                    </View>

                                    {/* Action Chips */}
                                    <View className="flex-row mt-4 gap-3">
                                        <TouchableOpacity
                                            onPress={() => customer?.phoneNumber && Linking.openURL(`tel:${customer.phoneNumber}`)}
                                            className={`flex-row items-center px-4 py-2 rounded-full ${isDark ? 'bg-primary/20' : 'bg-primary/10'}`}
                                        >
                                            <Call size={16} color={isDark ? "white" : "#6366f1"} variant="Bold" />
                                            <Typography variant="small" weight="bold" color="primary" className="ml-2">Call</Typography>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => customer?.phoneNumber && Linking.openURL(`sms:${customer.phoneNumber}`)}
                                            className={`flex-row items-center px-4 py-2 rounded-full ${isDark ? 'bg-green-950/30' : 'bg-green-50'}`}
                                        >
                                            <Message size={16} color="#22c55e" variant="Bold" />
                                            <Typography variant="small" weight="bold" className="ml-2 text-green-600">Message</Typography>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            {/* Stats Summary */}
                            <View className="px-4 mb-8">
                                <Surface variant="white" className="flex-row py-4" rounded="2xl">
                                    <View className="flex-1 items-center border-r border-zinc-100">
                                        <Typography variant="h3" weight="bold">{measurements.length}</Typography>
                                        <Typography variant="caption" color="gray">Measurements</Typography>
                                    </View>
                                    <View className="flex-1 items-center">
                                        <Typography variant="h3" weight="bold">{orders.length}</Typography>
                                        <Typography variant="caption" color="gray">Orders</Typography>
                                    </View>
                                </Surface>
                            </View>

                            {/* Notes Section */}
                            <SectionLabel>About & Notes</SectionLabel>
                            <View className="px-4 mb-8">
                                <Surface variant="white" className="p-4" rounded="2xl">
                                    <Typography className="text-zinc-600 leading-6">
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
                            <View className="px-4 mb-8">
                                <Surface variant="white" rounded="2xl" className="overflow-hidden">
                                    {measurements.length === 0 ? (
                                        <View className="p-8 items-center"><Typography color="gray" variant="small">No measurements yet</Typography></View>
                                    ) : (
                                        measurements.map((m, idx) => (
                                            <Pressable
                                                key={m.id}
                                                onPress={() => router.push({ pathname: '/measurements/edit', params: { measurementId: m.id, customerId: id } })}
                                                className={`p-4 flex-row items-center justify-between ${idx !== measurements.length - 1 ? 'border-b border-zinc-50' : ''}`}
                                            >
                                                <View>
                                                    <Typography weight="bold">{m.title}</Typography>
                                                    <Typography variant="caption" color="gray">{new Date(m.createdAt || 0).toLocaleDateString()}</Typography>
                                                </View>
                                                <ArrowRight2 size={18} color="#D1D1D6" />
                                            </Pressable>
                                        ))
                                    )}
                                </Surface>
                            </View>

                            {/* Recent Orders Section */}
                            <SectionLabel>Recent Orders</SectionLabel>
                            <View className="px-4 mb-8">
                                <Surface variant="white" rounded="2xl" className="overflow-hidden">
                                    {orders.length === 0 ? (
                                        <View className="p-8 items-center"><Typography color="gray" variant="small">No orders yet</Typography></View>
                                    ) : (
                                        orders.slice(0, 3).map((order, idx) => (
                                            <Pressable
                                                key={order.id}
                                                onPress={() => router.push({ pathname: '/(tabs)/orders/[id]', params: { id: order.id } })}
                                                className={`p-4 flex-row items-center justify-between ${idx !== orders.length - 1 ? 'border-b border-zinc-50' : ''}`}
                                            >
                                                <View className="flex-row items-center">
                                                    <View className={`w-8 h-8 rounded-lg items-center justify-center mr-3 ${order.status === 'DELIVERED' ? 'bg-green-50' : 'bg-orange-50'}`}>
                                                        <Box size={16} color={order.status === 'DELIVERED' ? '#22c55e' : '#f97316'} variant="Bulk" />
                                                    </View>
                                                    <View>
                                                        <Typography weight="bold" variant="small">{order.styleName}</Typography>
                                                        <Typography variant="caption" color="gray">{order.status}</Typography>
                                                    </View>
                                                </View>
                                                <ArrowRight2 size={18} color="#D1D1D6" />
                                            </Pressable>
                                        ))
                                    )}
                                </Surface>
                            </View>

                            <View className="px-4 mb-10">
                                <Button
                                    onPress={() => router.push({ pathname: '/(tabs)/orders/new', params: { customerId: customer?.id } })}
                                    className="h-16 bg-blue-500 rounded-full border-none"
                                    textClassName="font-bold"
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
                            <Surface variant="white" rounded="2xl" className="mb-6 overflow-hidden">
                                <View className={`flex-row items-center px-4 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-50'}`}>
                                    <Typography weight="medium" className="w-24">Full Name</Typography>
                                    <TextInput value={fullName} onChangeText={setFullName} className={`flex-1 h-14 font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`} />
                                </View>
                                <View className="flex-row items-center px-4">
                                    <Typography weight="medium" className="w-24">Phone</Typography>
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
                            <Surface variant="white" rounded="2xl" className="p-1 mb-6 flex-row">
                                {['female', 'male', 'other'].map((g) => {
                                    const isActive = gender === g;
                                    return (
                                        <TouchableOpacity
                                            key={g}
                                            onPress={() => setGender(g)}
                                            className={`flex-1 py-2.5 rounded-xl items-center ${isActive ? (isDark ? 'bg-zinc-700' : 'bg-white shadow-sm border border-zinc-100') : ''}`}
                                        >
                                            <Typography variant="small" weight={isActive ? "bold" : "medium"} className={`capitalize ${isActive ? (isDark ? 'text-white' : 'text-primary') : 'text-zinc-400'}`}>
                                                {g}
                                            </Typography>
                                        </TouchableOpacity>
                                    );
                                })}
                            </Surface>

                            <SectionLabel>Notes</SectionLabel>
                            <Surface variant="white" rounded="2xl" className="p-4 mb-8">
                                <TextInput
                                    value={notes}
                                    onChangeText={setNotes}
                                    multiline
                                    placeholder="Add measurements or preferences..."
                                    className={`min-h-[120px] font-medium ${isDark ? 'text-white' : 'text-zinc-800'}`}
                                    textAlignVertical="top"
                                />
                            </Surface>

                            <Button onPress={handleDelete} variant="ghost" className="h-14 mb-10" textClassName="text-red-500 font-bold">
                                Delete Customer
                            </Button>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}