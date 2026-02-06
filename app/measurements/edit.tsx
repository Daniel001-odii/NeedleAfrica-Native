import React, { useState, useEffect } from 'react';
import { View, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Typography } from '../../components/ui/Typography';
import { Surface } from '../../components/ui/Surface';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { ArrowLeft, Trash } from 'iconsax-react-native';
import { useCustomerMeasurements } from '../../hooks/useMeasurement';
import Toast from 'react-native-toast-message';

export default function EditMeasurementScreen() {
    const router = useRouter();
    const { measurementId, customerId } = useLocalSearchParams<{ measurementId: string; customerId: string }>();
    const { measurements, updateMeasurement, deleteMeasurement } = useCustomerMeasurements(customerId!);

    const [title, setTitle] = useState('');
    const [values, setValues] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const measurement = measurements.find(m => m.id === measurementId);

    useEffect(() => {
        if (measurement) {
            setTitle(measurement.title);
            try {
                setValues(JSON.parse(measurement.valuesJson));
            } catch (e) {
                setValues({});
            }
        }
    }, [measurement]);

    const handleValueChange = (field: string, text: string) => {
        setValues(prev => ({ ...prev, [field]: text }));
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a title');
            return;
        }

        const hasValues = Object.values(values).some(v => String(v).trim().length > 0);
        if (!hasValues) {
            Alert.alert('Error', 'Please enter at least one measurement value');
            return;
        }

        setSubmitting(true);
        try {
            await updateMeasurement(measurementId!, title, values);
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Measurement updated'
            });
            router.back();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to update measurement');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Measurement',
            'Are you sure you want to delete this measurement?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteMeasurement(measurementId!);
                            Toast.show({
                                type: 'success',
                                text1: 'Deleted',
                                text2: 'Measurement removed'
                            });
                            router.back();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete measurement');
                        }
                    }
                }
            ]
        );
    };

    if (!measurementId || !customerId) return null;

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <View className="flex-1 p-6">
                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-6">
                        <View className="flex-row items-center gap-3">
                            <IconButton
                                icon={<ArrowLeft size={24} color="black" />}
                                variant="ghost"
                                onPress={() => router.back()}
                            />
                            <Typography variant="h2" weight="bold">Edit Measurement</Typography>
                        </View>
                        <IconButton
                            icon={<Trash size={24} color="#EF4444" />}
                            variant="ghost"
                            className="bg-red-50"
                            onPress={handleDelete}
                        />
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerClassName="pb-10"
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Title Input */}
                        <Typography variant="h3" weight="bold" className="mb-2">Title</Typography>
                        <Surface variant="muted" className="px-4 py-3 mb-6" rounded="xl" hasBorder>
                            <TextInput
                                className="text-base text-dark font-medium"
                                placeholder="e.g. Shirt for Wedding"
                                value={title}
                                onChangeText={setTitle}
                            />
                        </Surface>

                        {/* Measurement Values */}
                        <Typography variant="h3" weight="bold" className="mb-4">Values</Typography>
                        <View className="gap-3 mb-8">
                            {Object.keys(values).map((field) => (
                                <View key={field}>
                                    <Typography variant="caption" color="gray" weight="bold" className="mb-1 ml-1 uppercase">{field}</Typography>
                                    <Surface variant="muted" className="px-4 py-3" rounded="xl" hasBorder>
                                        <TextInput
                                            className="text-base text-dark font-medium"
                                            placeholder={`Enter ${field}`}
                                            value={String(values[field] || '')}
                                            onChangeText={(text) => handleValueChange(field, text)}
                                            keyboardType="numeric"
                                        />
                                    </Surface>
                                </View>
                            ))}
                        </View>

                        <Button
                            onPress={handleSave}
                            className="h-16 rounded-full bg-dark"
                            textClassName="text-white"
                            isLoading={submitting}
                        >
                            Save Changes
                        </Button>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
