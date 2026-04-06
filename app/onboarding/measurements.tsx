import React, { useState } from 'react';
import {
    View,
    TextInput,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Ruler, ArrowRight2, MagicStar, Star, ArrowLeft } from 'iconsax-react-native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useMeasurements } from '../../hooks/useMeasurements';
import { useMeasurementTemplates } from '../../hooks/useMeasurementTemplates';
import { IconButton } from '../../components/ui/IconButton';
import Toast from 'react-native-toast-message';
import { TypingText } from '../../components/ui/TypingText';

const DEFAULT_TEMPLATES = [
    {
        name: 'Shirt',
        fields: ['Chest', 'Waist', 'Length', 'Shoulder', 'Sleeve'],
        icon: <MagicStar size={22} color="#3B82F6" variant="Bulk" />,
        iconBg: '#EFF6FF',
    },
    {
        name: 'Trousers',
        fields: ['Waist', 'Hip', 'Length', 'Thigh', 'Ankle'],
        icon: <Ruler size={22} color="#10B981" variant="Bulk" />,
        iconBg: '#F0FDF4',
    },
    {
        name: 'Dress',
        fields: ['Bust', 'Waist', 'Hip', 'Length', 'Shoulder'],
        icon: <Star size={22} color="#8B5CF6" variant="Bulk" />,
        iconBg: '#F5F3FF',
    },
];

export default function AddMeasurements() {
    const { state, updateState, nextStep, prevStep } = useOnboarding();
    const { addMeasurement } = useMeasurements();
    const { addTemplate } = useMeasurementTemplates();

    const [view, setView] = useState<'pick_template' | 'enter_measurements'>(state.template ? 'enter_measurements' : 'pick_template');
    const [selectedTemplate, setSelectedTemplate] = useState<any>(state.template || null);
    const [fields, setFields] = useState<string[]>(state.template?.fields || []);
    const [measurementValues, setMeasurementValues] = useState<Record<string, string>>(state.measurement?.values || {});
    const [isAddingField, setIsAddingField] = useState(false);
    const [newFieldName, setNewFieldName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSelectTemplate = (template: any) => {
        setSelectedTemplate(template);
        setFields([...template.fields]);
        setView('enter_measurements');
    };

    const handleAddField = () => {
        if (!newFieldName.trim()) return;
        if (fields.includes(newFieldName.trim())) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Field already exists' });
            return;
        }
        setFields([...fields, newFieldName.trim()]);
        setNewFieldName('');
        setIsAddingField(false);
    };

    const handleRemoveField = (fieldName: string) => {
        setFields(fields.filter(f => f !== fieldName));
        const newValues = { ...measurementValues };
        delete newValues[fieldName];
        setMeasurementValues(newValues);
    };

    const isFormValid = fields.length > 0 && fields.every(f => measurementValues[f]?.trim());

    const handleSaveMeasurements = async () => {
        if (!state.customer?.id) return;

        if (!isFormValid) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'Please fill out all measurements' });
            return;
        }

        setIsLoading(true);
        try {
            const createdTemplate = await addTemplate({
                name: selectedTemplate.name,
                fields: fields
            });

            if (createdTemplate) {
                await addMeasurement({
                    customerId: state.customer.id,
                    title: `${selectedTemplate.name} Measurements`,
                    valuesJson: JSON.stringify(measurementValues)
                });

                updateState({
                    template: { id: createdTemplate.id, name: createdTemplate.name, fields: fields },
                    measurement: { values: measurementValues },
                    step: 4
                });

                nextStep();
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to save measurements' });
        } finally {
            setIsLoading(false);
        }
    };

    if (view === 'pick_template') {
        return (
            <View className="flex-1 bg-white">
                <View className="px-6 pt-4 bg-white">
                    <IconButton
                        icon={<ArrowLeft size={24} color="#1F2937" />}
                        onPress={prevStep}
                        variant="ghost"
                        className="-ml-4"
                    />
                </View>
                <ScrollView contentContainerClassName="p-6 pb-20 bg-white" showsVerticalScrollIndicator={false}>
                    <View className="mb-8 mt-2">
                        <TypingText variant="h1" weight="bold" className="mb-2 text-gray-900" text="Choose a Template" speed={30} />
                        <Typography color="gray" variant="subtitle" className="leading-5">
                            Select a starting point to measure {state.customer?.name}.
                        </Typography>
                    </View>

                    <View className="mb-8">
                        <Typography variant="caption" color="gray" weight="bold" className="ml-4 mb-2 uppercase tracking-wider text-[11px]">
                            Standard Layouts
                        </Typography>
                        <View className="bg-white border border-gray-100 rounded-[24px] shadow-sm overflow-hidden">
                            {DEFAULT_TEMPLATES.map((tpl, index) => {
                                const isLast = index === DEFAULT_TEMPLATES.length - 1;
                                return (
                                    <TouchableOpacity
                                        key={tpl.name}
                                        onPress={() => handleSelectTemplate(tpl)}
                                        className={`flex-row items-center p-4 active:bg-gray-50 ${!isLast ? 'border-b border-gray-50' : ''}`}
                                    >
                                        <View
                                            className="w-12 h-12 rounded-[16px] items-center justify-center mr-4"
                                            style={{ backgroundColor: tpl.iconBg }}
                                        >
                                            {tpl.icon}
                                        </View>
                                        <View className="flex-1">
                                            <Typography weight="bold" className="text-gray-900 text-[16px] mb-0.5">
                                                {tpl.name}
                                            </Typography>
                                            <Typography color="gray" className="text-[13px]" numberOfLines={1}>
                                                {tpl.fields.join(', ')}
                                            </Typography>
                                        </View>
                                        <ArrowRight2 size={18} color="#9CA3AF" />
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </ScrollView>

                <View className="p-6 bg-white items-center pb-8 border-t border-gray-50">
                    <Typography color="gray" variant="small" weight="medium">Step 4 of 5</Typography>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <View className="px-6 pt-4 bg-white">
                    <IconButton
                        icon={<ArrowLeft size={24} color="#1F2937" />}
                        onPress={() => setView('pick_template')}
                        variant="ghost"
                        className="-ml-4"
                    />
                </View>
                <ScrollView
                    contentContainerClassName="p-6 pb-20 bg-white"
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="mb-8 mt-2">
                        <TypingText variant="h1" weight="bold" className="mb-2 text-gray-900" text="Measurements" speed={30} />
                        <Typography color="gray" variant="subtitle" className="leading-5">
                            Enter values for {state.customer?.name} ({selectedTemplate?.name}).
                        </Typography>
                    </View>

                    <View className="mb-8">
                        <Typography variant="caption" color="gray" weight="bold" className="ml-4 mb-2 uppercase tracking-wider text-[11px]">
                            {selectedTemplate?.name} Details
                        </Typography>
                        <View className="bg-white border border-gray-100 rounded-[24px] shadow-sm overflow-hidden">

                            {/* Measurement Fields */}
                            {fields.map((field: string) => (
                                <View key={field} className="flex-row items-center px-4 py-1.5 min-h-[56px] border-b border-gray-50">

                                    <TouchableOpacity onPress={() => handleRemoveField(field)} className="mr-3 p-1">
                                        <View className="w-5 h-5 rounded-full bg-red-500 items-center justify-center">
                                            <View className="w-2.5 h-[2px] bg-white rounded-full" />
                                        </View>
                                    </TouchableOpacity>

                                    <Typography weight="semibold" className="text-gray-900 w-1/3 text-[15px] capitalize">
                                        {field}
                                    </Typography>

                                    <View className="flex-1 flex-row items-center justify-end">
                                        <TextInput
                                            className="flex-1 text-right font-semibold text-gray-900 text-[16px] min-w-[60px]"
                                            placeholder="0"
                                            placeholderTextColor="#D1D5DB"
                                            keyboardType="numeric"
                                            value={measurementValues[field] || ''}
                                            onChangeText={(val) => setMeasurementValues(prev => ({ ...prev, [field]: val }))}
                                        />
                                        <Typography weight="medium" className="text-gray-400 ml-2 text-[15px]">
                                            cm
                                        </Typography>
                                    </View>
                                </View>
                            ))}

                            {/* Add Custom Field Inline Row */}
                            {isAddingField ? (
                                <View className="flex-row items-center px-4 py-2 min-h-[56px] bg-blue-50/40">
                                    <View className="w-5 h-5 rounded-full bg-blue-500 items-center justify-center mr-3">
                                        <View className="w-2.5 h-[2px] bg-white rounded-full absolute" />
                                        <View className="w-[2px] h-2.5 bg-white rounded-full absolute" />
                                    </View>
                                    <TextInput
                                        className="flex-1 font-semibold text-gray-900 text-[16px]"
                                        placeholder="e.g. Neck, Ankle..."
                                        placeholderTextColor="#9CA3AF"
                                        autoFocus
                                        value={newFieldName}
                                        onChangeText={setNewFieldName}
                                        onSubmitEditing={handleAddField}
                                        returnKeyType="done"
                                    />
                                    <TouchableOpacity onPress={handleAddField} className="bg-blue-600 px-4 py-2 rounded-full ml-2">
                                        <Typography weight="bold" className="text-white text-[13px]">Add</Typography>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => setIsAddingField(true)}
                                    className="flex-row items-center px-4 py-1.5 min-h-[56px] active:bg-gray-50"
                                >
                                    <View className="w-5 h-5 rounded-full bg-green-500 items-center justify-center mr-3">
                                        <View className="w-2.5 h-[2px] bg-white rounded-full absolute" />
                                        <View className="w-[2px] h-2.5 bg-white rounded-full absolute" />
                                    </View>
                                    <Typography weight="semibold" className="text-blue-600 text-[16px]">
                                        Add custom field
                                    </Typography>
                                </TouchableOpacity>
                            )}

                        </View>
                    </View>

                </ScrollView>

                <View className="p-6 bg-white pt-2 border-t border-gray-50">
                    <Button
                        onPress={handleSaveMeasurements}
                        isLoading={isLoading}
                        disabled={!isFormValid}
                        className={`h-14 rounded-full border-0 ${!isFormValid ? 'bg-gray-200' : 'bg-blue-600'}`}
                        textClassName={`text-lg font-bold ${!isFormValid ? 'text-gray-400' : 'text-white'}`}
                    >
                        Save Measurements
                    </Button>

                    <View className="mt-5 items-center pb-2">
                        <Typography color="gray" variant="small" weight="medium">Step 4 of 5</Typography>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}