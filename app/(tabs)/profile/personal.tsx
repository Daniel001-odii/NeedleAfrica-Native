import React, { useState } from 'react';
import { View, ScrollView, TextInput, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, User, Shop, Sms, Call, Location, Trash } from 'iconsax-react-native';
import { Typography } from '../../../components/ui/Typography';
import { Surface } from '../../../components/ui/Surface';
import { IconButton } from '../../../components/ui/IconButton';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../contexts/AuthContext';

export default function PersonalInformation() {
    const { user } = useAuth();
    const router = useRouter();

    const [username, setUsername] = useState('janedoe_tailor');
    const [fullName, setFullName] = useState(user?.name || '');
    const [businessName, setBusinessName] = useState('Needle Africa Studio');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState('08012345678');
    const [address, setAddress] = useState('123 Fashion Lane, Lagos, Nigeria');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSaving(false);
        Alert.alert('Success', 'Profile updated successfully');
        router.back();
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action is irreversible.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => console.log('Delete Account') }
            ]
        );
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
                        label="EMAIL ADDRESS"
                        value={email}
                        onChangeText={setEmail}
                        icon={<Sms size={18} color="#6B7280" variant="Bulk" />}
                        placeholder="email@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <InputGroup
                        label="PHONE (WHATSAPP)"
                        value={phone}
                        onChangeText={setPhone}
                        icon={<Call size={18} color="#6B7280" variant="Bulk" />}
                        placeholder="Phone number"
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
}

function InputGroup({ label, value, onChangeText, icon, placeholder, keyboardType, autoCapitalize, multiline }: InputGroupProps) {
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
                />
            </Surface>
        </View>
    );
}

import { Pressable } from 'react-native';

