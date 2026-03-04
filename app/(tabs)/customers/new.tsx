import React, { useState } from 'react';
import { View, TextInput, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useCustomers } from '../../../hooks/useCustomers';
import { useResourceLimits } from '../../../hooks/useResourceLimits';
import { useSubscription } from '../../../hooks/useSubscription';
import { useSync } from '../../../hooks/useSync';
import { ArrowLeft, User, Call, InfoCircle } from 'iconsax-react-native';
import { Typography } from '../../../components/ui/Typography';
import { Surface } from '../../../components/ui/Surface';
import { IconButton } from '../../../components/ui/IconButton';
import { Button } from '../../../components/ui/Button';
import Toast from 'react-native-toast-message';
import { ResourceLimitModal } from '../../../components/ResourceLimitModal';
import { useConfirm } from '../../../contexts/ConfirmContext';
import { useTheme } from '../../../contexts/ThemeContext';

export default function NewCustomer() {
    const { isDark } = useTheme();
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [gender, setGender] = useState('female');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
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

    const { addCustomer } = useCustomers();
    const { sync: performSync, isOnline } = useSync();
    const { canCreate } = useResourceLimits();
    const { confirm } = useConfirm();
    const { isFree } = useSubscription();
    const router = useRouter();

    const handleSubmit = async () => {
        if (!fullName.trim()) {
            confirm({
                title: 'Error',
                message: 'Full name is required',
                confirmText: 'OK',
                onConfirm: () => { }
            });
            return;
        }

        // Check resource limits for free tier
        if (isFree) {
            const limitCheck = canCreate('customers');
            if (!limitCheck.allowed && !proceedAnyway) {
                setLimitModalData(limitCheck);
                setShowLimitModal(true);
                return;
            }
        }

        try {
            setIsSubmitting(true);
            // OPTIMISTIC UPDATE: Write to local DB and redirect immediately
            await addCustomer({
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
            confirm({
                title: 'Error',
                message: 'Failed to save customer',
                confirmText: 'OK',
                onConfirm: () => { }
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-white'}`}>
            {/* Header */}
            <View className={`px-6 py-4 flex-row items-center border-b ${isDark ? 'border-border-dark' : 'border-gray-50'}`}>
                <IconButton
                    icon={<ArrowLeft size={20} color={isDark ? "white" : "black"} />}
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
                    keyboardShouldPersistTaps="handled"
                >
                    <Typography variant="body" weight="bold" className="mb-6">Customer Details</Typography>

                    {/* Name Input */}
                    <View className="mb-6">
                        <View className="flex-row items-center mb-2 ml-1">
                            <User size={16} color={isDark ? "#9CA3AF" : "#6B7280"} variant="Bulk" />
                            <Typography variant="caption" color="gray" weight="medium" className="ml-2 uppercase">Full Name *</Typography>
                        </View>
                        <Surface variant="muted" rounded="2xl" className={`p-1 px-4 border ${isDark ? 'border-border-dark' : 'border-gray-100'}`}>
                            <TextInput
                                className={`h-14 font-semibold ${isDark ? 'text-white' : 'text-dark'}`}
                                placeholder="E.g. Jane Doe"
                                placeholderTextColor={isDark ? "#4B5563" : "#9CA3AF"}
                                value={fullName}
                                onChangeText={setFullName}
                            />
                        </Surface>
                    </View>

                    {/* Phone Input */}
                    <View className="mb-6">
                        <View className="flex-row items-center mb-2 ml-1">
                            <Call size={16} color={isDark ? "#9CA3AF" : "#6B7280"} variant="Bulk" />
                            <Typography variant="caption" color="gray" weight="medium" className="ml-2 uppercase">Phone Number</Typography>
                        </View>
                        <Surface variant="muted" rounded="2xl" className={`p-1 px-4 border ${isDark ? 'border-border-dark' : 'border-gray-100'}`}>
                            <TextInput
                                className={`h-14 font-semibold ${isDark ? 'text-white' : 'text-dark'}`}
                                placeholder="E.g. 08012345678"
                                placeholderTextColor={isDark ? "#4B5563" : "#9CA3AF"}
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
                                            ? (isDark ? 'bg-gray-100 border-white' : 'bg-dark border-dark')
                                            : (isDark ? 'bg-dark-800 border-border-dark' : 'bg-blue-100 border-blue-100')
                                            }`}
                                    >
                                        <Typography
                                            variant="small"
                                            weight={isActive ? 'bold' : 'medium'}
                                            color={isActive ? (isDark ? 'dark' : 'white') : 'gray'}
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
                            <InfoCircle size={16} color={isDark ? "#9CA3AF" : "#6B7280"} variant="Bulk" />
                            <Typography variant="caption" color="gray" weight="medium" className="ml-2 uppercase">Measurements & Notes</Typography>
                        </View>
                        <Surface variant="muted" rounded="2xl" className={`p-4 border ${isDark ? 'border-border-dark' : 'border-gray-100'} min-h-[140px]`}>
                            <TextInput
                                className={`font-medium flex-1 ${isDark ? 'text-white' : 'text-dark'}`}
                                placeholder="Add measurements or style preferences..."
                                placeholderTextColor={isDark ? "#4B5563" : "#9CA3AF"}
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
                        className={`h-16 rounded-full border-0 shadow-lg ${isDark ? 'bg-white shadow-white/10' : 'bg-dark shadow-dark/10'}`}
                        textClassName={isDark ? "text-black text-lg" : "text-white text-lg"}
                    >
                        Create Customer
                    </Button>
                </ScrollView>
            </KeyboardAvoidingView>

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
                    setTimeout(() => handleSubmit(), 100);
                }}
                resource="customers"
                currentCount={limitModalData.currentCount}
                limit={limitModalData.limit}
                isOffline={!isOnline}
            />
        </View>
    );
}
