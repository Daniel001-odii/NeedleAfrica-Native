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
        <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-[#F2F2F7]'}`}>
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="flex-row items-center justify-between px-4 py-3">
                    <IconButton
                        icon={<ArrowLeft size={24} color={isDark ? "white" : "black"} />}
                        variant="ghost"
                        onPress={() => router.back()}
                    />
                    <Typography variant="h2" weight="bold">Edit Measurement</Typography>
                    <IconButton
                        icon={<Trash size={22} color="#EF4444" />}
                        variant="ghost"
                        onPress={handleDelete}
                    />
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1"
                >
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerClassName="pb-10 pt-4"
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Title Section */}
                        <View className="mb-6">
                            <Typography variant="caption" color="gray" weight="medium" className="mb-2 px-6 uppercase tracking-wider">
                                Measurement Title
                            </Typography>
                            <Surface variant="white" className="mx-4 overflow-hidden" rounded="xl">
                                <View className="px-4 py-3.5">
                                    <TextInput
                                        className={`text-[17px] ${isDark ? 'text-white' : 'text-black'}`}
                                        style={{ fontFamily: 'Grotesk-Medium' }}
                                        placeholder="e.g. Shirt for Wedding"
                                        placeholderTextColor={isDark ? "#636366" : "#AEAEB2"}
                                        value={title}
                                        onChangeText={setTitle}
                                    />
                                </View>
                            </Surface>
                        </View>

                        {/* Values Section */}
                        <View className="mb-8">
                            <Typography variant="caption" color="gray" weight="medium" className="mb-2 px-6 uppercase tracking-wider">
                                Measurement Values ({unit})
                            </Typography>
                            <Surface variant="white" className="mx-4 overflow-hidden" rounded="xl">
                                {Object.keys(values).map((field, index, array) => (
                                    <View key={field}>
                                        <View className="flex-row items-center px-4 py-3.5">
                                            <Typography
                                                variant="body"
                                                weight="medium"
                                                className="w-1/3 capitalize"
                                                color="gray"
                                            >
                                                {field}
                                            </Typography>
                                            <TextInput
                                                className={`flex-1 text-[17px] text-right ${isDark ? 'text-white' : 'text-black'}`}
                                                style={{ fontFamily: 'Grotesk-Bold' }}
                                                placeholder="0.0"
                                                placeholderTextColor={isDark ? "#636366" : "#AEAEB2"}
                                                value={String(values[field] || '')}
                                                onChangeText={(text) => handleValueChange(field, text)}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                        {index < array.length - 1 && (
                                            <View className={`h-[0.5px] ml-4 ${isDark ? 'bg-zinc-800' : 'bg-gray-200'}`} />
                                        )}
                                    </View>
                                ))}
                            </Surface>
                        </View>

                        <View className="px-4 mt-4">
                            <Button
                                onPress={handleSave}
                                style={{
                                    borderWidth: 0,
                                }}
                                className={`h-14 text-white rounded-2xl bg-blue-500 rounded-full`}
                                isLoading={submitting}
                            >
                                Save Changes
                            </Button>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

