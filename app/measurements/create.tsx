import React, { useState, useEffect } from 'react';
import { View, TextInput, ScrollView, Alert, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Typography } from '../../components/ui/Typography';
import { Surface } from '../../components/ui/Surface';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { ArrowLeft, DocumentText } from 'iconsax-react-native';
import { useCustomerMeasurements } from '../../hooks/useMeasurement';
import { useMeasurementTemplates, MeasurementTemplate } from '../../hooks/useMeasurementTemplates';

import { useAuth } from '../../contexts/AuthContext';

export default function CreateMeasurementScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { customerId } = useLocalSearchParams<{ customerId: string }>();
    const { addMeasurement } = useCustomerMeasurements(customerId!);
    const { templates, loading: templatesLoading } = useMeasurementTemplates();

    const unit = user?.measurementUnit || 'inch';

    const [selectedTemplate, setSelectedTemplate] = useState<MeasurementTemplate | null>(null);
    const [title, setTitle] = useState('');
    const [values, setValues] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (selectedTemplate) {
            setTitle(selectedTemplate.name);
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
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a title');
            return;
        }

        const hasValues = Object.values(values).some(v => v.trim().length > 0);
        if (!hasValues) {
            Alert.alert('Error', 'Please enter at least one measurement value');
            return;
        }

        setSubmitting(true);
        try {
            await addMeasurement(title, values);
            router.back();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to save measurement');
        } finally {
            setSubmitting(false);
        }
    };

    if (!customerId) return null;

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <View className="flex-1 p-6">
                    <View className="flex-row items-center mb-6 gap-3">
                        <IconButton
                            icon={<ArrowLeft size={24} color="black" />}
                            variant="ghost"
                            onPress={() => router.back()}
                        />
                        <Typography variant="h2" weight="bold">New Measurement</Typography>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerClassName="pb-10"
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Template Selection */}
                        <Typography variant="h3" weight="bold" className="mb-3">Choose Template</Typography>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                            {templates.map(template => (
                                <Pressable
                                    key={template.id}
                                    onPress={() => setSelectedTemplate(template)}
                                    className={`mr-3 p-4 rounded-2xl border ${selectedTemplate?.id === template.id ? 'bg-lavender border-brand-primary' : 'bg-white border-gray-200'}`}
                                >
                                    <Typography weight="bold" color={selectedTemplate?.id === template.id ? 'primary' : 'black'}>
                                        {template.name}
                                    </Typography>
                                </Pressable>
                            ))}
                            <Pressable
                                onPress={() => router.push('/measurement-templates')}
                                className="p-4 rounded-2xl border border-dashed border-gray-300 items-center justify-center"
                            >
                                <Typography variant="small" color="gray">Manage</Typography>
                            </Pressable>
                        </ScrollView>

                        <Typography variant="h3" weight="bold" className="mb-2">Title</Typography>
                        <Surface variant="muted" className="px-4 py-3 mb-6" rounded="xl" hasBorder>
                            <TextInput
                                className="text-base text-dark font-medium"
                                placeholder="e.g. Shirt for Wedding"
                                value={title}
                                onChangeText={setTitle}
                            />
                        </Surface>

                        {selectedTemplate ? (
                            <>
                                <Typography variant="h3" weight="bold" className="mb-4">Values</Typography>
                                <View className="gap-3 mb-8">
                                    {selectedTemplate.fields.map((field: string) => (
                                        <View key={field}>
                                            <Typography variant="caption" color="gray" weight="bold" className="mb-1 ml-1 uppercase">{field} ({unit})</Typography>
                                            <Surface variant="muted" className="px-4 py-3" rounded="xl" hasBorder>
                                                <TextInput
                                                    className="text-base text-dark font-medium"
                                                    placeholder={`Enter ${field}`}
                                                    value={values[field] || ''}
                                                    onChangeText={(text) => handleValueChange(field, text)}
                                                    keyboardType="numeric"
                                                />
                                            </Surface>
                                        </View>
                                    ))}
                                </View>
                            </>
                        ) : (
                            <View className="items-center justify-center p-8 bg-gray-50 rounded-2xl mb-8">
                                <DocumentText size={32} color="#9CA3AF" variant="Bulk" />
                                <Typography color="gray" className="mt-2 text-center">Select a template above to start entering values</Typography>
                            </View>
                        )}

                        <Button
                            onPress={handleSave}
                            className="h-16 rounded-full bg-dark"
                            textClassName="text-white"
                            isLoading={submitting}
                            disabled={!selectedTemplate}
                        >
                            Save Measurement
                        </Button>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
