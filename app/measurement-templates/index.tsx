import React from 'react';
import { View, FlatList, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Typography } from '../../components/ui/Typography';
import { Surface } from '../../components/ui/Surface';
import { IconButton } from '../../components/ui/IconButton';
import { ArrowLeft, Add, Trash, DocumentText } from 'iconsax-react-native';
import { useMeasurementTemplates, MeasurementTemplate } from '../../hooks/useMeasurementTemplates';
import { Swipeable } from 'react-native-gesture-handler';

export default function MeasurementTemplatesScreen() {
    const router = useRouter();
    const { templates, loading, deleteTemplate } = useMeasurementTemplates();

    const handleDelete = (id: string, name: string) => {
        Alert.alert(
            "Delete Template",
            `Are you sure you want to delete "${name}"?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => deleteTemplate(id)
                }
            ]
        );
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
        <View className="flex-1 bg-white">
            <View className="flex-1 p-6 pb-0">
                {/* Header */}
                <View className="flex-row justify-between items-center mb-6">
                    <View className="flex-row items-center gap-3">
                        <IconButton
                            icon={<ArrowLeft size={24} color="black" />}
                            variant="ghost"
                            onPress={() => router.back()}
                        />
                        <Typography variant="h2" weight="bold">Templates</Typography>
                    </View>
                    <IconButton
                        icon={<Add size={24} color="white" />}
                        variant="dark"
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
                                <Surface variant="white" className="flex-row items-center p-5 mb-2 border border-gray-100" rounded="3xl" hasShadow>
                                    <Surface variant="lavender" className="w-12 h-12 items-center justify-center mr-4" rounded="full">
                                        <DocumentText size={24} color="#4F46E5" variant="Bold" />
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
        </View>
    );
}
