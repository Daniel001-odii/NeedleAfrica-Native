import React, { useState } from 'react';
import {
    View,
    TextInput,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, BookSquare, UserAdd, UserCirlceAdd } from 'iconsax-react-native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useCustomers } from '../../hooks/useCustomers';
import { IconButton } from '../../components/ui/IconButton';
import Toast from 'react-native-toast-message';
import PhoneInput from 'react-phone-number-input/react-native-input';
import { TypingText } from '../../components/ui/TypingText';
import * as Contacts from 'expo-contacts';

const PHONE_INPUT_STYLE = {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    textAlign: 'right' as const,
    width: '100%',
};

import { OnboardingIntroScreen } from '../../components/OnboardingIntroScreen';

export default function AddFirstCustomer() {
    const { state, updateState, nextStep, prevStep } = useOnboarding();
    const { addCustomer } = useCustomers();
    const router = useRouter();

    const [showIntro, setShowIntro] = useState(true);
    const [name, setName] = useState(state.customer?.name || '');
    const [phone, setPhone] = useState<string | undefined>(state.customer?.phone || undefined);
    const [gender, setGender] = useState(state.customer?.gender || '');
    const [isLoading, setIsLoading] = useState(false);

    const handleImportContact = async () => {
        try {
            if (Platform.OS === 'android') {
                const { status } = await Contacts.requestPermissionsAsync();
                if (status !== 'granted') {
                    Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'Please grant contacts permission.' });
                    return;
                }
            }

            const contact = await Contacts.presentContactPickerAsync();
            if (contact) {
                const fullName = contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(' ');

                let phoneNumber = '';
                if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
                    let rawPhone = contact.phoneNumbers[0].number || '';
                    rawPhone = rawPhone.replace(/[^\d+]/g, '');
                    if (rawPhone.startsWith('0')) {
                        phoneNumber = '+234' + rawPhone.substring(1);
                    } else if (rawPhone.length > 0 && !rawPhone.startsWith('+')) {
                        phoneNumber = '+' + rawPhone;
                    } else {
                        phoneNumber = rawPhone;
                    }
                }

                if (fullName) setName(fullName);
                if (phoneNumber) setPhone(phoneNumber);
            }
        } catch (error) {
            console.error('Error importing contact:', error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to import contact' });
        }
    };

    const isFormValid = name.trim() && gender;

    const handleSaveCustomer = async () => {
        if (!name.trim()) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'Please enter the customer\'s name' });
            return;
        }

        setIsLoading(true);
        try {
            const customer = await addCustomer({
                fullName: name.trim(),
                phoneNumber: phone?.trim() || '',
                gender: gender,
                notes: 'Created during onboarding'
            });

            if (customer) {
                updateState({
                    customer: { id: customer.id, name: name.trim(), phone: phone?.trim() || '', gender: gender },
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

    const handleSkip = () => {
        updateState({ step: 6 });
        router.push('/onboarding/completion');
    };

    if (showIntro) {
        return (
            <OnboardingIntroScreen
                title="Meet your clients."
                subtitle="Add your very first client to build a profile. Organize measurements, keep records, and manage relationships in one place."
                stepIndex={3}
                buttonText="Create Client Profile"
                onNext={() => setShowIntro(false)}
                onBack={prevStep}
                onSkip={handleSkip}
                illustrationType="customer"
            />
        );
    }

    return (
        <View className="flex-1 bg-white">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">

                {/* Header */}
                <View className="px-6 pt-4 bg-white flex-row justify-between items-center">
                    <IconButton
                        icon={<ArrowLeft size={24} color="#1F2937" />}
                        onPress={() => setShowIntro(true)}
                        variant="ghost"
                        className="-ml-4"
                    />
                    <TouchableOpacity onPress={handleSkip}>
                        <Typography color="primary" weight="bold" className="text-[16px]">Skip</Typography>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    contentContainerClassName="p-6 pb-20 bg-white"
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="mb-8 mt-2">
                        <TypingText variant="h1" weight="bold" className="mb-2 text-gray-900" text="Add First Client" speed={30} />
                        <Typography color="gray" variant="subtitle" className="leading-5">
                            Who are you dressing today? Don't worry, you can easily add more later.
                        </Typography>
                    </View>

                    {/* Group 1: Contact Information */}
                    <View className="mb-8">
                        <View className="flex-row justify-between items-center mb-2 px-4">
                            <Typography variant="caption" color="gray" weight="bold" className="uppercase tracking-wider text-[11px]">
                                Contact Details
                            </Typography>
                            <TouchableOpacity onPress={handleImportContact} className="bg-brand-primary/10 px-3 py-1.5 rounded-full flex-row items-center gap-1.5">
                                <UserAdd size={14} color="#FF5678" variant="Bulk" />
                                <Typography variant="caption" color="primary" weight="bold">
                                    Add contact
                                </Typography>
                            </TouchableOpacity>
                        </View>
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
                                        style={PHONE_INPUT_STYLE}
                                        placeholder="(+123) 456 7890"
                                        placeholderTextColor="#D1D5DB"
                                        value={phone}
                                        onChange={setPhone}
                                        defaultCountry="NG"
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
                                            ? 'bg-brand-primary border-brand-primary'
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
                        className={`h-14 rounded-full border-0 shadow-none ${!isFormValid ? 'bg-gray-200' : 'bg-brand-primary'}`}
                        textClassName={`text-lg font-bold ${!isFormValid ? 'text-gray-400' : 'text-white'}`}
                    >
                        Save Customer
                    </Button>

                </View>

            </KeyboardAvoidingView>
        </View>
    );
}