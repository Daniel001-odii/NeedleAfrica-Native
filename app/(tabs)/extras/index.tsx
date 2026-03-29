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
    MoneySend
} from 'iconsax-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { Typography } from '../../../components/ui/Typography';
import { IconButton } from '../../../components/ui/IconButton';

export default function Extras() {
    const router = useRouter();
    const { isDark } = useTheme();

    return (
        <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-[#F2F2F7]'}`}>

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

                {/* Hero: Invoice Generator */}
                <View className="px-4 mt-6">
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => router.push('/(tabs)/orders/invoices')}
                        className={`overflow-hidden rounded-[32px] ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-blue-600 shadow-xl shadow-blue-200'}`}
                    >
                        <View className="p-6 z-10 w-3/4">
                            <Typography variant="h3" weight="bold" color="white">Professional Invoices</Typography>
                            <Typography variant="small" className="text-blue-100 mt-1 mb-4">
                                Generate and send digital receipts to your clients instantly.
                            </Typography>
                            <View className="bg-white self-start px-5 py-2.5 rounded-full shadow-sm">
                                <Typography variant="small" weight="bold" className="text-blue-600">Create New</Typography>
                            </View>
                        </View>
                        <View className="absolute -right-8 -bottom-8 opacity-20">
                            <DocumentText size={160} color="white" variant="Bulk" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Studio Tools Grid */}
                <SectionLabel label="Creative Tools" />
                <View className="flex-row flex-wrap px-4 justify-between">
                    <ToolCard
                        icon={<Colorfilter size={24} color="#0D9488" variant="Bulk" />}
                        title="Pantone"
                        desc="Color palettes"
                        onPress={() => router.push('/(tabs)/extras/pantone')}
                    />
                    <ToolCard
                        icon={<TrendUp size={24} color="#F43F5E" variant="Bulk" />}
                        title="Tag Walk"
                        desc="Runway trends"
                        onPress={() => router.push('/(tabs)/extras/ideas' as any)}
                    />
                    <ToolCard
                        icon={<DocumentText size={24} color="#10B981" variant="Bulk" />}
                        title="Receipts"
                        desc="Digital records"
                        infoText="Generate digital receipts for your customers after payment."
                    />
                    <ToolCard
                        icon={<PenTool size={24} color="#8B5CF6" variant="Bulk" />}
                        title="Monogram"
                        desc="Embroidery inspo"
                        infoText="Browse unique monogram designs and embroidery patterns."
                    />
                </View>

                {/* AI Innovations Section */}
                <SectionLabel label="AI Labs" />
                <View className="px-4 gap-y-3">
                    <AiToolRow
                        icon={<Mirror size={22} color="#6366f1" variant="Bulk" />}
                        title="Virtual Try-on"
                        desc="Mock designs on client photos"
                        infoText="Upload a client photo to see how designs look before cutting fabric."
                    />
                    <AiToolRow
                        icon={<Scan size={22} color="#FDB022" variant="Bulk" />}
                        title="Fabric Scanner"
                        desc="Identify material & care"
                        infoText="AI analyzes fabric type and suggests best styling techniques."
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

function SectionLabel({ label }: { label: string }) {
    return (
        <Typography variant="caption" color="gray" weight="bold" className="mt-10 mb-4 ml-6 uppercase tracking-widest">
            {label}
        </Typography>
    );
}

function ToolCard({ icon, title, desc, onPress, infoText }: { icon: any, title: string, desc: string, onPress?: () => void, infoText?: string }) {
    const { isDark } = useTheme();
    const handlePress = () => onPress ? onPress() : Alert.alert(title, infoText);

    return (
        <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.7}
            className={`w-[48%] mb-4 p-5 rounded-[32px] ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white shadow-sm shadow-gray-100'}`}
        >
            <View className={`w-12 h-12 items-center justify-center rounded-2xl mb-4 ${isDark ? 'bg-zinc-800' : 'bg-gray-50'}`}>
                {icon}
            </View>
            <Typography weight="bold" variant="body" className="mb-0.5">{title}</Typography>
            <Typography variant="small" color="gray" numberOfLines={1}>{desc}</Typography>
        </TouchableOpacity>
    );
}

function AiToolRow({ icon, title, desc, infoText }: { icon: any, title: string, desc: string, infoText: string }) {
    const { isDark } = useTheme();
    return (
        <TouchableOpacity
            onPress={() => Alert.alert(title, infoText)}
            activeOpacity={0.7}
            className={`flex-row items-center p-5 rounded-[32px] ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white shadow-sm shadow-gray-100'}`}
        >
            <View className={`w-12 h-12 items-center justify-center rounded-2xl mr-4 ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                {icon}
            </View>
            <View className="flex-1">
                <View className="flex-row items-center mb-0.5">
                    <Typography weight="bold" className="text-[15px]">{title}</Typography>
                    <View className="ml-2 px-2 py-0.5 bg-indigo-500 rounded-lg">
                        <Typography weight="bold" className="text-[9px] text-white">AI LABS</Typography>
                    </View>
                </View>
                <Typography variant="small" color="gray" numberOfLines={1}>{desc}</Typography>
            </View>
            <ArrowRight2 size={16} color="#9CA3AF" />
        </TouchableOpacity>
    );
}