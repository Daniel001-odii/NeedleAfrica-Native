import React, { useState, useEffect } from 'react';
import { View, TextInput, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Typography } from '../../components/ui/Typography';
import { Surface } from '../../components/ui/Surface';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { ArrowLeft, Add, Trash, Global, InfoCircle, ArrowDown2, ArrowUp2 } from 'iconsax-react-native';
import { useMeasurementTemplates } from '../../hooks/useMeasurementTemplates';
import Toast from 'react-native-toast-message';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function EditTemplateScreen() {
    const router = useRouter();
    const { templateId } = useLocalSearchParams<{ templateId: string }>();
    const { templates, updateTemplate, deleteTemplate } = useMeasurementTemplates();
    const { confirm } = useConfirm();
    const { isDark } = useTheme();

    const template = templates.find(t => t.id === templateId);

    const [name, setName] = useState('');
    const [fields, setFields] = useState<string[]>([]);
    const [isPublic, setIsPublic] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        if (template) {
            setName(template.name || '');
            setFields(template.fields);
            setIsPublic(template.isPublic === true);
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

        setSubmitting(true);
        try {
            await updateTemplate(templateId!, {
                name: name.trim(),
                fields: validFields,
                isPublic
            });
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Template updated'
            });
            router.back();
        } catch (error) {
            console.error(error);
            confirm({
                title: 'Error',
                message: 'Failed to update template',
                confirmText: 'OK',
                onConfirm: () => { }
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        confirm({
            title: 'Delete Template',
            message: `Are you sure you want to delete "${name}"?`,
            confirmText: 'Delete',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await deleteTemplate(templateId!);
                    Toast.show({
                        type: 'success',
                        text1: 'Deleted',
                        text2: 'Template removed'
                    });
                    router.back();
                } catch (error) {
                    confirm({
                        title: 'Error',
                        message: 'Failed to delete template',
                        confirmText: 'OK',
                        onConfirm: () => { }
                    });
                }
            }
        });
    };

    if (!templateId) return null;

    return (
        <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'}`}>
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="flex-1 p-6">
                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-6">
                        <View className="flex-row items-center gap-3">
                            <IconButton
                                icon={<ArrowLeft size={24} color={isDark ? "white" : "black"} />}
                                variant="ghost"
                                onPress={() => router.back()}
                            />
                            <Typography variant="h2" weight="bold">Edit Template</Typography>
                        </View>
                        <IconButton
                            icon={<Trash size={24} color="#EF4444" />}
                            variant="ghost"
                            className={isDark ? "bg-red-900/20" : "bg-red-50"}
                            onPress={handleDelete}
                        />
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-10">
                        {/* Template Name */}
                        <View className="mb-8">
                            <Typography variant="caption" color="gray" weight="bold" className={`ml-4 mb-2 uppercase tracking-wider text-[11px] ${isDark ? 'text-zinc-400' : ''}`}>
                                Template Details
                            </Typography>
                            <View className={`rounded-[24px] overflow-hidden ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-100 shadow-sm'}`}>
                                <View className="flex-row items-center px-4 py-4">
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

                        {/* Measurement Fields */}
                        <View className="mb-8">
                            <Typography variant="caption" color="gray" weight="bold" className={`ml-4 mb-2 uppercase tracking-wider text-[11px] ${isDark ? 'text-zinc-400' : ''}`}>
                                Measurement Fields ({fields.length})
                            </Typography>

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
                                                Public templates appear in the Templates Library for the community to browse. Only your template name and fields will be visible.
                                            </Typography>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Save Button */}
                        <Button
                            variant="primary"
                            className={`w-full h-14 rounded-full mb-10 ${isDark ? 'bg-white' : 'bg-dark'}`}
                            textClassName={isDark ? 'text-dark' : 'text-white'}
                            onPress={handleSave}
                            isLoading={submitting}
                        >
                            Save Changes
                        </Button>
                    </ScrollView>
                </View>
            </SafeAreaView>
        </View>
    );
}