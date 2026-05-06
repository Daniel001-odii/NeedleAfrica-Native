import React, { useState } from 'react';
import { View, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Typography } from '../../components/ui/Typography';
import { Surface } from '../../components/ui/Surface';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { ArrowLeft, Add, Trash, Ruler } from 'iconsax-react-native';
import { useMeasurementTemplates } from '../../hooks/useMeasurementTemplates';
import { useResourceLimits } from '../../hooks/useResourceLimits';
import { useSubscription } from '../../hooks/useSubscription';
import { useSync } from '../../hooks/useSync';
import { ResourceLimitModal } from '../../components/ResourceLimitModal';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useTheme } from '../../contexts/ThemeContext';
import { TypingText } from '../../components/ui/TypingText';

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
        <View className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-[#F2F2F7]'}`}>
            <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                    
                    {/* Header Strip */}
                    <View className="px-6 pt-2 pb-2">
                        <IconButton
                            icon={<ArrowLeft size={24} color={isDark ? "white" : "#1F2937"} />}
                            onPress={() => router.back()}
                            variant="ghost"
                            className="-ml-4"
                        />
                    </View>

                    <ScrollView
                        contentContainerClassName="p-6 pb-10"
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View className="mb-10 mt-2">
                            <TypingText 
                                variant="h1" 
                                weight="bold" 
                                className={`mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`} 
                                text="New Template" 
                                speed={30} 
                            />
                            <Typography color="gray" variant="subtitle" className="leading-5">
                                Create a reusable set of measurement fields for your designs.
                            </Typography>
                        </View>

                        {/* Section 1: Template Identity */}
                        <View className="mb-8">
                            <Typography variant="caption" color="gray" weight="bold" className="ml-4 mb-2 uppercase tracking-wider text-[11px]">
                                Template Details
                            </Typography>
                            <View className={`rounded-[24px] overflow-hidden border ${isDark ? 'bg-surface-dark border-border-dark' : 'bg-white border-gray-100 shadow-sm'}`}>
                                <View className={`flex-row items-center px-5 py-4 border-b ${isDark ? 'border-white/5' : 'border-gray-50'}`}>
                                    <View className={`w-8 h-8 rounded-lg items-center justify-center mr-3 ${isDark ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}>
                                        <Ruler size={18} color="#6366f1" variant="Bulk" />
                                    </View>
                                    <TextInput
                                        className={`flex-1 text-[16px] font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
                                        placeholder="Template Name (e.g. Kaftan)"
                                        placeholderTextColor={isDark ? "#4B5563" : "#9CA3AF"}
                                        value={name}
                                        onChangeText={setName}
                                    />
                                </View>
                            </View>
                            <Typography variant="caption" color="gray" className="ml-5 mt-2 opacity-60">
                                Give your template a name that describes the style.
                            </Typography>
                        </View>

                        {/* Section 2: Fields Configuration */}
                        <View className="mb-8">
                            <View className="flex-row justify-between items-center ml-4 mb-2 pr-2">
                                <Typography variant="caption" color="gray" weight="bold" className="uppercase tracking-wider text-[11px]">
                                    Measurement Fields ({fields.length})
                                </Typography>
                                <TouchableOpacity onPress={handleAddField}>
                                    <Typography variant="caption" weight="bold" className={isDark ? "text-indigo-400" : "text-blue-600"}>
                                        + ADD FIELD
                                    </Typography>
                                </TouchableOpacity>
                            </View>

                            <View className={`rounded-[24px] overflow-hidden border ${isDark ? 'bg-surface-dark border-border-dark' : 'bg-white border-gray-100 shadow-sm'}`}>
                                {fields.map((field, index) => {
                                    const isLast = index === fields.length - 1;
                                    return (
                                        <View key={index} className={`flex-row items-center px-5 py-3.5 ${!isLast ? (isDark ? 'border-b border-white/5' : 'border-b border-gray-50') : ''}`}>
                                            <Typography weight="bold" color="gray" className="w-6 text-[12px] opacity-40">
                                                {index + 1}
                                            </Typography>
                                            <TextInput
                                                className={`flex-1 text-[15px] font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}
                                                placeholder={`Field Name (e.g. Waist, Length)`}
                                                placeholderTextColor={isDark ? "#4B5563" : "#D1D5DB"}
                                                value={field}
                                                onChangeText={(text) => handleFieldChange(text, index)}
                                            />
                                            {fields.length > 1 && (
                                                <TouchableOpacity 
                                                    onPress={() => handleRemoveField(index)}
                                                    className={`p-2 rounded-full ${isDark ? 'bg-red-900/10' : 'bg-red-50'}`}
                                                >
                                                    <Trash size={16} color="#EF4444" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        </View>

                    </ScrollView>

                    {/* Sticky Action Bar */}
                    <View className={`px-6 py-4 border-t ${isDark ? 'bg-background-dark border-border-dark' : 'bg-white border-gray-100'}`}>
                        <Button
                            onPress={handleSave}
                            isLoading={submitting}
                            disabled={!name.trim() || fields.filter(f => f.trim()).length === 0}
                            className={`h-16 rounded-full border-0 ${(!name.trim() || fields.filter(f => f.trim()).length === 0) ? (isDark ? 'bg-zinc-800' : 'bg-gray-100') : 'bg-blue-600'}`}
                            textClassName={`text-lg font-bold ${(!name.trim() || fields.filter(f => f.trim()).length === 0) ? 'text-gray-400' : 'text-white'}`}
                        >
                            Save Template
                        </Button>
                    </View>

                </KeyboardAvoidingView>
            </SafeAreaView>

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
    );
}
