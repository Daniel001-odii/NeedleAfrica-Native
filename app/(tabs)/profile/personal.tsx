import React, { useState, useEffect } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, Pressable, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, User, Shop, Sms, Call, Location, Trash, Warning2, CloseCircle } from 'iconsax-react-native';
import { Typography } from '../../../components/ui/Typography';
import { Surface } from '../../../components/ui/Surface';
import { IconButton } from '../../../components/ui/IconButton';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../contexts/AuthContext';
import Toast from 'react-native-toast-message';
import { useConfirm } from '../../../contexts/ConfirmContext';
import { useTheme } from '../../../contexts/ThemeContext';
import CountryPicker, { Country, getAllCountries } from 'react-native-country-picker-modal';
import PhoneInput from 'react-phone-number-input/react-native-input';

export default function PersonalInformation() {
    const { user, updateProfile, deleteAccount, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const { confirm } = useConfirm();
    const { isDark } = useTheme();

    const [username, setUsername] = useState(user?.username || '');
    const [businessName, setBusinessName] = useState(user?.businessName || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phoneNumber || '');
    const [address, setAddress] = useState(user?.address || '');
    const [country, setCountry] = useState(user?.country || 'Nigeria');
    const [countryCode, setCountryCode] = useState<any>(user?.country ? undefined : 'NG');
    const [noOfEmployees, setNoOfEmployees] = useState(user?.noOfEmployees || '1-5');
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (user) {
            setUsername(user.username || '');
            setBusinessName(user.businessName || '');
            setEmail(user.email || '');
            setPhone(user.phoneNumber || '');
            setAddress(user.address || '');
            if (user.country) {
                setCountry(user.country);
                // Resolve country code from name for the picker
                getAllCountries('emoji' as any).then(countries => {
                    const found = countries.find(c =>
                        (typeof c.name === 'string' && c.name === user.country) ||
                        (typeof c.name === 'object' && (c.name as any).common === user.country)
                    );
                    if (found) setCountryCode(found.cca2);
                }).catch(() => { });
            }
            if (user.noOfEmployees) setNoOfEmployees(user.noOfEmployees);
        }
    }, [user]);

    const handleSave = async () => {
        if (!username) {
            Toast.show({
                type: 'error',
                text1: 'Required',
                text2: 'Username is required'
            });
            return;
        }

        setIsSaving(true);
        try {
            await updateProfile({
                username,
                businessName,
                phoneNumber: phone,
                address,
                country,
                noOfEmployees
            });
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Profile updated successfully'
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

    const handleDeleteAccount = () => {
        setShowDeleteModal(true);
    };

    const confirmDeleteAccount = async () => {
        if (deleteConfirmationText !== 'DELETE') {
            Toast.show({
                type: 'error',
                text1: 'Confirmation Failed',
                text2: 'Please type DELETE in all caps to confirm'
            });
            return;
        }

        setIsDeleting(true);
        try {
            await deleteAccount();
            setShowDeleteModal(false);
            Toast.show({
                type: 'success',
                text1: 'Account Deleted',
                text2: 'Your account has been permanently removed.'
            });
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Delete Failed',
                text2: error.message || 'Something went wrong'
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <View className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-white'}`}>
            <View className={`px-6 py-4 flex-row items-center border-b ${isDark ? 'border-border-dark' : 'border-gray-50'}`}>
                <IconButton
                    icon={<ArrowLeft size={20} color={isDark ? 'white' : 'black'} />}
                    onPress={() => router.back()}
                    variant="ghost"
                    className="-ml-2"
                />
                <Typography variant="h3" weight="bold" className="ml-2">Personal Information</Typography>
            </View>

            <ScrollView contentContainerClassName="p-6 pb-20" showsVerticalScrollIndicator={false}>
                {/* Email Display - Non-editable */}
                <View className="mb-8">
                    <View className="flex-row items-center mb-2 ml-1">
                        {/* <Sms size={18} color="#6B7280" variant="Bulk" /> */}
                        {/* <Typography variant="caption" color="gray" weight="bold" className="ml-2 uppercase tracking-tight">EMAIL ADDRESS</Typography> */}
                    </View>
                    <Surface variant="white" rounded="2xl" className={`p-4 justify-center ${!isDark ? 'border border-gray-100' : ''}`}>
                        <Typography variant="body" weight="semibold">
                            {user?.email || 'No email set'}
                        </Typography>
                    </Surface>
                    <TouchableOpacity
                        onPress={() => confirm({
                            title: 'Change Email',
                            message: 'Please contact us at support@needleafrica.com if you need to change your email address.',
                            confirmText: 'OK',
                            onConfirm: () => { }
                        })}
                        className="mt-2 ml-1"
                    >
                        <Typography variant="small" color="primary" className="underline">Need to change your email? Contact us</Typography>
                    </TouchableOpacity>
                </View>

                {/* Section: Profile Details */}
                <View className="mb-10">
                    <Typography variant="caption" color="gray" weight="bold" className="mb-6 uppercase tracking-widest ml-1">Profile Details</Typography>

                    <InputGroup
                        label="USERNAME"
                        value={username}
                        onChangeText={setUsername}
                        icon={<User size={18} color="#6B7280" variant="Bulk" />}
                        placeholder="Choose a unique username"
                    />

                    {/*   <InputGroup
                        label="FULL NAME"
                        value={fullName}
                        onChangeText={setFullName}
                        icon={<User size={18} color="#6B7280" variant="Bulk" />}
                        placeholder="Your full name"
                    /> */}

                    <InputGroup
                        label="BUSINESS NAME"
                        value={businessName}
                        onChangeText={setBusinessName}
                        icon={<Shop size={18} color="#6B7280" variant="Bulk" />}
                        placeholder="Your studio name"
                    />

                    <View className="h-6" />

                    <View className="mb-6">
                        <View className="flex-row items-center mb-2 ml-1">
                            <Call size={18} color="#6B7280" variant="Bulk" />
                            <Typography variant="caption" color="gray" weight="bold" className="ml-2 uppercase tracking-tight">PHONE (WHATSAPP PREFERRED)</Typography>
                        </View>
                        <Surface variant="muted" rounded="2xl" className={`px-4 border ${isDark ? 'border-border-dark' : 'border-gray-100'} h-16 justify-center`}>
                            <PhoneInput
                                style={{ flex: 1 }}
                                textComponent={TextInput}
                                textProps={{
                                    placeholder: "+234 800 000 0000",
                                    placeholderTextColor: "#9CA3AF",
                                    className: `font-semibold flex-1 ${isDark ? 'text-white' : 'text-dark'}`
                                }}
                                defaultCountry="NG"
                                value={phone}
                                onChange={(val) => setPhone(val || '')}
                            />
                        </Surface>
                    </View>

                    <InputGroup
                        label="WORKSHOP ADDRESS"
                        value={address}
                        onChangeText={setAddress}
                        icon={<Location size={18} color="#6B7280" variant="Bulk" />}
                        placeholder="Where do you create?"
                        multiline
                    />

                    {/* Country */}
                    <View className="mb-6">
                        <View className="flex-row items-center mb-2 ml-1">
                            <Location size={18} color="#6B7280" variant="Bulk" />
                            <Typography variant="caption" color="gray" weight="bold" className="ml-2 uppercase tracking-tight">COUNTRY - {country}</Typography>
                        </View>
                        <Surface variant="muted" rounded="2xl" className={`px-4 border ${isDark ? 'border-border-dark' : 'border-gray-100'} h-16 justify-center`}>
                            <View className="flex-row items-center h-full">
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
                                    containerButtonStyle={{ height: '100%', justifyContent: 'center' }}
                                />
                                {(!countryCode) && (
                                    <View style={{ position: 'absolute', left: 40, pointerEvents: 'none' }}>
                                        <Typography weight="semibold" className="text-dark dark:text-white opacity-80">{country}</Typography>
                                    </View>
                                )}
                            </View>
                        </Surface>
                    </View>

                    {/* Employees */}
                    <View className="mb-6">
                        <View className="flex-row items-center mb-2 ml-1">
                            <Typography variant="caption" color="gray" weight="bold" className="ml-2 uppercase tracking-tight">NUMBER OF EMPLOYEES</Typography>
                        </View>
                        <View className="flex-row flex-wrap mt-2">
                            {['1-5', '6-20', '21-50', '50+'].map((range) => (
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

                    <Button
                        onPress={handleSave}
                        isLoading={isSaving}
                        className="h-16 rounded-full bg-blue-600 border-0"
                        textClassName="text-white"
                    >
                        Save Changes
                    </Button>
                </View>

                {/* Section: Danger Zone */}
                <View className="mb-10">
                    <Typography variant="caption" color="red" weight="bold" className="mb-6 uppercase tracking-widest ml-1">Danger Zone</Typography>
                    <Pressable
                        onPress={handleDeleteAccount}
                        className={`flex-row items-center p-5 rounded-3xl border ${isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-100'}`}
                    >
                        <View className={`w-12 h-12 items-center justify-center rounded-2xl mr-4 ${isDark ? 'bg-red-500/20' : 'bg-white'}`}>
                            <Trash size={20} color="#EF4444" variant="Bulk" />
                        </View>
                        <View className="flex-1">
                            <Typography variant="body" weight="bold" color="red">Delete Account</Typography>
                            <Typography variant="small" color="red" className="opacity-70 mt-1">Permanently remove all your data</Typography>
                        </View>
                    </Pressable>
                </View>


            </ScrollView>

            {/* Delete Account Confirmation Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showDeleteModal}
                onRequestClose={() => setShowDeleteModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'android' ? -100 : 0} // Adjust 24 to match your header/nav height
                    style={{ flex: 1 }}
                >
                    <Pressable
                        className="flex-1 bg-black/50 justify-end"
                        onPress={() => setShowDeleteModal(false)}
                    >
                        <Pressable className={`rounded-t-3xl max-h-[90%] ${isDark ? 'bg-background-dark' : 'bg-white'}`}>
                            <ScrollView
                                className="p-6 pb-10"
                                bounces={false}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                            >
                                <View className="flex-row justify-between items-center mb-6">
                                    <View className="flex-row items-center">
                                        <Warning2 size={28} color="#EF4444" variant="Bulk" />
                                        <Typography variant="h3" weight="bold" color="red" className="ml-2">Delete Account</Typography>
                                    </View>
                                    <TouchableOpacity onPress={() => setShowDeleteModal(false)}>
                                        <CloseCircle size={28} color={isDark ? "#9CA3AF" : "#6B7280"} />
                                    </TouchableOpacity>
                                </View>

                                <View className={`rounded-2xl p-4 mb-6 border ${isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
                                    <Typography variant="body" weight="bold" color="red" className="mb-2">Warning: This action cannot be undone</Typography>
                                    <Typography variant="small" color="gray" className="leading-5">
                                        Deleting your account will permanently remove:
                                    </Typography>
                                    <View className="mt-3 ml-1">
                                        <Typography variant="small" color="gray" className="mb-1">• All your customer records</Typography>
                                        <Typography variant="small" color="gray" className="mb-1">• All order history and measurements</Typography>
                                        <Typography variant="small" color="gray" className="mb-1">• All invoices and payment data</Typography>
                                        <Typography variant="small" color="gray">• Your account and profile information</Typography>
                                    </View>
                                </View>

                                <Typography variant="body" weight="semibold" className="mb-3">
                                    To confirm deletion, type <Typography variant="body" weight="bold" color="red">DELETE</Typography> below:
                                </Typography>
                                <Surface variant="muted" rounded="2xl" className={`px-4 h-16 justify-center border ${isDark ? 'border-border-dark' : 'border-gray-200'} mb-6`}>
                                    <TextInput
                                        className={`font-semibold flex-1 ${isDark ? 'text-white' : 'text-dark'}`}
                                        placeholder="Type DELETE to confirm"
                                        placeholderTextColor="#9CA3AF"
                                        value={deleteConfirmationText}
                                        onChangeText={setDeleteConfirmationText}
                                        autoCapitalize="characters"
                                        autoCorrect={false}
                                    />
                                </Surface>

                                <Button
                                    onPress={confirmDeleteAccount}
                                    isLoading={isDeleting}
                                    disabled={deleteConfirmationText !== 'DELETE'}
                                    className={`h-16 rounded-full ${deleteConfirmationText === 'DELETE' ? 'bg-red-600' : 'bg-gray-300'}`}
                                    textClassName="text-white"
                                >
                                    Permanently Delete My Account
                                </Button>
                            </ScrollView>
                        </Pressable>
                    </Pressable>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

interface InputGroupProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    icon: React.ReactNode;
    placeholder: string;
    keyboardType?: any;
    autoCapitalize?: any;
    multiline?: boolean;
    editable?: boolean;
}

function InputGroup({ label, value, onChangeText, icon, placeholder, keyboardType, autoCapitalize, multiline, editable = true }: InputGroupProps) {
    const { isDark } = useTheme();
    return (
        <View className="mb-6">
            <View className="flex-row items-center mb-2 ml-1">
                {icon}
                <Typography variant="caption" color="gray" weight="bold" className="ml-2 uppercase tracking-tight">{label}</Typography>
            </View>
            <Surface variant="muted" rounded="2xl" className={`px-4 border ${isDark ? 'border-border-dark' : 'border-gray-100'} ${multiline ? 'py-4 min-h-[100px]' : 'h-16 justify-center'}`}>
                <TextInput
                    className={`font-semibold flex-1 ${isDark ? 'text-white' : 'text-dark'}`}
                    placeholder={placeholder}
                    placeholderTextColor="#9CA3AF"
                    value={value}
                    onChangeText={onChangeText}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    multiline={multiline}
                    textAlignVertical={multiline ? 'top' : 'center'}
                    editable={editable}
                    style={!editable ? { opacity: 0.6 } : {}}
                />
            </Surface>
        </View>
    );
}


