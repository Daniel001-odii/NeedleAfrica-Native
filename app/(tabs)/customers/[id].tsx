import React from 'react';
import { View, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Call, Message, User, InfoCircle, Edit2, Trash } from 'iconsax-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../../components/ui/Typography';
import { Surface } from '../../../components/ui/Surface';
import { IconButton } from '../../../components/ui/IconButton';
import { useCustomers } from '../../../hooks/useCustomers';

export default function CustomerDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { customers } = useCustomers();

    // Find customer from existing list (mocking detail fetch)
    const customer = customers.find(c => c.id === id) || {
        fullName: 'Loading...',
        phoneNumber: '',
        gender: '',
        notes: ''
    };

    const initials = customer.fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="px-6 py-4 flex-row justify-between items-center border-b border-gray-50">
                <IconButton
                    icon={<ArrowLeft size={20} color="black" />}
                    onPress={() => router.back()}
                    variant="ghost"
                    className="-ml-2"
                />
                <Typography variant="h3" weight="bold">Customer Profile</Typography>
                <IconButton
                    icon={<Edit2 size={20} color="black" />}
                    variant="ghost"
                    className="-mr-2"
                />
            </View>

            <ScrollView
                contentContainerClassName="p-6 pb-20"
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Header Card */}
                <Surface variant="lavender" className="p-8 items-center mb-8" rounded="3xl">
                    <Surface variant="white" className="w-24 h-24 items-center justify-center mb-4 shadow-sm" rounded="full">
                        <Typography variant="h2" weight="bold" className="text-brand-primary">
                            {initials}
                        </Typography>
                    </Surface>
                    <Typography variant="h2" weight="bold" className="mb-1">{customer.fullName}</Typography>
                    <Typography variant="body" color="gray" className="capitalize">{customer.gender || 'Unknown gender'}</Typography>
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
                        <IconButton icon={<Trash size={24} color="#EF4444" variant="Bulk" />} variant="white" className="mb-2" />
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
                                    <Typography variant="body" weight="bold">{customer.phoneNumber || 'Not provided'}</Typography>
                                </View>
                            </View>
                            <View className="flex-row items-center">
                                <User size={20} color="#9CA3AF" variant="Linear" />
                                <View className="ml-4">
                                    <Typography variant="caption" color="gray">Gender</Typography>
                                    <Typography variant="body" weight="bold" className="capitalize">{customer.gender || 'Not specified'}</Typography>
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
                                {customer.notes || "No measurements or specific style preferences recorded for this customer yet."}
                            </Typography>
                        </Surface>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}
