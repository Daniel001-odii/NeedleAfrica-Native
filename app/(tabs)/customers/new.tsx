import React, { useState } from 'react';
import { View, TextInput, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import { useCustomers } from '../../../hooks/useCustomers';
import { useResourceLimits } from '../../../hooks/useResourceLimits';
import { useSubscription } from '../../../hooks/useSubscription';
import { useSync } from '../../../hooks/useSync';
import { User, Call, InfoCircle, ArrowLeft } from 'iconsax-react-native';
import { Typography } from '../../../components/ui/Typography';
import { Surface } from '../../../components/ui/Surface';
import { Button } from '../../../components/ui/Button';
import { IconButton } from '../../../components/ui/IconButton';
import Toast from 'react-native-toast-message';
import { ResourceLimitModal } from '../../../components/ResourceLimitModal';
import { useConfirm } from '../../../contexts/ConfirmContext';
import { useTheme } from '../../../contexts/ThemeContext';
import PhoneInput from 'react-phone-number-input/react-native-input';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import { useAuth } from '../../../contexts/AuthContext';
import { useMeasurementTemplates, MeasurementTemplate } from '../../../hooks/useMeasurementTemplates';
import Measurement from '../../../database/watermelon/models/Measurement';
import { DocumentText, Add, CloseSquare } from 'iconsax-react-native';

export default function NewCustomer() {
    const { isDark } = useTheme();
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [gender, setGender] = useState('female');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [limitModalData, setLimitModalData] = useState({
        allowed: true,
        currentCount: 0,
        limit: 10,
        message: '',
        isAtLimit: false,
        isNearLimit: false,
    });
    const [proceedAnyway, setProceedAnyway] = useState(false);
    const [wantsMeasurements, setWantsMeasurements] = useState(false);

    const { addCustomer } = useCustomers();
    const { sync: performSync, isOnline } = useSync();
    const { canCreate } = useResourceLimits();
    const { confirm } = useConfirm();
    const { isFree } = useSubscription();
    const router = useRouter();
    const posthog = usePostHog();
    const database = useDatabase();
    const { user } = useAuth();
    const { templates } = useMeasurementTemplates();

    const [selectedTemplate, setSelectedTemplate] = useState<MeasurementTemplate | null>(null);
    const [mTitle, setMTitle] = useState('');
    const [mValues, setMValues] = useState<Record<string, string>>({});
    const unit = user?.measurementUnit || 'inch';

    const handleSubmit = async (addMeasurementsFlag?: boolean | any) => {
        const _wantsMeasurements = typeof addMeasurementsFlag === 'boolean' ? addMeasurementsFlag : wantsMeasurements;
        setWantsMeasurements(_wantsMeasurements);

        if (!fullName.trim()) {
            confirm({
                title: 'Required Field',
                message: 'Please enter the customer\'s full name.',
                confirmText: 'OK',
                onConfirm: () => { }
            });
            return;
        }

        if (isFree) {
            const limitCheck = canCreate('customers');
            if (!limitCheck.allowed && !proceedAnyway) {
                setLimitModalData(limitCheck);
                setShowLimitModal(true);
                return;
            }
        }

        try {
            setIsSubmitting(true);
            const customer = await addCustomer({ fullName, phoneNumber, gender, notes });
            
            // Save measurements if template selected
            if (selectedTemplate && customer?.id && user?.id) {
                const hasValues = Object.values(mValues).some(v => v.trim().length > 0);
                if (hasValues) {
                    await Measurement.createSyncable(database, user.id, customer.id, {
                        title: mTitle || selectedTemplate.name || 'Initial Measurements',
                        values: mValues
                    });
                    posthog.capture('measurement_captured', { 
                        context: 'customer_creation',
                        template_name: selectedTemplate.name || 'Unknown'
                    });
                }
            }

            posthog.capture('customer_created', { gender, has_phone: !!phoneNumber });
            performSync().catch(console.error);
            Toast.show({ type: 'success', text1: 'Saved', text2: 'Customer and measurements added' });
            
            router.replace('/(tabs)/customers/');
        } catch (error) {
            confirm({ 
                title: 'Error', 
                message: 'Failed to save customer', 
                confirmText: 'OK', 
                onConfirm: () => { } 
            });
        } finally {
            setIsSubmitting(false);
            setProceedAnyway(false); // reset state after submission
        }
    };

    const SectionLabel = ({ children }: { children: string }) => (
        <Typography variant="caption" color="gray" weight="bold" className="uppercase ml-4 mb-2 tracking-widest opacity-60">
            {children}
        </Typography>
    );

    return (
        <View className={`flex-1 ${isDark ? 'bg-zinc-950' : 'bg-gray-50'}`}>
            {/* Standard Refined Header */}
            <View className={`px-4 pt-2 pb-2 flex-row items-center justify-between ${isDark ? 'bg-zinc-950 border-b border-white/5' : 'bg-white border-b border-gray-50'}`}>
                <View className="flex-row items-center">
                    <IconButton
                        icon={<ArrowLeft size={22} color={isDark ? 'white' : 'black'} />}
                        onPress={() => router.back()}
                        variant="ghost"
                    />
                    <Typography variant="h3" weight="bold" className="ml-2">New Customer</Typography>
                </View>
                <TouchableOpacity onPress={() => handleSubmit(false)} disabled={isSubmitting}>
                    <Typography color="primary" weight="bold" className={isSubmitting ? 'opacity-50' : ''}>
                        {isSubmitting ? '...' : 'Create'}
                    </Typography>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView contentContainerClassName="py-6 px-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                    {/* Basic Info Section */}
                    <SectionLabel>Personal Information</SectionLabel>
                    <Surface variant="white" rounded="2xl" className="mb-6 overflow-hidden">
                        <View className={`flex-row items-center px-4 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-50'}`}>
                            <User size={18} color="#94a3b8" variant="Bulk" />
                            <TextInput
                                className={`flex-1 h-14 ml-3 font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}
                                placeholder="Full Name"
                                placeholderTextColor="#94a3b8"
                                value={fullName}
                                onChangeText={setFullName}
                            />
                        </View>
                        <View className="flex-row items-center px-4">
                            <Call size={18} color="#94a3b8" variant="Bulk" />
                            <View className="flex-1 ml-3 h-14 justify-center">
                                <PhoneInput
                                    style={{ color: isDark ? 'white' : 'black', fontWeight: '600' }}
                                    placeholder="Phone Number"
                                    placeholderTextColor="#94a3b8"
                                    defaultCountry="NG"
                                    value={phoneNumber}
                                    onChange={(val) => setPhoneNumber(val || '')}
                                />
                            </View>
                        </View>
                    </Surface>

                    {/* Gender Section (Segmented Control Style) */}
                    <SectionLabel>Gender</SectionLabel>
                    <Surface variant="white" rounded="2xl" className="p-1 mb-6 flex-row">
                        {['female', 'male', 'other'].map((g) => {
                            const isActive = gender === g;
                            return (
                                <TouchableOpacity
                                    key={g}
                                    onPress={() => setGender(g)}
                                    className={`flex-1 py-2.5 rounded-xl items-center ${isActive ? (isDark ? 'bg-zinc-700' : 'bg-white shadow-sm border border-zinc-100') : ''}`}
                                >
                                    <Typography
                                        variant="small"
                                        weight={isActive ? "bold" : "medium"}
                                        className={`capitalize ${isActive ? (isDark ? 'text-white' : 'text-brand-primary') : 'text-zinc-400'}`}
                                    >
                                        {g}
                                    </Typography>
                                </TouchableOpacity>
                            );
                        })}
                    </Surface>

                    {/* Measurements Section */}
                    <View className="flex-row items-center justify-between ml-4 mb-2 pr-4">
                        <Typography variant="caption" color="gray" weight="bold" className="uppercase tracking-widest opacity-60">
                            Measurements (Optional)
                        </Typography>
                        {selectedTemplate && (
                            <TouchableOpacity onPress={() => { setSelectedTemplate(null); setMValues({}); }}>
                                <Typography variant="caption" color="red" weight="bold">Clear</Typography>
                            </TouchableOpacity>
                        )}
                    </View>

                    {!selectedTemplate ? (
                        <Surface variant="white" rounded="2xl" className="mb-6 p-1">
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="p-1">
                                {templates.map((template) => (
                                    <TouchableOpacity
                                        key={template.id}
                                        onPress={() => {
                                            setSelectedTemplate(template);
                                            setMTitle(template.name || '');
                                            const initialValues: Record<string, string> = {};
                                            template.fields.forEach((f: string) => initialValues[f] = '');
                                            setMValues(initialValues);
                                        }}
                                        className={`mr-2 px-6 py-4 rounded-xl items-center justify-center border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-50 border-gray-100'}`}
                                    >
                                        <DocumentText size={18} color={isDark ? '#94a3b8' : '#64748b'} variant="Bulk" />
                                        <Typography variant="small" weight="bold" className="mt-2">{template.name}</Typography>
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity
                                    onPress={() => router.push('/measurement-templates/create')}
                                    className={`px-6 py-4 rounded-xl items-center justify-center border border-dashed ${isDark ? 'border-zinc-800' : 'border-gray-200'}`}
                                >
                                    <Add size={18} color="#94a3b8" />
                                    <Typography variant="small" color="gray" className="mt-2">New Template</Typography>
                                </TouchableOpacity>
                            </ScrollView>
                        </Surface>
                    ) : (
                        <Surface variant="white" rounded="2xl" className="p-4 mb-6">
                            <View className="flex-row items-center mb-4">
                                <DocumentText size={20} color="#3b82f6" variant="Bulk" />
                                <TextInput
                                    className={`flex-1 ml-3 font-bold text-lg ${isDark ? 'text-white' : 'text-zinc-900'}`}
                                    placeholder="Measurement Title"
                                    value={mTitle}
                                    onChangeText={setMTitle}
                                />
                            </View>
                            
                            <View className="flex-row flex-wrap gap-3">
                                {selectedTemplate.fields.map((field: string) => (
                                    <View key={field} style={{ width: '47%' }} className={`p-3 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-50 border-zinc-100'}`}>
                                        <Typography variant="caption" color="gray" weight="bold" className="mb-1 uppercase text-[10px]">{field} ({unit})</Typography>
                                        <TextInput
                                            className={`font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}
                                            placeholder="0"
                                            placeholderTextColor="#94a3b8"
                                            keyboardType="numeric"
                                            value={mValues[field]}
                                            onChangeText={(val) => setMValues(prev => ({ ...prev, [field]: val }))}
                                        />
                                    </View>
                                ))}
                            </View>
                        </Surface>
                    )}

                    {/* Notes Section */}
                    <SectionLabel>Notes</SectionLabel>
                    <Surface variant="white" rounded="2xl" className="p-4 mb-8">
                        <View className="flex-row items-start">
                            <InfoCircle size={18} color="#94a3b8" variant="Bulk" className="mt-1" />
                            <TextInput
                                className={`flex-1 ml-3 min-h-[120px] font-medium ${isDark ? 'text-white' : 'text-zinc-800'}`}
                                placeholder="Any extra preferences..."
                                placeholderTextColor="#94a3b8"
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>
                    </Surface>

                    {/* Primary Action Button (Standard Bottom Placement) */}
                    <Button
                        onPress={() => handleSubmit(false)}
                        isLoading={isSubmitting}
                        disabled={isSubmitting}
                        style={{ borderWidth: 0 }}
                        className="h-16 rounded-full shadow-none bg-blue-500 border-none mt-4"
                        textClassName="font-bold text-white text-lg"
                    >
                        Save Customer
                    </Button>
                </ScrollView>
            </KeyboardAvoidingView>

            <ResourceLimitModal
                visible={showLimitModal}
                onClose={() => setShowLimitModal(false)}
                onUpgrade={() => {
                    setShowLimitModal(false);
                    router.push('/(tabs)/profile/subscription');
                }}
                onContinueAnyway={() => {
                    setShowLimitModal(false);
                    setProceedAnyway(true);
                    setTimeout(() => handleSubmit(wantsMeasurements), 100);
                }}
                resource="customers"
                currentCount={limitModalData.currentCount}
                limit={limitModalData.limit}
                isOffline={!isOnline}
            />
        </View>
    );
}