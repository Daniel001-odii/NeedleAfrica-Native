import React, { useState, useEffect } from 'react';
import { View, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Typography } from '../../components/ui/Typography';
import { Surface } from '../../components/ui/Surface';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { ArrowLeft, Trash } from 'iconsax-react-native';
import { useCustomerMeasurements } from '../../hooks/useMeasurement';
import Toast from 'react-native-toast-message';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

export default function EditMeasurementScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { measurementId, customerId } = useLocalSearchParams<{ measurementId: string; customerId: string }>();
    const { measurements, updateMeasurement, deleteMeasurement } = useCustomerMeasurements(customerId!);
    const { confirm } = useConfirm();
    const { isDark } = useTheme();

    const unit = user?.measurementUnit || 'inch';

    const [title, setTitle] = useState('');
    const [values, setValues] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const measurement = measurements.find(m => m.id === measurementId);

    useEffect(() => {
        if (measurement) {
            setTitle(measurement.title || '');
            try {
                setValues(JSON.parse(measurement.valuesJson || '{}'));
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
            confirm({
                title: 'Error',
                message: 'Please enter a title',
                confirmText: 'OK',
                onConfirm: () => { }
            });
            return;
        }

        const hasValues = Object.values(values).some(v => String(v).trim().length > 0);
        if (!hasValues) {
            confirm({
                title: 'Error',
                message: 'Please enter at least one measurement value',
                confirmText: 'OK',
                onConfirm: () => { }
            });
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
            confirm({
                title: 'Error',
                message: 'Failed to update measurement',
                confirmText: 'OK',
                onConfirm: () => { }
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        confirm({
            title: 'Delete Measurement',
            message: 'Are you sure you want to delete this measurement?',
            confirmText: 'Delete',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await deleteMeasurement(measurementId!);
                    Toast.show({
                        type: 'success',
                        text1: 'Deleted',
                        text2: 'Measurement removed'
                    });
                    router.back();
                } catch (error) {
                    confirm({
                        title: 'Error',
                        message: 'Failed to delete measurement',
                        confirmText: 'OK',
                        onConfirm: () => { }
                    });
                }
            }
        });
    };

    if (!measurementId || !customerId) return null;

    return (
        <View className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-white'}`}>
            <SafeAreaView className="flex-1" edges={['top']}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1"
                >
                    <View className="flex-1 p-6">
                        {/* Header */}
                        <View className="flex-row items-center justify-between mb-6">
                            <View className="flex-row items-center gap-3">
                                <IconButton
                                    icon={<ArrowLeft size={24} color={isDark ? "white" : "black"} />}
                                    variant="ghost"
                                    onPress={() => router.back()}
                                />
                                <Typography variant="h2" weight="bold">Edit Measurement</Typography>
                            </View>
                            <IconButton
                                icon={<Trash size={24} color="#EF4444" />}
                                variant="ghost"
                                className={isDark ? "bg-red-900/20" : "bg-red-50"}
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
                            <Surface variant="muted" className={`px-4 py-3 mb-6 border ${isDark ? 'bg-surface-muted-dark border-border-dark' : 'border-gray-100'}`} rounded="xl" hasBorder>
                                <TextInput
                                    className={`text-base font-medium ${isDark ? 'text-white' : 'text-dark'}`}
                                    placeholder="e.g. Shirt for Wedding"
                                    placeholderTextColor="#9CA3AF"
                                    value={title}
                                    onChangeText={setTitle}
                                />
                            </Surface>

                            {/* Measurement Values */}
                            <Typography variant="h3" weight="bold" className="mb-4">Values</Typography>
                            <View className="gap-3 mb-8">
                                {Object.keys(values).map((field) => (
                                    <View key={field}>
                                        <Typography variant="caption" color="gray" weight="bold" className="mb-1 ml-1 uppercase">{field} ({unit})</Typography>
                                        <Surface variant="muted" className={`px-4 py-3 border ${isDark ? 'bg-surface-muted-dark border-border-dark' : 'border-gray-100'}`} rounded="xl" hasBorder>
                                            <TextInput
                                                className={`text-base font-medium ${isDark ? 'text-white' : 'text-dark'}`}
                                                placeholder={`Enter ${field}`}
                                                placeholderTextColor="#9CA3AF"
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
                                className={`h-16 rounded-full ${isDark ? 'bg-white' : 'bg-dark'}`}
                                textClassName={isDark ? 'text-dark' : 'text-white'}
                                isLoading={submitting}
                            >
                                Save Changes
                            </Button>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
