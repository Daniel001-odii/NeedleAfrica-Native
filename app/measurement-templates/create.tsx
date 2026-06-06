import React, { useState } from 'react';
import { View, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { ArrowLeft, Add, Trash, ArrowRight2, Global, InfoCircle, ArrowDown2, ArrowUp2 } from 'iconsax-react-native';
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
    const [fields, setFields] = useState<string[]>(['', '', '', '']);
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
    const [isPublic, setIsPublic] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

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
                fields: validFields,
                isPublic
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
        <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'}`}>
            <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                    
                    {/* Simple Header */}
                    <View className="px-6 pt-3 pb-2 flex-row justify-between items-center">
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
                        <View className="mb-8 mt-2">
                            {/* <TypingText 
                                variant="h1" 
                                weight="bold" 
                                className="mb-2 text-black" 
                                text="New Template" 
                                speed={30} 
                            /> */}
                            <Typography color={isDark ? 'white' : 'black'} className='font-bold text-3xl mb-2'>New Measurement Template</Typography>
                            <Typography color="gray" variant="subtitle" className={`leading-5 ${isDark ? 'text-zinc-400' : ''}`}>
                                Create a reusable set of measurement fields for your designs.
                            </Typography>
                        </View>

                        {/* Section 1: Template Name */}
                        <View className="mb-8">
                            <Typography variant="caption" color="gray" weight="bold" className={`ml-4 mb-2 uppercase tracking-wider text-[11px] ${isDark ? 'text-zinc-400' : ''}`}>
                                Template Details
                            </Typography>
                            <View className={`rounded-[24px] overflow-hidden ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-100 shadow-sm'}`}>
                                <View className={`flex-row items-center px-4 py-4 ${isDark ? 'border-b border-white/5' : 'border-b border-gray-50'}`}>
                                    <Typography weight="semibold" className={`w-1/3 text-[15px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        Name
                                    </Typography>
                                    <TextInput
                                        className={`flex-1 text-right font-semibold text-[16px] ${isDark ? 'text-white' : 'text-gray-900'}`}
                                        placeholder="e.g. Kaftan, Shirt..."
                                        placeholderTextColor={isDark ? "#52525b" : "#D1D5DB"}
                                        value={name}
                                        onChangeText={setName}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Section 2: Measurement Fields */}
                        <View className="mb-8">
                            <View className="flex-row items-center justify-between ml-4 mb-2">
                                <Typography variant="caption" color="gray" weight="bold" className={`uppercase tracking-wider text-[11px] ${isDark ? 'text-zinc-400' : ''}`}>
                                    Measurement Fields ({fields.length})
                                </Typography>
                            </View>

                            <View className={`rounded-[24px] overflow-hidden ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-100 shadow-sm'}`}>
                                {fields.map((field, index) => {
                                    const isLast = index === fields.length - 1;
                                    return (
                                        <View key={index} className={`flex-row items-center px-4 py-1.5 min-h-[56px] ${!isLast ? (isDark ? 'border-b border-white/5' : 'border-b border-gray-50') : ''}`}>
                                            <TouchableOpacity onPress={() => handleRemoveField(index)} className="mr-3 p-1">
                                                <View className="w-5 h-5 rounded-full bg-red-500 items-center justify-center">
                                                    <View className="w-2.5 h-[2px] bg-white rounded-full" />
                                                </View>
                                            </TouchableOpacity>
                                            <Typography weight="semibold" className={`w-1/3 text-[15px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                Field {index + 1}
                                            </Typography>
                                            <TextInput
                                                className={`flex-1 text-right font-semibold text-[16px] ${isDark ? 'text-white' : 'text-gray-900'}`}
                                                placeholder="e.g. Waist, Length..."
                                                placeholderTextColor={isDark ? "#52525b" : "#D1D5DB"}
                                                value={field}
                                                onChangeText={(text) => handleFieldChange(text, index)}
                                            />
                                        </View>
                                    );
                                })}

                                {/* Add Field Inline Row */}
                                <TouchableOpacity
                                    onPress={handleAddField}
                                    className={`flex-row items-center px-4 py-1.5 min-h-[56px] ${isDark ? 'active:bg-white/5' : 'active:bg-gray-50'}`}
                                >
                                    <View className="w-5 h-5 rounded-full bg-green-500 items-center justify-center mr-3">
                                        <View className="w-2.5 h-[2px] bg-white rounded-full absolute" />
                                        <View className="w-[2px] h-2.5 bg-white rounded-full absolute" />
                                    </View>
                                    <Typography weight="semibold" className="text-brand-primary text-[16px]">
                                        Add custom field
                                    </Typography>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Advanced Section — Visibility */}
                        <View className="mb-8">
                            <TouchableOpacity
                                onPress={() => setShowAdvanced(!showAdvanced)}
                                className={`flex-row items-center justify-between px-4 py-3 rounded-2xl ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-gray-50'}`}
                                activeOpacity={0.7}
                            >
                                <Typography weight="semibold" className={`text-[14px] ${isDark ? 'text-zinc-300' : 'text-gray-600'}`}>
                                    Advanced
                                </Typography>
                                {showAdvanced ? (
                                    <ArrowUp2 size={16} color={isDark ? "#a1a1aa" : "#9ca3af"} />
                                ) : (
                                    <ArrowDown2 size={16} color={isDark ? "#a1a1aa" : "#9ca3af"} />
                                )}
                            </TouchableOpacity>

                            {showAdvanced && (
                                <View className={`mt-3 rounded-[24px] overflow-hidden ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-100 shadow-sm'}`}>
                                    <View className="flex-row items-center justify-between px-4 py-4">
                                        <View className="flex-row items-center flex-1 mr-3">
                                            <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${isDark ? 'bg-emerald-900/20' : 'bg-emerald-50'}`}>
                                                <Global size={20} color={isDark ? "#34D399" : "#10B981"} />
                                            </View>
                                            <View className="flex-1">
                                                <Typography weight="semibold" className={`text-[15px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    Share to Marketplace
                                                </Typography>
                                                <Typography variant="small" color="gray" className={isDark ? 'text-zinc-400' : ''}>
                                                    Make this template available for other tailors & designers
                                                </Typography>
                                            </View>
                                        </View>
                                        <Switch
                                            value={isPublic}
                                            onValueChange={setIsPublic}
                                            trackColor={{ false: isDark ? '#3f3f46' : '#e5e7eb', true: '#10B981' }}
                                            thumbColor="#ffffff"
                                        />
                                    </View>

                                    <View className={`mx-4 mb-4 p-3 rounded-xl flex-row items-start ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                                        <InfoCircle size={16} color={isDark ? "#60a5fa" : "#3b82f6"} style={{ marginTop: 1, marginRight: 8 }} />
                                        <View className="flex-1">
                                            <Typography variant="small" weight="medium" className={`text-[12px] leading-[18px] ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                                                Public templates appear in the Templates Library for the community to browse and add to their collection. Only your template name and fields will be visible — your personal data stays private.
                                            </Typography>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>

                    </ScrollView>

                    {/* Bottom Action Bar */}
                    <View className={`p-6 pt-2 border-t ${isDark ? 'bg-black border-white/5' : 'bg-white border-gray-50'}`}>
                        <Button
                            onPress={handleSave}
                            isLoading={submitting}
                            disabled={!name.trim() || fields.filter(f => f.trim()).length === 0}
                            className={`h-14 rounded-full border-0 shadow-none ${(!name.trim() || fields.filter(f => f.trim()).length === 0) ? 'bg-gray-200' : 'bg-brand-primary'}`}
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
