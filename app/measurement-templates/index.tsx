import React from 'react';
import { View, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Typography } from '../../components/ui/Typography';
import { Surface } from '../../components/ui/Surface';
import { IconButton } from '../../components/ui/IconButton';
import { ArrowLeft, Add, Trash, DocumentText } from 'iconsax-react-native';
import { useMeasurementTemplates, MeasurementTemplate } from '../../hooks/useMeasurementTemplates';
import { Swipeable } from 'react-native-gesture-handler';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useResourceLimits } from '../../hooks/useResourceLimits';

export default function MeasurementTemplatesScreen() {
    const router = useRouter();
    const { templates, loading, deleteTemplate } = useMeasurementTemplates();
    const { confirm } = useConfirm();
    const { isDark } = useTheme();
    const { user } = useAuth();
    const { getLimitStatus } = useResourceLimits();

    const isPro = user?.subscriptionPlan === 'PRO' || user?.subscriptionPlan === 'STUDIO_AI';
    const templateLimit = getLimitStatus('templates');

    const handleDelete = (id: string, name: string) => {
        confirm({
            title: "Delete Template",
            message: `Are you sure you want to delete "${name}"?`,
            confirmText: "Delete",
            type: "danger",
            onConfirm: () => deleteTemplate(id)
        });
    };

    const renderRightActions = (item: MeasurementTemplate) => {
        return (
            <View className="pl-4 mb-2 justify-center">
                <Pressable
                    onPress={() => handleDelete(item.id, item.name || 'Template')}
                    className="bg-red-50 justify-center items-center w-16 h-16 rounded-3xl"
                >
                    <Trash size={24} color="red" variant="Bold" />
                </Pressable>
            </View>
        );
    };

    return (
        <View className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-white'}`}>
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="flex-1 p-6 pb-0">
                    {/* Header */}
                    <View className="flex-row justify-between items-center mb-6">
                        <View className="flex-row items-center gap-3">
                            <IconButton
                                icon={<ArrowLeft size={24} color={isDark ? "white" : "black"} />}
                                variant="ghost"
                                onPress={() => router.back()}
                            />
                            <View className="flex-row items-center">
                                <Typography variant="h2" weight="bold">Templates</Typography>
                                {!isPro && (
                                    <View className={`ml-3 px-2 py-0.5 rounded-lg ${isDark ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}>
                                        <Typography variant="small" weight="bold" className={isDark ? 'text-indigo-400' : 'text-indigo-600'}>
                                            {templateLimit.current}/{templateLimit.limit}
                                        </Typography>
                                    </View>
                                )}
                            </View>
                        </View>
                        <IconButton
                            icon={<Add size={24} color={isDark ? "white" : "black"} />}
                            variant={"glass"}
                            onPress={() => router.push('/measurement-templates/create')}
                        />
                    </View>

                    <FlatList
                        data={templates}
                        keyExtractor={item => item.id}
                        contentContainerClassName="pt-2 pb-16 gap-3"
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <Swipeable
                                renderRightActions={() => renderRightActions(item)}
                            >
                                <Pressable onPress={() => router.push({ pathname: '/measurement-templates/edit', params: { templateId: item.id } })}>
                                    <Surface
                                        variant="white"
                                        className={`flex-row items-center p-5 mb-2 border ${isDark ? 'bg-surface-dark border-border-dark' : 'border-gray-100'}`}
                                        rounded="3xl"
                                        hasShadow={!isDark}
                                        hasBorder={isDark}
                                    >
                                        <Surface variant="lavender" className={`w-12 h-12 items-center justify-center mr-4 ${isDark ? 'bg-indigo-900/40' : 'bg-soft-lavender'}`} rounded="full">
                                            <DocumentText size={24} color={isDark ? "#818CF8" : "#4F46E5"} variant="Bold" />
                                        </Surface>
                                        <View className="flex-1">
                                            <Typography variant="body" weight="bold">{item.name}</Typography>
                                            <Typography variant="caption" color="gray">
                                                {item.fields.length} Fields: {item.fields.slice(0, 3).join(', ')}{item.fields.length > 3 ? '...' : ''}
                                            </Typography>
                                        </View>
                                    </Surface>
                                </Pressable>
                            </Swipeable>
                        )}
                        ListEmptyComponent={
                            !loading ? (
                                <View className="items-center justify-center py-20">
                                    <Typography variant="body" color="gray">No templates found. Create one to get started.</Typography>
                                </View>
                            ) : null
                        }
                    />
                </View>
            </SafeAreaView>
        </View>
    );
}
