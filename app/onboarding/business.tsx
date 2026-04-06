import React, { useState } from 'react';
import {
    View,
    ScrollView,
    TouchableOpacity,
    Modal,
    KeyboardAvoidingView,
    Platform,
    TextInput
} from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { ArrowLeft, ArrowRight2, CloseCircle, TickCircle } from 'iconsax-react-native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useAuth } from '../../contexts/AuthContext';
import CountryPicker from 'react-native-country-picker-modal';
import PhoneInput from 'react-phone-number-input/react-native-input';
import Toast from 'react-native-toast-message';
import { TypingText } from '../../components/ui/TypingText';

const PHONE_INPUT_STYLE = {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    textAlign: 'right' as const,
    width: '100%',
};

const BUSINESS_TYPE_OPTIONS = [
    'Tailor',
    'Fashion Designer',
    'Seamstress',
    'Bespoke Brand',
    'Ready-to-Wear Brand',
    'Fashion House / Studio',
    'Bespoke + Ready-to-Wear',
    'Bridal Designer',
    'Uniform / Corporate Maker',
    'Fashion Student / Intern'
];

const HEARD_ABOUT_US_OPTIONS = [
    'Twitter',
    'Instagram',
    'Facebook',
    'LinkedIn',
    'TikTok',
    'Word of Mouth',
    'Other'
];

export default function BusinessDetails() {
    const { updateProfile } = useAuth();
    const { state, updateState, nextStep, prevStep } = useOnboarding();

    const [businessType, setBusinessType] = useState(state.businessType || '');
    const [phone, setPhone] = useState<string | undefined>(state.phoneNumber || undefined);
    const [country, setCountry] = useState(state.country || 'Nigeria');
    const [countryCode, setCountryCode] = useState<any>(state.country === 'Nigeria' ? 'NG' : (state.country ? undefined : 'NG'));
    const [noOfEmployees, setNoOfEmployees] = useState(state.noOfEmployees || '1-5');
    const [joinedFrom, setJoinedFrom] = useState(state.joinedFrom || '');

    const [showTypeModal, setShowTypeModal] = useState(false);
    const [showHeardModal, setShowHeardModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const isFormValid = !!(businessType && phone && country && joinedFrom);

    const handleContinue = async () => {
        if (!isFormValid) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'Please fill in the essential fields' });
            return;
        }

        setIsLoading(true);
        try {
            await updateProfile({
                businessType,
                phoneNumber: phone || '',
                country,
                noOfEmployees,
                joinedFrom
            });

            updateState({
                businessType,
                phoneNumber: phone || '',
                country,
                noOfEmployees,
                joinedFrom,
                step: 2
            });

            nextStep();
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update profile' });
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
                        <TypingText variant="h1" weight="bold" className="mb-2 text-gray-900" text="Business Details" speed={30} />
                        <Typography color="gray" variant="subtitle" className="leading-5">
                            Help us tailor your experience to suit your craft.
                        </Typography>
                    </View>

                    {/* Group 1: Business Profile */}
                    <View className="mb-8">
                        <Typography variant="caption" color="gray" weight="bold" className="ml-4 mb-2 uppercase tracking-wider text-[11px]">
                            Studio Profile
                        </Typography>
                        <View className="bg-white border border-gray-100 rounded-[24px] shadow-sm overflow-hidden">

                            {/* Specialization */}
                            <TouchableOpacity
                                onPress={() => setShowTypeModal(true)}
                                className="flex-row items-center justify-between px-4 py-4 border-b border-gray-50 active:bg-gray-50"
                            >
                                <Typography weight="semibold" className="text-gray-900 text-[15px]">
                                    Specialization
                                </Typography>
                                <View className="flex-row items-center">
                                    <Typography weight="medium" className={`text-[15px] mr-2 ${businessType ? 'text-blue-600' : 'text-gray-400'}`}>
                                        {businessType || 'Select'}
                                    </Typography>
                                    <ArrowRight2 size={16} color="#9CA3AF" />
                                </View>
                            </TouchableOpacity>

                            {/* Team Size */}
                            <View className="px-4 py-4">
                                <Typography weight="semibold" className="text-gray-900 text-[15px] mb-3">
                                    Team Size
                                </Typography>
                                <View className="flex-row flex-wrap gap-2.5">
                                    {['1-5', '6-20', '21-50', '50+'].map((range) => {
                                        const isSelected = noOfEmployees === range;
                                        return (
                                            <TouchableOpacity
                                                key={range}
                                                onPress={() => setNoOfEmployees(range)}
                                                className={`px-4 py-2.5 rounded-[12px] border ${isSelected
                                                    ? 'bg-blue-600 border-blue-600'
                                                    : 'bg-gray-50 border-gray-100'
                                                    }`}
                                            >
                                                <Typography
                                                    weight="bold"
                                                    className={`text-[14px] ${isSelected ? 'text-white' : 'text-gray-600'}`}
                                                >
                                                    {range}
                                                </Typography>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Group 2: Contact & Location */}
                    <View className="mb-8">
                        <Typography variant="caption" color="gray" weight="bold" className="ml-4 mb-2 uppercase tracking-wider text-[11px]">
                            Contact Info
                        </Typography>
                        <View className="bg-white border border-gray-100 rounded-[24px] shadow-sm overflow-hidden">

                            {/* Phone Number */}
                            <View className="flex-row items-center px-4 py-4 border-b border-gray-50">
                                <Typography weight="semibold" className="text-gray-900 w-1/3 text-[15px]">
                                    WhatsApp
                                </Typography>
                                <View className="flex-1 items-end">
                                    <PhoneInput
                                        style={PHONE_INPUT_STYLE}
                                        placeholder="(+123) 456 7890"
                                        placeholderTextColor="#D1D5DB"
                                        defaultCountry="NG"
                                        value={phone}
                                        onChange={setPhone}
                                    />
                                </View>
                            </View>

                            {/* Country Picker */}
                            <View className="flex-row items-center px-4 py-4">
                                <Typography weight="semibold" className="text-gray-900 w-1/3 text-[15px]">
                                    Country
                                </Typography>
                                <View className="flex-1 items-end flex-row justify-end">
                                    <CountryPicker
                                        withFilter
                                        withFlag
                                        withCountryNameButton
                                        withAlphaFilter
                                        withEmoji
                                        countryCode={countryCode}
                                        onSelect={(c: any) => {
                                            setCountry(c.name);
                                            setCountryCode(c.cca2);
                                        }}
                                        theme={{
                                            fontFamily: 'Inter-Medium', // Or your default app font
                                            fontSize: 16,
                                            onBackgroundTextColor: '#111827'
                                        }}
                                        containerButtonStyle={{ padding: 0, margin: 0 }}
                                    />
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Group 3: Discovery */}
                    <View className="mb-6">
                        <Typography variant="caption" color="gray" weight="bold" className="ml-4 mb-2 uppercase tracking-wider text-[11px]">
                            Discovery
                        </Typography>
                        <View className="bg-white border border-gray-100 rounded-[24px] shadow-sm overflow-hidden">
                            <TouchableOpacity
                                onPress={() => setShowHeardModal(true)}
                                className="flex-row items-center justify-between px-4 py-4 active:bg-gray-50"
                            >
                                <Typography weight="semibold" className="text-gray-900 text-[15px]">
                                    How did you hear about us?
                                </Typography>
                                <View className="flex-row items-center">
                                    <Typography weight="medium" className={`text-[15px] mr-2 ${joinedFrom ? 'text-blue-600' : 'text-gray-400'}`}>
                                        {joinedFrom || 'Select'}
                                    </Typography>
                                    <ArrowRight2 size={16} color="#9CA3AF" />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                </ScrollView>

                {/* Bottom Action Bar */}
                <View className="p-6 bg-white pt-2 border-t border-gray-50">
                    <Button
                        onPress={handleContinue}
                        isLoading={isLoading}
                        disabled={!isFormValid}
                        className={`h-14 rounded-full border-0 ${!isFormValid ? 'bg-gray-200' : 'bg-blue-600'}`}
                        textClassName={`text-lg font-bold ${!isFormValid ? 'text-gray-400' : 'text-white'}`}
                    >
                        Continue
                    </Button>

                    <View className="mt-5 items-center pb-2">
                        <Typography color="gray" variant="small" weight="medium">Step 2 of 5</Typography>
                    </View>
                </View>

            </KeyboardAvoidingView>

            {/* Selection Modals */}
            <SelectionModal
                visible={showTypeModal}
                onClose={() => setShowTypeModal(false)}
                title="Select Specialization"
                options={BUSINESS_TYPE_OPTIONS}
                selected={businessType}
                onSelect={setBusinessType}
            />

            <SelectionModal
                visible={showHeardModal}
                onClose={() => setShowHeardModal(false)}
                title="Discovery Source"
                options={HEARD_ABOUT_US_OPTIONS}
                selected={joinedFrom}
                onSelect={setJoinedFrom}
            />
        </View>
    );
}

// ----------------------------------------------------------------------
// Reusable Native-Style Bottom Sheet Modal
// ----------------------------------------------------------------------

function SelectionModal({ visible, onClose, title, options, selected, onSelect }: any) {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableOpacity
                activeOpacity={1}
                onPress={onClose}
                className="flex-1 bg-black/40 justify-end"
            >
                <View className="bg-[#F2F2F7] rounded-t-[32px] max-h-[75%] pb-8">

                    <View className="flex-row justify-between items-center p-6 pb-4 border-b border-gray-200">
                        <View className="w-8" />
                        <Typography variant="h3" weight="bold" className="text-gray-900">{title}</Typography>
                        <TouchableOpacity onPress={onClose} className="bg-gray-200/80 p-1.5 rounded-full">
                            <CloseCircle size={22} color="#6B7280" variant="Bold" />
                        </TouchableOpacity>
                    </View>

                    {/* List */}
                    <ScrollView showsVerticalScrollIndicator={false} className="px-4 pt-4">
                        <View className="bg-white rounded-[24px] overflow-hidden mb-8">
                            {options.map((opt: string, index: number) => {
                                const isSelected = selected === opt;
                                const isLast = index === options.length - 1;

                                return (
                                    <TouchableOpacity
                                        key={opt}
                                        onPress={() => {
                                            onSelect(opt);
                                            onClose();
                                        }}
                                        className={`flex-row items-center justify-between px-5 py-4 bg-white active:bg-gray-50 ${!isLast ? 'border-b border-gray-100' : ''}`}
                                    >
                                        <Typography
                                            weight={isSelected ? "bold" : "semibold"}
                                            className={`text-[16px] ${isSelected ? "text-blue-600" : "text-gray-900"}`}
                                        >
                                            {opt}
                                        </Typography>
                                        {isSelected && <TickCircle size={22} color="#2563EB" variant="Bold" />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}