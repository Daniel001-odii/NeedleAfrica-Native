import React, { useState, useEffect } from 'react';
import { View, ScrollView, TextInput, Alert, TouchableOpacity, Pressable, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, User, Shop, Sms, Call, Location, Trash, Warning2, CloseCircle } from 'iconsax-react-native';
import { Typography } from '../../../components/ui/Typography';
import { Surface } from '../../../components/ui/Surface';
import { IconButton } from '../../../components/ui/IconButton';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../contexts/AuthContext';
import Toast from 'react-native-toast-message';

export default function PersonalInformation() {
    const { user, updateProfile, deleteAccount, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();

    const [username, setUsername] = useState(user?.username || '');
    const [businessName, setBusinessName] = useState(user?.businessName || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phoneNumber || '');
    const [address, setAddress] = useState(user?.address || '');
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
                address
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
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <View className="px-6 py-4 flex-row items-center border-b border-gray-50">
                <IconButton
                    icon={<ArrowLeft size={20} color="black" />}
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
                    <Surface variant="white" rounded="2xl" className=" justify-center border-gray-100">
                        <Typography variant="body" weight="semibold" className="text-dark">
                            {user?.email || 'No email set'}
                        </Typography>
                    </Surface>
                    <TouchableOpacity
                        onPress={() => Alert.alert(
                            'Change Email',
                            'Please contact us at support@needleafrica.com if you need to change your email address.',
                            [{ text: 'OK' }]
                        )}
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

                    <InputGroup
                        label="PHONE (WHATSAPP PREFERRED)"
                        value={phone}
                        onChangeText={setPhone}
                        icon={<Call size={18} color="#6B7280" variant="Bulk" />}
                        placeholder="+234 800 000 0000"
                        keyboardType="phone-pad"
                    />

                    <InputGroup
                        label="WORKSHOP ADDRESS"
                        value={address}
                        onChangeText={setAddress}
                        icon={<Location size={18} color="#6B7280" variant="Bulk" />}
                        placeholder="Where do you create?"
                        multiline
                    />
                    <Button
                        onPress={handleSave}
                        isLoading={isSaving}
                        className="h-16 rounded-full bg-dark border-0 shadow-lg"
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
                        className="flex-row items-center p-5 bg-red-50 rounded-3xl border border-red-100"
                    >
                        <View className="w-12 h-12 items-center justify-center bg-white rounded-2xl mr-4">
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
                    className="flex-1"
                >
                    <View className="flex-1 bg-black/50 justify-end">
                        <View className="bg-white rounded-t-3xl p-6 pb-10">
                            <View className="flex-row justify-between items-center mb-6">
                                <View className="flex-row items-center">
                                    <Warning2 size={28} color="#EF4444" variant="Bulk" />
                                    <Typography variant="h3" weight="bold" color="red" className="ml-2">Delete Account</Typography>
                                </View>
                                <TouchableOpacity onPress={() => setShowDeleteModal(false)}>
                                    <CloseCircle size={28} color="#6B7280" />
                                </TouchableOpacity>
                            </View>

                            <View className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
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
                                To confirm deletion, type <Typography variant="body" weight="bold" className="text-red-600">DELETE</Typography> below:
                            </Typography>
                            <Surface variant="white" rounded="2xl" className="px-4 h-16 justify-center border border-gray-200 mb-6">
                                <TextInput
                                    className="font-semibold text-dark flex-1"
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
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
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
    return (
        <View className="mb-6">
            <View className="flex-row items-center mb-2 ml-1">
                {icon}
                <Typography variant="caption" color="gray" weight="bold" className="ml-2 uppercase tracking-tight">{label}</Typography>
            </View>
            <Surface variant="muted" rounded="2xl" className={`px-4 border border-gray-100 ${multiline ? 'py-4 min-h-[100px]' : 'h-16 justify-center'}`}>
                <TextInput
                    className="font-semibold text-dark flex-1"
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


