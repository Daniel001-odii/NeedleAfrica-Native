import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Briefcase, InfoCircle, Location, Add, Minus } from 'iconsax-react-native';
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

export default function Onboarding() {
    const router = useRouter();
    const { completeOnboarding, updateProfile } = useAuth();
    const { isDark } = useTheme();

    const [country, setCountry] = useState<Country | null>(null);
    const [noOfEmployees, setNoOfEmployees] = useState('1-5');
    const [joinedFrom, setJoinedFrom] = useState('');
    const [customSource, setCustomSource] = useState('');

    const [isLoading, setIsLoading] = useState(false);

    const handleGetStarted = async () => {
        if (!country) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'Please select your country' });
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
                country: country.name as string,
                noOfEmployees,
                joinedFrom: joinedFrom === 'Other' ? customSource.trim() : joinedFrom
            });
            posthog.capture('onboarding_completed', {
                country: country.name as string,
                noOfEmployees,
                joinedFrom: joinedFrom === 'Other' ? customSource.trim() : joinedFrom
            });
            completeOnboarding();
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
                        {/* Country */}
                        <View className="mb-6">
                            <Typography variant="caption" weight="bold" color="gray" className="ml-1 mb-2 uppercase">Country</Typography>
                            <Surface variant="muted" rounded="2xl" className="px-4 h-16 justify-center">
                                <View className="flex-row items-center">
                                    <Location size={20} color="#6B7280" variant="Bulk" className="mr-3" />
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

                        disabled={isLoading || !country || !noOfEmployees || !joinedFrom}
                        onPress={handleGetStarted}
                        isLoading={isLoading}
                        className="h-16 rounded-full bg-blue-500 border-0 mt-auto shadow-none"
                        textClassName="text-white text-lg font-bold"
                    >
                        Complete Profile
                    </Button>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
