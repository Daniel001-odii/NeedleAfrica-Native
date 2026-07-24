import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, Pressable, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Trash, Logout, Warning2, CloseCircle, ArrowRight2, TickCircle } from 'iconsax-react-native';
import { Typography } from '../../../components/ui/Typography';
import { IconButton } from '../../../components/ui/IconButton';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../contexts/AuthContext';
import Toast from 'react-native-toast-message';
import { useConfirm } from '../../../contexts/ConfirmContext';
import { useTheme } from '../../../contexts/ThemeContext';
import CountryPicker, { getAllCountries } from 'react-native-country-picker-modal';
import PhoneInput from 'react-phone-number-input/react-native-input';

// Convert local-format Nigerian phone (e.g. "08156074667") to E.164 ("+2348156074667").
function toE164(raw: string): string {
    if (!raw) return '';
    if (raw.startsWith('+')) return raw;
    if (/^0[789]\d{9}$/.test(raw)) {
        return '+234' + raw.slice(1);
    }
    return raw;
}

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
    const { user, updateProfile, deleteAccount, changePassword, logout, changeEmail, verifyEmailChange, resendEmailChangeOtp, sendEmailVerification, verifyEmail } = useAuth();
    const router = useRouter();
    const { confirm } = useConfirm();
    const { isDark } = useTheme();

    const [username, setUsername] = useState(user?.username || '');
    const [businessName, setBusinessName] = useState(user?.businessName || '');
    const [email] = useState(user?.email || '');
    const [phone, setPhone] = useState(toE164(user?.phoneNumber || ''));
    const [whatsappNumber, setWhatsappNumber] = useState(toE164(user?.whatsappNumber || ''));
    const [address, setAddress] = useState(user?.address || '');
    const [country, setCountry] = useState(user?.country || 'Nigeria');
    const [countryCode, setCountryCode] = useState<any>(user?.country ? undefined : 'NG');
    const [noOfEmployees, setNoOfEmployees] = useState(user?.noOfEmployees || '1-5');
    const [businessType, setBusinessType] = useState(user?.businessType || '');
    const [showBusinessTypeModal, setShowBusinessTypeModal] = useState(false);
    const [showEmployeesModal, setShowEmployeesModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEmailLoading, setIsEmailLoading] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    // Email change state
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailStep, setEmailStep] = useState<'initiate' | 'verify' | 'success'>('initiate');
    const [newEmail, setNewEmail] = useState('');
    const [emailPassword, setEmailPassword] = useState('');

    // Verify current email state
    const [showVerifyEmailModal, setShowVerifyEmailModal] = useState(false);
    const [verifyEmailStep, setVerifyEmailStep] = useState<'send' | 'otp' | 'success'>('send');

    // OTP State managed as an array of 6 digits
    const [otpArray, setOtpArray] = useState<string[]>(Array(6).fill(''));
    const otpCode = otpArray.join(''); // Derived state for submission compatibility

    const isOAuthUser = user?.provider === 'GOOGLE' || user?.provider === 'APPLE';

    // OTP input refs
    const otpRefs = useRef<(TextInput | null)[]>([]);

    const handleOtpDigitChange = (text: string, index: number) => {
        const cleanText = text.replace(/\D/g, '');

        // Handle code paste (if pasted text length is larger than 1)
        if (cleanText.length > 1) {
            const pastedDigits = cleanText.slice(0, 6).split('');
            const newOtp = [...otpArray];

            // Distribute characters starting from current focused index
            pastedDigits.forEach((digit, i) => {
                if (index + i < 6) {
                    newOtp[index + i] = digit;
                }
            });

            setOtpArray(newOtp);
            // Focus the next empty input or last input
            const nextFocusIndex = Math.min(index + pastedDigits.length, 5);
            otpRefs.current[nextFocusIndex]?.focus();
            return;
        }

        const newOtp = [...otpArray];
        // Allow over-writing existing text by selecting the last character entered
        newOtp[index] = cleanText.slice(-1);
        setOtpArray(newOtp);

        // Auto-advance to next input if text is entered
        if (cleanText && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyPress = (key: string, index: number) => {
        // If backspace is pressed on an empty input field, step back and clear the previous input
        if (key === 'Backspace' && !otpArray[index] && index > 0) {
            const newOtp = [...otpArray];
            newOtp[index - 1] = '';
            setOtpArray(newOtp);
            otpRefs.current[index - 1]?.focus();
        }
    };

    useEffect(() => {
        if (user) {
            setUsername(user.username || '');
            setBusinessName(user.businessName || '');
            setPhone(toE164(user.phoneNumber || ''));
            setWhatsappNumber(toE164(user.whatsappNumber || ''));
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
                whatsappNumber: whatsappNumber || undefined,
                address: address.trim(),
                country,
                businessType,
                noOfEmployees,
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

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'Please fill in all password fields' });
            return;
        }
        if (newPassword.length < 8) {
            Toast.show({ type: 'error', text1: 'Invalid', text2: 'New password must be at least 8 characters' });
            return;
        }
        if (newPassword !== confirmNewPassword) {
            Toast.show({ type: 'error', text1: 'Mismatch', text2: 'New passwords do not match' });
            return;
        }

        setIsChangingPassword(true);
        try {
            await changePassword(currentPassword, newPassword);
            Toast.show({ type: 'success', text1: 'Success', text2: 'Password updated successfully' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setShowPasswordModal(false);
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Update Failed', text2: error.message || 'Could not change password' });
        } finally {
            setIsChangingPassword(false);
        }
    };

    // ---------- EMAIL CHANGE HANDLERS ----------

    const handleInitiateEmailChange = async () => {
        if (!newEmail.trim()) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'Please enter a new email address' });
            return;
        }
        if (newEmail === email) {
            Toast.show({ type: 'error', text1: 'Invalid', text2: 'New email must be different from current email' });
            return;
        }

        setIsEmailLoading(true);
        try {
            const password = (!isOAuthUser && emailPassword) ? emailPassword : undefined;
            await changeEmail(newEmail.trim(), password);
            Toast.show({ type: 'success', text1: 'Code Sent', text2: `Verification code sent to ${newEmail.trim()}` });
            setEmailStep('verify');
            setOtpArray(Array(6).fill(''));
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Failed', text2: error.message || 'Could not initiate email change' });
        } finally {
            setIsEmailLoading(false);
        }
    };

    const handleVerifyEmailChange = async () => {
        if (otpCode.length !== 6) {
            Toast.show({ type: 'error', text1: 'Invalid', text2: 'Please enter the 6-digit verification code' });
            return;
        }

        setIsEmailLoading(true);
        try {
            await verifyEmailChange(otpCode);
            setEmailStep('success');
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Failed', text2: error.message || 'Verification failed' });
        } finally {
            setIsEmailLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setIsEmailLoading(true);
        try {
            await resendEmailChangeOtp();
            Toast.show({ type: 'success', text1: 'Code Resent', text2: `A new code has been sent to ${newEmail}` });
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Failed', text2: error.message || 'Could not resend code' });
        } finally {
            setIsEmailLoading(false);
        }
    };

    const closeEmailModal = () => {
        setShowEmailModal(false);
        setEmailStep('initiate');
        setNewEmail('');
        setEmailPassword('');
        setOtpArray(Array(6).fill(''));
    };

    // ---------- VERIFY CURRENT EMAIL HANDLERS ----------

    const handleSendVerification = async () => {
        setIsEmailLoading(true);
        try {
            await sendEmailVerification();
            setVerifyEmailStep('otp');
            setOtpArray(Array(6).fill(''));
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Failed', text2: error.message || 'Could not send verification code' });
        } finally {
            setIsEmailLoading(false);
        }
    };

    const handleVerifyCurrentEmail = async () => {
        if (otpCode.length !== 6) {
            Toast.show({ type: 'error', text1: 'Invalid', text2: 'Please enter the 6-digit verification code' });
            return;
        }

        setIsEmailLoading(true);
        try {
            await verifyEmail(otpCode);
            setVerifyEmailStep('success');
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Failed', text2: error.message || 'Verification failed' });
        } finally {
            setIsEmailLoading(false);
        }
    };

    const handleResendVerificationOtp = async () => {
        setIsEmailLoading(true);
        try {
            await sendEmailVerification();
            Toast.show({ type: 'success', text1: 'Code Resent', text2: `A new code has been sent to ${email}` });
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Failed', text2: error.message || 'Could not resend code' });
        } finally {
            setIsEmailLoading(false);
        }
    };

    const closeVerifyEmailModal = () => {
        setShowVerifyEmailModal(false);
        setVerifyEmailStep('send');
        setOtpArray(Array(6).fill(''));
    };

    const cardBaseStyle = isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-100 shadow-sm shadow-gray-100/50';

    return (
        <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'}`}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">

                {/* Header */}
                <View className={`px-4 pt-2 pb-2 flex-row items-center justify-between ${isDark ? 'bg-black border-b border-white/5' : 'bg-white border-b border-gray-50'}`}>
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

                    {/* Section: Account Settings */}
                    <View className="mb-6">
                        <Typography variant="caption" color="gray" weight="bold" className="ml-4 mb-2 uppercase tracking-wider text-[11px]">
                            Account Settings
                        </Typography>
                        <View className={`rounded-[24px] overflow-hidden ${cardBaseStyle}`}>

                            {/* Email Row — tappable for verify or change */}
                            <TouchableOpacity
                                onPress={() => {
                                    if (user?.emailIsVerified) {
                                        setShowEmailModal(true);
                                        setEmailStep('initiate');
                                        setNewEmail('');
                                        setEmailPassword('');
                                        setOtpArray(Array(6).fill(''));
                                    } else {
                                        setShowVerifyEmailModal(true);
                                        setVerifyEmailStep('send');
                                        setOtpArray(Array(6).fill(''));
                                    }
                                }}
                                className="flex-row items-center justify-between px-4 py-4 border-b border-gray-50 dark:border-white/5"
                            >
                                <View className="flex-1">
                                    <Typography weight="semibold" className="text-gray-900 dark:text-white text-[15px]">Email</Typography>
                                    <View className="flex-row items-center mt-0.5">
                                        <Typography className="text-gray-400 text-[14px] mr-1">{email || 'No email set'}</Typography>
                                        {user?.emailIsVerified ? (
                                            <View className="flex-row items-center bg-green-100 dark:bg-green-800/30 px-1.5 py-0.5 rounded-full">
                                                <TickCircle size={12} color="#16A34A" variant="Bold" />
                                                <Typography variant="small" className="text-green-700 dark:text-green-400 ml-1 text-[10px]">Verified</Typography>
                                            </View>
                                        ) : (
                                            <View className="flex-row items-center bg-amber-100 dark:bg-amber-800/30 px-1.5 py-0.5 rounded-full">
                                                <Warning2 size={12} color="#D97706" variant="Bold" />
                                                <Typography variant="small" className="text-amber-700 dark:text-amber-400 ml-1 text-[10px]">Unverified</Typography>
                                            </View>
                                        )}
                                    </View>
                                </View>
                                <ArrowRight2 size={14} color="#9CA3AF" />
                            </TouchableOpacity>

                            {/* Password Menu Item */}
                            {(!user?.provider || user?.provider === 'NEEDLEX') && (
                                <TouchableOpacity
                                    onPress={() => setShowPasswordModal(true)}
                                    className="flex-row items-center justify-between px-4 py-4 border-b border-gray-50 dark:border-white/5"
                                >
                                    <Typography weight="semibold" className="text-gray-900 dark:text-white text-[15px]">Security</Typography>
                                    <View className="flex-row items-center">
                                        <Typography className="text-gray-400 text-[14px] mr-1">Update password</Typography>
                                        <ArrowRight2 size={14} color="#9CA3AF" />
                                    </View>
                                </TouchableOpacity>
                            )}

                            <ProfileRowInput
                                label="Username"
                                value={username}
                                onChangeText={setUsername}
                                placeholder="Choose username"
                                isDark={isDark}
                            />

                            {/* Country Picker Inline */}
                            <View className="flex-row items-center px-4 py-4 border-b border-gray-50 dark:border-white/5">
                                <Typography weight="semibold" className="text-gray-900 dark:text-white w-1/3 text-[14px]">
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
                                            fontFamily: 'Inter-Medium',
                                            fontSize: 16,
                                            onBackgroundTextColor: '#111827'
                                        }}
                                        containerButtonStyle={{ padding: 0, margin: 0 }}
                                    />
                                </View>
                            </View>

                            {/* Business Type (Specialization) */}
                            <TouchableOpacity
                                onPress={() => setShowBusinessTypeModal(true)}
                                className="flex-row items-center justify-between px-4 py-4 border-b border-gray-50 dark:border-white/5"
                            >
                                <Typography weight="semibold" className="text-gray-900 dark:text-white text-[15px]">Specialization</Typography>
                                <View className="flex-row items-center">
                                    <Typography className={`text-[14px] mr-2 ${businessType ? 'text-blue-600' : 'text-gray-400'}`}>
                                        {businessType || 'Select'}
                                    </Typography>
                                    <ArrowRight2 size={14} color="#9CA3AF" />
                                </View>
                            </TouchableOpacity>

                            {/* Team Size */}
                            <TouchableOpacity
                                onPress={() => setShowEmployeesModal(true)}
                                className="flex-row items-center justify-between px-4 py-4"
                            >
                                <Typography weight="semibold" className="text-gray-900 dark:text-white text-[15px]">Team Size</Typography>
                                <View className="flex-row items-center">
                                    <Typography className={`text-[15px] mr-2 ${noOfEmployees ? 'text-blue-600' : 'text-gray-400'}`}>
                                        {noOfEmployees || 'Select'}
                                    </Typography>
                                    <ArrowRight2 size={14} color="#9CA3AF" />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Primary Safe/Save Button */}
                    <Button
                        onPress={handleSave}
                        isLoading={isSaving}
                        className="h-14 rounded-full bg-blue-600 border-0 mb-8 mt-2"
                        textClassName="text-white text-[16px] font-bold"
                    >
                        Save Account Settings
                    </Button>

                    {/* Section: Danger Zone */}
                    <View className="mb-6">
                        <Typography variant="caption" color="red" weight="bold" className="ml-4 mb-2 uppercase tracking-wider text-[11px]">
                            Danger Zone
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

            {/* Modal: Team Size Selector */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showEmployeesModal}
                onRequestClose={() => setShowEmployeesModal(false)}
            >
                <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setShowEmployeesModal(false)}>
                    <Pressable className={`rounded-t-[32px] max-h-[75%] pb-8 ${isDark ? 'bg-[#1C1C1E]' : 'bg-[#F2F2F7]'}`}>
                        <View className="flex-row justify-between items-center p-6 pb-4 border-b border-gray-100 dark:border-white/5">
                            <View className="w-8" />
                            <Typography variant="h3" weight="bold" className="text-gray-900 dark:text-white">Team Size</Typography>
                            <TouchableOpacity onPress={() => setShowEmployeesModal(false)} className="bg-gray-200/80 dark:bg-white/10 p-1.5 rounded-full">
                                <CloseCircle size={22} color="#6B7280" variant="Bold" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
                            <View className={`rounded-[24px] overflow-hidden mb-8 ${cardBaseStyle}`}>
                                {['1-5', '6-20', '21-50', '50+'].map((range, index) => {
                                    const isSelected = noOfEmployees === range;
                                    const isLast = index === 3;
                                    return (
                                        <TouchableOpacity
                                            key={range}
                                            onPress={() => {
                                                setNoOfEmployees(range);
                                                setShowEmployeesModal(false);
                                            }}
                                            className={`flex-row items-center justify-between px-5 py-4 bg-white dark:bg-transparent active:bg-gray-50 dark:active:bg-white/5 ${!isLast ? 'border-b border-gray-100 dark:border-white/5' : ''}`}
                                        >
                                            <Typography
                                                weight={isSelected ? "bold" : "semibold"}
                                                className={`text-[15px] ${isSelected ? 'text-blue-600' : (isDark ? 'text-white' : 'text-gray-900')}`}
                                            >
                                                {range}
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

            {/* Modal: Change Password */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showPasswordModal}
                onRequestClose={() => setShowPasswordModal(false)}
            >
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setShowPasswordModal(false)}>
                        <Pressable className={`rounded-t-[32px] max-h-[85%] pb-10 ${isDark ? 'bg-[#1C1C1E]' : 'bg-[#F2F2F7]'}`}>
                            <View className="p-6">
                                <View className="flex-row justify-between items-center mb-6">
                                    <View className="flex-row items-center">
                                        <Warning2 size={24} color="#2563EB" variant="Bulk" />
                                        <Typography variant="h3" weight="bold" className="text-gray-900 dark:text-white ml-2">Update Password</Typography>
                                    </View>
                                    <TouchableOpacity onPress={() => setShowPasswordModal(false)} className="bg-gray-200/80 dark:bg-white/10 p-1.5 rounded-full">
                                        <CloseCircle size={22} color="#6B7280" variant="Bold" />
                                    </TouchableOpacity>
                                </View>

                                <View className={`rounded-[24px] overflow-hidden mb-6 ${cardBaseStyle}`}>
                                    <ProfileRowInput
                                        label="Current"
                                        value={currentPassword}
                                        onChangeText={setCurrentPassword}
                                        placeholder="••••••••"
                                        isDark={isDark}
                                        secureTextEntry
                                    />
                                    <ProfileRowInput
                                        label="New"
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        placeholder="••••••••"
                                        isDark={isDark}
                                        secureTextEntry
                                    />
                                    <ProfileRowInput
                                        label="Confirm"
                                        value={confirmNewPassword}
                                        onChangeText={setConfirmNewPassword}
                                        placeholder="••••••••"
                                        isDark={isDark}
                                        secureTextEntry
                                    />
                                </View>

                                <Button
                                    onPress={handleChangePassword}
                                    isLoading={isChangingPassword}
                                    className="h-14 rounded-full bg-blue-600 border-0"
                                    textClassName="text-white text-[16px] font-bold"
                                >
                                    Update Password
                                </Button>
                            </View>
                        </Pressable>
                    </Pressable>
                </KeyboardAvoidingView>
            </Modal>

            {/* Modal: Verify Current Email */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showVerifyEmailModal}
                onRequestClose={closeVerifyEmailModal}
            >
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <Pressable className="flex-1 bg-black/40 justify-end" onPress={closeVerifyEmailModal}>
                        <Pressable className={`rounded-t-[32px] max-h-[85%] pb-10 ${isDark ? 'bg-[#1C1C1E]' : 'bg-[#F2F2F7]'}`}>
                            <View className="p-6">
                                {verifyEmailStep === 'send' && (
                                    <>
                                        <View className="flex-row justify-between items-center mb-6">
                                            <View className="flex-row items-center">
                                                <Typography variant="h3" weight="bold" className="text-gray-900 dark:text-white">
                                                    Verify Your Email
                                                </Typography>
                                            </View>
                                            <TouchableOpacity onPress={closeVerifyEmailModal} className="bg-gray-200/80 dark:bg-white/10 p-1.5 rounded-full">
                                                <CloseCircle size={22} color="#6B7280" variant="Bold" />
                                            </TouchableOpacity>
                                        </View>

                                        <View className={`rounded-[24px] p-4 mb-6 border ${isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-100'}`}>
                                            <Typography weight="semibold" className="text-amber-700 dark:text-amber-400 text-[15px] mb-1">
                                                Your email is not verified
                                            </Typography>
                                            <Typography className="text-amber-600/80 dark:text-amber-400/70 text-[14px] leading-5">
                                                We'll send a verification code to <Typography weight="bold">{email}</Typography>. Verifying your email helps secure your account and enables important notifications.
                                            </Typography>
                                        </View>

                                        <Button
                                            onPress={handleSendVerification}
                                            isLoading={isEmailLoading}
                                            className="h-14 rounded-full bg-blue-600 border-0 mb-3"
                                            textClassName="text-white text-[16px] font-bold"
                                        >
                                            Send Verification Code
                                        </Button>

                                        <TouchableOpacity
                                            onPress={() => {
                                                closeVerifyEmailModal();
                                                setTimeout(() => {
                                                    setShowEmailModal(true);
                                                    setEmailStep('initiate');
                                                    setNewEmail('');
                                                    setEmailPassword('');
                                                    setOtpArray(Array(6).fill(''));
                                                }, 400);
                                            }}
                                            disabled={isEmailLoading}
                                            className="py-2"
                                        >
                                            <Typography variant="small" color="primary" weight="bold" className="text-center">
                                                Change email instead?
                                            </Typography>
                                        </TouchableOpacity>
                                    </>
                                )}

                                {verifyEmailStep === 'otp' && (
                                    <>
                                        <View className="flex-row justify-between items-center mb-4">
                                            <Typography variant="h3" weight="bold" className="text-gray-900 dark:text-white">
                                                Enter code
                                            </Typography>
                                            <TouchableOpacity onPress={closeVerifyEmailModal} className="bg-gray-200/80 dark:bg-white/10 p-1.5 rounded-full">
                                                <CloseCircle size={22} color="#6B7280" variant="Bold" />
                                            </TouchableOpacity>
                                        </View>

                                        {/* 6‑digit OTP inputs */}
                                        <View className="flex-row justify-center gap-2 mb-4">
                                            {[0, 1, 2, 3, 4, 5].map((index) => {
                                                const hasValue = !!otpArray[index];
                                                return (
                                                    <TextInput
                                                        key={index}
                                                        ref={(ref) => { otpRefs.current[index] = ref; }}
                                                        className={`w-12 h-14 text-center text-[22px] font-bold rounded-xl border ${hasValue
                                                                ? (isDark ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-blue-500 bg-blue-50 text-gray-900')
                                                                : (isDark ? 'border-white/10 bg-zinc-900 text-white' : 'border-gray-200 bg-gray-50 text-gray-900')
                                                            }`}
                                                        keyboardType="number-pad"
                                                        maxLength={2}
                                                        value={otpArray[index]}
                                                        onChangeText={(text) => handleOtpDigitChange(text, index)}
                                                        onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
                                                        selectTextOnFocus
                                                    />
                                                );
                                            })}
                                        </View>

                                        <Typography variant="small" color="gray" className="text-center mb-1">
                                            Sent to <Typography variant="small" weight="medium" className={isDark ? 'text-white' : 'text-gray-900'}>{email}</Typography>
                                        </Typography>
                                        <Typography variant="small" color="gray" className="text-center mb-6 opacity-60">
                                            Expires in 1 hour
                                        </Typography>

                                        <Button
                                            onPress={handleVerifyCurrentEmail}
                                            isLoading={isEmailLoading}
                                            className="h-14 rounded-full bg-blue-600 border-0 mb-3"
                                            textClassName="text-white text-[16px] font-bold"
                                        >
                                            Verify
                                        </Button>

                                        <TouchableOpacity onPress={handleResendVerificationOtp} disabled={isEmailLoading} className="py-2">
                                            <Typography variant="small" color="primary" weight="bold" className="text-center">
                                                Resend Code
                                            </Typography>
                                        </TouchableOpacity>
                                    </>
                                )}

                                {verifyEmailStep === 'success' && (
                                    <>
                                        <View className="items-center py-8">
                                            <View className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-800/30 items-center justify-center mb-6">
                                                <TickCircle size={48} color="#16A34A" variant="Bold" />
                                            </View>
                                            <Typography variant="h3" weight="bold" className="text-gray-900 dark:text-white mb-2 text-center">
                                                Email Verified!
                                            </Typography>
                                            <Typography className="text-gray-500 dark:text-gray-400 text-[15px] text-center leading-6 mb-2">
                                                Your email has been verified
                                            </Typography>
                                            <Typography weight="bold" color="primary" className="text-[16px] mb-6 text-center">
                                                {email}
                                            </Typography>
                                            <Button
                                                onPress={closeVerifyEmailModal}
                                                className="h-14 rounded-full bg-green-600 border-0 px-10"
                                                textClassName="text-white text-[16px] font-bold"
                                            >
                                                Done
                                            </Button>
                                        </View>
                                    </>
                                )}
                            </View>
                        </Pressable>
                    </Pressable>
                </KeyboardAvoidingView>
            </Modal>

            {/* Modal: Change Email */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showEmailModal}
                onRequestClose={closeEmailModal}
            >
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <Pressable className="flex-1 bg-black/40 justify-end" onPress={closeEmailModal}>
                        <Pressable className={`rounded-t-[32px] max-h-[85%] pb-10 ${isDark ? 'bg-[#1C1C1E]' : 'bg-[#F2F2F7]'}`}>
                            <View className="p-6">
                                {emailStep === 'initiate' && (
                                    <>
                                        <View className="flex-row justify-between items-center mb-6">
                                            <View className="flex-row items-center">
                                                <Typography variant="h3" weight="bold" className="text-gray-900 dark:text-white">
                                                    Change Email
                                                </Typography>
                                            </View>
                                            <TouchableOpacity onPress={closeEmailModal} className="bg-gray-200/80 dark:bg-white/10 p-1.5 rounded-full">
                                                <CloseCircle size={22} color="#6B7280" variant="Bold" />
                                            </TouchableOpacity>
                                        </View>

                                        <View className={`rounded-[24px] overflow-hidden mb-6 ${cardBaseStyle}`}>
                                            <ProfileRowInput
                                                label="Current"
                                                value={email || ''}
                                                onChangeText={() => { }}
                                                placeholder="you@example.com"
                                                isDark={isDark}
                                            />
                                            <ProfileRowInput
                                                label="New"
                                                value={newEmail}
                                                onChangeText={setNewEmail}
                                                placeholder="new@example.com"
                                                isDark={isDark}
                                            />
                                            {!isOAuthUser && (
                                                <ProfileRowInput
                                                    label="Password"
                                                    value={emailPassword}
                                                    onChangeText={setEmailPassword}
                                                    placeholder="Confirm with password"
                                                    isDark={isDark}
                                                    secureTextEntry
                                                />
                                            )}
                                        </View>

                                        <Button
                                            onPress={handleInitiateEmailChange}
                                            isLoading={isEmailLoading}
                                            className="h-14 rounded-full bg-blue-600 border-0"
                                            textClassName="text-white text-[16px] font-bold"
                                        >
                                            Send Verification Code
                                        </Button>
                                    </>
                                )}

                                {emailStep === 'verify' && (
                                    <>
                                        <View className="flex-row justify-between items-center mb-4">
                                            <Typography variant="h3" weight="bold" className="text-gray-900 dark:text-white">
                                                Enter code
                                            </Typography>
                                            <TouchableOpacity onPress={closeEmailModal} className="bg-gray-200/80 dark:bg-white/10 p-1.5 rounded-full">
                                                <CloseCircle size={22} color="#6B7280" variant="Bold" />
                                            </TouchableOpacity>
                                        </View>

                                        {/* 6‑digit OTP inputs */}
                                        <View className="flex-row justify-center gap-2 mb-4">
                                            {[0, 1, 2, 3, 4, 5].map((index) => {
                                                const hasValue = !!otpArray[index];
                                                return (
                                                    <TextInput
                                                        key={index}
                                                        ref={(ref) => { otpRefs.current[index] = ref; }}
                                                        className={`w-12 h-14 text-center text-[22px] font-bold rounded-xl border ${hasValue
                                                                ? (isDark ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-blue-500 bg-blue-50 text-gray-900')
                                                                : (isDark ? 'border-white/10 bg-zinc-900 text-white' : 'border-gray-200 bg-gray-50 text-gray-900')
                                                            }`}
                                                        keyboardType="number-pad"
                                                        maxLength={2} // Using 2 instead of 1 lets users overwrite values smoothly
                                                        value={otpArray[index]}
                                                        onChangeText={(text) => handleOtpDigitChange(text, index)}
                                                        onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
                                                        selectTextOnFocus
                                                    />
                                                );
                                            })}
                                        </View>

                                        {/* Minimalist copy */}
                                        <Typography variant="small" color="gray" className="text-center mb-1">
                                            Sent to <Typography variant="small" weight="medium" className={isDark ? 'text-white' : 'text-gray-900'}>{newEmail}</Typography>
                                        </Typography>
                                        <Typography variant="small" color="gray" className="text-center mb-6 opacity-60">
                                            Expires in 1 hour
                                        </Typography>

                                        <Button
                                            onPress={handleVerifyEmailChange}
                                            isLoading={isEmailLoading}
                                            className="h-14 rounded-full bg-blue-600 border-0 mb-3"
                                            textClassName="text-white text-[16px] font-bold"
                                        >
                                            Verify
                                        </Button>

                                        <TouchableOpacity onPress={handleResendOtp} disabled={isEmailLoading} className="py-2">
                                            <Typography variant="small" color="primary" weight="bold" className="text-center">
                                                Resend Code
                                            </Typography>
                                        </TouchableOpacity>
                                    </>
                                )}

                                {emailStep === 'success' && (
                                    <>
                                        <View className="items-center py-8">
                                            <View className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-800/30 items-center justify-center mb-6">
                                                <TickCircle size={48} color="#16A34A" variant="Bold" />
                                            </View>
                                            <Typography variant="h3" weight="bold" className="text-gray-900 dark:text-white mb-2 text-center">
                                                Email Changed!
                                            </Typography>
                                            <Typography className="text-gray-500 dark:text-gray-400 text-[15px] text-center leading-6 mb-2">
                                                Your email has been updated to
                                            </Typography>
                                            <Typography weight="bold" color="primary" className="text-[16px] mb-6 text-center">
                                                {newEmail}
                                            </Typography>
                                            <Button
                                                onPress={closeEmailModal}
                                                className="h-14 rounded-full bg-green-600 border-0 px-10"
                                                textClassName="text-white text-[16px] font-bold"
                                            >
                                                Done
                                            </Button>
                                        </View>
                                    </>
                                )}
                            </View>
                        </Pressable>
                    </Pressable>
                </KeyboardAvoidingView>
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
    secureTextEntry?: boolean;
}

function ProfileRowInput({ label, value, onChangeText, placeholder, isDark, secureTextEntry }: ProfileRowInputProps) {
    return (
        <View className="flex-row items-center px-4 py-4 border-b border-gray-50 dark:border-white/5">
            <Typography weight="semibold" className="text-gray-900 dark:text-white w-1/3 text-[14px]">
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
                secureTextEntry={secureTextEntry}
            />
        </View>
    );
}