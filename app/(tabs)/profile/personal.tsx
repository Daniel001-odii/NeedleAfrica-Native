import React, { useState, useEffect } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, Pressable, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Trash, Warning2, CloseCircle, ArrowRight2, TickCircle } from 'iconsax-react-native';
import { Typography } from '../../../components/ui/Typography';
import { IconButton } from '../../../components/ui/IconButton';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../contexts/AuthContext';
import Toast from 'react-native-toast-message';
import { useConfirm } from '../../../contexts/ConfirmContext';
import { useTheme } from '../../../contexts/ThemeContext';
import CountryPicker, { getAllCountries } from 'react-native-country-picker-modal';
import PhoneInput from 'react-phone-number-input/react-native-input';

const BUSINESS_TYPE_OPTIONS = [
    'Tailor',
    'Fashion Designer',
    'Seamstress',
    'Pattern Maker',
    'Bespoke / Made-to-Measure Brand',
    'Ready-to-Wear Brand',
    'Fashion Brand (Bespoke + Ready-to-Wear)',
    'Bridal Designer',
    'Uniform / Corporate Maker',
    'Costume Designer',
    'Atelier / Studio',
    'Fashion Student / Apprentice'
];

export default function PersonalInformation() {
    const { user, updateProfile, deleteAccount } = useAuth();
    const router = useRouter();
    const { confirm } = useConfirm();
    const { isDark } = useTheme();

    const [username, setUsername] = useState(user?.username || '');
    const [businessName, setBusinessName] = useState(user?.businessName || '');
    const [email] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phoneNumber || '');
    const [address, setAddress] = useState(user?.address || '');
    const [country, setCountry] = useState(user?.country || 'Nigeria');
    const [countryCode, setCountryCode] = useState<any>(user?.country ? undefined : 'NG');
    const [noOfEmployees, setNoOfEmployees] = useState(user?.noOfEmployees || '1-5');
    const [businessType, setBusinessType] = useState(user?.businessType || '');
    const [showBusinessTypeModal, setShowBusinessTypeModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (user) {
            setUsername(user.username || '');
            setBusinessName(user.businessName || '');
            setPhone(user.phoneNumber || '');
            setAddress(user.address || '');
            if (user.country) {
                setCountry(user.country);
                getAllCountries('emoji' as any).then(countries => {
                    const found = countries.find(c =>
                        (typeof c.name === 'string' && c.name === user.country) ||
                        (typeof c.name === 'object' && (c.name as any).common === user.country)
                    );
                    if (found) setCountryCode(found.cca2);
                }).catch(() => { });
            }
            if (user.noOfEmployees) setNoOfEmployees(user.noOfEmployees);
            if (user.businessType) setBusinessType(user.businessType);
        }
    }, [user]);

    const handleSave = async () => {
        if (!username.trim()) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'Username is required' });
            return;
        }

        setIsSaving(true);
        try {
            await updateProfile({
                username: username.trim(),
                businessName: businessName.trim(),
                phoneNumber: phone,
                address: address.trim(),
                country,
                noOfEmployees,
                businessType
            });
            Toast.show({ type: 'success', text1: 'Success', text2: 'Profile updated successfully' });
            router.back();
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Update Failed', text2: error.message || 'Something went wrong' });
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDeleteAccount = async () => {
        if (deleteConfirmationText !== 'DELETE') {
            Toast.show({ type: 'error', text1: 'Failed', text2: 'Type DELETE in caps to confirm' });
            return;
        }

        setIsDeleting(true);
        try {
            await deleteAccount();
            setShowDeleteModal(false);
            Toast.show({ type: 'success', text1: 'Account Deleted', text2: 'Account permanently removed.' });
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Delete Failed', text2: error.message || 'Something went wrong' });
        } finally {
            setIsDeleting(false);
        }
    };

    const cardBaseStyle = isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-100 shadow-sm shadow-gray-100/50';

    return (
        <View className={`flex-1 ${isDark ? 'bg-zinc-950' : 'bg-gray-50'}`}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">

                {/* Header */}
                <View className={`px-4 pt-2 pb-2 flex-row items-center justify-between ${isDark ? 'bg-zinc-950 border-b border-white/5' : 'bg-white border-b border-gray-50'}`}>
                    <View className="flex-row items-center">
                        <IconButton
                            icon={<ArrowLeft size={22} color={isDark ? 'white' : 'black'} />}
                            onPress={() => router.back()}
                            variant="ghost"
                        />
                        <Typography variant="h3" weight="bold" className="ml-2 text-gray-900 dark:text-white">Profile</Typography>
                    </View>
                    <TouchableOpacity onPress={handleSave} disabled={isSaving}>
                        <Typography color="primary" weight="bold" className={isSaving ? 'opacity-50' : ''}>
                            {isSaving ? 'Saving...' : 'Done'}
                        </Typography>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerClassName="p-5 pb-10" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                    {/* Section: Workspace Profile */}
                    <View className="mb-6">
                        <Typography variant="caption" color="gray" weight="bold" className="ml-4 mb-2 uppercase tracking-wider text-[11px]">
                            Workspace Profile
                        </Typography>
                        <View className={`rounded-[24px] overflow-hidden ${cardBaseStyle}`}>

                            {/* Read-only Email */}
                            <TouchableOpacity
                                onPress={() => confirm({
                                    title: 'Change Email',
                                    message: 'Please contact us at hello@needleafrica.com if you need to change your email address.',
                                    confirmText: 'OK',
                                    onConfirm: () => { }
                                })}
                                className="flex-row items-center justify-between px-4 py-4 border-b border-gray-50 dark:border-white/5"
                            >
                                <Typography weight="semibold" className="text-gray-900 dark:text-white text-[15px]">Email</Typography>
                                <View className="flex-row items-center">
                                    <Typography className="text-gray-400 text-[15px] mr-1">{email || 'No email set'}</Typography>
                                    <ArrowRight2 size={14} color="#9CA3AF" />
                                </View>
                            </TouchableOpacity>

                            <ProfileRowInput
                                label="Username"
                                value={username}
                                onChangeText={setUsername}
                                placeholder="Choose username"
                                isDark={isDark}
                            />

                            <ProfileRowInput
                                label="Brand Name"
                                value={businessName}
                                onChangeText={setBusinessName}
                                placeholder="Studio / Brand Name"
                                isDark={isDark}
                            />

                            {/* Phone Input */}
                            <View className="flex-row items-center px-4 py-4 border-b border-gray-50 dark:border-white/5">
                                <Typography weight="semibold" className="text-gray-900 dark:text-white w-1/3 text-[15px]">
                                    WhatsApp
                                </Typography>
                                <View className="flex-1 items-end">
                                    <PhoneInput
                                        style={{ fontSize: 15, fontWeight: '600', color: isDark ? 'white' : '#111827', textAlign: 'right', width: '100%' }}
                                        placeholder="+123 000 000 000"
                                        placeholderTextColor="#9CA3AF"
                                        defaultCountry="NG"
                                        value={phone}
                                        onChange={(val: any) => setPhone(val || '')}
                                    />
                                </View>
                            </View>

                            {/* Country Picker */}
                            <View className="flex-row items-center px-4 py-4">
                                <Typography weight="semibold" className="text-gray-900 dark:text-white w-1/3 text-[15px]">
                                    Country
                                </Typography>
                                <View className="flex-1 items-end">
                                    <CountryPicker
                                        withFilter
                                        withFlag
                                        withCountryNameButton
                                        withAlphaFilter
                                        withCallingCode={false}
                                        withEmoji
                                        onSelect={(c: any) => {
                                            setCountry(c.name as string);
                                            setCountryCode(c.cca2);
                                        }}
                                        countryCode={countryCode}
                                        theme={isDark ? { onBackgroundTextColor: '#ffffff', backgroundColor: '#1C1C1E', filterPlaceholderTextColor: '#9CA3AF' } : {}}
                                        containerButtonStyle={{ padding: 0 }}
                                    />
                                </View>
                            </View>

                        </View>
                    </View>

                    {/* Section: Studio Particulars */}
                    <View className="mb-6">
                        <Typography variant="caption" color="gray" weight="bold" className="ml-4 mb-2 uppercase tracking-wider text-[11px]">
                            Studio Particulars
                        </Typography>
                        <View className={`rounded-[24px] overflow-hidden ${cardBaseStyle}`}>

                            {/* Specialization Selection */}
                            <TouchableOpacity
                                onPress={() => setShowBusinessTypeModal(true)}
                                className="flex-row items-center justify-between px-4 py-4 border-b border-gray-50 dark:border-white/5 active:bg-gray-50 dark:active:bg-white/5"
                            >
                                <Typography weight="semibold" className="text-gray-900 dark:text-white text-[15px]">Description</Typography>
                                <View className="flex-row items-center">
                                    <Typography weight="medium" className={`text-[15px] mr-2 ${businessType ? 'text-blue-600' : 'text-gray-400'}`}>
                                        {businessType || 'Select specialization'}
                                    </Typography>
                                    <ArrowRight2 size={16} color="#9CA3AF" />
                                </View>
                            </TouchableOpacity>

                            {/* Team Size */}
                            <View className="px-4 py-4 border-b border-gray-50 dark:border-white/5">
                                <Typography weight="semibold" className="text-gray-900 dark:text-white text-[15px] mb-3">
                                    Team Size
                                </Typography>
                                <View className="flex-row flex-wrap gap-2">
                                    {['1-5', '6-20', '21-50', '50+'].map((range) => {
                                        const isSelected = noOfEmployees === range;
                                        return (
                                            <TouchableOpacity
                                                key={range}
                                                onPress={() => setNoOfEmployees(range)}
                                                className={`px-4 py-2 rounded-[12px] border ${isSelected
                                                    ? 'bg-blue-600 border-blue-600'
                                                    : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5'
                                                    }`}
                                            >
                                                <Typography
                                                    weight="bold"
                                                    className={`text-[13px] ${isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}
                                                >
                                                    {range}
                                                </Typography>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Multi-Line Address */}
                            <View className="px-4 py-4">
                                <Typography weight="semibold" className="text-gray-900 dark:text-white text-[15px] mb-2">
                                    Workshop Address
                                </Typography>
                                <TextInput
                                    className={`text-[15px] leading-tight min-h-[64px] font-medium text-left ${isDark ? 'text-white' : 'text-gray-900'}`}
                                    placeholder="Enter physical workshop address"
                                    placeholderTextColor="#9CA3AF"
                                    value={address}
                                    onChangeText={setAddress}
                                    multiline
                                    textAlignVertical="top"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Primary Safe/Save Button */}
                    <Button
                        onPress={handleSave}
                        isLoading={isSaving}
                        className="h-14 rounded-full bg-blue-600 border-0 mb-8 mt-2"
                        textClassName="text-white text-[16px] font-bold"
                    >
                        Save Changes
                    </Button>

                    {/* Section: Account Actions */}
                    <View className="mb-6">
                        <Typography variant="caption" color="red" weight="bold" className="ml-4 mb-2 uppercase tracking-wider text-[11px]">
                            Account Actions
                        </Typography>
                        <View className={`rounded-[24px] overflow-hidden ${cardBaseStyle}`}>
                            <TouchableOpacity
                                onPress={() => setShowDeleteModal(true)}
                                className="flex-row items-center p-4 active:bg-red-50 dark:active:bg-red-900/10"
                            >
                                <View className={`w-10 h-10 items-center justify-center rounded-[14px] mr-3 ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
                                    <Trash size={18} color="#EF4444" variant="Bulk" />
                                </View>
                                <View className="flex-1">
                                    <Typography weight="bold" className="text-red-500 text-[15px]">Delete Account</Typography>
                                    <Typography variant="small" color="red" className="opacity-60 text-[12px] mt-0.5">Permanently remove all your data</Typography>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Modal: Delete Confirmation */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showDeleteModal}
                onRequestClose={() => setShowDeleteModal(false)}
            >
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setShowDeleteModal(false)}>
                        <Pressable className={`rounded-t-[32px] max-h-[85%] pb-8 ${isDark ? 'bg-[#1C1C1E]' : 'bg-[#F2F2F7]'}`}>
                            <ScrollView className="p-6" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                <View className="flex-row justify-between items-center mb-6">
                                    <View className="flex-row items-center">
                                        <Warning2 size={24} color="#EF4444" variant="Bulk" />
                                        <Typography variant="h3" weight="bold" color="red" className="ml-2">Delete Account</Typography>
                                    </View>
                                    <TouchableOpacity onPress={() => setShowDeleteModal(false)} className="bg-gray-200/80 dark:bg-white/10 p-1.5 rounded-full">
                                        <CloseCircle size={22} color="#6B7280" variant="Bold" />
                                    </TouchableOpacity>
                                </View>

                                <View className={`rounded-[24px] p-4 mb-6 border ${isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-white border-red-100 shadow-sm shadow-red-100/50'}`}>
                                    <Typography weight="bold" color="red" className="mb-2 text-[15px]">Warning: This cannot be undone</Typography>
                                    <Typography color="gray" className="text-[13px] leading-5">
                                        Deleting your account removes all records, order history, measurements, and invoices. It cannot be recovered.
                                    </Typography>
                                </View>

                                <Typography className="text-gray-900 dark:text-white font-semibold text-[15px] mb-3">
                                    To confirm deletion, type <Typography weight="bold" color="red">DELETE</Typography> below:
                                </Typography>

                                <View className={`px-4 h-14 justify-center border rounded-[16px] mb-6 bg-white dark:bg-transparent ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                                    <TextInput
                                        className={`font-semibold flex-1 text-[16px] ${isDark ? 'text-white' : 'text-gray-900'}`}
                                        placeholder="Type DELETE"
                                        placeholderTextColor="#9CA3AF"
                                        value={deleteConfirmationText}
                                        onChangeText={setDeleteConfirmationText}
                                        autoCapitalize="characters"
                                        autoCorrect={false}
                                    />
                                </View>

                                <Button
                                    onPress={confirmDeleteAccount}
                                    isLoading={isDeleting}
                                    disabled={deleteConfirmationText !== 'DELETE'}
                                    className={`h-14 rounded-full border-0 ${deleteConfirmationText === 'DELETE' ? 'bg-red-600' : 'bg-gray-200'}`}
                                    textClassName={`text-white text-[16px] font-bold ${deleteConfirmationText !== 'DELETE' ? 'text-gray-400' : 'text-white'}`}
                                >
                                    Permanently Delete
                                </Button>
                            </ScrollView>
                        </Pressable>
                    </Pressable>
                </KeyboardAvoidingView>
            </Modal>

            {/* Modal: Business Specialization Selector */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showBusinessTypeModal}
                onRequestClose={() => setShowBusinessTypeModal(false)}
            >
                <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setShowBusinessTypeModal(false)}>
                    <Pressable className={`rounded-t-[32px] max-h-[75%] pb-8 ${isDark ? 'bg-[#1C1C1E]' : 'bg-[#F2F2F7]'}`}>

                        <View className="flex-row justify-between items-center p-6 pb-4 border-b border-gray-100 dark:border-white/5">
                            <View className="w-8" />
                            <Typography variant="h3" weight="bold" className="text-gray-900 dark:text-white">Describe Your Craft</Typography>
                            <TouchableOpacity onPress={() => setShowBusinessTypeModal(false)} className="bg-gray-200/80 dark:bg-white/10 p-1.5 rounded-full">
                                <CloseCircle size={22} color="#6B7280" variant="Bold" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="p-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            <View className={`rounded-[24px] overflow-hidden mb-8 ${cardBaseStyle}`}>
                                {BUSINESS_TYPE_OPTIONS.map((option, index) => {
                                    const isSelected = businessType === option;
                                    const isLast = index === BUSINESS_TYPE_OPTIONS.length - 1;

                                    return (
                                        <TouchableOpacity
                                            key={option}
                                            onPress={() => {
                                                setBusinessType(option);
                                                setShowBusinessTypeModal(false);
                                            }}
                                            className={`flex-row items-center justify-between px-5 py-4 bg-white dark:bg-transparent active:bg-gray-50 dark:active:bg-white/5 ${!isLast ? 'border-b border-gray-100 dark:border-white/5' : ''}`}
                                        >
                                            <Typography
                                                weight={isSelected ? "bold" : "semibold"}
                                                className={`text-[15px] ${isSelected ? 'text-blue-600' : (isDark ? 'text-white' : 'text-gray-900')}`}
                                            >
                                                {option}
                                            </Typography>
                                            {isSelected && (
                                                <TickCircle size={20} color="#2563EB" variant="Bold" />
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

// ----------------------------------------------------------------------
// Profile Generic Right-Aligned Table Row
// ----------------------------------------------------------------------

interface ProfileRowInputProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    isDark?: boolean;
}

function ProfileRowInput({ label, value, onChangeText, placeholder, isDark }: ProfileRowInputProps) {
    return (
        <View className="flex-row items-center px-4 py-4 border-b border-gray-50 dark:border-white/5">
            <Typography weight="semibold" className="text-gray-900 dark:text-white w-1/3 text-[15px]">
                {label}
            </Typography>
            <TextInput
                className={`flex-1 text-right font-semibold text-[15px] ${isDark ? 'text-white' : 'text-gray-900'}`}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                value={value}
                onChangeText={onChangeText}
                autoCorrect={false}
                returnKeyType="done"
            />
        </View>
    );
}