import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Briefcase, InfoCircle, Location, Add, Minus, ArrowDown2, TickCircle, CloseCircle, Shop } from 'iconsax-react-native';
import { Typography } from '../components/ui/Typography';
import { Surface } from '../components/ui/Surface';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import CountryPicker, { Country } from 'react-native-country-picker-modal';
import Toast from 'react-native-toast-message';
import { posthog } from '../posthogConfig';

const SOCIAL_OPTIONS = ['Twitter', 'Instagram', 'Facebook', 'LinkedIn', 'TikTok', 'Word of Mouth', 'Other'];
const EMPLOYEE_RANGES = ['1-5', '6-20', '21-50', '50+'];
const BUSINESS_TYPE_OPTIONS = [
    'Tailor',
    'Fashion Designer',
    'Seamstress',
    'Pattern Maker',
    'Alterations Specialist',
    'Bespoke / Made-to-Measure Brand',
    'Ready-to-Wear Brand',
    'Fashion Brand (Bespoke + Ready-to-Wear)',
    'Bridal Designer',
    'Uniform / Corporate Wear Maker',
    'Costume Designer',
    'Fashion House / Atelier / Studio',
    'Fashion Student',
    'Apprentice / Intern'
];

export default function Onboarding() {
    const router = useRouter();
    const { user, completeOnboarding, updateProfile } = useAuth();
    const { isDark } = useTheme();

    const [businessName, setBusinessName] = useState(user?.businessName || '');
    const [country, setCountry] = useState<Country | null>(null);
    const [noOfEmployees, setNoOfEmployees] = useState('1-5');
    const [businessType, setBusinessType] = useState('');
    const [showBusinessTypeModal, setShowBusinessTypeModal] = useState(false);
    const [joinedFrom, setJoinedFrom] = useState('');
    const [customSource, setCustomSource] = useState('');

    const [isLoading, setIsLoading] = useState(false);

    const handleGetStarted = async () => {
        if (!businessName?.trim()) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'Please enter your business name' });
            return;
        }
        if (!country) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'Please select your country' });
            return;
        }
        if (!businessType) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'Please tell us what best describes you' });
            return;
        }
        if (!joinedFrom) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'Please tell us how you heard about us' });
            return;
        }
        if (joinedFrom === 'Other' && !customSource.trim()) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'Please specify how you heard about us' });
            return;
        }

        setIsLoading(true);
        try {
            await updateProfile({
                businessName: businessName.trim(),
                country: country.name as string,
                noOfEmployees,
                businessType,
                joinedFrom: joinedFrom === 'Other' ? customSource.trim() : joinedFrom
            });
            posthog.capture('onboarding_completed', {
                businessName: businessName.trim(),
                country: country.name as string,
                noOfEmployees,
                businessType,
                joinedFrom: joinedFrom === 'Other' ? customSource.trim() : joinedFrom
            });
            await completeOnboarding();
            router.replace('/(tabs)');
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Could not save profile' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-white dark:bg-background-dark">
            <SafeAreaView className="flex-1">
                <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <View className="mb-10 mt-4">
                        <Typography variant="h1" weight="bold" className="mb-2">Almost there!</Typography>
                        <Typography color="gray" variant="subtitle">
                            Tell us a bit about your business to help us serve you better.
                        </Typography>
                    </View>

                    {/* Form Fields */}
                    <View className="mb-10">
                        {/* Business Name - Only show if not set or empty */}
                        <View className="mb-6">
                            <Typography variant="caption" weight="bold" color="gray" className="ml-1 mb-2 uppercase">Business Name</Typography>
                            <Surface variant="muted" rounded="2xl" className="px-4 h-16 justify-center">
                                <View className="flex-row items-center">
                                    {/* <Shop size={20} color="#6B7280" variant="Bulk" className="mr-3" /> */}
                                    <TextInput
                                        className="flex-1 h-full font-semibold text-dark dark:text-white"
                                        placeholder={`e.g. ${user?.username}'s Studio`}
                                        placeholderTextColor="#9CA3AF"
                                        value={businessName}
                                        onChangeText={setBusinessName}
                                    />
                                </View>
                            </Surface>
                        </View>
                        {/* Country */}
                        <View className="mb-6">
                            <Typography variant="caption" weight="bold" color="gray" className="ml-1 mb-2 uppercase">Country</Typography>
                            <Surface variant="muted" rounded="2xl" className="px-4 h-16 justify-center">
                                <View className="flex-row items-center">
                                    {/* <Location size={20} color="#6B7280" variant="Bulk" className="mr-3" /> */}
                                    <View className="flex-1">
                                        <CountryPicker
                                            withFilter
                                            withFlag
                                            withCountryNameButton
                                            withAlphaFilter
                                            withCallingCode={false}
                                            withEmoji
                                            onSelect={(c) => setCountry(c)}
                                            countryCode={country?.cca2 as any}
                                            theme={isDark ? { onBackgroundTextColor: '#ffffff', backgroundColor: '#1C1C1E', filterPlaceholderTextColor: '#9CA3AF' } : {}}
                                            containerButtonStyle={{ height: '100%', justifyContent: 'center' }}
                                        />
                                    </View>
                                </View>
                            </Surface>
                        </View>

                        {/* What best describes you */}
                        <View className="mb-6">
                            <Typography variant="caption" weight="bold" color="gray" className="ml-1 mb-2 uppercase">What best describes you?</Typography>
                            <TouchableOpacity
                                onPress={() => setShowBusinessTypeModal(true)}
                                activeOpacity={0.7}
                            >
                                <Surface variant="muted" rounded="2xl" className={`px-4 border ${isDark ? 'border-border-dark' : 'border-gray-100'} h-16 flex-row items-center justify-between`}>
                                    <Typography weight="semibold" className={businessType ? (isDark ? 'text-white' : 'text-dark') : 'text-gray-400'}>
                                        {businessType || 'Select specialization'}
                                    </Typography>
                                    <ArrowDown2 size={18} color="#6B7280" variant="Outline" />
                                </Surface>
                            </TouchableOpacity>
                        </View>

                        {/* Employees */}
                        <View className="mb-6">
                            <Typography variant="caption" weight="bold" color="gray" className="ml-1 mb-2 uppercase">Number of Employees</Typography>
                            <View className="flex-row flex-wrap mt-2">
                                {EMPLOYEE_RANGES.map((range) => (
                                    <TouchableOpacity
                                        key={range}
                                        onPress={() => setNoOfEmployees(range)}
                                        className={`px-5 py-3 rounded-full border mb-3 mr-2 ${noOfEmployees === range ? 'bg-blue-500 border-blue-500' : 'bg-transparent border-gray-300 dark:border-gray-700'}`}
                                    >
                                        <Typography weight="semibold" className={noOfEmployees === range ? 'text-white' : 'text-gray-600 dark:text-gray-300'}>
                                            {range}
                                        </Typography>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>



                        {/* Heard About Us */}
                        <View className="mb-6">
                            <Typography variant="caption" weight="bold" color="gray" className="ml-1 mb-2 uppercase">How did you hear about us?</Typography>
                            <View className="flex-row flex-wrap mt-2">
                                {SOCIAL_OPTIONS.map((option) => (
                                    <TouchableOpacity
                                        key={option}
                                        onPress={() => setJoinedFrom(option)}
                                        className={`px-4 py-2 rounded-full border mb-3 mr-2 ${joinedFrom === option ? 'bg-blue-500 border-blue-500' : 'bg-transparent border-gray-300 dark:border-gray-700'}`}
                                    >
                                        <Typography weight="semibold" className={joinedFrom === option ? 'text-white' : 'text-gray-600 dark:text-gray-300'}>
                                            {option}
                                        </Typography>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Custom Source Input */}
                        {joinedFrom === 'Other' && (
                            <View className="mb-6">
                                <Typography variant="caption" weight="bold" color="gray" className="ml-1 mb-2 uppercase">Please Specify</Typography>
                                <Surface variant="muted" rounded="2xl" className="flex-row items-center px-4 h-16">
                                    <InfoCircle size={20} color="#6B7280" variant="Bulk" className="mr-3" />
                                    <TextInput
                                        className="flex-1 h-full mt-1 font-semibold text-dark dark:text-white"
                                        placeholder="e.g. A friend"
                                        placeholderTextColor="#9CA3AF"
                                        value={customSource}
                                        onChangeText={setCustomSource}
                                    />
                                </Surface>
                            </View>
                        )}
                    </View>

                    {/* Main Action */}
                    <Button
                        // disabled={isLoading || !businessName?.trim() || !country || !noOfEmployees || !businessType || !joinedFrom}
                        onPress={handleGetStarted}
                        isLoading={isLoading}
                        className="h-16 rounded-full bg-blue-500 border-0 mt-auto shadow-none"
                        textClassName="text-white text-lg font-bold"
                    >
                        Complete Profile
                    </Button>
                </ScrollView>
            </SafeAreaView>

            {/* Business Type Selector Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showBusinessTypeModal}
                onRequestClose={() => setShowBusinessTypeModal(false)}
            >
                <Pressable
                    className="flex-1 bg-black/50 justify-end"
                    onPress={() => setShowBusinessTypeModal(false)}
                >
                    <Pressable className={`rounded-3xl max-h-[50%] m-2 mb-12 ${isDark ? 'bg-background-dark' : 'bg-white'}`}>
                        <View className={`px-6 py-4 flex-row justify-between items-center border-b ${isDark ? 'border-border-dark' : 'border-gray-100'}`}>
                            <Typography variant="h3" weight="bold">What describes you?</Typography>
                            <TouchableOpacity onPress={() => setShowBusinessTypeModal(false)}>
                                <CloseCircle size={28} color={isDark ? "#9CA3AF" : "#6B7280"} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
                            {BUSINESS_TYPE_OPTIONS.map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    onPress={() => {
                                        setBusinessType(option);
                                        setShowBusinessTypeModal(false);
                                    }}
                                    className={`flex-row items-center justify-between p-4 mb-2 rounded-2xl ${businessType === option ? 'bg-blue-50' : ''}`}
                                >
                                    <Typography
                                        variant="body"
                                        weight={businessType === option ? "bold" : "semibold"}
                                        className={businessType === option ? 'text-blue-600' : (isDark ? 'text-white' : 'text-dark')}
                                    >
                                        {option}
                                    </Typography>
                                    {businessType === option && (
                                        <TickCircle size={20} color="#2563EB" variant="Bold" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}
