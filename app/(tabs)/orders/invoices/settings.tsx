import React, { useState, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, Image, Platform, KeyboardAvoidingView, TextInput, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Building, Call, Location, DocumentText, MagicStar, Brush, Eye, Crown, CloseCircle } from 'iconsax-react-native';
import { Modal } from 'react-native';
import { Typography } from '../../../../components/ui/Typography';
import { IconButton } from '../../../../components/ui/IconButton';
import { Button } from '../../../../components/ui/Button';
import { useAuth } from '../../../../contexts/AuthContext';
import { useTheme } from '../../../../contexts/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { WebView } from 'react-native-webview';
import { useSubscription } from '../../../../hooks/useSubscription';
import { ModernTemplate, ClassicTemplate, MinimalTemplate, CreativeTemplate, ElegantTemplate, BoldTemplate, CorporateTemplate } from '../../../../components/invoice-templates';

export default function InvoiceSettingsScreen() {
    const router = useRouter();
    const { user, updateProfile, uploadProfilePhoto, isActionLoading } = useAuth();
    const { isDark } = useTheme();
    const { isFree } = useSubscription();
    const { width: windowWidth } = useWindowDimensions();
    const [previewTemplate, setPreviewTemplate] = useState<any>(null);

    const previewPadding = 48; // p-6 on each side
    const previewScale = (windowWidth - previewPadding) / 800;

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
            if (form.profilePicture && form.profilePicture !== user?.profilePicture) {
                if (!form.profilePicture.startsWith('http')) {
                    await uploadProfilePhoto(form.profilePicture);
                }
            }
            const { profilePicture, ...restForm } = form;
            await updateProfile(restForm);

            Toast.show({ type: 'success', text1: 'Settings Saved' });
            router.back();
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Update Failed' });
        }
    };

    const mockData = useMemo(() => ({
        invoice: { invoiceNumber: '1023', amount: 2450, currency: '$' },
        customer: { fullName: 'Jane Cooper' },
        order: { styleName: 'Evening Gown' }
    }), []);

    return (
        <View className={`flex-1 ${isDark ? 'bg-zinc-950' : 'bg-gray-50'}`}>
            {/* Header */}
            <View className={`px-4 pt-2 pb-2 flex-row items-center justify-between ${isDark ? 'bg-zinc-950 border-b border-zinc-900' : 'bg-white border-b border-gray-50'}`}>
                <View className="flex-row items-center">
                    <IconButton
                        icon={<ArrowLeft size={22} color={isDark ? "white" : "black"} />}
                        onPress={() => router.back()}
                        variant="ghost"
                    />
                    <Typography variant="h3" weight="bold" className="ml-2">Invoice Setup</Typography>
                </View>
                <TouchableOpacity onPress={handleSave} disabled={isActionLoading}>
                    <Typography color="primary" weight="bold" className={isActionLoading ? 'opacity-50' : ''}>
                        {isActionLoading ? 'Saving...' : 'Done'}
                    </Typography>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView contentContainerClassName="p-5 pb-10" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                    {/* Branding Identity Section */}
                    <View className="items-center py-8">
                        <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8} className="relative">
                            <View className={`w-28 h-28 rounded-[40px] items-center justify-center overflow-hidden ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white shadow-sm shadow-gray-200'}`}>
                                {form.profilePicture ? (
                                    <Image source={{ uri: form.profilePicture }} className="w-full h-full" />
                                ) : (
                                    <Building size={48} color={isDark ? "#3f3f46" : "#e4e4e7"} variant="Bulk" />
                                )}
                            </View>
                            <View className="absolute -bottom-2 -right-2 bg-blue-600 w-10 h-10 rounded-full items-center justify-center border-4 border-gray-50 dark:border-zinc-950">
                                <Camera size={18} color="white" variant="Bold" />
                            </View>
                        </TouchableOpacity>
                        <Typography variant="body" weight="bold" className="mt-4">Business Identity</Typography>
                        <Typography variant="small" color="gray">This logo appears on your invoices</Typography>
                    </View>

                    {/* Business Info Group */}
                    <SectionLabel label="Business Details" isFirst />
                    <View className={`rounded-2xl overflow-hidden ${isDark ? 'bg-zinc-900' : 'bg-white shadow-sm shadow-gray-200'}`}>
                        <InputRow
                            label="Name"
                            icon={<Building size={18} color="#3b82f6" variant="Bulk" />}
                            value={form.businessName}
                            onChangeText={(t: string) => setForm({ ...form, businessName: t })}
                            placeholder="Your Workshop Name"
                        />
                        <InputRow
                            label="Contact"
                            icon={<Call size={18} color="#3b82f6" variant="Bulk" />}
                            value={form.phoneNumber}
                            onChangeText={(t: string) => setForm({ ...form, phoneNumber: t })}
                            placeholder="Phone Number"
                            keyboardType="phone-pad"
                        />
                        <InputRow
                            label="Address"
                            icon={<Location size={18} color="#3b82f6" variant="Bulk" />}
                            value={form.address}
                            onChangeText={(t: string) => setForm({ ...form, address: t })}
                            placeholder="Street, City, Country"
                            multiline
                            last
                        />
                    </View>

                    {/* Template Selection */}
                    <View className="flex-row items-center justify-between mt-8 mb-4 px-6">
                        <Typography variant="caption" color="gray" weight="bold" className="uppercase tracking-widest">
                            Invoice Template
                        </Typography>
                        <View className="flex-row items-center">
                            <Brush size={14} color="#3b82f6" />
                            <Typography variant="small" color="primary" className="ml-1 font-bold">Select Style</Typography>
                        </View>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                    >
                        {[
                            { id: 0, name: 'Modern', TemplateComp: ModernTemplate },
                            { id: 1, name: 'Classic', TemplateComp: ClassicTemplate },
                            { id: 2, name: 'Minimal', TemplateComp: MinimalTemplate },
                            { id: 3, name: 'Creative', TemplateComp: CreativeTemplate },
                            { id: 4, name: 'Elegant', TemplateComp: ElegantTemplate },
                            { id: 5, name: 'Bold', TemplateComp: BoldTemplate },
                            { id: 6, name: 'Corporate', TemplateComp: CorporateTemplate },
                        ].map((template) => {
                            const scale = 120 / 800;
                            const isActive = form.invoiceTemplate === template.id;
                            const isLocked = isFree && template.id > 2;
                            const rawHtml = template.TemplateComp({ user: user || {}, ...mockData });
                            const miniHtml = rawHtml.replace('</head>', `<style>@media screen { html { transform: scale(${scale}); transform-origin: top left; width: 800px; height: 1050px; overflow: hidden; } body { margin: 0; padding: 0; } }</style></head>`);

                            const handleSelect = () => {
                                if (isLocked) {
                                    Toast.show({
                                        type: 'info',
                                        text1: 'Premium Style',
                                        text2: 'Upgrade to Pro to use this template'
                                    });
                                    return;
                                }
                                setForm({ ...form, invoiceTemplate: template.id });
                            };

                            return (
                                <View key={template.id} className="items-center">
                                    <View className={`p-1 rounded-[24px] border-2 ${isActive ? 'border-blue-500' : 'border-transparent'}`}>
                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            onPress={handleSelect}
                                            className={`overflow-hidden rounded-[20px] bg-white border ${isDark ? 'border-zinc-800' : 'border-gray-100'} relative`}
                                            style={{ width: 120, height: 160 }}
                                        >
                                            <View pointerEvents="none" className="flex-1">
                                                <WebView source={{ html: miniHtml }} scrollEnabled={false} originWhitelist={['*']} />
                                            </View>

                                            {/* Preview Overlay Button */}
                                            <TouchableOpacity
                                                onPress={() => setPreviewTemplate(template)}
                                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 items-center justify-center backdrop-blur-md"
                                            >
                                                <Eye size={16} color="white" variant="Bold" />
                                            </TouchableOpacity>

                                            {/* Lock Badge */}
                                            {isLocked && (
                                                <View className="absolute inset-0 bg-black/5 items-center justify-center">
                                                    <View className="bg-yellow-400 px-2 py-0.5 rounded-full flex-row items-center border border-yellow-500/20">
                                                        <Crown size={10} color="black" variant="Bulk" />
                                                        <Typography variant="caption" weight="bold" className="text-[10px] ml-0.5 text-black">PRO</Typography>
                                                    </View>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                    <View className="flex-row items-center mt-2">
                                        <Typography variant="small" weight={isActive ? "bold" : "medium"} color={isActive ? "primary" : "gray"}>
                                            {template.name}
                                        </Typography>
                                        {isLocked && <Crown size={12} color="#EAB308" variant="Bulk" className="ml-1" />}
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>

                    {/* Full Preview Modal */}
                    <Modal
                        visible={!!previewTemplate}
                        animationType="slide"
                        transparent={true}
                        onRequestClose={() => setPreviewTemplate(null)}
                    >
                        <View className="flex-1 bg-black/80 justify-center p-6 pt-16 pb-12">
                            <View className={`rounded-3xl overflow-hidden ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white shadow-2xl'}`} style={{ maxHeight: '90%' }}>
                                <View className={`p-4 flex-row justify-between items-center ${isDark ? 'bg-zinc-900 border-b border-zinc-800' : 'bg-white border-b border-gray-100'}`}>
                                    <View>
                                        <Typography variant="h3" weight="bold">{previewTemplate?.name} Style</Typography>
                                        <Typography variant="caption" color="gray">Full Layout Preview</Typography>
                                    </View>
                                    <IconButton
                                        icon={<CloseCircle size={24} color={isDark ? "white" : "black"} />}
                                        onPress={() => setPreviewTemplate(null)}
                                        variant="ghost"
                                    />
                                </View>
                                <View className="bg-white overflow-hidden items-center justify-center p-0" style={{ height: 1050 * previewScale, width: '100%' }}>
                                    {previewTemplate && (
                                        <WebView
                                            source={{ 
                                                html: previewTemplate.TemplateComp({ user: user || {}, ...mockData })
                                                    .replace('</head>', `<style>@media screen { html { transform: scale(${previewScale}); transform-origin: top left; width: 800px; height: 1050px; overflow: hidden; } body { margin: 0; padding: 0; } }</style></head>`)
                                            }}
                                            originWhitelist={['*']}
                                            scrollEnabled={false}
                                            style={{ width: 800 * previewScale, height: 1050 * previewScale, backgroundColor: 'white' }}
                                        />
                                    )}
                                </View>
                                <View className={`p-4 ${isDark ? 'bg-zinc-900' : 'bg-white'} border-t ${isDark ? 'border-zinc-800' : 'border-gray-100'}`}>
                                    <Button
                                        onPress={() => {
                                            const templateId = previewTemplate.id;
                                            const isLocked = isFree && templateId > 2;
                                            if (isLocked) {
                                                Toast.show({ type: 'info', text1: 'Premium Style', text2: 'Upgrade to Pro to use this template' });
                                            } else {
                                                setForm({ ...form, invoiceTemplate: templateId });
                                                setPreviewTemplate(null);
                                            }
                                        }}
                                        className={`h-14 rounded-full ${isFree && previewTemplate?.id > 2 ? 'bg-yellow-400' : 'bg-blue-600'}`}
                                        textClassName={isFree && previewTemplate?.id > 2 ? 'text-black font-bold' : 'text-white font-bold'}
                                    >
                                        {isFree && previewTemplate?.id > 2 ? 'Upgrade to Use Style' : 'Choose this Style'}
                                    </Button>
                                </View>
                            </View>
                        </View>
                    </Modal>

                    {/* Info Note */}
                    <View className="mt-10 p-5 rounded-3xl bg-blue-500/10 flex-row">
                        <MagicStar size={20} color="#3b82f6" variant="Bulk" />
                        <View className="flex-1 ml-3">
                            <Typography variant="small" weight="bold" color="primary">Professional Touch</Typography>
                            <Typography variant="small" color="gray" className="mt-1 leading-4">
                                These details are printed on every invoice. A complete profile helps clients trust your workshop.
                            </Typography>
                        </View>
                    </View>

                    <View className="mt-8">
                        <Button
                            onPress={handleSave}
                            isLoading={isActionLoading}
                            className="h-16 rounded-full bg-blue-600 border-0"
                            textClassName="text-white font-bold"
                        >
                            Save Settings
                        </Button>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

/** 
 * Design-System Components
 */

function SectionLabel({ label, isFirst }: { label: string, isFirst?: boolean }) {
    return (
        <Typography variant="caption" color="gray" weight="bold" className={`${isFirst ? 'mt-2' : 'mt-8'} mb-2 ml-4 uppercase tracking-widest text-[11px]`}>
            {label}
        </Typography>
    );
}

interface InputRowProps {
    label: string;
    icon: React.ReactNode;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    last?: boolean;
    multiline?: boolean;
    keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'numeric' | 'email-address' | 'phone-pad';
}

function InputRow({ label, icon, value, onChangeText, placeholder, last, multiline, keyboardType = "default" }: InputRowProps) {
    const { isDark } = useTheme();
    return (
        <View className={`flex-row items-center px-4 ${multiline ? 'py-4 min-h-[64px]' : 'h-16'}`}>
            <View className={`w-9 h-9 items-center justify-center rounded-xl mr-3 ${isDark ? 'bg-zinc-800' : 'bg-gray-50'}`}>
                {icon}
            </View>
            <View className="flex-1">
                <Typography variant="caption" color="gray" weight="bold" className="mb-0.5">{label.toUpperCase()}</Typography>
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#9CA3AF"
                    keyboardType={keyboardType}
                    multiline={multiline}
                    className={`font-semibold text-[15px] p-0 m-0 ${isDark ? 'text-white' : 'text-zinc-900'}`}
                />
            </View>
            {!last && <View className={`absolute bottom-0 right-0 left-16 h-[1px] ${isDark ? 'bg-zinc-800' : 'bg-gray-50'}`} />}
        </View>
    );
}