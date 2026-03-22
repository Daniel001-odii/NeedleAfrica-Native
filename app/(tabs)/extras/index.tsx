import React from 'react';
import { View, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import {
    Mirror,
    Scan,
    DocumentText,
    PenTool,
    TrendUp,
    Colorfilter
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
                <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/(tabs)/orders/invoices')}>
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

                {/* Studio Tools + AI Grid */}
                <Typography variant="subtitle" weight="bold" className="mb-4">Studio Tools + AI</Typography>
                <View className="flex-row flex-wrap justify-between gap-y-4 mb-8">

                    <FeatureCard
                        icon={<Colorfilter size={24} color={isDark ? "#2DD4BF" : "#0D9488"} variant="Bulk" />}
                        title="Pantone"
                        description="Seasonal color palettes"
                        variant="blue"
                        onPress={() => router.push('/(tabs)/extras/pantone')}
                    />

                    <FeatureCard
                        icon={<TrendUp size={24} color={isDark ? "#FB7185" : "#F43F5E"} variant="Bulk" />}
                        title="Tag Walk"
                        description="Fashion trends & runways"
                        variant="peach"
                        onPress={() => router.push('/(tabs)/extras/ideas' as any)}
                    />

                    <FeatureCard
                        icon={<DocumentText size={24} color={isDark ? "#34D399" : "#12D39D"} variant="Bulk" />}
                        title="Receipt Maker"
                        description="Create customized receipts"
                        variant="green"
                        infoText="Automatically generate professional digital receipts for your customers after their payments are confirmed."
                    />
                    <FeatureCard
                        icon={<PenTool size={24} color={isDark ? "#A78BFA" : "#9B8AFB"} variant="Bulk" />}
                        title="Monogram Inspo"
                        description="Browse embroidery ideas"
                        variant="lavender"
                        infoText="Browse a collection of unique monogram designs and embroidery patterns to add a personalized touch to your tailored pieces."
                    />

                    <FeatureCard
                        icon={<Mirror size={24} color={isDark ? "#818CF8" : "#6366f1"} variant="Bulk" />}
                        title="Virtual Try-on"
                        description="Mock designs on models"
                        variant="blue"
                        isAI
                        infoText="Upload a photo of your client to see how the design looks on them before you start sewing. Save time and get immediate visual feedback."
                    />
                    <FeatureCard
                        icon={<Scan size={24} color={isDark ? "#FDB022" : "#FDB022"} variant="Bulk" />}
                        title="Fabric Scanner"
                        description="Identify materials"
                        variant="peach"
                        isAI
                        infoText="Use your camera to scan fabrics. Our AI will help identify the material type, care instructions, and suggest suitable styles for it."
                    />





                </View>

            </ScrollView>
        </View>
    );
}

function FeatureCard({ icon, title, description, variant, comingSoon, isAI, infoText, onPress }: { icon: React.ReactNode, title: string, description: string, variant: any, comingSoon?: boolean, isAI?: boolean, infoText?: string, onPress?: () => void }) {
    const { isDark } = useTheme();

    // Define dark-mode friendly backgrounds for colorful cards
    const darkVariants: Record<string, string> = {
        blue: 'bg-blue-900/20 border-blue-500/30',
        peach: 'bg-orange-900/20 border-orange-500/30',
        green: 'bg-green-900/20 border-green-500/30',
        lavender: 'bg-indigo-900/20 border-indigo-500/30',
    };

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else if (infoText) {
            Alert.alert(title, infoText);
        }
    };

    return (
        <TouchableOpacity
            className="w-[48%] active:scale-95"
            onPress={handlePress}
        >
            <Surface
                variant={isDark ? 'muted' : variant}
                className={`p-4 h-[120px] justify-between relative overflow-hidden border ${isDark ? (darkVariants[variant] || 'border-border-dark') : 'border-transparent'}`}
                rounded="2xl"
            >
                {comingSoon && (
                    <View className={`absolute top-3 right-3 px-2 py-0.5 rounded-md ${isDark ? 'bg-white/10' : 'bg-black/5'}`}>
                        <Typography variant="small" weight="bold" className={`text-[10px] uppercase ${isDark ? 'text-white/40' : 'text-black/40'}`}>Soon</Typography>
                    </View>
                )}
                {isAI && (
                    <View className={`absolute top-3 right-3 px-2 py-0.5 rounded-md ${isDark ? 'bg-white' : 'bg-black'}`}>
                        <Typography variant="small" weight="bold" className={`text-[10px] uppercase ${isDark ? 'text-black' : 'text-white'}`}>AI</Typography>
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


