import React, { useState } from 'react';
import { View, TextInput, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Typography } from '../../components/ui/Typography';
import { Surface } from '../../components/ui/Surface';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { ArrowLeft, Add, Trash } from 'iconsax-react-native';
import { useMeasurementTemplates } from '../../hooks/useMeasurementTemplates';

export default function CreateTemplateScreen() {
    const router = useRouter();
    const { addTemplate } = useMeasurementTemplates();
    const [name, setName] = useState('');
    const [fields, setFields] = useState<string[]>(['', '', '', '']); // Start with 4 empty fields
    const [submitting, setSubmitting] = useState(false);

    const handleAddField = () => {
        setFields([...fields, '']);
    };

    const handleRemoveField = (index: number) => {
        const newFields = fields.filter((_, i) => i !== index);
        setFields(newFields);
    };

    const handleFieldChange = (text: string, index: number) => {
        const newFields = [...fields];
        newFields[index] = text;
        setFields(newFields);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a template name');
            return;
        }

        const validFields = fields.filter(f => f.trim().length > 0);
        if (validFields.length === 0) {
            Alert.alert('Error', 'Please add at least one field');
            return;
        }

        setSubmitting(true);
        try {
            await addTemplate({
                name: name.trim(),
                fields: validFields
            });
            router.back();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to save template');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <View className="flex-1 p-6">
                {/* Header */}
                <View className="flex-row items-center mb-6 gap-3">
                    <IconButton
                        icon={<ArrowLeft size={24} color="black" />}
                        variant="ghost"
                        onPress={() => router.back()}
                    />
                    <Typography variant="h2" weight="bold">New Template</Typography>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    <Typography variant="h3" weight="bold" className="mb-2">Template Name</Typography>
                    <Surface variant="muted" className="px-4 py-3 mb-6" rounded="xl" hasBorder>
                        <TextInput
                            className="text-base text-dark font-medium"
                            placeholder="e.g. Shirt, Trousers, Gown"
                            placeholderTextColor="#9CA3AF"
                            value={name}
                            onChangeText={setName}
                        />
                    </Surface>

                    <View className="flex-row justify-between items-center mb-4">
                        <Typography variant="h3" weight="bold">Measurement Fields</Typography>
                        <Button
                            variant="ghost"
                            className="px-0"
                            onPress={handleAddField}
                        >
                            <View className="flex-row items-center gap-1">
                                <Add size={18} color="#4F46E5" />
                                <Typography className="text-brand-primary" weight="bold">Add Field</Typography>
                            </View>
                        </Button>
                    </View>

                    <View className="gap-3 mb-8">
                        {fields.map((field, index) => (
                            <View key={index} className="flex-row items-center gap-2">
                                <Surface variant="muted" className="flex-1 px-4 py-3" rounded="xl" hasBorder>
                                    <TextInput
                                        className="text-base text-dark font-medium"
                                        placeholder={`Field ${index + 1} (e.g. Length, Waist)`}
                                        placeholderTextColor="#9CA3AF"
                                        value={field}
                                        onChangeText={(text) => handleFieldChange(text, index)}
                                    />
                                </Surface>
                                {fields.length > 1 && (
                                    <IconButton
                                        icon={<Trash size={20} color="#EF4444" />}
                                        variant="ghost"
                                        className="bg-red-50"
                                        onPress={() => handleRemoveField(index)}
                                    />
                                )}
                            </View>
                        ))}
                    </View>

                    <Button
                        variant="primary"
                        className="w-full h-14 rounded-full mb-10"
                        onPress={handleSave}
                        isLoading={submitting}
                    >
                        Save Template
                    </Button>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}
