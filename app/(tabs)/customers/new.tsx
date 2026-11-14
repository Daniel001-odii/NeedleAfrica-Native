import React, { useState } from 'react';
import { View, TextInput, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import { useCustomers } from '../../../hooks/useCustomers';
import { useResourceLimits } from '../../../hooks/useResourceLimits';
import { useSubscription } from '../../../hooks/useSubscription';
import { useSync } from '../../../hooks/useSync';
import { User, Call, InfoCircle, ArrowLeft, UserCirlceAdd, UserAdd, Ruler } from 'iconsax-react-native';
import { Typography } from '../../../components/ui/Typography';
import { SectionCard } from '../../../components/ui/SectionCard';
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
import { DocumentText, Add, CloseSquare, BookSquare } from 'iconsax-react-native';
import * as Contacts from 'expo-contacts/legacy';

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
    const [wantsMeasurements, setWantsMeasurements] = useState(false);

    const { addCustomer } = useCustomers();
    const { sync: performSync, isOnline } = useSync();
    const { canCreate } = useResourceLimits();
    const { confirm } = useConfirm();
    const router = useRouter();
    const { from } = useLocalSearchParams<{ from?: string }>();
    const posthog = usePostHog();
    const database = useDatabase();
    const { user } = useAuth();
    const { templates } = useMeasurementTemplates();

    const [selectedTemplate, setSelectedTemplate] = useState<MeasurementTemplate | null>(null);
    const [mTitle, setMTitle] = useState('');
    const [mValues, setMValues] = useState<Record<string, string>>({});
    const unit = user?.measurementUnit || 'inch';

    const handleImportContact = async () => {
        try {
            if (Platform.OS === 'android') {
                const { status } = await Contacts.requestPermissionsAsync();
                if (status !== 'granted') {
                    Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'Please grant contacts permission.' });
                    return;
                }
            }

            const contact = await Contacts.presentContactPickerAsync();
            posthog.capture('contact_imported');
            if (contact) {
                const name = contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(' ');

                let phone = '';
                if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
                    let rawPhone = contact.phoneNumbers[0].number || '';
                    rawPhone = rawPhone.replace(/[^\d+]/g, '');
                    if (rawPhone.startsWith('0')) {
                        phone = '+234' + rawPhone.substring(1);
                    } else if (rawPhone.length > 0 && !rawPhone.startsWith('+')) {
                        phone = '+' + rawPhone;
                    } else {
                        phone = rawPhone;
                    }
                }

                if (name) setFullName(name);
                if (phone) setPhoneNumber(phone);
            }
        } catch (error) {
            console.error('Error importing contact:', error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to import contact' });
        }
    };

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

        const isPro = user?.subscriptionPlan === 'PRO' || user?.subscriptionPlan === 'STUDIO_AI';
        if (!isPro) {
            const limitCheck = await canCreate('customers');
            if (!limitCheck.allowed) {
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

            posthog.capture('customer_created', { gender, has_phone: !!phoneNumber, from: from || 'direct' });
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
        }
    };

    return (
        <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'}`}>
            {/* Standard Refined Header */}
            <View className={`px-4 pt-2 pb-2 flex-row items-center justify-between ${isDark ? 'bg-black border-b border-white/5' : 'bg-white border-b border-gray-50'}`}>
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

                    {/* Personal Information Section */}
                    <SectionCard
                        icon={User}
                        title="Personal information"
                        rightElement={
                            <TouchableOpacity
                                onPress={handleImportContact}
                                className={`px-2.5 py-1 rounded-full flex-row items-center gap-1.5 ${isDark ? 'bg-blue-500/20' : 'bg-blue-500/10'}`}
                            >
                                <UserAdd size={13} color={isDark ? '#60a5fa' : '#2563eb'} variant="Bulk" />
                                <Typography variant="caption" className={isDark ? 'text-blue-400' : 'text-blue-600'} weight="bold">
                                    Add from contact
                                </Typography>
                            </TouchableOpacity>
                        }
                        className="mb-4"
                        innerClassName="p-0 overflow-hidden"
                    >
                        {/* Full Name */}
                        <View className={`flex-row items-center px-4 border-b ${isDark ? 'border-zinc-700/60' : 'border-gray-100'}`}>
                            <User size={18} color="#94a3b8" variant="Bulk" />
                            <TextInput
                                className={`flex-1 h-14 ml-3 font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}
                                placeholder="Full Name"
                                placeholderTextColor="#94a3b8"
                                value={fullName}
                                onChangeText={setFullName}
                            />
                        </View>

                        {/* Phone Number */}
                        <View className={`flex-row items-center px-4 border-b ${isDark ? 'border-zinc-700/60' : 'border-gray-100'}`}>
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

                        {/* Gender Segmented Control */}
                        <View className="p-3">
                            <View className={`p-1 rounded-full flex-row ${isDark ? 'bg-zinc-900' : 'bg-gray-100'}`}>
                                {['female', 'male', 'other'].map((g) => {
                                    const isActive = gender === g;
                                    return (
                                        <TouchableOpacity
                                            key={g}
                                            onPress={() => setGender(g)}
                                            className={`flex-1 py-2 rounded-full items-center ${isActive ? 'bg-brand-primary' : ''}`}
                                        >
                                            <Typography
                                                variant="small"
                                                weight={isActive ? "bold" : "medium"}
                                                className={`capitalize ${isActive ? 'text-white' : 'text-zinc-400'}`}
                                            >
                                                {g}
                                            </Typography>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    </SectionCard>

                    {/* Measurements Section */}
                    <SectionCard
                        icon={Ruler}
                        title="Measurements (optional)"
                        rightElement={
                            selectedTemplate ? (
                                <TouchableOpacity onPress={() => { setSelectedTemplate(null); setMValues({}); }}>
                                    <Typography variant="caption" color="red" weight="bold">Clear</Typography>
                                </TouchableOpacity>
                            ) : null
                        }
                        className="mb-4"
                        innerClassName="p-3"
                    >
                        {!selectedTemplate ? (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
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
                                        className={`px-5 py-3.5 rounded-xl items-center justify-center border ${isDark ? 'bg-zinc-800/80 border-zinc-700' : 'bg-gray-50 border-gray-200'}`}
                                    >
                                        <DocumentText size={18} color={isDark ? '#94a3b8' : '#64748b'} variant="Bulk" />
                                        <Typography variant="small" weight="bold" className="mt-1.5">{template.name}</Typography>
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity
                                    onPress={() => router.push('/measurement-templates/create')}
                                    className={`px-5 py-3.5 rounded-xl items-center justify-center border border-dashed ${isDark ? 'border-zinc-700' : 'border-gray-300'}`}
                                >
                                    <Add size={18} color="#94a3b8" />
                                    <Typography variant="small" color="gray" className="mt-1.5">New Template</Typography>
                                </TouchableOpacity>
                            </ScrollView>
                        ) : (
                            <View>
                                <View className="flex-row items-center mb-3">
                                    <DocumentText size={20} color="#3b82f6" variant="Bulk" />
                                    <TextInput
                                        className={`flex-1 ml-2 font-bold text-base ${isDark ? 'text-white' : 'text-zinc-900'}`}
                                        placeholder="Measurement Title"
                                        value={mTitle}
                                        onChangeText={setMTitle}
                                    />
                                </View>

                                <View className="flex-row flex-wrap gap-2.5">
                                    {selectedTemplate.fields.map((field: string) => (
                                        <View key={field} style={{ width: '48%' }} className={`p-2.5 rounded-xl border ${isDark ? 'bg-zinc-800/80 border-zinc-700' : 'bg-gray-50 border-gray-200'}`}>
                                            <Typography variant="caption" color="gray" weight="bold" className="mb-1 uppercase text-[10px]">{field} ({unit})</Typography>
                                            <TextInput
                                                className={`font-bold p-0 m-0 ${isDark ? 'text-white' : 'text-zinc-900'}`}
                                                placeholder="0"
                                                placeholderTextColor="#94a3b8"
                                                keyboardType="decimal-pad"
                                                value={mValues[field]}
                                                onChangeText={(val) => setMValues(prev => ({ ...prev, [field]: val }))}
                                            />
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </SectionCard>

                    {/* Notes Section */}
                    <SectionCard
                        icon={InfoCircle}
                        title="Additional notes"
                        className="mb-6"
                        innerClassName="p-4"
                    >
                        <TextInput
                            className={`min-h-[100px] font-medium p-0 m-0 ${isDark ? 'text-white' : 'text-zinc-800'}`}
                            placeholder="Any extra preferences or notes..."
                            placeholderTextColor="#94a3b8"
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            textAlignVertical="top"
                        />
                    </SectionCard>

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
                resource="customers"
                currentCount={limitModalData.currentCount}
                limit={limitModalData.limit}
            />
        </View>
    );
}