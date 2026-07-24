import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Add, TickCircle, DocumentText, Global } from 'iconsax-react-native';
import { Typography } from '../../components/ui/Typography';
import { IconButton } from '../../components/ui/IconButton';
import { useTheme } from '../../contexts/ThemeContext';
import { useMeasurementTemplates, MeasurementTemplate } from '../../hooks/useMeasurementTemplates';
import { TEMPLATE_LIBRARY, PresetMeasurementTemplate } from '../../constants/presetMeasurementTemplates';
import { useResourceLimits } from '../../hooks/useResourceLimits';
import { useAuth } from '../../contexts/AuthContext';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import axiosInstance from '../../lib/axios';

interface MarketplaceTemplate {
    id: string;
    name: string;
    fields: string[];
    userId: string;
    publisherName?: string;
    createdAt: string;
    updatedAt: string;
}

export default function TemplatesLibraryScreen() {
    const { isDark } = useTheme();
    const { templates, addTemplate } = useMeasurementTemplates();
    const { user } = useAuth();
    const { getLimitStatus } = useResourceLimits();

    const isPro = user?.subscriptionPlan === 'PRO' || user?.subscriptionPlan === 'STUDIO_AI';
    const templateLimit = getLimitStatus('templates');

    const [marketplaceTemplates, setMarketplaceTemplates] = useState<MarketplaceTemplate[]>([]);
    const [loadingMarketplace, setLoadingMarketplace] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchMarketplace = async () => {
        try {
            const res = await axiosInstance.get('/measurement-templates?public=true');
            setMarketplaceTemplates(res.data || []);
        } catch (error) {
            console.error('Failed to fetch marketplace templates:', error);
        } finally {
            setLoadingMarketplace(false);
            setRefreshing(false);
        }
    };

    // Fetch marketplace templates from API on mount
    useEffect(() => {
        fetchMarketplace();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchMarketplace();
    };

    // Track which templates are already in the user's collection
    const existingTemplateNames = new Set(
        templates.map(t => (t.name || '').toLowerCase().trim())
    );

    // Filter marketplace templates — exclude user's own and already-added ones
    const filteredMarketplace = marketplaceTemplates.filter(
        t => t.userId !== user?.id && !existingTemplateNames.has(t.name.toLowerCase().trim())
    );

    const handleAddTemplate = async (preset: PresetMeasurementTemplate | MarketplaceTemplate) => {
        // Check limit for non-Pro users
        if (!isPro && templateLimit.current >= templateLimit.limit) {
            Toast.show({
                type: 'info',
                text1: 'Template Limit Reached',
                text2: `Free users can have up to ${templateLimit.limit} templates. Upgrade to Pro for unlimited.`,
            });
            return;
        }

        try {
            await addTemplate({ name: preset.name, fields: [...preset.fields] });
            Toast.show({
                type: 'success',
                text1: 'Template Added',
                text2: `"${preset.name}" has been added to your templates.`,
            });
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Failed',
                text2: error.message || 'Could not add template.',
            });
        }
    };

    const cardBaseStyle = isDark
        ? 'bg-zinc-900 border border-zinc-800'
        : 'bg-white border border-gray-100 shadow-sm shadow-gray-100/50';

    return (
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
            <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'}`}>
                {/* Header */}
                <View className={`px-4 pt-2 pb-2 flex-row items-center justify-between ${isDark ? 'bg-black border-b border-white/5' : 'bg-white border-b border-gray-50'}`}>
                    <View className="flex-row items-center">
                        <IconButton
                            icon={<ArrowLeft size={22} color={isDark ? 'white' : 'black'} />}
                            onPress={() => router.back()}
                            variant="ghost"
                        />
                        <Typography variant="h3" weight="bold" className="ml-2">
                            Templates Library
                        </Typography>
                    </View>
                    <View className="flex-row items-center">
                        {!isPro && (
                            <View className={`px-2 py-0.5 rounded-lg mr-2 ${isDark ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}>
                                <Typography variant="small" weight="bold" className={isDark ? 'text-indigo-400' : 'text-indigo-600'}>
                                    {templateLimit.current}/{templateLimit.limit}
                                </Typography>
                            </View>
                        )}
                        <TouchableOpacity onPress={() => router.push('/measurement-templates')}>
                            <Typography color="primary" weight="bold" className="text-[14px]">
                                My Templates
                            </Typography>
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView
                    contentContainerClassName="p-5 pb-12"
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={isDark ? '#60a5fa' : '#3b82f6'}
                            colors={['#3b82f6']}
                        />
                    }
                >
                    {/* Sub-header */}
                    <View className="mb-6">
                        <Typography variant="body" color="gray" weight="medium" className="text-center px-4 leading-relaxed">
                            Browse ready-made measurement templates for different garment types.
                            Tap <Typography weight="bold" color="primary">Add</Typography> to include one in your collection.
                        </Typography>
                    </View>


                    {/* Category: Community Marketplace */}
                    {filteredMarketplace.length > 0 && (
                        <>
                            <Typography variant="caption" color="gray" weight="bold" className="ml-1 mb-3 uppercase tracking-wider text-[11px]">
                                Community Templates
                            </Typography>

                            <View className="gap-3 mb-8">
                                {filteredMarketplace.map((item) => (
                                    <MarketplaceTemplateCard
                                        key={item.id}
                                        item={item}
                                        onAdd={() => handleAddTemplate(item)}
                                        cardBaseStyle={cardBaseStyle}
                                        isDark={isDark}
                                    />
                                ))}
                            </View>
                        </>
                    )}

                    {/* Category: Core Templates */}
                    <Typography variant="caption" color="gray" weight="bold" className="ml-1 mb-3 uppercase tracking-wider text-[11px]">
                        Core Garments
                    </Typography>

                    <View className="gap-3 mb-8">
                        {TEMPLATE_LIBRARY.slice(0, 7).map((preset) => {
                            const isAlreadyAdded = existingTemplateNames.has(preset.name.toLowerCase().trim());
                            return (
                                <TemplateLibraryCard
                                    key={preset.name}
                                    preset={preset}
                                    isAlreadyAdded={isAlreadyAdded}
                                    onAdd={() => handleAddTemplate(preset)}
                                    cardBaseStyle={cardBaseStyle}
                                    isDark={isDark}
                                />
                            );
                        })}
                    </View>

                    {/* Category: Traditional / African Wear */}
                    <Typography variant="caption" color="gray" weight="bold" className="ml-1 mb-3 uppercase tracking-wider text-[11px]">
                        Traditional / African Wear
                    </Typography>

                    <View className="gap-3 mb-8">
                        {TEMPLATE_LIBRARY.slice(7, 11).map((preset) => {
                            const isAlreadyAdded = existingTemplateNames.has(preset.name.toLowerCase().trim());
                            return (
                                <TemplateLibraryCard
                                    key={preset.name}
                                    preset={preset}
                                    isAlreadyAdded={isAlreadyAdded}
                                    onAdd={() => handleAddTemplate(preset)}
                                    cardBaseStyle={cardBaseStyle}
                                    isDark={isDark}
                                />
                            );
                        })}
                    </View>

                    {/* Category: Formal & Specialty */}
                    <Typography variant="caption" color="gray" weight="bold" className="ml-1 mb-3 uppercase tracking-wider text-[11px]">
                        Formal & Specialty
                    </Typography>

                    <View className="gap-3 mb-8">
                        {TEMPLATE_LIBRARY.slice(11).map((preset) => {
                            const isAlreadyAdded = existingTemplateNames.has(preset.name.toLowerCase().trim());
                            return (
                                <TemplateLibraryCard
                                    key={preset.name}
                                    preset={preset}
                                    isAlreadyAdded={isAlreadyAdded}
                                    onAdd={() => handleAddTemplate(preset)}
                                    cardBaseStyle={cardBaseStyle}
                                    isDark={isDark}
                                />
                            );
                        })}
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

function MarketplaceTemplateCard({
    item,
    onAdd,
    cardBaseStyle,
    isDark,
}: {
    item: MarketplaceTemplate;
    onAdd: () => void;
    cardBaseStyle: string;
    isDark: boolean;
}) {
    return (
        <View className={`rounded-[20px] p-4 ${cardBaseStyle}`}>
            <View className="flex-row items-start justify-between">
                <View className="flex-1 mr-3">
                    <View className="flex-row items-center mb-2">
                        <View className={`w-8 h-8 rounded-xl items-center justify-center mr-3 ${isDark ? 'bg-emerald-900/20' : 'bg-emerald-50'}`}>
                            <Global size={18} color={isDark ? "#34D399" : "#10B981"} variant="Bulk" />
                        </View>
                        <View className="flex-1">
                            <Typography variant="body" weight="bold" className="text-[15px]">
                                {item.name}
                            </Typography>
                            <View className="flex-row items-center gap-1">
                                <Typography variant="caption" color="gray">
                                    {item.fields.length} fields
                                </Typography>
                                {item.publisherName && (
                                    <>
                                        <Typography variant="caption" color="gray">·</Typography>
                                        <Typography variant="caption" color="gray" className={isDark ? 'text-zinc-400' : ''}>
                                            by {item.publisherName}
                                        </Typography>
                                    </>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Field Tags */}
                    <View className="flex-row flex-wrap gap-1.5 ml-11">
                        {item.fields.map((field) => (
                            <View
                                key={field}
                                className={`px-2.5 py-1 rounded-lg ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}
                            >
                                <Typography variant="small" className="text-[11px]" color="gray" weight="medium">
                                    {field}
                                </Typography>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Add Button */}
                <TouchableOpacity
                    onPress={onAdd}
                    activeOpacity={0.7}
                    className="bg-green-600 px-4 py-2 rounded-full flex-row items-center"
                >
                    <Add size={16} color="white" />
                    <Typography variant="small" weight="bold" className="text-white ml-1 text-[12px]">
                        Add
                    </Typography>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function TemplateLibraryCard({
    preset,
    isAlreadyAdded,
    onAdd,
    cardBaseStyle,
    isDark,
}: {
    preset: PresetMeasurementTemplate;
    isAlreadyAdded: boolean;
    onAdd: () => void;
    cardBaseStyle: string;
    isDark: boolean;
}) {
    return (
        <View className={`rounded-[20px] p-4 ${cardBaseStyle}`}>
            <View className="flex-row items-start justify-between">
                <View className="flex-1 mr-3">
                    <View className="flex-row items-center mb-2">
                        <View className={`w-8 h-8 rounded-xl items-center justify-center mr-3 ${isDark ? 'bg-indigo-900/20' : 'bg-blue-50'}`}>
                            <DocumentText size={18} color={isDark ? "#ff8fa3" : "#3b82f6"} variant="Bulk" />
                        </View>
                        <View className="flex-1">
                            <Typography variant="body" weight="bold" className="text-[15px]">
                                {preset.name}
                            </Typography>
                            <Typography variant="caption" color="gray">
                                {preset.fields.length} fields
                            </Typography>
                        </View>
                    </View>

                    {/* Field Tags */}
                    <View className="flex-row flex-wrap gap-1.5 ml-11">
                        {preset.fields.map((field) => (
                            <View
                                key={field}
                                className={`px-2.5 py-1 rounded-lg ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}
                            >
                                <Typography variant="small" className="text-[11px]" color="gray" weight="medium">
                                    {field}
                                </Typography>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Add / Added Button */}
                {isAlreadyAdded ? (
                    <View className="flex-row items-center bg-green-100 dark:bg-green-900/30 px-3 py-2 rounded-full">
                        <TickCircle size={16} color="#10B981" variant="Bold" />
                        <Typography variant="small" weight="bold" className="text-green-600 dark:text-green-400 ml-1.5 text-[12px]">
                            Added
                        </Typography>
                    </View>
                ) : (
                    <TouchableOpacity
                        onPress={onAdd}
                        activeOpacity={0.7}
                        className="bg-blue-600 px-4 py-2 rounded-full flex-row items-center"
                    >
                        <Add size={16} color="white" />
                        <Typography variant="small" weight="bold" className="text-white ml-1 text-[12px]">
                            Add
                        </Typography>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}