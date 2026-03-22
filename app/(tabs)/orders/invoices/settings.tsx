import React, { useState, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, Image, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Building, Call, Location, DocumentText } from 'iconsax-react-native';
import { Typography } from '../../../../components/ui/Typography';
import { Surface } from '../../../../components/ui/Surface';
import { IconButton } from '../../../../components/ui/IconButton';
import { Button } from '../../../../components/ui/Button';
import { useAuth } from '../../../../contexts/AuthContext';
import { useTheme } from '../../../../contexts/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import { TextInput } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { WebView } from 'react-native-webview';
import { ModernTemplate, ClassicTemplate, MinimalTemplate, CreativeTemplate, ElegantTemplate, BoldTemplate, CorporateTemplate } from '../../../../components/invoice-templates';

export default function InvoiceSettingsScreen() {
    const router = useRouter();
    const { user, updateProfile, uploadProfilePhoto, isActionLoading } = useAuth();
    const { isDark } = useTheme();

    const [form, setForm] = useState({
        businessName: user?.businessName || '',
        phoneNumber: user?.phoneNumber || '',
        address: user?.address || '',
        profilePicture: user?.profilePicture || '',
        invoiceTemplate: user?.invoiceTemplate || 0,
    });

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setForm({ ...form, profilePicture: result.assets[0].uri });
        }
    };

    const handleSave = async () => {
        try {
            // Check if there's a new local image to upload
            if (form.profilePicture && form.profilePicture !== user?.profilePicture) {
                // Determine if it's a local file (usually starts with file:// or contains an asset url)
                if (!form.profilePicture.startsWith('http')) {
                    await uploadProfilePhoto(form.profilePicture);
                }
            }

            // Exclude profilePicture from the standard updateProfile payload
            // since the upload endpoint handles saving the resulting URL to the DB.
            const { profilePicture, ...restForm } = form;
            await updateProfile(restForm);
            
            Toast.show({
                type: 'success',
                text1: 'Settings Saved',
                text2: 'Your invoice details have been updated.',
            });
            router.back();
        } catch (error) {
            console.error(error);
            Toast.show({
                type: 'error',
                text1: 'Update Failed',
                text2: 'Could not save your changes. Please try again.',
            });
        }
    };

    const mockData = useMemo(() => ({
        invoice: { invoiceNumber: '1023', amount: 2450, currency: '$' },
        customer: { fullName: 'Jane Cooper' },
        order: { styleName: 'Brand Strategy' }
    }), []);

    return (
        <View className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-white'}`}>
            <View className={`px-6 py-4 flex-row items-center border-b ${isDark ? 'border-border-dark' : 'border-gray-50'}`}>
                <IconButton
                    icon={<ArrowLeft size={20} color={isDark ? "white" : "black"} />}
                    onPress={() => router.back()}
                    variant="ghost"
                    className="-ml-2"
                />
                <Typography variant="h3" weight="bold" className="ml-2">Invoice Settings</Typography>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView contentContainerClassName="p-6 pb-32" showsVerticalScrollIndicator={false}>

                    {/* Branding Section */}
                    <Typography variant="body" weight="bold" className="mb-4">Business Brading</Typography>
                    <View className="items-center mb-8">
                        <TouchableOpacity onPress={handlePickImage} className="relative">
                            <Surface variant="muted" className="w-24 h-24 items-center justify-center overflow-hidden" rounded="full">
                                {form.profilePicture ? (
                                    <Image source={{ uri: form.profilePicture }} className="w-full h-full" />
                                ) : (
                                    <Building size={40} color={isDark ? "#9CA3AF" : "#6B7280"} />
                                )}
                            </Surface>
                            <View className="absolute bottom-0 right-0 bg-blue-500 w-8 h-8 rounded-full items-center justify-center border-2 border-white">
                                <Camera size={16} color="white" variant="Bold" />
                            </View>
                        </TouchableOpacity>
                        <Typography variant="caption" color="gray" className="mt-2">Tap to change logo</Typography>
                    </View>

                    {/* Form Fields */}
                    <View className="gap-y-6">
                        <View>
                            <Typography variant="small" weight="bold" className="mb-2 ml-1">Business Name</Typography>
                            <Surface variant="muted" className={`flex-row items-center px-4 h-14 border ${isDark ? 'border-border-dark' : 'border-gray-100'}`} rounded="xl">
                                <Building size={20} color={isDark ? "#9CA3AF" : "#6B7280"} variant="Bulk" className="mr-3" />
                                <TextInput
                                    className={`flex-1 ${isDark ? 'text-white' : 'text-black'}`}
                                    placeholder="Enter business name"
                                    placeholderTextColor="#9CA3AF"
                                    value={form.businessName}
                                    onChangeText={(text) => setForm({ ...form, businessName: text })}
                                />
                            </Surface>
                        </View>

                        <View>
                            <Typography variant="small" weight="bold" className="mb-2 ml-1">Phone Number</Typography>
                            <Surface variant="muted" className={`flex-row items-center px-4 h-14 border ${isDark ? 'border-border-dark' : 'border-gray-100'}`} rounded="xl">
                                <Call size={20} color={isDark ? "#9CA3AF" : "#6B7280"} variant="Bulk" className="mr-3" />
                                <TextInput
                                    className={`flex-1 ${isDark ? 'text-white' : 'text-black'}`}
                                    placeholder="Enter phone number"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="phone-pad"
                                    value={form.phoneNumber}
                                    onChangeText={(text) => setForm({ ...form, phoneNumber: text })}
                                />
                            </Surface>
                        </View>

                        <View>
                            <Typography variant="small" weight="bold" className="mb-2 ml-1">Address</Typography>
                            <Surface variant="muted" className={`flex-row items-start px-4 py-3 h-24 border ${isDark ? 'border-border-dark' : 'border-gray-100'}`} rounded="xl">
                                <Location size={20} color={isDark ? "#9CA3AF" : "#6B7280"} variant="Bulk" className="mr-3 mt-1" />
                                <TextInput
                                    className={`flex-1 ${isDark ? 'text-white' : 'text-black'}`}
                                    placeholder="Enter business address"
                                    placeholderTextColor="#9CA3AF"
                                    multiline
                                    numberOfLines={3}
                                    value={form.address}
                                    onChangeText={(text) => setForm({ ...form, address: text })}
                                />
                            </Surface>
                        </View>
                    </View>

                    {/* Invoice Template Selection */}
                    <Typography variant="body" weight="bold" className="mb-4 mt-8">Invoice Template Formats</Typography>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false} 
                        className="mb-8" 
                        contentContainerStyle={{ gap: 16, paddingRight: 24, paddingBottom: 10 }}
                    >
                        {[
                            { id: 0, TemplateComp: ModernTemplate },
                            { id: 1, TemplateComp: ClassicTemplate },
                            { id: 2, TemplateComp: MinimalTemplate },
                            { id: 3, TemplateComp: CreativeTemplate },
                            { id: 4, TemplateComp: ElegantTemplate },
                            { id: 5, TemplateComp: BoldTemplate },
                            { id: 6, TemplateComp: CorporateTemplate },
                        ].map((template) => {
                            const scale = 100 / 800; // 100px width thumbnail layout
                            const rawHtml = template.TemplateComp({ user: user || {}, ...mockData });
                            // Inject CSS scaling for mini-thumbnail view!
                            const miniHtml = rawHtml.replace('</head>', `
                                <style>
                                    @media screen {
                                        html { transform: scale(${scale}); transform-origin: top left; width: 800px; height: 1050px; overflow: hidden; }
                                        body { margin: 0; padding: 0; }
                                    }
                                </style>
                            </head>`);

                            const isActive = form.invoiceTemplate === template.id;

                            return (
                                <TouchableOpacity
                                    key={template.id}
                                    onPress={() => setForm({ ...form, invoiceTemplate: template.id })}
                                    className={`p-1 rounded-2xl border-2 ${
                                        isActive
                                            ? 'border-blue-500 bg-blue-50'
                                            : isDark ? 'border-border-dark bg-gray-800' : 'border-gray-200 bg-white'
                                    }`}
                                >
                                    <View pointerEvents="none" className="overflow-hidden rounded-xl bg-white" style={{ width: 100, height: 131 }}>
                                        <WebView
                                            source={{ html: miniHtml }}
                                            style={{ backgroundColor: 'white' }}
                                            scrollEnabled={false}
                                            showsVerticalScrollIndicator={false}
                                            originWhitelist={['*']}
                                        />
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* Info Surface */}
                    <Surface variant={isDark ? "muted" : "blue"} className="mt-8 p-4 border border-blue-500/10" rounded="2xl">
                        <View className="flex-row items-center mb-2">
                            <DocumentText size={20} color="#3B82F6" variant="Bulk" />
                            <Typography variant="body" weight="bold" className="ml-2">Invoice Preview</Typography>
                        </View>
                        <Typography variant="small" color="gray" className="leading-5">
                            This information will appear at the header of all digital invoices generated. Ensure your contact details are accurate so clients can reach you.
                        </Typography>
                    </Surface>

                    <Button
                        onPress={handleSave}
                        isLoading={isActionLoading}
                        variant="blue"
                        style={{ borderWidth: 0 }}
                        className="h-14 rounded-full border-none shadow-none mt-8 mb-6"
                    >
                        <View className="flex-row items-center">
                            <Typography weight="bold" color="white">Save Customisations</Typography>
                        </View>
                    </Button>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
