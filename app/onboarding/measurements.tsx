import React, { useState } from 'react';
import {
    View,
    TextInput,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useRouter } from 'expo-router';
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
        icon: <HugeiconsLongSleeveShirt color="#3B82F6" />,
        iconBg: '#EFF6FF',
    },
    {
        name: 'Trousers',
        fields: ['Waist', 'Hip', 'Length', 'Thigh', 'Ankle'],
        icon: <HugeiconsJoggerPants color="#10B981" />,
        iconBg: '#F0FDF4',
    },
    {
        name: 'Dress',
        fields: ['Bust', 'Waist', 'Hip', 'Length', 'Shoulder'],
        icon: <HugeiconsDress03 color="#8B5CF6" />,
        iconBg: '#F5F3FF',
    },
];


import Svg, { Path, G, Line } from 'react-native-svg';

export function HugeiconsJoggerPants({ color = '#10B981' }: { color?: string }) {
    return (
        <Svg width="24" height="24" viewBox="0 0 24 24">{/* Icon from Huge Icons by Hugeicons - undefined */}<G fill="none" stroke={color} strokeLinecap="round" strokeWidth="1.5"><Path d="M18.16 5V4c0-.943 0-1.414-.3-1.707C17.559 2 17.075 2 16.107 2H7.893c-.968 0-1.452 0-1.753.293s-.3.764-.3 1.707v1m12.32 0l2.655 14.652c.197 1.09.296 1.633-.012 1.99c-.307.358-.875.358-2.01.358h-1.17c-.73 0-1.096 0-1.368-.196c-.272-.195-.38-.535-.594-1.216l-1.698-5.375C13.16 12.67 12.758 11.4 12 11.4s-1.16 1.271-1.963 3.813L8.34 20.588c-.215.68-.322 1.02-.594 1.216S7.107 22 6.376 22H5.207c-1.135 0-1.703 0-2.01-.357c-.308-.358-.21-.902-.012-1.99L5.84 5m12.32 0H5.84" /><Path strokeLinejoin="round" d="M10 7.778L12 5l3 5" /></G></Svg>
    )
}

export function HugeiconsLongSleeveShirt({ color = '#3B82F6' }: { color?: string }) {
    return (
        <Svg width="24" height="24" viewBox="0 0 24 24">{/* Icon from Huge Icons by Hugeicons - undefined */}<G fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"><Path d="M5.5 7c.329.986.719 1.984.86 3.02c.1.743.06 1.497-.019 3.005L6 19.527c0 .705.12 1.082.755 1.423c2.613 1.4 7.877 1.4 10.49 0c.635-.34.755-.718.755-1.423l-.341-6.502c-.08-1.508-.119-2.262-.018-3.006c.14-1.035.53-2.033.859-3.019" /><Path d="M5.971 18.513c-.466.233-.932.537-1.474.479c-.917-.098-1.13-.54-1.317-1.649L2.1 10.921c-.145-.858-.145-.865.083-1.706l.538-1.983c.364-1.342.546-2.013.982-2.525c.437-.512 1.072-.8 2.343-1.375L8.59 2.179c.395-.178.398-.179.832-.179h5.156c.434 0 .437 0 .832.18l2.544 1.152c1.271.575 1.906.863 2.343 1.375c.436.512.618 1.183.982 2.525l.538 1.983c.228.84.228.848.083 1.706l-1.08 6.422c-.187 1.11-.401 1.552-1.32 1.65c-.567.06-.981-.234-1.474-.48" /><Path d="M9 2.5s.908 1.915 1.66 2.314c.387.204.87.186 1.34.186s.953.018 1.34-.186C14.091 4.414 15 2.5 15 2.5" /></G></Svg>
    )
}

export function HugeiconsDress03({ color = '#8B5CF6' }: { color?: string }) {
    return (
        <Svg width="24" height="24" viewBox="0 0 24 24">{/* Icon from Huge Icons by Hugeicons - undefined */}<G fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"><Path d="m15 4l-3 2l-3-2c-.586.51-1.93 1.293-1.997 2.146c-.029.37.126.571.435.975C8.112 8.002 9 8.521 9 10h6c0-1.48.888-1.998 1.562-2.879c.31-.404.464-.606.434-.975C16.93 5.293 15.587 4.509 15 4M9 4V2m6 2V2m-5.5 8h5m3.5 9c2 0 3-2.173 3-2.173c-2.825-1.836-4.5-3.993-5.413-5.622c-.347-.62-.521-.93-.755-1.068C14.598 10 14.285 10 13.659 10H10.34c-.626 0-.939 0-1.173.137s-.408.447-.755 1.068C7.5 12.834 5.825 14.99 3 16.827C3 16.827 4 19 6 19" /><Path d="M13.706 14c.34.796 1.815 2.671 3.435 4.31c.597.605.896.907.855 1.42c-.04.512-.29.683-.79 1.025C16.07 21.53 14.336 22 12 22s-4.07-.469-5.207-1.245c-.5-.342-.75-.513-.79-1.025c-.04-.513.259-.815.856-1.42c1.62-1.639 3.096-3.514 3.435-4.31" /></G></Svg>
    )
}


import { OnboardingIntroScreen } from '../../components/OnboardingIntroScreen';

export default function AddMeasurements() {
    const { state, updateState, nextStep, prevStep } = useOnboarding();
    const { addMeasurement } = useMeasurements();
    const { addTemplate } = useMeasurementTemplates();
    const router = useRouter();

    const [showIntro, setShowIntro] = useState(true);
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

    const handleSkip = () => {
        updateState({ step: 6 });
        router.push('/onboarding/completion');
    };

    if (showIntro) {
        return (
            <OnboardingIntroScreen
                title="Precision is everything."
                subtitle="Select a standard template or custom-design fields. Say goodbye to messy paper record pads forever."
                stepIndex={4}
                buttonText="Start Measuring"
                onNext={() => setShowIntro(false)}
                onBack={prevStep}
                onSkip={handleSkip}
                illustrationType="measurements"
            />
        );
    }

    if (view === 'pick_template') {
        return (
            <View className="flex-1 bg-white">
                <View className="px-6 pt-4 bg-white flex-row justify-between items-center">
                    <IconButton
                        icon={<ArrowLeft size={24} color="#1F2937" />}
                        onPress={() => setShowIntro(true)}
                        variant="ghost"
                        className="-ml-4"
                    />
                    <TouchableOpacity onPress={handleSkip}>
                        <Typography color="primary" weight="bold" className="text-[16px]">Skip</Typography>
                    </TouchableOpacity>
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

            </View>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <View className="px-6 pt-4 bg-white flex-row justify-between items-center">
                    <IconButton
                        icon={<ArrowLeft size={24} color="#1F2937" />}
                        onPress={() => setView('pick_template')}
                        variant="ghost"
                        className="-ml-4"
                    />
                    <TouchableOpacity onPress={handleSkip}>
                        <Typography color="primary" weight="bold" className="text-[16px]">Skip</Typography>
                    </TouchableOpacity>
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
                                            in
                                        </Typography>
                                    </View>
                                </View>
                            ))}

                            {/* Add Custom Field Inline Row */}
                            {isAddingField ? (
                                <View className="flex-row items-center px-4 py-2 min-h-[56px] bg-brand-primary/10">
                                    <View className="w-5 h-5 rounded-full bg-brand-primary items-center justify-center mr-3">
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
                                    <TouchableOpacity onPress={handleAddField} className="bg-brand-primary px-4 py-2 rounded-full ml-2">
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
                                    <Typography weight="semibold" className="text-brand-primary text-[16px]">
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
                        className={`h-14 rounded-full border-0 shadow-none ${!isFormValid ? 'bg-gray-200' : 'bg-brand-primary'}`}
                        textClassName={`text-lg font-bold ${!isFormValid ? 'text-gray-400' : 'text-white'}`}
                    >
                        Save Measurements
                    </Button>

                </View>
            </KeyboardAvoidingView>
        </View>
    );
}