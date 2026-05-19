import React from 'react';
import { View, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Mirror,
    Scan,
    DocumentText,
    PenTool,
    TrendUp,
    Colorfilter,
    ArrowRight2,
    Setting4,
    Receipt21,
    MoneySend,
    Gallery,
    Lock
} from 'iconsax-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { useRevenueCat } from '../../../hooks/useRevenueCat';
import { Typography } from '../../../components/ui/Typography';
import { IconButton } from '../../../components/ui/IconButton';
import { VirtualTryOnIcon, UnsplashIcon, PinterestIcon } from '../../../components/ui/CustomIcons';

export default function Extras() {
    const router = useRouter();
    const { isDark } = useTheme();
    const { isPro } = useRevenueCat();

    return (
        <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'}`}>

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

                {/* Hero: Catalog Management */}
                <View className="px-4 mt-6">
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => router.push('/(tabs)/extras/catalog-gallery' as any)}
                        className={`overflow-hidden rounded-[32px] ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-blue-600 shadow-xl shadow-blue-200'}`}
                    >
                        <View className="p-6 z-10 w-3/4">
                            <Typography variant="h3" weight="bold" color="white">Catalog Gallery</Typography>
                            <Typography variant="small" className="text-blue-100 mt-1 mb-4">
                                Showcase your best designs and get orders directly from clients.
                            </Typography>
                            <View className="bg-white self-start px-5 py-2.5 rounded-full shadow-sm">
                                <Typography variant="small" weight="bold" className="text-blue-600">Open Gallery</Typography>
                            </View>
                        </View>
                        <View className="absolute -right-8 -bottom-8 opacity-20">
                            <Gallery size={160} color="white" variant="Bulk" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Studio Tools Grid */}
                <SectionLabel label="Creative Tools" />
                <View className="flex-row flex-wrap px-4 justify-between">
                    <ToolCard
                        icon={<DocumentText size={24} color="#10B981" variant="Bulk" />}
                        title="Invoice Editor"
                        desc="Billing and client receipts"
                        onPress={() => router.push('/(tabs)/orders/invoices' as any)}
                    />
                    <ToolCard
                        icon={<Colorfilter size={24} color="#0D9488" variant="Bulk" />}
                        title="Pantone Generator"
                        desc="Fashion color palettes"
                        onPress={() => router.push('/(tabs)/extras/pantone')}
                    />
                    <ToolCard
                        icon={
                            <View style={{ width: 28, height: 28, position: 'relative' }}>
                                <PinterestIcon size={20} color="#E60023" style={{ position: 'absolute', top: 0, left: 0 }} />
                                <View style={{
                                    position: 'absolute',
                                    bottom: -2,
                                    right: -2,
                                    backgroundColor: isDark ? '#27272a' : '#f9fafb',
                                    borderRadius: 6,
                                    padding: 2,
                                    borderWidth: 1.5,
                                    borderColor: isDark ? '#18181b' : '#ffffff'
                                }}>
                                    <UnsplashIcon size={11} color={isDark ? '#ffffff' : '#000000'} />
                                </View>
                            </View>
                        }
                        title="Style Inspo"
                        desc="Browse fashion ideas"
                        onPress={() => router.push('/(tabs)/extras/ideas' as any)}
                    />
                    <ToolCard
                        icon={<PenTool size={24} color="#8B5CF6" variant="Bulk" />}
                        title="Monogram"
                        desc="Embroidery inspirations"
                        infoText="Browse unique monogram designs and patterns. (Coming Soon)"
                    />
                </View>

                {/* AI Innovations Section */}
                <SectionLabel label="AI Labs" showBadge />
                <View className="px-4 gap-y-3 pb-20">
                    <AiToolRow
                        icon={<VirtualTryOnIcon size={24} color="#FF5678" />}
                        title="Virtual Try-on"
                        desc="Mock designs on client photos"
                        onPress={() => router.push('/(tabs)/extras/virtual-tryon')}
                        isLocked={!isPro}
                    />
                    <AiToolRow
                        icon={<PenTool size={22} color="#FDB022" variant="Bulk" />}
                        title="Sketch to Design"
                        desc="Convert sketches to realistic fabric"
                        onPress={() => router.push('/(tabs)/extras/sketch-to-design')}
                        isLocked={!isPro}
                    />
                </View>

            </ScrollView>
        </View>
    );
}

/** 
 * Design System Components
 */

function QuickStat({ icon, label, value }: { icon: any, label: string, value: string }) {
    const { isDark } = useTheme();
    return (
        <View className={`flex-1 flex-row items-center p-4 rounded-2xl ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white shadow-sm shadow-gray-100'}`}>
            <View className={`w-8 h-8 items-center justify-center rounded-lg ${isDark ? 'bg-zinc-800' : 'bg-gray-50'}`}>
                {icon}
            </View>
            <View className="ml-3">
                <Typography variant="caption" color="gray" weight="bold">{label}</Typography>
                <Typography variant="body" weight="bold">{value}</Typography>
            </View>
        </View>
    );
}

function SectionLabel({ label, showBadge }: { label: string, showBadge?: boolean }) {
    return (
        <View className="flex-row items-center mt-10 mb-4 ml-6">
            <Typography variant="caption" color="gray" weight="bold" className="uppercase tracking-widest">
                {label}
            </Typography>
            {showBadge && (
                <View className="ml-2.5 px-2 py-0.5 bg-indigo-500 rounded-lg">
                    <Typography weight="bold" className="text-[9px] text-white">PRO</Typography>
                </View>
            )}
        </View>
    );
}

function ToolCard({ icon, title, desc, onPress, infoText }: { icon: any, title: string, desc: string, onPress?: () => void, infoText?: string }) {
    const { isDark } = useTheme();
    const handlePress = () => onPress ? onPress() : Alert.alert(title, infoText);

    return (
        <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.7}
            className={`w-[48%] mb-4 p-5 rounded-[32px] ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-100'}`}
        >
            <View className={`w-12 h-12 items-center justify-center rounded-2xl mb-4 ${isDark ? 'bg-zinc-800' : 'bg-gray-50'}`}>
                {icon}
            </View>
            <Typography weight="bold" variant="body" className="mb-0.5">{title}</Typography>
            <Typography variant="small" color="gray" numberOfLines={1}>{desc}</Typography>
        </TouchableOpacity>
    );
}

function AiToolRow({ icon, title, desc, onPress, infoText, isLocked }: { icon: any, title: string, desc: string, onPress?: () => void, infoText?: string, isLocked?: boolean }) {
    const { isDark } = useTheme();
    const handlePress = () => onPress ? onPress() : Alert.alert(title, infoText);

    return (
        <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.7}
            className={`flex-row items-center p-5 rounded-[32px] ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-100'}`}
        >
            <View className={`w-12 h-12 items-center justify-center rounded-2xl mr-4 ${isLocked ? 'bg-zinc-500/10' : (isDark ? 'bg-indigo-500/10' : 'bg-indigo-50')}`}>
                {icon}
            </View>
            <View className="flex-1">
                <View className="flex-row items-center mb-0.5">
                    <Typography weight="bold" className={`text-[15px] ${isLocked ? 'opacity-80' : ''}`}>{title}</Typography>
                </View>
                <Typography variant="small" color="gray" numberOfLines={1}>{desc}</Typography>
            </View>
            <ArrowRight2 size={16} color="#9CA3AF" />
        </TouchableOpacity>
    );
}