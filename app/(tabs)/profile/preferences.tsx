import React, { useState } from 'react';
import { View, ScrollView, Switch, TouchableOpacity, TextInput, Pressable, Modal, FlatList, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    ArrowLeft, Sms, DirectNotification, MagicStar, Ruler,
    Coin1, Add, SearchNormal1, TickCircle, Moon, Sun,
    ArrowRight2, Monitor, Notification, CalendarTick, CloseCircle
} from 'iconsax-react-native';
import { CURRENCIES } from '../../../constants/currencies';
import { Typography } from '../../../components/ui/Typography';
import { Surface } from '../../../components/ui/Surface';
import { IconButton } from '../../../components/ui/IconButton';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import Toast from 'react-native-toast-message';
import Svg, { Path } from 'react-native-svg';

export default function Preferences() {
    const router = useRouter();
    const { user, updateProfile } = useAuth();
    const { theme, setTheme, isDark } = useTheme();
    const [isSaving, setIsSaving] = useState(false);

    // States
    const [smsAlerts, setSmsAlerts] = useState(user?.smsAlerts ?? true);
    const [emailNotifs, setEmailNotifs] = useState(user?.emailNotifications ?? true);
    const [marketingTips, setMarketingTips] = useState(user?.marketingTips ?? false);

    const initialReminderValue = (!user?.reminderDays || user.reminderDays === '0') ? '1' : user.reminderDays;
    const [reminderDay, setReminderDay] = useState(initialReminderValue);
    const [customDays, setCustomDays] = useState(!['1', '2', '3'].includes(initialReminderValue) ? initialReminderValue : '');
    const [showCustomInput, setShowCustomInput] = useState(!['1', '2', '3'].includes(initialReminderValue));

    const [unit, setUnit] = useState<'cm' | 'inch'>(user?.measurementUnit || 'inch');
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
            Toast.show({ type: 'success', text1: 'Preferences saved' });
            router.back();
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const filteredCurrencies = CURRENCIES.filter(c =>
        c.name.toLowerCase().includes(currencySearchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(currencySearchQuery.toLowerCase())
    );

    return (
        <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-[#F2F2F7]'}`}>
            {/* Header */}
            <View className={`px-4 pt-2 pb-2 flex-row items-center justify-between ${isDark ? 'bg-zinc-950 border-b border-white/5' : 'bg-white border-b border-gray-50'}`}>
                <View className="flex-row items-center">
                    <IconButton
                        icon={<ArrowLeft size={22} color={isDark ? 'white' : 'black'} />}
                        onPress={() => router.back()}
                        variant="ghost"
                    />
                    <Typography variant="h3" weight="bold" className="ml-2">Preferences</Typography>
                </View>
                <TouchableOpacity onPress={handleSave} disabled={isSaving}>
                    <Typography color="primary" weight="bold" className={isSaving ? 'opacity-50' : ''}>
                        {isSaving ? 'Saving...' : 'Done'}
                    </Typography>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="p-5 pb-10" keyboardShouldPersistTaps="handled">

                {/* Appearance Section */}
                <SectionLabel label="Appearance" isFirst />
                <View className={`rounded-2xl overflow-hidden ${isDark ? 'bg-zinc-900' : 'bg-white shadow-sm'}`}>
                    <ThemeRow
                        current={theme}
                        onChange={(t) => setTheme(t)}
                        isDark={isDark}
                    />
                </View>

                {/* Notifications Section */}
                <SectionLabel label="Notifications" />
                <View className={`rounded-2xl overflow-hidden ${isDark ? 'bg-zinc-900' : 'bg-white shadow-sm'}`}>
                    <SettingRow
                        icon={<Sms size={20} color="#3b82f6" variant="Bulk" />}
                        title="SMS Alerts"
                        subtitle="Receive order updates via text"
                        last={false}
                    >
                        <Switch
                            value={smsAlerts}
                            onValueChange={setSmsAlerts}
                            trackColor={{ false: '#71717a', true: '#3b82f6' }}
                            thumbColor={Platform.OS === 'ios' ? undefined : '#fff'}
                        />
                    </SettingRow>
                    <SettingRow
                        icon={<DirectNotification size={20} color="#3b82f6" variant="Bulk" />}
                        title="Email Updates"
                        subtitle="Workshop activity and summaries"
                        last={false}
                    >
                        <Switch
                            value={emailNotifs}
                            onValueChange={setEmailNotifs}
                            trackColor={{ false: '#71717a', true: '#3b82f6' }}
                            thumbColor={Platform.OS === 'ios' ? undefined : '#fff'}
                        />
                    </SettingRow>
                    <SettingRow
                        icon={<MagicStar size={20} color="#3b82f6" variant="Bulk" />}
                        title="Marketing & Tips"
                        subtitle="Growth hacks and special offers"
                        last={true}
                    >
                        <Switch
                            value={marketingTips}
                            onValueChange={setMarketingTips}
                            trackColor={{ false: '#71717a', true: '#3b82f6' }}
                            thumbColor={Platform.OS === 'ios' ? undefined : '#fff'}
                        />
                    </SettingRow>
                </View>

                {/* Delivery & Personal Section */}
                <SectionLabel label="App Settings" />
                <View className={`rounded-2xl overflow-hidden ${isDark ? 'bg-zinc-900' : 'bg-white shadow-sm'}`}>
                    <Pressable onPress={() => setShowCustomInput(!showCustomInput)}>
                        <SettingRow
                            icon={<CalendarTick size={20} color="#3b82f6" variant="Bulk" />}
                            title="Delivery Reminder"
                            last={false}
                        >
                            <View className="flex-row items-center">
                                <Typography color="gray" className="mr-1">
                                    {showCustomInput ? `${customDays || 0} days` : `${reminderDay} days`}
                                </Typography>
                                <ArrowRight2 size={14} color="#9CA3AF" />
                            </View>
                        </SettingRow>
                    </Pressable>

                    {/* Compact Reminder Picker */}
                    <View className={`px-4 pb-4 flex-row justify-between bg-transparent`}>
                        {['1', '2', '3'].map((day) => (
                            <TouchableOpacity
                                key={day}
                                onPress={() => { setReminderDay(day); setShowCustomInput(false); }}
                                className={`flex-1 mx-1 py-2 rounded-lg items-center ${reminderDay === day && !showCustomInput ? 'bg-blue-500' : isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}
                            >
                                <Typography weight="bold" color={reminderDay === day && !showCustomInput ? 'white' : 'gray'}>{day}d</Typography>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            onPress={() => setShowCustomInput(true)}
                            className={`flex-1 mx-1 py-2 rounded-lg items-center ${showCustomInput ? 'bg-blue-500' : isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}
                        >
                            <Typography weight="bold" color={showCustomInput ? 'white' : 'gray'}>Edit</Typography>
                        </TouchableOpacity>
                    </View>

                    {showCustomInput && (
                        <View className="px-4 pb-4">
                            <TextInput
                                className={`p-3 rounded-xl ${isDark ? 'bg-zinc-800 text-white' : 'bg-gray-50 text-black'}`}
                                placeholder="Enter custom days..."
                                placeholderTextColor="#9CA3AF"
                                value={customDays}
                                onChangeText={setCustomDays}
                                keyboardType="number-pad"
                            />
                        </View>
                    )}

                    <View className={`h-[1px] mx-4 ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`} />

                    <Pressable onPress={() => setUnit(unit === 'cm' ? 'inch' : 'cm')}>
                        <SettingRow
                            icon={<Ruler size={20} color="#3b82f6" variant="Bulk" />}
                            title="Measurement Unit"
                            last={false}
                        >
                            <View className={`px-3 py-1 rounded-full ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                                <Typography variant="small" weight="bold">{unit.toUpperCase()}</Typography>
                            </View>
                        </SettingRow>
                    </Pressable>

                    <Pressable onPress={() => setIsCurrencyModalVisible(true)}>
                        <SettingRow
                            icon={<Coin1 size={20} color="#3b82f6" variant="Bulk" />}
                            title="Currency"
                            last={true}
                        >
                            <View className="flex-row items-center">
                                <Typography color="gray" className="mr-1">{selectedCurrency.code}</Typography>
                                <ArrowRight2 size={14} color="#9CA3AF" />
                            </View>
                        </SettingRow>
                    </Pressable>
                </View>

                {/* Main Save Button */}
                <Button
                    onPress={handleSave}
                    isLoading={isSaving}
                    className="h-14 rounded-full bg-blue-600 border-0 mt-8"
                    textClassName="text-white text-[16px] font-bold"
                >
                    Save Changes
                </Button>
            </ScrollView>

            {/* Currency Modal (Keeping Logic Similar but UI cleaner) */}
            <Modal visible={isCurrencyModalVisible} animationType="slide" transparent>
                <View className="flex-1 bg-black/60 justify-end">
                    <View className={`h-[70%] rounded-t-[32px] p-6 ${isDark ? 'bg-zinc-900' : 'bg-white'}`}>
                        <View className="flex-row items-center justify-between mb-6">
                            <Typography variant="h2" weight="bold">Currency</Typography>
                            <TouchableOpacity onPress={() => setIsCurrencyModalVisible(false)} className="bg-gray-100 dark:bg-zinc-800 p-1.5 rounded-full">
                                <CloseCircle size={22} color="#6B7280" variant="Bold" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            className={`mb-4 p-4 rounded-2xl ${isDark ? 'bg-zinc-800 text-white' : 'bg-gray-100 text-black'}`}
                            placeholder="Search currency..."
                            placeholderTextColor="#9CA3AF"
                            value={currencySearchQuery}
                            onChangeText={setCurrencySearchQuery}
                        />

                        <FlatList
                            data={filteredCurrencies}
                            keyExtractor={(item) => item.code}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => { setCurrency(item.code); setIsCurrencyModalVisible(false); }}
                                    className={`flex-row items-center py-4 border-b ${isDark ? 'border-zinc-800' : 'border-gray-100'}`}
                                >
                                    <Typography className="flex-1 text-lg" weight={currency === item.code ? 'bold' : 'medium'}>
                                        {item.name} <Typography color="gray">({item.symbol})</Typography>
                                    </Typography>
                                    {currency === item.code && <TickCircle size={22} color="#3b82f6" variant="Bold" />}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

/** 
 * Sub-Components for a Cleaner Main Render
 */

function SectionLabel({ label, isFirst }: { label: string, isFirst?: boolean }) {
    return (
        <Typography variant="caption" color="gray" weight="bold" className={`${isFirst ? 'mt-2' : 'mt-8'} mb-2 ml-4 uppercase tracking-widest text-[11px]`}>
            {label}
        </Typography>
    );
}

function SettingRow({ icon, title, subtitle, children, last }: { icon: React.ReactNode, title: string, subtitle?: string, children: React.ReactNode, last: boolean }) {
    const { isDark } = useTheme();
    return (
        <View className={`flex-row items-center px-4 ${subtitle ? 'min-h-[76px] py-3' : 'h-16'}`}>
            <View className={`w-10 h-10 items-center justify-center rounded-xl mr-3 ${isDark ? 'bg-zinc-800' : 'bg-blue-50'}`}>
                {icon}
            </View>
            <View className="flex-1">
                <Typography variant="body" weight="bold" className="text-gray-900 dark:text-white">{title}</Typography>
                {subtitle && (
                    <Typography color="gray" className="text-[12px] mt-0.5 leading-tight">
                        {subtitle}
                    </Typography>
                )}
            </View>
            {children}
            {!last && <View className={`absolute bottom-0 right-0 left-16 h-[1px] ${isDark ? 'bg-zinc-800' : 'bg-gray-50'}`} />}
        </View>
    );
}

function ThemeRow({ current, onChange, isDark }: { current: string, onChange: (t: any) => void, isDark: boolean }) {
    const options = [
        { id: 'light', icon: Sun, label: 'Light' },
        { id: 'dark', icon: Moon, label: 'Dark' },
        { id: 'system', icon: Monitor, label: 'Auto' },
    ];

    return (
        <View className="flex-row p-2 justify-between">
            {options.map((opt) => {
                const isActive = current === opt.id;
                const Icon = opt.icon;
                return (
                    <TouchableOpacity
                        key={opt.id}
                        onPress={() => onChange(opt.id)}
                        className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${isActive ? (isDark ? 'bg-zinc-800' : 'bg-gray-100') : ''}`}
                    >
                        <Icon size={18} color={isActive ? '#3b82f6' : '#9CA3AF'} variant={isActive ? 'Bold' : 'Linear'} />
                        <Typography
                            variant="small"
                            weight={isActive ? 'bold' : 'medium'}
                            className={`ml-2 ${isActive ? (isDark ? 'text-white' : 'text-blue-600') : 'text-gray-500'}`}
                        >
                            {opt.label}
                        </Typography>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}