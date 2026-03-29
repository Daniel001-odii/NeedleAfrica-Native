import React, { useState } from 'react';
import { View, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Typography } from '../../components/ui/Typography';
import { Surface } from '../../components/ui/Surface';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { ArrowLeft, Add, Trash } from 'iconsax-react-native';
import { useMeasurementTemplates } from '../../hooks/useMeasurementTemplates';
import { useResourceLimits } from '../../hooks/useResourceLimits';
import { useSubscription } from '../../hooks/useSubscription';
import { useSync } from '../../hooks/useSync';
import { ResourceLimitModal } from '../../components/ResourceLimitModal';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function CreateTemplateScreen() {
    const router = useRouter();
    const { addTemplate } = useMeasurementTemplates();
    const { canCreate } = useResourceLimits();
    const { confirm } = useConfirm();
    const { isFree } = useSubscription();
    const { isOnline } = useSync();
    const { isDark } = useTheme();

    const [name, setName] = useState('');
    const [fields, setFields] = useState<string[]>(['', '', '', '']); // Start with 4 empty fields
    const [submitting, setSubmitting] = useState(false);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [limitModalData, setLimitModalData] = useState({
        allowed: true,
        currentCount: 0,
        limit: 5,
        message: '',
        isAtLimit: false,
        isNearLimit: false,
    });
    const [proceedAnyway, setProceedAnyway] = useState(false);

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
            confirm({
                title: 'Error',
                message: 'Please enter a template name',
                confirmText: 'OK',
                onConfirm: () => { }
            });
            return;
        }

        const validFields = fields.filter(f => f.trim().length > 0);
        if (validFields.length === 0) {
            confirm({
                title: 'Error',
                message: 'Please add at least one field',
                confirmText: 'OK',
                onConfirm: () => { }
            });
            return;
        }

        // Check resource limits for free tier
        if (isFree) {
            const limitCheck = canCreate('templates');
            if (!limitCheck.allowed && !proceedAnyway) {
                setLimitModalData(limitCheck);
                setShowLimitModal(true);
                return;
            }
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
            confirm({
                title: 'Error',
                message: 'Failed to save template',
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
                <View className="flex-1 p-6">
                    {/* Header */}
                    <View className="flex-row items-center mb-6 gap-3">
                        <IconButton
                            icon={<ArrowLeft size={24} color={isDark ? "white" : "black"} />}
                            variant="ghost"
                            onPress={() => router.back()}
                        />
                        <Typography variant="h2" weight="bold">New Template</Typography>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Typography variant="h3" weight="bold" className="mb-2">Template Name</Typography>
                        <Surface variant="muted" className={`px-4 py-3 mb-6 border ${isDark ? 'bg-surface-muted-dark border-border-dark' : 'border-gray-100'}`} rounded="xl" hasBorder>
                            <TextInput
                                className={`text-base font-medium ${isDark ? 'text-white' : 'text-dark'}`}
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
                                    <Add size={18} color={isDark ? "#818CF8" : "#4F46E5"} />
                                    <Typography className={isDark ? "text-indigo-300" : "text-brand-primary"} weight="bold">Add Field</Typography>
                                </View>
                            </Button>
                        </View>

                        <View className="gap-3 mb-8">
                            {fields.map((field, index) => (
                                <View key={index} className="flex-row items-center gap-2">
                                    <Surface variant="muted" className={`flex-1 px-4 py-3 border ${isDark ? 'bg-surface-muted-dark border-border-dark' : 'border-gray-100'}`} rounded="xl" hasBorder>
                                        <TextInput
                                            className={`text-base font-medium ${isDark ? 'text-white' : 'text-dark'}`}
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
                                            className={isDark ? "bg-red-900/20" : "bg-red-50"}
                                            onPress={() => handleRemoveField(index)}
                                        />
                                    )}
                                </View>
                            ))}
                        </View>

                        <Button
                            variant="primary"
                            className={`w-full h-14 rounded-full mb-10 ${isDark ? 'bg-white' : 'bg-dark'}`}
                            textClassName={isDark ? 'text-dark' : 'text-white'}
                            onPress={handleSave}
                            isLoading={submitting}
                        >
                            Save Template
                        </Button>
                    </ScrollView>

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
                            setTimeout(() => handleSave(), 100);
                        }}
                        resource="templates"
                        currentCount={limitModalData.currentCount}
                        limit={limitModalData.limit}
                        isOffline={!isOnline}
                    />
                </View>
            </SafeAreaView>
        </View>
    );
}
