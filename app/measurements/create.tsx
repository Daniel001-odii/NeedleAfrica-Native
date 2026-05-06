import React, { useState, useEffect, useMemo } from 'react';
import { View, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import { Typography } from '../../components/ui/Typography';
import { Surface } from '../../components/ui/Surface';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { Ruler, ArrowLeft, DocumentText, SearchNormal1, User as UserIcon, TickCircle, ArrowDown2 } from 'iconsax-react-native';
import { TypingText } from '../../components/ui/TypingText';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useCustomers } from '../../hooks/useCustomers';
import { useCustomerMeasurements } from '../../hooks/useMeasurement';
import { useMeasurementTemplates, MeasurementTemplate } from '../../hooks/useMeasurementTemplates';
import { useConfirm } from '../../contexts/ConfirmContext';
import Toast from 'react-native-toast-message';

export default function CreateMeasurementScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { initialCustomerId, customerId } = useLocalSearchParams<{ initialCustomerId: string, customerId: string }>();
    const effectiveCustomerId = customerId || initialCustomerId;
    const { customers, loading: loadingCustomers } = useCustomers();
    const { confirm } = useConfirm();
    const { isDark } = useTheme();
    const posthog = usePostHog();

    const [selectedCustomerId, setSelectedCustomerId] = useState(effectiveCustomerId || '');
    const { addMeasurement } = useCustomerMeasurements(selectedCustomerId);
    const { templates, loading: templatesLoading } = useMeasurementTemplates();

    const unit = user?.measurementUnit || 'inch';

    const [selectedTemplate, setSelectedTemplate] = useState<MeasurementTemplate | null>(null);
    const [title, setTitle] = useState('');
    const [values, setValues] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCustomers = useMemo(() => {
        return customers.filter(c =>
            (c.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.phoneNumber?.includes(searchQuery)
        );
    }, [customers, searchQuery]);

    const selectedCustomer = useMemo(() => {
        return customers.find(c => c.id === selectedCustomerId);
    }, [customers, selectedCustomerId]);

    useEffect(() => {
        if (selectedTemplate) {
            setTitle(selectedTemplate.name || '');
            const initialValues: Record<string, string> = {};
            selectedTemplate.fields.forEach((field: string) => {
                initialValues[field] = '';
            });
            setValues(initialValues);
        }
    }, [selectedTemplate]);

    const handleValueChange = (field: string, text: string) => {
        setValues(prev => ({ ...prev, [field]: text }));
    };

    const handleSave = async () => {
        if (!selectedCustomerId) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Please select a customer' });
            return;
        }

        if (!title.trim()) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter a title' });
            return;
        }

        const hasValues = Object.values(values).some(v => v.trim().length > 0);
        if (!hasValues) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter at least one measurement' });
            return;
        }

        setSubmitting(true);
        try {
            await addMeasurement(title, values);

            posthog.capture('measurement_captured', {
                template_name: selectedTemplate?.name || 'Manual',
                field_count: Object.keys(values).length,
                unit: unit
            });
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Measurement saved successfully'
            });
            router.back();
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to save measurement' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-[#F2F2F7]'}`}>
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className={`px-6 pt-2 pb-2 ${isDark ? 'bg-background-dark' : 'bg-[#F2F2F7]'}`}>
                    <IconButton
                        icon={<ArrowLeft size={24} color={isDark ? "white" : "#1F2937"} />}
                        onPress={() => router.back()}
                        variant="ghost"
                        className="-ml-4"
                    />
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1"
                >
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerClassName="p-6 pb-20"
                        keyboardShouldPersistTaps="handled"
                    >
                        <View className="mb-10 mt-2">
                            <TypingText
                                variant="h1"
                                weight="bold"
                                className={`mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
                                text="New Measurement"
                                speed={30}
                            />
                            <Typography color="gray" variant="subtitle" className="leading-5">
                                Record and save specific measurements for your clients.
                            </Typography>
                        </View>

                        {/* Section 1: Customer Selection */}
                        <View className="mb-8">
                            <Typography variant="caption" color="gray" weight="bold" className="ml-4 mb-2 uppercase tracking-wider text-[11px]">
                                Customer Selection
                            </Typography>

                            {!selectedCustomerId ? (
                                <View>
                                    <Surface variant="muted" rounded="2xl" className={`flex-row items-center px-4 h-14 mb-4 border ${isDark ? 'border-border-dark bg-surface-muted-dark' : 'border-gray-100 bg-white'}`}>
                                        <SearchNormal1 size={18} color={isDark ? "#9CA3AF" : "#6B7280"} />
                                        <TextInput
                                            className={`ml-3 flex-1 font-semibold ${isDark ? 'text-white' : 'text-dark'}`}
                                            placeholder="Search customers..."
                                            placeholderTextColor="#9CA3AF"
                                            value={searchQuery}
                                            onChangeText={setSearchQuery}
                                        />
                                    </Surface>
                                    {loadingCustomers ? (
                                        <ActivityIndicator color="#6366f1" />
                                    ) : (
                                        <View className={`rounded-[24px] overflow-hidden border ${isDark ? 'bg-surface-dark border-border-dark' : 'bg-white border-gray-100 shadow-sm'}`}>
                                            {filteredCustomers.slice(0, 5).map((customer, index) => (
                                                <TouchableOpacity
                                                    key={customer.id}
                                                    onPress={() => setSelectedCustomerId(customer.id)}
                                                    className={`flex-row items-center p-4 ${index < filteredCustomers.slice(0, 5).length - 1 ? (isDark ? 'border-b border-white/5' : 'border-b border-gray-50') : ''} ${isDark ? 'active:bg-white/5' : 'active:bg-gray-50'}`}
                                                >
                                                    <Surface variant="lavender" className={`w-10 h-10 items-center justify-center mr-3 ${isDark ? 'bg-indigo-900/40' : 'bg-soft-lavender'}`} rounded="full">
                                                        <Typography variant="small" weight="bold" className={isDark ? 'text-indigo-300' : 'text-brand-primary'}>
                                                            {(customer.fullName || 'U').charAt(0).toUpperCase()}
                                                        </Typography>
                                                    </Surface>
                                                    <View className="flex-1">
                                                        <Typography weight="bold" className={isDark ? 'text-white' : 'text-gray-900'}>{customer.fullName}</Typography>
                                                        <Typography variant="caption" color="gray">{customer.phoneNumber || 'No phone'}</Typography>
                                                    </View>
                                                </TouchableOpacity>
                                            ))}
                                            {filteredCustomers.length === 0 && (
                                                <View className="p-8 items-center">
                                                    <Typography color="gray">No customers found</Typography>
                                                </View>
                                            )}
                                        </View>
                                    )}
                                </View>
                            ) : (
                                <Surface variant="lavender" className={`p-4 flex-row items-center justify-between ${isDark ? 'bg-indigo-900/40' : 'bg-soft-lavender'}`} rounded="2xl">
                                    <View className="flex-row items-center">
                                        <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isDark ? 'bg-white/10' : 'bg-white'}`}>
                                            <UserIcon size={20} color={isDark ? "white" : "#6366f1"} variant="Bulk" />
                                        </View>
                                        <View>
                                            <Typography weight="bold" className={isDark ? 'text-white' : 'text-gray-900'}>{selectedCustomer?.fullName}</Typography>
                                            <Typography variant="caption" color="gray">{selectedCustomer?.phoneNumber}</Typography>
                                        </View>
                                    </View>
                                    {!effectiveCustomerId && (
                                        <TouchableOpacity onPress={() => { setSelectedCustomerId(''); setSelectedTemplate(null); }} className="px-3 py-1 bg-indigo-500/10 rounded-full">
                                            <Typography variant="small" color="primary" weight="bold">Change</Typography>
                                        </TouchableOpacity>
                                    )}
                                </Surface>
                            )}
                        </View>

                        {selectedCustomerId && (
                            <>
                                {/* Section 2: Template Selection */}
                                <View className="mb-8">
                                    <Typography variant="caption" color="gray" weight="bold" className="ml-4 mb-2 uppercase tracking-wider text-[11px]">
                                        Measurement Template
                                    </Typography>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row overflow-visible">
                                        {templates.map(template => (
                                            <TouchableOpacity
                                                key={template.id}
                                                onPress={() => setSelectedTemplate(template)}
                                                className={`mr-3 px-6 py-4 rounded-2xl border ${selectedTemplate?.id === template.id
                                                    ? (isDark ? 'bg-indigo-900/60 border-indigo-500' : 'bg-soft-lavender border-brand-primary')
                                                    : (isDark ? 'bg-surface-dark border-border-dark' : 'bg-white border-gray-100')}`}
                                            >
                                                <Typography weight="bold" color={selectedTemplate?.id === template.id ? 'primary' : (isDark ? 'white' : 'black')}>
                                                    {template.name}
                                                </Typography>
                                            </TouchableOpacity>
                                        ))}
                                        <TouchableOpacity
                                            onPress={() => router.push('/measurement-templates')}
                                            className={`px-6 py-4 rounded-2xl border border-dashed ${isDark ? 'border-gray-700 bg-surface-dark' : 'border-gray-200 bg-white'} items-center justify-center`}
                                        >
                                            <Typography variant="small" color="gray" weight="bold">Manage Templates</Typography>
                                        </TouchableOpacity>
                                    </ScrollView>
                                </View>

                                {/* Section 3: Measurements */}
                                <View className="mb-8">
                                    <Typography variant="caption" color="gray" weight="bold" className="ml-4 mb-2 uppercase tracking-wider text-[11px]">
                                        Measurement Values
                                    </Typography>

                                    <View className={`rounded-[24px] overflow-hidden border ${isDark ? 'bg-surface-dark border-border-dark' : 'bg-white border-gray-100 shadow-sm'}`}>
                                        {/* Title Field */}
                                        <View className={`flex-row items-center px-5 py-4 border-b ${isDark ? 'border-white/5' : 'border-gray-50'}`}>
                                            <View className={`w-8 h-8 rounded-lg items-center justify-center mr-3 ${isDark ? 'bg-orange-900/30' : 'bg-orange-50'}`}>
                                                <DocumentText size={18} color="#f97316" variant="Bulk" />
                                            </View>
                                            <TextInput
                                                className={`flex-1 text-[16px] font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
                                                placeholder="Measurement Title (e.g. Kaftan)"
                                                placeholderTextColor={isDark ? "#4B5563" : "#9CA3AF"}
                                                value={title}
                                                onChangeText={setTitle}
                                            />
                                        </View>

                                        {selectedTemplate ? (
                                            <View>
                                                {selectedTemplate.fields.map((field: string, index: number) => (
                                                    <View
                                                        key={field}
                                                        className={`flex-row items-center justify-between px-5 py-4 ${index < selectedTemplate.fields.length - 1 ? (isDark ? 'border-b border-white/5' : 'border-b border-gray-50') : ''}`}
                                                    >
                                                        <Typography weight="semibold" className={isDark ? 'text-white' : 'text-gray-900'}>
                                                            {field} <Typography variant="caption" color="gray">({unit})</Typography>
                                                        </Typography>
                                                        <TextInput
                                                            className={`text-right text-[16px] font-bold ${isDark ? 'text-white' : 'text-blue-600'} min-w-[60px]`}
                                                            placeholder="0"
                                                            placeholderTextColor="#9CA3AF"
                                                            value={values[field] || ''}
                                                            onChangeText={(text) => handleValueChange(field, text)}
                                                            keyboardType="numeric"
                                                        />
                                                    </View>
                                                ))}
                                            </View>
                                        ) : (
                                            <View className="p-10 items-center">
                                                <Ruler size={32} color="#9CA3AF" variant="Bulk" />
                                                <Typography color="gray" className="mt-2 text-center">Select a template above to reveal measurement fields</Typography>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                <Button
                                    onPress={handleSave}
                                    className={`h-16 rounded-full border-0 bg-blue-600 shadow-none`}
                                    textClassName="text-white font-bold text-lg"
                                    isLoading={submitting}
                                    disabled={!selectedTemplate || submitting}
                                >
                                    Save Measurements
                                </Button>
                            </>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
