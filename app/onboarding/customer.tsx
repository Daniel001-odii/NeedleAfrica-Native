import React, { useState } from 'react';
import {
    View,
    TextInput,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { ArrowLeft } from 'iconsax-react-native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useCustomers } from '../../hooks/useCustomers';
import { IconButton } from '../../components/ui/IconButton';
import Toast from 'react-native-toast-message';
import PhoneInput from 'react-phone-number-input/react-native-input';

export default function AddFirstCustomer() {
    const { state, updateState, nextStep, prevStep } = useOnboarding();
    const { addCustomer } = useCustomers();

    const [name, setName] = useState(state.customer?.name || '');
    const [phone, setPhone] = useState(state.customer?.phone || '');
    const [gender, setGender] = useState(state.customer?.gender || '');
    const [isLoading, setIsLoading] = useState(false);

    const isFormValid = name.trim() && phone.trim() && gender;

    const handleSaveCustomer = async () => {
        if (!name.trim()) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'Please enter the customer\'s name' });
            return;
        }

        setIsLoading(true);
        try {
            const customer = await addCustomer({
                fullName: name.trim(),
                phoneNumber: phone.trim(),
                gender: gender,
                notes: 'Created during onboarding'
            });

            if (customer) {
                updateState({
                    customer: { id: customer.id, name: name.trim(), phone: phone.trim(), gender: gender },
                    step: 3
                });

                nextStep();
            }
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to save customer' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-white">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">

                {/* Header */}
                <View className="px-6 pt-4 bg-white">
                    <IconButton
                        icon={<ArrowLeft size={24} color="#1F2937" />}
                        onPress={prevStep}
                        variant="ghost"
                        className="-ml-4"
                    />
                </View>

                <ScrollView
                    contentContainerClassName="p-6 pb-20 bg-white"
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="mb-8 mt-2">
                        <Typography variant="h1" weight="bold" className="mb-2 text-gray-900">
                            Add First Customer
                        </Typography>
                        <Typography color="gray" variant="subtitle" className="leading-5">
                            Who are you dressing today? Don't worry, you can easily add more later.
                        </Typography>
                    </View>

                    {/* Group 1: Contact Information */}
                    <View className="mb-8">
                        <Typography variant="caption" color="gray" weight="bold" className="ml-4 mb-2 uppercase tracking-wider text-[11px]">
                            Contact Details
                        </Typography>
                        <View className="bg-white border border-gray-100 rounded-[24px] shadow-sm overflow-hidden">

                            {/* Full Name Inline */}
                            <View className="flex-row items-center px-4 py-4 border-b border-gray-50">
                                <Typography weight="semibold" className="text-gray-900 w-1/3 text-[15px]">
                                    Full Name
                                </Typography>
                                <TextInput
                                    className="flex-1 text-right font-semibold text-gray-900 text-[16px]"
                                    placeholder="e.g. John Doe"
                                    placeholderTextColor="#D1D5DB"
                                    value={name}
                                    onChangeText={setName}
                                    autoCapitalize="words"
                                />
                            </View>

                            {/* Phone Number Inline */}
                            <View className="flex-row items-center px-4 py-4">
                                <Typography weight="semibold" className="text-gray-900 w-1/3 text-[15px]">
                                    Phone Number
                                </Typography>
                                <View className="flex-1 items-end">
                                    <PhoneInput
                                        style={{
                                            fontSize: 16,
                                            fontWeight: '600',
                                            color: '#111827',
                                            textAlign: 'right',
                                            width: '100%'
                                        }}
                                        placeholder="(555) 000-0000"
                                        placeholderTextColor="#D1D5DB"
                                        value={phone}
                                        onChange={(v: any) => {
                                            if (v !== phone) setPhone(v || '');
                                        }}
                                        defaultCode="NG"
                                    />
                                </View>
                            </View>

                        </View>
                    </View>

                    {/* Group 2: Gender Selection */}
                    <View className="mb-6">
                        <Typography variant="caption" color="gray" weight="bold" className="ml-4 mb-2 uppercase tracking-wider text-[11px]">
                            Gender
                        </Typography>
                        <View className="flex-row gap-3">
                            {['male', 'female', 'other'].map((g) => {
                                const isSelected = gender === g;
                                return (
                                    <TouchableOpacity
                                        key={g}
                                        onPress={() => setGender(g)}
                                        className={`flex-1 h-12 rounded-[16px] items-center justify-center border ${isSelected
                                                ? 'bg-blue-600 border-blue-600'
                                                : 'bg-gray-50 border-gray-100'
                                            }`}
                                    >
                                        <Typography
                                            weight="bold"
                                            className={`capitalize text-[15px] ${isSelected ? 'text-white' : 'text-gray-600'
                                                }`}
                                        >
                                            {g}
                                        </Typography>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                </ScrollView>

                {/* Bottom Action Bar */}
                <View className="p-6 bg-white pt-2 border-t border-gray-50">
                    <Button
                        onPress={handleSaveCustomer}
                        isLoading={isLoading}
                        disabled={!isFormValid}
                        className={`h-14 rounded-full border-0 ${!isFormValid ? 'bg-gray-200' : 'bg-blue-600'}`}
                        textClassName={`text-lg font-bold ${!isFormValid ? 'text-gray-400' : 'text-white'}`}
                    >
                        Save Customer
                    </Button>

                    <View className="mt-5 items-center pb-2">
                        <Typography color="gray" variant="small" weight="medium">Step 3 of 5</Typography>
                    </View>
                </View>

            </KeyboardAvoidingView>
        </View>
    );
}