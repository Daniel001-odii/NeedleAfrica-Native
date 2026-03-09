import React from 'react';
import { View, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    MagicStar,
    ArrowRight,
    Mirror,
    Scan,
    DocumentText,
    Setting2,
    Gallery,
    InfoCircle,
    TrendUp,
    Colorfilter,
    PenTool,
    ArrowRight2
} from 'iconsax-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { Surface } from '../../../components/ui/Surface';
import { Typography } from '../../../components/ui/Typography';
import { IconButton } from '../../../components/ui/IconButton';

export default function Extras() {
    const router = useRouter();
    const { isDark } = useTheme();

    return (
        <View className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-white'}`}>
            <ScrollView contentContainerClassName="p-6 pb-32" showsVerticalScrollIndicator={false}>
                {/* Hero Feature: Generate Invoice */}
                <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/(tabs)/orders/invoices/new')}>
                    <Surface variant={isDark ? "muted" : "lavender"} className={`p-6 mb-8 relative overflow-hidden border ${isDark ? 'border-border-dark' : 'border-transparent'}`} rounded="3xl">
                        <View className="z-10 w-3/5">
                            <Typography variant="subtitle" weight="bold" className={`mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Generate Invoice</Typography>
                            <Typography variant="caption" className={`${isDark ? 'text-gray-400' : 'text-gray-700'} mb-6`}>
                                Create and send professional invoices for your tailoring projects instantly.
                            </Typography>
                            <Surface variant={isDark ? "white" : "dark"} className="self-start px-4 py-2" rounded="full">
                                <Typography variant="small" color={isDark ? "black" : "white"} weight="bold">Create Now</Typography>
                            </Surface>
                        </View>

                        {/* Featured Image */}
                        <Image
                            source={{ uri: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&fit=crop' }}
                            className={`absolute -right-12 -top-2 w-48 h-full ${isDark ? 'opacity-20' : 'opacity-40'} rounded-3xl`}
                            style={{ transform: [{ rotate: '15deg' }] }}
                        />
                    </Surface>
                </TouchableOpacity>

                {/* AI Features Grid */}
                <Typography variant="subtitle" weight="bold" className="mb-4">AI Tools</Typography>
                <View className="flex-row flex-wrap justify-between gap-y-4 mb-8">
                    <FeatureCard
                        icon={<Mirror size={24} color={isDark ? "#818CF8" : "#6366f1"} variant="Bulk" />}
                        title="Virtual Try-on"
                        description="Mock designs on models"
                        variant="blue"
                        infoText="Upload a photo of your client to see how the design looks on them before you start sewing. Save time and get immediate visual feedback."
                    />
                    <FeatureCard
                        icon={<Scan size={24} color={isDark ? "#FDB022" : "#FDB022"} variant="Bulk" />}
                        title="Fabric Scanner"
                        description="Identify materials"
                        variant="peach"
                        infoText="Use your camera to scan fabrics. Our AI will help identify the material type, care instructions, and suggest suitable styles for it."
                    />
                    <FeatureCard
                        icon={<DocumentText size={24} color={isDark ? "#34D399" : "#12D39D"} variant="Bulk" />}
                        title="Receipt Gen"
                        description="Auto-create receipts"
                        variant="green"
                        infoText="Automatically generate professional digital receipts for your customers after their payments are confirmed."
                    />
                    <FeatureCard
                        icon={<Setting2 size={24} color={isDark ? "#A78BFA" : "#9B8AFB"} variant="Bulk" />}
                        title="Customize"
                        description="Personalize receipts"
                        variant="lavender"
                        infoText="Customize your receipts with your shop's logo, branding colors, and unique layout arrangements."
                    />
                </View>

                {/* More Features List */}
                <Typography variant="subtitle" weight="bold" className="mb-4">Discovery</Typography>
                <View className="gap-10">
                    <DiscoveryItem
                        icon={<TrendUp size={20} color={isDark ? "white" : "black"} />}
                        title="Tag Walk"
                        subtitle="Discover the latest fashion trends and runways"
                        onPress={() => router.push('/(tabs)/extras/ideas' as any)}
                    />
                    <DiscoveryItem
                        icon={<Colorfilter size={20} color={isDark ? "white" : "black"} />}
                        title="Pantone"
                        subtitle="Explore seasonal color palettes and pairings"
                        onPress={() => router.push('/(tabs)/extras/pantone')}
                    />
                    {/*  <DiscoveryItem
                        icon={<PenTool size={20} color={isDark ? "white" : "black"} />}
                        title="Embroidery"
                        subtitle="Inspiring patterns and stitching techniques"
                        onPress={() => router.push('/(tabs)/extras/embroidery')}
                    /> */}
                </View>

            </ScrollView>
        </View>
    );
}

function FeatureCard({ icon, title, description, variant, comingSoon, infoText }: { icon: React.ReactNode, title: string, description: string, variant: any, comingSoon?: boolean, infoText?: string }) {
    const { isDark } = useTheme();

    // Define dark-mode friendly backgrounds for colorful cards
    const darkVariants: Record<string, string> = {
        blue: 'bg-blue-900/20 border-blue-500/30',
        peach: 'bg-orange-900/20 border-orange-500/30',
        green: 'bg-green-900/20 border-green-500/30',
        lavender: 'bg-indigo-900/20 border-indigo-500/30',
    };

    return (
        <TouchableOpacity
            className="w-[48%] active:scale-95"
            onPress={() => { if (infoText) Alert.alert(title, infoText); }}
        >
            <Surface
                variant={isDark ? 'muted' : variant}
                className={`p-4 h-40 justify-between relative overflow-hidden border ${isDark ? (darkVariants[variant] || 'border-border-dark') : 'border-transparent'}`}
                rounded="2xl"
            >
                {comingSoon && (
                    <View className={`absolute top-3 right-3 px-2 py-0.5 rounded-md ${isDark ? 'bg-white/10' : 'bg-black/5'}`}>
                        <Typography variant="small" weight="bold" className={`text-[10px] uppercase ${isDark ? 'text-white/40' : 'text-black/40'}`}>Soon</Typography>
                    </View>
                )}
                <View className="flex-row justify-between w-full">
                    <View className={`w-10 h-10 ${isDark ? 'bg-white/10' : 'bg-white/50'} rounded-xl items-center justify-center`}>
                        {icon}
                    </View>
                </View>
                <View>
                    <Typography variant="body" weight="bold" className="mb-1">{title}</Typography>
                    <Typography variant="small" color="gray" numberOfLines={2}>{description}</Typography>
                </View>
            </Surface>
        </TouchableOpacity>
    );
}

function DiscoveryItem({ icon, title, subtitle, onPress }: { icon: React.ReactNode, title: string, subtitle: string, onPress?: () => void }) {
    const { isDark } = useTheme();
    return (
        <TouchableOpacity
            className={`flex-row items-center`}
            onPress={onPress}
        >
            <View className={`w-10 h-10 ${isDark ? 'bg-dark-800' : 'bg-white'} rounded-xl items-center justify-center mr-4`}>
                {icon}
            </View>
            <View className="flex-1">
                <Typography variant="body" weight="bold">{title}</Typography>
                <Typography variant="small" color="gray">{subtitle}</Typography>
            </View>
            <ArrowRight2 size={18} color="#9CA3AF" />
        </TouchableOpacity>
    );
}
