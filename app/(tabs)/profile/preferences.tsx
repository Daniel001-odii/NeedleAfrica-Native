import React, { useState } from 'react';
import { View, ScrollView, Switch, TouchableOpacity, TextInput, Pressable, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Notification, Sms, DirectNotification, MagicStar, Timer1, Ruler, Coin1, Add, SearchNormal1, TickCircle, CloseCircle } from 'iconsax-react-native';
import * as Notifications from 'expo-notifications';
import { CURRENCIES, Currency } from '../../../constants/currencies';
import { Typography } from '../../../components/ui/Typography';
import { Surface } from '../../../components/ui/Surface';
import { IconButton } from '../../../components/ui/IconButton';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../contexts/AuthContext';
import axiosInstance from '../../../lib/axios';
import Toast from 'react-native-toast-message';

import { NotificationService } from '../../../services/NotificationService';

export default function Preferences() {
    const router = useRouter();
    const { user, updateProfile } = useAuth();
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
                currency
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

    return (
        <View className="flex-1 bg-white">
            <View className="px-6 py-4 flex-row items-center border-b border-gray-50">
                <IconButton
                    icon={<ArrowLeft size={20} color="black" />}
                    onPress={() => router.back()}
                    variant="ghost"
                    className="-ml-2"
                />
                <Typography variant="h3" weight="bold" className="ml-2">Preferences</Typography>
            </View>

            <ScrollView contentContainerClassName="p-6 pb-20" showsVerticalScrollIndicator={false}>

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
                                className={`px-6 py-3 rounded-full border ${reminderDay === day && !showCustomInput ? 'bg-dark border-dark' : 'bg-white border-gray-100'}`}
                            >
                                <Typography weight="bold" color={(reminderDay === day && !showCustomInput) ? 'white' : 'black'}>
                                    {day} Day{day !== '1' ? 's' : ''}
                                </Typography>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            onPress={() => setShowCustomInput(true)}
                            className={`px-6 py-3 rounded-full border flex-row items-center ${showCustomInput ? 'bg-dark border-dark' : 'bg-white border-gray-100'}`}
                        >
                            <Add size={16} color={showCustomInput ? 'white' : 'black'} className="mr-2" />
                            <Typography weight="bold" color={showCustomInput ? 'white' : 'black'}>Custom</Typography>
                        </TouchableOpacity>
                    </View>

                    {showCustomInput && (
                        <Surface variant="muted" rounded="2xl" className="mt-4 px-4 h-16 border border-gray-100 justify-center">
                            <TextInput
                                className="font-semibold text-dark flex-1"
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
                            <Surface variant="white" className="p-4 border border-gray-50 flex-row items-center" rounded="2xl">
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
                            </Surface>
                        </Pressable>
                    </View>

                    <View>
                        <Typography variant="body" weight="semibold" className="mb-4 ml-1">Currency</Typography>
                        <Pressable onPress={() => setIsCurrencyModalVisible(true)}>
                            <Surface variant="muted" rounded="2xl" className="flex-row items-center px-4 h-16 border border-gray-100">
                                <Coin1 size={20} color="#3b82f6" variant="Bulk" />
                                <Typography weight="bold" className="ml-3 flex-1">
                                    {selectedCurrency.name} ({selectedCurrency.symbol})
                                </Typography>
                                <ArrowLeft size={18} color="#9CA3AF" style={{ transform: [{ rotate: '180deg' }] }} />
                            </Surface>
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
                                <IconButton
                                    icon={<CloseCircle size={24} color="black" />}
                                    onPress={() => setIsCurrencyModalVisible(false)}
                                    variant="ghost"
                                />
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
                                            <View className="w-10 h-10 items-center justify-center bg-white rounded-xl mr-4 shadow-sm">
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

                <Button
                    onPress={handleSave}
                    isLoading={isSaving}
                    className="h-16 rounded-full bg-blue-600 border-0 shadow-lg"
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
    return (
        <Surface variant="white" className="p-4 mb-4 border border-gray-50" rounded="2xl">
            <View className="flex-row items-center">
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
        </Surface>
    );
}
