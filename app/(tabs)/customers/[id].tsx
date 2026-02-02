import React, { useState, useEffect } from 'react';
import { View, ScrollView, TextInput, Alert, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Call, Message, User, InfoCircle, Edit2, Trash, TickCircle, CloseCircle } from 'iconsax-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../../components/ui/Typography';
import { Surface } from '../../../components/ui/Surface';
import { IconButton } from '../../../components/ui/IconButton';
import { Button } from '../../../components/ui/Button';
import { useCustomers } from '../../../hooks/useCustomers';
import { useSync } from '../../../hooks/useSync';
import Toast from 'react-native-toast-message';

export default function CustomerDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { customers, updateCustomer, deleteCustomer } = useCustomers();
    const { sync: performSync } = useSync();

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
            <SafeAreaView className="flex-1 bg-white items-center justify-center" edges={['top']}>
                <Typography variant="body" color="gray">Customer not found</Typography>
                <Button onPress={() => router.back()} className="mt-4">Go Back</Button>
            </SafeAreaView>
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
        Alert.alert(
            'Delete Customer',
            'Are you sure you want to delete this customer? This will also remove all their measurements and orders.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
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
                }
            ]
        );
    };

    const initials = (fullName || '??')
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            {/* Header */}
            <View className="px-6 py-4 flex-row justify-between items-center border-b border-gray-50">
                <IconButton
                    icon={<ArrowLeft size={20} color="black" />}
                    onPress={() => isEditing ? setIsEditing(false) : router.back()}
                    variant="ghost"
                    className="-ml-2"
                />
                <Typography variant="h3" weight="bold">
                    {isEditing ? 'Edit Profile' : 'Customer Profile'}
                </Typography>
                <IconButton
                    icon={isEditing ? <CloseCircle size={20} color="#EF4444" /> : <Edit2 size={20} color="black" />}
                    onPress={() => setIsEditing(!isEditing)}
                    variant="ghost"
                    className="-mr-2"
                />
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
                            {/* View Mode: Profile Header Card */}
                            <Surface variant="lavender" className="p-8 items-center mb-8" rounded="3xl">
                                <Surface variant="white" className="w-24 h-24 items-center justify-center mb-4 shadow-sm" rounded="full">
                                    <Typography variant="h2" weight="bold" className="text-brand-primary">
                                        {initials}
                                    </Typography>
                                </Surface>
                                <Typography variant="h2" weight="bold" className="mb-1">{customer?.fullName}</Typography>
                                <Typography variant="body" color="gray" className="capitalize">{customer?.gender || 'Unknown gender'}</Typography>
                            </Surface>

                            {/* Quick Actions */}
                            <View className="flex-row gap-4 mb-8">
                                <Surface variant="muted" className="flex-1 p-4 items-center" rounded="2xl" hasBorder>
                                    <IconButton icon={<Call size={24} color="#6366f1" variant="Bulk" />} variant="white" className="mb-2" />
                                    <Typography variant="small" weight="bold">Call</Typography>
                                </Surface>
                                <Surface variant="muted" className="flex-1 p-4 items-center" rounded="2xl" hasBorder>
                                    <IconButton icon={<Message size={24} color="#6366f1" variant="Bulk" />} variant="white" className="mb-2" />
                                    <Typography variant="small" weight="bold">Message</Typography>
                                </Surface>
                                <Surface variant="muted" className="flex-1 p-4 items-center" rounded="2xl" hasBorder>
                                    <IconButton
                                        icon={<Trash size={24} color="#EF4444" variant="Bulk" />}
                                        variant="white"
                                        className="mb-2"
                                        onPress={handleDelete}
                                    />
                                    <Typography variant="small" weight="bold" className="text-red-500">Delete</Typography>
                                </Surface>
                            </View>

                            {/* Info Sections */}
                            <View className="gap-6">
                                <View>
                                    <Typography variant="caption" color="gray" weight="bold" className="mb-3 uppercase ml-1">Contact Details</Typography>
                                    <Surface variant="white" className="p-4 border border-gray-100" rounded="2xl">
                                        <View className="flex-row items-center mb-4">
                                            <Call size={20} color="#9CA3AF" variant="Linear" />
                                            <View className="ml-4">
                                                <Typography variant="caption" color="gray">Phone Number</Typography>
                                                <Typography variant="body" weight="bold">{customer?.phoneNumber || 'Not provided'}</Typography>
                                            </View>
                                        </View>
                                        <View className="flex-row items-center">
                                            <User size={20} color="#9CA3AF" variant="Linear" />
                                            <View className="ml-4">
                                                <Typography variant="caption" color="gray">Gender</Typography>
                                                <Typography variant="body" weight="bold" className="capitalize">{customer?.gender || 'Not specified'}</Typography>
                                            </View>
                                        </View>
                                    </Surface>
                                </View>

                                <View>
                                    <Typography variant="caption" color="gray" weight="bold" className="mb-3 uppercase ml-1">Measurements & Notes</Typography>
                                    <Surface variant="muted" className="p-5 border border-gray-50 min-h-[120px]" rounded="2xl">
                                        <View className="flex-row mb-3">
                                            <InfoCircle size={20} color="#9CA3AF" variant="Bulk" />
                                            <Typography variant="body" weight="medium" className="ml-2 text-gray-400">Notes Overview</Typography>
                                        </View>
                                        <Typography variant="body" className="leading-relaxed">
                                            {customer?.notes || "No measurements or specific style preferences recorded for this customer yet."}
                                        </Typography>
                                    </Surface>
                                </View>
                            </View>
                        </>
                    ) : (
                        <View className="gap-6">
                            {/* Edit Mode: Form Fields */}
                            <View>
                                <View className="flex-row items-center mb-2 ml-1">
                                    <User size={16} color="#6B7280" variant="Bulk" />
                                    <Typography variant="caption" color="gray" weight="medium" className="ml-2 uppercase">Full Name</Typography>
                                </View>
                                <Surface variant="muted" rounded="2xl" className="p-1 px-4 border border-gray-100">
                                    <TextInput
                                        className="h-14 font-semibold text-dark"
                                        placeholder="E.g. Jane Doe"
                                        value={fullName}
                                        onChangeText={setFullName}
                                    />
                                </Surface>
                            </View>

                            <View>
                                <View className="flex-row items-center mb-2 ml-1">
                                    <Call size={16} color="#6B7280" variant="Bulk" />
                                    <Typography variant="caption" color="gray" weight="medium" className="ml-2 uppercase">Phone Number</Typography>
                                </View>
                                <Surface variant="muted" rounded="2xl" className="p-1 px-4 border border-gray-100">
                                    <TextInput
                                        className="h-14 font-semibold text-dark"
                                        placeholder="E.g. 08012345678"
                                        value={phoneNumber}
                                        onChangeText={setPhoneNumber}
                                        keyboardType="phone-pad"
                                    />
                                </Surface>
                            </View>

                            <View>
                                <Typography variant="caption" color="gray" weight="medium" className="ml-1 mb-3 uppercase">Gender</Typography>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                    {['female', 'male', 'other'].map((g) => {
                                        const isActive = gender === g;
                                        return (
                                            <Pressable
                                                key={g}
                                                onPress={() => setGender(g)}
                                                className={`px-6 py-3 rounded-full mr-3 border ${isActive ? 'bg-dark border-dark' : 'bg-white border-gray-100'}`}
                                            >
                                                <Typography variant="small" weight={isActive ? 'bold' : 'medium'} color={isActive ? 'white' : 'gray'} className="capitalize">
                                                    {g}
                                                </Typography>
                                            </Pressable>
                                        );
                                    })}
                                </ScrollView>
                            </View>

                            <View>
                                <View className="flex-row items-center mb-2 ml-1">
                                    <InfoCircle size={16} color="#6B7280" variant="Bulk" />
                                    <Typography variant="caption" color="gray" weight="medium" className="ml-2 uppercase">Measurements & Notes</Typography>
                                </View>
                                <Surface variant="muted" rounded="2xl" className="p-4 border border-gray-100 min-h-[140px]">
                                    <TextInput
                                        className="font-medium text-dark flex-1"
                                        placeholder="Add notes..."
                                        value={notes}
                                        onChangeText={setNotes}
                                        multiline
                                        textAlignVertical="top"
                                    />
                                </Surface>
                            </View>

                            <Button
                                onPress={handleUpdate}
                                className="h-16 rounded-full bg-dark mt-4"
                                textClassName="text-white"
                            >
                                Save Changes
                            </Button>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
