import React, { useState, useEffect, useMemo } from 'react';
import { View, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Typography } from '../../components/ui/Typography';
import { Surface } from '../../components/ui/Surface';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { ArrowLeft, DocumentText, SearchNormal1, User as UserIcon } from 'iconsax-react-native';
import { useCustomerMeasurements } from '../../hooks/useMeasurement';
import { useMeasurementTemplates, MeasurementTemplate } from '../../hooks/useMeasurementTemplates';
import { useCustomers } from '../../hooks/useCustomers';
import { useAuth } from '../../contexts/AuthContext';
import Toast from 'react-native-toast-message';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function CreateMeasurementScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { initialCustomerId } = useLocalSearchParams<{ initialCustomerId: string }>();
    const { customers, loading: loadingCustomers } = useCustomers();
    const { confirm } = useConfirm();
    const { isDark } = useTheme();

    const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId || '');
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
            confirm({
                title: 'Error',
                message: 'Please select a customer',
                confirmText: 'OK',
                onConfirm: () => { }
            });
            return;
        }

        if (!title.trim()) {
            confirm({
                title: 'Error',
                message: 'Please enter a title',
                confirmText: 'OK',
                onConfirm: () => { }
            });
            return;
        }

        const hasValues = Object.values(values).some(v => v.trim().length > 0);
        if (!hasValues) {
            confirm({
                title: 'Error',
                message: 'Please enter at least one measurement value',
                confirmText: 'OK',
                onConfirm: () => { }
            });
            return;
        }

        setSubmitting(true);
        try {
            await addMeasurement(title, values);
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Measurement saved successfully'
            });
            router.back();
        } catch (error) {
            console.error(error);
            confirm({
                title: 'Error',
                message: 'Failed to save measurement',
                confirmText: 'OK',
                onConfirm: () => { }
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-white'}`}>
            <SafeAreaView className="flex-1" edges={['top']}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1"
                >
                    <View className="flex-1">
                        <View className={`px-6 py-4 flex-row items-center border-b ${isDark ? 'border-border-dark' : 'border-gray-50'}`}>
                            <IconButton
                                icon={<ArrowLeft size={20} color={isDark ? "white" : "black"} />}
                                onPress={() => router.back()}
                                variant="ghost"
                                className="-ml-2"
                            />
                            <Typography variant="h3" weight="bold" className="ml-2">New Measurement</Typography>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerClassName="p-6 pb-20"
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* 1. Customer Selection */}
                            <Typography variant="caption" color="gray" weight="bold" className="mb-4 uppercase tracking-widest ml-1">1. Select Customer</Typography>

                            {!selectedCustomerId ? (
                                <View className="mb-8">
                                    <Surface variant="muted" rounded="2xl" className={`flex-row items-center px-4 h-14 mb-4 border ${isDark ? 'border-border-dark' : 'border-gray-100'}`}>
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
                                        <ActivityIndicator color={isDark ? "white" : "black"} />
                                    ) : (
                                        <View className="gap-3">
                                            {filteredCustomers.slice(0, 5).map(customer => (
                                                <Pressable key={customer.id} onPress={() => setSelectedCustomerId(customer.id)}>
                                                    <Surface variant="white" className={`p-4 border flex-row items-center ${isDark ? 'bg-surface-dark border-border-dark' : 'border-gray-100'}`} rounded="2xl" hasBorder>
                                                        <View className="w-10 h-10 bg-indigo-500 rounded-full items-center justify-center mr-4">
                                                            <Typography weight="bold" color="white">{(customer.fullName || 'U')[0].toUpperCase()}</Typography>
                                                        </View>
                                                        <Typography weight="bold" className={isDark ? 'text-white' : 'text-dark'}>{customer.fullName}</Typography>
                                                    </Surface>
                                                </Pressable>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            ) : (
                                <Surface variant="lavender" className={`p-4 mb-8 flex-row items-center justify-between ${isDark ? 'bg-indigo-900/40' : 'bg-soft-lavender'}`} rounded="2xl">
                                    <View className="flex-row items-center">
                                        <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${isDark ? 'bg-white/10' : 'bg-white'}`}>
                                            <UserIcon size={20} color={isDark ? "white" : "black"} variant="Bulk" />
                                        </View>
                                        <View>
                                            <Typography weight="bold" className={isDark ? 'text-white' : 'text-dark'}>{selectedCustomer?.fullName}</Typography>
                                            <Typography variant="caption" color="gray">{selectedCustomer?.phoneNumber}</Typography>
                                        </View>
                                    </View>
                                    {!initialCustomerId && (
                                        <Pressable onPress={() => { setSelectedCustomerId(''); setSelectedTemplate(null); }}>
                                            <Typography variant="small" color="primary" weight="bold">Change</Typography>
                                        </Pressable>
                                    )}
                                </Surface>
                            )}

                            {selectedCustomerId && (
                                <>
                                    {/* 2. Template Selection */}
                                    <Typography variant="caption" color="gray" weight="bold" className="mb-4 uppercase tracking-widest ml-1">2. Choose Template</Typography>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                                        {templates.map(template => (
                                            <Pressable
                                                key={template.id}
                                                onPress={() => setSelectedTemplate(template)}
                                                className={`mr-3 p-4 rounded-2xl border ${selectedTemplate?.id === template.id
                                                    ? (isDark ? 'bg-indigo-900/60 border-indigo-500' : 'bg-soft-lavender border-brand-primary')
                                                    : (isDark ? 'bg-surface-dark border-border-dark' : 'bg-white border-gray-200')}`}
                                            >
                                                <Typography weight="bold" color={selectedTemplate?.id === template.id ? 'primary' : (isDark ? 'white' : 'black')}>
                                                    {template.name}
                                                </Typography>
                                            </Pressable>
                                        ))}
                                        <Pressable
                                            onPress={() => router.push('/measurement-templates')}
                                            className={`px-6 py-4 rounded-2xl border border-dashed ${isDark ? 'border-gray-600' : 'border-gray-300'} items-center justify-center`}
                                        >
                                            <Typography variant="small" color="gray">Manage</Typography>
                                        </Pressable>
                                    </ScrollView>

                                    {/* 3. Measurement Details */}
                                    <Typography variant="caption" color="gray" weight="bold" className="mb-4 uppercase tracking-widest ml-1">3. Measurement Values</Typography>

                                    <View className="mb-6">
                                        <Typography variant="body" weight="semibold" className="mb-2 ml-1">Title</Typography>
                                        <Surface variant="muted" className={`px-4 h-14 justify-center border ${isDark ? 'bg-surface-muted-dark border-border-dark' : 'border-gray-100'}`} rounded="xl" hasBorder>
                                            <TextInput
                                                className={`text-base font-semibold ${isDark ? 'text-white' : 'text-dark'}`}
                                                placeholder="e.g. Wedding Suit"
                                                placeholderTextColor="#9CA3AF"
                                                value={title}
                                                onChangeText={setTitle}
                                            />
                                        </Surface>
                                    </View>

                                    {selectedTemplate ? (
                                        <View className="gap-4 mb-8">
                                            {selectedTemplate.fields.map((field: string) => (
                                                <View key={field}>
                                                    <Typography variant="caption" color="gray" weight="bold" className="mb-1 ml-1 uppercase">{field} ({unit})</Typography>
                                                    <Surface variant="muted" className={`px-4 h-14 justify-center border ${isDark ? 'bg-surface-muted-dark border-border-dark' : 'border-gray-100'}`} rounded="xl" hasBorder>
                                                        <TextInput
                                                            className={`text-base font-semibold ${isDark ? 'text-white' : 'text-dark'}`}
                                                            placeholder={`Enter ${field}`}
                                                            placeholderTextColor="#9CA3AF"
                                                            value={values[field] || ''}
                                                            onChangeText={(text) => handleValueChange(field, text)}
                                                            keyboardType="numeric"
                                                        />
                                                    </Surface>
                                                </View>
                                            ))}
                                        </View>
                                    ) : (
                                        <View className={`items-center justify-center p-10 rounded-3xl mb-8 ${isDark ? 'bg-surface-muted-dark' : 'bg-gray-50'}`}>
                                            <DocumentText size={32} color="#9CA3AF" variant="Bulk" />
                                            <Typography color="gray" className="mt-2 text-center">Select a template above to start entering values</Typography>
                                        </View>
                                    )}
                                    <Button
                                        onPress={handleSave}
                                        className={`h-16 rounded-full mb-10 ${isDark ? 'bg-white' : 'bg-dark'}`}
                                        textClassName={`${isDark ? 'text-dark' : 'text-white'} font-bold`}
                                        isLoading={submitting}
                                        disabled={!selectedTemplate}
                                    >
                                        Save Measurement
                                    </Button>
                                </>
                            )}
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
