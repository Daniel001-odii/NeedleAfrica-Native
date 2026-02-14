import React, { useState, useEffect } from 'react';
import { View, TextInput, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Typography } from '../../components/ui/Typography';
import { Surface } from '../../components/ui/Surface';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { ArrowLeft, Add, Trash } from 'iconsax-react-native';
import { useMeasurementTemplates } from '../../hooks/useMeasurementTemplates';
import Toast from 'react-native-toast-message';

export default function EditTemplateScreen() {
    const router = useRouter();
    const { templateId } = useLocalSearchParams<{ templateId: string }>();
    const { templates, updateTemplate, deleteTemplate } = useMeasurementTemplates();

    const template = templates.find(t => t.id === templateId);

    const [name, setName] = useState('');
    const [fields, setFields] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (template) {
            setName(template.name || '');
            setFields(template.fields);
        }
    }, [template]);

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
            await updateTemplate(templateId!, {
                name: name.trim(),
                fields: validFields
            });
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Template updated'
            });
            router.back();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to update template');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Template',
            `Are you sure you want to delete "${name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteTemplate(templateId!);
                            Toast.show({
                                type: 'success',
                                text1: 'Deleted',
                                text2: 'Template removed'
                            });
                            router.back();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete template');
                        }
                    }
                }
            ]
        );
    };

    if (!templateId) return null;

    return (
        <View className="flex-1 bg-white">
            <View className="flex-1 p-6">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-6">
                    <View className="flex-row items-center gap-3">
                        <IconButton
                            icon={<ArrowLeft size={24} color="black" />}
                            variant="ghost"
                            onPress={() => router.back()}
                        />
                        <Typography variant="h2" weight="bold">Edit Template</Typography>
                    </View>
                    <IconButton
                        icon={<Trash size={24} color="#EF4444" />}
                        variant="ghost"
                        className="bg-red-50"
                        onPress={handleDelete}
                    />
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
                        Save Changes
                    </Button>
                </ScrollView>
            </View>
        </View>
    );
}
