import React, { useState } from 'react';
import { View, ScrollView, Switch, TouchableOpacity, TextInput, Pressable, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Notification, Sms, DirectNotification, MagicStar, Timer1, Ruler, Coin1, Add, SearchNormal1, TickCircle, CloseCircle, Moon, Sun, ArrowLeft2 } from 'iconsax-react-native';
import * as Notifications from 'expo-notifications';
import { CURRENCIES, Currency } from '../../../constants/currencies';
import { Typography } from '../../../components/ui/Typography';
import { Surface } from '../../../components/ui/Surface';
import { IconButton } from '../../../components/ui/IconButton';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import axiosInstance from '../../../lib/axios';
import Toast from 'react-native-toast-message';

import { NotificationService } from '../../../services/NotificationService';
import Svg, { Path } from 'react-native-svg';

export default function Preferences() {
    const router = useRouter();
    const { user, updateProfile } = useAuth();
    const { theme, setTheme, isDark } = useTheme();
    const [isSaving, setIsSaving] = useState(false);

    // Notification states
    const [smsAlerts, setSmsAlerts] = useState(user?.smsAlerts ?? true);
    const [emailNotifs, setEmailNotifs] = useState(user?.emailNotifications ?? true);
    const [marketingTips, setMarketingTips] = useState(user?.marketingTips ?? false);

    // Delivery Reminder states
    // Initialize with '1' if reminderDays is '0', null, or undefined to ensure a default is visible
    const initialReminderValue = (!user?.reminderDays || user.reminderDays === '0') ? '1' : user.reminderDays;

    const [reminderDay, setReminderDay] = useState(initialReminderValue); // '1', '2', '3', 'custom'
    const [customDays, setCustomDays] = useState(!['1', '2', '3'].includes(initialReminderValue) ? initialReminderValue : '');
    const [showCustomInput, setShowCustomInput] = useState(!['1', '2', '3'].includes(initialReminderValue));

    // Personal Setting states
    const [unit, setUnit] = useState<'cm' | 'inch'>(user?.measurementUnit || 'inch'); // 'cm' or 'inch'
    const [currency, setCurrency] = useState(user?.currency || 'NGN');
    const [isCurrencyModalVisible, setIsCurrencyModalVisible] = useState(false);
    const [currencySearchQuery, setCurrencySearchQuery] = useState('');

    const selectedCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateProfile({
                smsAlerts,
                emailNotifications: emailNotifs,
                marketingTips,
                reminderDays: showCustomInput ? customDays : reminderDay,
                measurementUnit: unit,
                currency,
                theme
            });
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Preferences updated successfully'
            });
            router.back();
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Update Failed',
                text2: error.message || 'Something went wrong'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const filteredCurrencies = CURRENCIES.filter(c =>
        c.name.toLowerCase().includes(currencySearchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(currencySearchQuery.toLowerCase())
    );

    const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
        setTheme(newTheme);
    };

    return (
        <View className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-background-default'}`}>
            <View className={`px-6 py-4 flex-row items-center border-b ${isDark ? 'border-border-dark' : 'border-gray-50'}`}>
                <IconButton
                    icon={<ArrowLeft size={20} color={isDark ? 'white' : 'black'} />}
                    onPress={() => router.back()}
                    variant="ghost"
                    className="-ml-2"
                />
                <Typography variant="h3" weight="bold" className="ml-2">Preferences</Typography>
            </View>

            <ScrollView
                contentContainerClassName="p-6 pb-20"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >

                {/* Section: Appearance */}
                <View className="mb-10">
                    <Typography variant="caption" color="gray" weight="bold" className="mb-6 uppercase tracking-widest ml-1">Appearance</Typography>

                    <View className="mb-4">
                        <Typography variant="body" weight="semibold" className="mb-4 ml-1">Theme</Typography>
                        <View className="flex-row gap-3">
                            {['light', 'dark', 'system'].map((themeOption) => {
                                const isSelected = theme === themeOption;
                                return (
                                    <TouchableOpacity
                                        key={themeOption}
                                        onPress={() => handleThemeChange(themeOption as 'light' | 'dark' | 'system')}
                                        activeOpacity={0.7}
                                        className="flex-1"
                                    >
                                        <Surface
                                            variant={isSelected ? 'white' : 'muted'}
                                            rounded="3xl"
                                            className={`items-center justify-center py-6 border-2 ${isSelected
                                                ? 'border-blue-500'
                                                : isDark ? 'border-transparent' : 'border-transparent'
                                                }`}
                                        >
                                            <View className={`w-12 h-12 rounded-2xl items-center justify-center mb-3 ${isSelected ? 'bg-blue-500' : isDark ? 'bg-dark-700' : 'bg-white'}`}>
                                                {themeOption === 'light' && <Sun size={24} color={isSelected ? 'white' : isDark ? '#9CA3AF' : '#4B5563'} variant={isSelected ? 'Bold' : 'Linear'} />}
                                                {themeOption === 'dark' && <Moon size={24} color={isSelected ? 'white' : isDark ? '#9CA3AF' : '#4B5563'} variant={isSelected ? 'Bold' : 'Linear'} />}
                                                {themeOption === 'system' && <MagicStar size={24} color={isSelected ? 'white' : isDark ? '#9CA3AF' : '#4B5563'} variant={isSelected ? 'Bold' : 'Linear'} />}
                                            </View>
                                            <Typography
                                                variant="small"
                                                weight={isSelected ? 'bold' : 'medium'}
                                                className={isSelected ? (isDark ? 'text-white' : 'text-blue-500') : 'text-gray-500'}
                                            >
                                                {themeOption === 'system' ? 'System' : themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                                            </Typography>

                                            {isSelected && (
                                                <View className="absolute top-2 right-2">
                                                    <TickCircle size={18} color={isDark ? '#FFFFFF' : '#3B82F6'} variant="Bold" />
                                                </View>
                                            )}
                                        </Surface>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </View>

                {/* Section: Notifications */}
                <View className="mb-10">
                    <Typography variant="caption" color="gray" weight="bold" className="mb-6 uppercase tracking-widest ml-1">Notifications</Typography>

                    <PreferenceToggle
                        icon={<Sms size={20} color="#3b82f6" variant="Bulk" />}
                        title="SMS Alerts"
                        subtitle="Receive order updates via text"
                        value={smsAlerts}
                        onValueChange={setSmsAlerts}
                    />

                    <PreferenceToggle
                        icon={<DirectNotification size={20} color="#3b82f6" variant="Bulk" />}
                        title="Email Notifications"
                        subtitle="Updates about your workshop activities"
                        value={emailNotifs}
                        onValueChange={setEmailNotifs}
                    />

                    <PreferenceToggle
                        icon={<MagicStar size={20} color="#3b82f6" variant="Bulk" />}
                        title="Marketing & Tips"
                        subtitle="Growth hacks and special offers"
                        value={marketingTips}
                        onValueChange={setMarketingTips}
                    />
                </View>

                {/* Section: Delivery Reminders */}
                <View className="mb-10">
                    <Typography variant="caption" color="gray" weight="bold" className="mb-6 uppercase tracking-widest ml-1">Delivery Reminders</Typography>

                    <Typography variant="body" weight="semibold" className="mb-4 ml-1">Remind me before delivery:</Typography>

                    <View className="flex-row flex-wrap gap-3">
                        {['1', '2', '3'].map((day) => (
                            <TouchableOpacity
                                key={day}
                                onPress={() => {
                                    setReminderDay(day);
                                    setShowCustomInput(false);
                                }}
                                className={`px-6 py-3 rounded-full border ${reminderDay === day && !showCustomInput
                                    ? 'bg-blue-500 border-blue-500'
                                    : isDark ? 'bg-dark-800 border-border-dark' : 'bg-white border-gray-100'
                                    }`}
                            >
                                <Typography weight="bold" color={(reminderDay === day && !showCustomInput) ? 'white' : (isDark ? 'gray' : 'black')}>
                                    {day} Day{day !== '1' ? 's' : ''}
                                </Typography>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            onPress={() => setShowCustomInput(true)}
                            className={`px-6 py-3 rounded-full border flex-row items-center ${showCustomInput
                                ? 'bg-blue-500 border-blue-500'
                                : isDark ? 'bg-dark-800 border-border-dark' : 'bg-white border-gray-100'
                                }`}
                        >
                            <Add size={16} color={showCustomInput ? 'white' : (isDark ? '#9CA3AF' : 'black')} className="mr-2" />
                            <Typography weight="bold" color={showCustomInput ? 'white' : (isDark ? 'gray' : 'black')}>Custom</Typography>
                        </TouchableOpacity>
                    </View>

                    {showCustomInput && (
                        <Surface variant="muted" rounded="2xl" className={`mt-4 px-4 h-16 border ${isDark ? 'border-border-dark' : 'border-gray-100'} justify-center`}>
                            <TextInput
                                className={`font-semibold flex-1 ${isDark ? 'text-white' : 'text-dark'}`}
                                placeholder="Enter custom days (e.g. 5)"
                                placeholderTextColor="#9CA3AF"
                                value={customDays}
                                onChangeText={setCustomDays}
                                keyboardType="number-pad"
                            />
                        </Surface>
                    )}
                </View>

                {/* Section: Personal Settings */}
                <View className="mb-12">
                    <Typography variant="caption" color="gray" weight="bold" className="mb-6 uppercase tracking-widest ml-1">Personal Settings</Typography>

                    <View className="mb-6">
                        <Typography variant="body" weight="semibold" className="mb-4 ml-1">Measurement Unit</Typography>
                        <Pressable
                            onPress={() => setUnit(unit === 'cm' ? 'inch' : 'cm')}
                            className="active:opacity-90"
                        >
                            <View className="flex-row items-center">
                                <View className="w-12 h-12 items-center justify-center bg-blue-50 rounded-xl mr-4">
                                    <Ruler size={20} color="#3b82f6" variant="Bulk" />
                                </View>
                                <View className="flex-1">
                                    <Typography variant="body" weight="bold">Unit System</Typography>
                                    <Typography variant="small" color="gray">Currently using {unit === 'cm' ? 'Centimeters' : 'Inches'}</Typography>
                                </View>
                                <View className="bg-muted w-24 h-10 rounded-full p-1 flex-row">
                                    <View className={`flex-1 items-center justify-center !rounded-full ${unit === 'cm' ? 'bg-dark' : ''}`}>
                                        <Typography variant="small" weight="bold" color={unit === 'cm' ? 'white' : 'gray'}>CM</Typography>
                                    </View>
                                    <View className={`flex-1 items-center justify-center !rounded-full ${unit === 'inch' ? 'bg-dark' : ''}`}>
                                        <Typography variant="small" weight="bold" color={unit === 'inch' ? 'white' : 'gray'}>IN</Typography>
                                    </View>
                                </View>
                            </View>
                        </Pressable>
                    </View>

                    <View className="mt-6">
                        <Typography variant="body" weight="semibold" className="mb-4 ml-1">Currency</Typography>
                        <Pressable onPress={() => setIsCurrencyModalVisible(true)}>
                            <View className="flex-row items-center h-16">
                                <Coin1 size={20} color="#3b82f6" variant="Bulk" />
                                <Typography weight="bold" className="ml-3 flex-1">
                                    {selectedCurrency.name} ({selectedCurrency.symbol})
                                </Typography>
                                <ArrowLeft2 size={18} color="#9CA3AF" style={{ transform: [{ rotate: '180deg' }] }} />
                            </View>
                        </Pressable>
                    </View>
                </View>

                {/* Currency Selection Modal */}
                <Modal
                    visible={isCurrencyModalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setIsCurrencyModalVisible(false)}
                >
                    <View className="flex-1 bg-black/50 justify-end">
                        <Surface variant="white" className="h-[80%] rounded-t-[40px] p-6 pb-12" rounded="none">
                            <View className="flex-row items-center justify-between mb-6">
                                <Typography variant="h2" weight="bold">Select Currency</Typography>
                                <TouchableOpacity onPress={() => setIsCurrencyModalVisible(false)} className="p-2">
                                    <Svg width="24" height="24" viewBox="0 0 24 24">
                                        <Path
                                            fill="none"
                                            stroke={isDark ? "white" : "black"}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="1.5"
                                            d="M18 6L6 18m12 0L6 6"
                                        />
                                    </Svg>
                                </TouchableOpacity>
                            </View>

                            <Surface variant="muted" rounded="2xl" className="flex-row items-center px-4 h-14 mb-6 border border-gray-100">
                                <SearchNormal1 size={18} color="#6B7280" />
                                <TextInput
                                    className="ml-3 flex-1 font-semibold text-dark"
                                    placeholder="Search currency..."
                                    placeholderTextColor="#9CA3AF"
                                    value={currencySearchQuery}
                                    onChangeText={setCurrencySearchQuery}
                                />
                            </Surface>

                            <FlatList
                                data={filteredCurrencies}
                                keyExtractor={(item) => item.code}
                                showsVerticalScrollIndicator={false}
                                renderItem={({ item }) => (
                                    <Pressable
                                        onPress={() => {
                                            setCurrency(item.code);
                                            setIsCurrencyModalVisible(false);
                                            setCurrencySearchQuery('');
                                        }}
                                        className="mb-3"
                                    >
                                        <Surface
                                            variant={currency === item.code ? 'white' : 'muted'}
                                            className={`p-4 flex-row items-center border ${currency === item.code ? 'border-dark' : 'border-transparent'}`}
                                            rounded="2xl"
                                        >
                                            <View className="w-10 h-10 items-center justify-center bg-white/50 rounded-xl mr-4 shadow-sm">
                                                <Typography weight="bold" variant="subtitle">{item.symbol}</Typography>
                                            </View>
                                            <View className="flex-1">
                                                <Typography weight="bold">{item.name}</Typography>
                                                <Typography variant="small" color="gray">{item.code}</Typography>
                                            </View>
                                            {currency === item.code && (
                                                <TickCircle size={20} color="#1C1C1E" variant="Bold" />
                                            )}
                                        </Surface>
                                    </Pressable>
                                )}
                                ListEmptyComponent={() => (
                                    <View className="items-center py-10">
                                        <Typography color="gray">No currencies found</Typography>
                                    </View>
                                )}
                            />
                        </Surface>
                    </View>
                </Modal>

                {/* Section: Test Notifications (Developer) */}
                {/* <View className="mb-10">
                    <Typography variant="caption" color="gray" weight="bold" className="mb-6 uppercase tracking-widest ml-1">Testing Notifications</Typography>
                    <View className="gap-3">
                        <Button 
                            variant="secondary"
                            className={`h-14 rounded-2xl border-0 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}
                            textClassName={isDark ? 'text-white' : 'text-dark'}
                            onPress={() => {
                                Toast.show({ type: 'info', text1: 'Morning Triggered', text2: 'Testing 8 AM logic' });
                                NotificationService.testSmartReminders(true);
                            }}
                        >
                            Test Morning Reminder (with pending)
                        </Button>
                        <Button 
                            variant="secondary"
                            className={`h-14 rounded-2xl border-0 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}
                            textClassName={isDark ? 'text-white' : 'text-dark'}
                            onPress={() => {
                                Toast.show({ type: 'info', text1: 'Evening Triggered', text2: 'Testing 8 PM logic' });
                                NotificationService.testSmartReminders(false);
                            }}
                        >
                            Test Evening/Empty Reminder
                        </Button>
                    </View>
                </View> */}

                <Button
                    onPress={handleSave}
                    isLoading={isSaving}
                    className="h-16 rounded-full bg-blue-600 border-0"
                    textClassName="text-white"
                >
                    Save Preferences
                </Button>
            </ScrollView>
        </View>
    );
}

interface PreferenceToggleProps {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
}

function PreferenceToggle({ icon, title, subtitle, value, onValueChange }: PreferenceToggleProps) {
    const { isDark } = useTheme();

    return (
        // <Surface variant="white" className={`p-4 mb-4 ${isDark ? 'border-border-dark' : 'border-gray-50'}`} rounded="2xl" hasBorder>
        <View className="flex-row items-center py-4">
            <View className="w-12 h-12 items-center justify-center bg-blue-50 rounded-xl mr-4">
                {icon}
            </View>
            <View className="flex-1">
                <Typography variant="body" weight="bold">{title}</Typography>
                <Typography variant="small" color="gray">{subtitle}</Typography>
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: '#F4F4F4', true: '#3b82f6' }}
                thumbColor="#FFFFFF"
            />
        </View>
        // </Surface>
    );
}
