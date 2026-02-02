import React, { useState } from 'react';
import { View, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useCustomers } from '../../../hooks/useCustomers';
import { ArrowLeft, User, Call, InfoCircle } from 'iconsax-react-native';
import { Typography } from '../../../components/ui/Typography';
import { Surface } from '../../../components/ui/Surface';
import { IconButton } from '../../../components/ui/IconButton';
import { Button } from '../../../components/ui/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { useSync } from '../../../hooks/useSync';

export default function NewCustomer() {
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [gender, setGender] = useState('female');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { addCustomer } = useCustomers();
    const { sync: performSync } = useSync();
    const router = useRouter();

    const handleSubmit = async () => {
        if (!fullName.trim()) {
            Alert.alert('Error', 'Full name is required');
            return;
        }

        try {
            // OPTIMISTIC UPDATE: Write to local DB and redirect immediately
            addCustomer({
                fullName,
                phoneNumber,
                gender,
                notes
            });

            // Trigger sync in background (fire and forget)
            performSync().catch(console.error);

            // Redirect immediately - don't wait for server!
            router.back();

            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Customer created locally'
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to save customer');
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            {/* Header */}
            <View className="px-6 py-4 flex-row items-center border-b border-gray-50">
                <IconButton
                    icon={<ArrowLeft size={20} color="black" />}
                    onPress={() => router.back()}
                    variant="ghost"
                    className="-ml-2"
                />
                <Typography variant="h3" weight="bold" className="ml-2">New Customer</Typography>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    contentContainerClassName="p-6 pb-20"
                    showsVerticalScrollIndicator={false}
                >
                    <Typography variant="body" weight="bold" className="mb-6">Customer Details</Typography>

                    {/* Name Input */}
                    <View className="mb-6">
                        <View className="flex-row items-center mb-2 ml-1">
                            <User size={16} color="#6B7280" variant="Bulk" />
                            <Typography variant="caption" color="gray" weight="medium" className="ml-2">FULL NAME *</Typography>
                        </View>
                        <Surface variant="muted" rounded="2xl" className="p-1 px-4 border border-gray-100">
                            <TextInput
                                className="h-14 font-semibold text-dark"
                                placeholder="E.g. Jane Doe"
                                placeholderTextColor="#9CA3AF"
                                value={fullName}
                                onChangeText={setFullName}
                            />
                        </Surface>
                    </View>

                    {/* Phone Input */}
                    <View className="mb-6">
                        <View className="flex-row items-center mb-2 ml-1">
                            <Call size={16} color="#6B7280" variant="Bulk" />
                            <Typography variant="caption" color="gray" weight="medium" className="ml-2">PHONE NUMBER</Typography>
                        </View>
                        <Surface variant="muted" rounded="2xl" className="p-1 px-4 border border-gray-100">
                            <TextInput
                                className="h-14 font-semibold text-dark"
                                placeholder="E.g. 08012345678"
                                placeholderTextColor="#9CA3AF"
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                keyboardType="phone-pad"
                            />
                        </Surface>
                    </View>

                    {/* Gender Selection */}
                    <View className="mb-8">
                        <Typography variant="caption" color="gray" weight="medium" className="ml-1 mb-3 uppercase">Gender</Typography>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            className="flex-row"
                            contentContainerClassName="pr-6"
                        >
                            {['female', 'male', 'other'].map((g) => {
                                const isActive = gender === g;
                                return (
                                    <Pressable
                                        key={g}
                                        onPress={() => setGender(g)}
                                        className={`flex-row items-center px-6 py-3 rounded-full mr-3 border ${isActive
                                            ? 'bg-dark border-dark'
                                            : 'bg-white border-gray-100'
                                            }`}
                                    >
                                        <Typography
                                            variant="small"
                                            weight={isActive ? 'bold' : 'medium'}
                                            color={isActive ? 'white' : 'gray'}
                                            className="capitalize"
                                        >
                                            {g}
                                        </Typography>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* Notes Input */}
                    <View className="mb-10">
                        <View className="flex-row items-center mb-2 ml-1">
                            <InfoCircle size={16} color="#6B7280" variant="Bulk" />
                            <Typography variant="caption" color="gray" weight="medium" className="ml-2">MEASUREMENTS & NOTES</Typography>
                        </View>
                        <Surface variant="muted" rounded="2xl" className="p-4 border border-gray-100 min-h-[140px]">
                            <TextInput
                                className="font-medium text-dark flex-1"
                                placeholder="Add measurements or style preferences..."
                                placeholderTextColor="#9CA3AF"
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                textAlignVertical="top"
                            />
                        </Surface>
                    </View>

                    {/* Footer Action */}
                    <Button
                        onPress={handleSubmit}
                        isLoading={isSubmitting}
                        className="h-16 rounded-full bg-dark border-0 shadow-lg"
                        textClassName="text-white text-lg"
                    >
                        Create Customer
                    </Button>
                </ScrollView>


            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
