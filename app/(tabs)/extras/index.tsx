import React from 'react';
import { View, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    MagicStar,
    ArrowRight,
    Mirror,
    Scan,
    DocumentText,
    Setting2,
    Gallery,
    InfoCircle
} from 'iconsax-react-native';
import { useRouter } from 'expo-router';
import { Surface } from '../../../components/ui/Surface';
import { Typography } from '../../../components/ui/Typography';
import { IconButton } from '../../../components/ui/IconButton';

export default function Extras() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-white">
            <ScrollView contentContainerClassName="p-6 pb-32" showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View className="flex-row justify-between items-center mb-8">
                    <Typography variant="h2" weight="bold">Extras</Typography>
                    <Surface variant="lavender" className="px-4 py-2" rounded="full">
                        <View className="flex-row items-center">
                            <MagicStar size={16} color="#6366f1" variant="Bold" />
                            <Typography variant="small" weight="bold" className="ml-2 text-brand-primary">PRO</Typography>
                        </View>
                    </Surface>
                </View>

                {/* Hero Feature: Generate Invoice */}
                <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/(tabs)/orders/invoices/new')}>
                    <Surface variant="lavender" className="p-6 mb-8 relative overflow-hidden" rounded="3xl">
                        <View className="z-10 w-3/5">
                            <Typography variant="subtitle" weight="bold" color="black" className="mb-2">Generate Invoice</Typography>
                            <Typography variant="caption" className="text-gray-700 mb-6">
                                Create and send professional invoices for your tailoring projects instantly.
                            </Typography>
                            <Surface variant="dark" className="self-start px-4 py-2" rounded="full">
                                <Typography variant="small" color="white" weight="bold">Create Now</Typography>
                            </Surface>
                        </View>

                        {/* Featured Image */}
                        <Image
                            source={{ uri: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&fit=crop' }}
                            className="absolute -right-12 -top-2 w-48 h-full opacity-40"
                            style={{ transform: [{ rotate: '15deg' }] }}
                        />
                    </Surface>
                </TouchableOpacity>

                {/* AI Features Grid */}
                <Typography variant="subtitle" weight="bold" className="mb-4">AI Tools</Typography>
                <View className="flex-row flex-wrap justify-between gap-y-4 mb-8">
                    <FeatureCard
                        icon={<Mirror size={24} color="#6366f1" variant="Bulk" />}
                        title="Virtual Try-on"
                        description="Mock designs on models"
                        variant="blue"
                        comingSoon
                        infoText="Upload a photo of your client to see how the design looks on them before you start sewing. Save time and get immediate visual feedback."
                    />
                    <FeatureCard
                        icon={<Scan size={24} color="#FDB022" variant="Bulk" />}
                        title="Fabric Scanner"
                        description="Identify materials"
                        variant="peach"
                        comingSoon
                        infoText="Use your camera to scan fabrics. Our AI will help identify the material type, care instructions, and suggest suitable styles for it."
                    />
                    <FeatureCard
                        icon={<DocumentText size={24} color="#12D39D" variant="Bulk" />}
                        title="Receipt Gen"
                        description="Auto-create receipts"
                        variant="green"
                        comingSoon
                        infoText="Automatically generate professional digital receipts for your customers after their payments are confirmed."
                    />
                    <FeatureCard
                        icon={<Setting2 size={24} color="#9B8AFB" variant="Bulk" />}
                        title="Customize"
                        description="Personalize receipts"
                        variant="lavender"
                        comingSoon
                        infoText="Customize your receipts with your shop's logo, branding colors, and unique layout arrangements."
                    />
                </View>

                {/* More Features List */}
                <Typography variant="subtitle" weight="bold" className="mb-4">Discovery</Typography>
                <View className="gap-4">
                    <DiscoveryItem
                        icon={<Gallery size={20} color="black" />}
                        title="Cloth Ideas"
                        subtitle="Explore creative tailoring outfit concepts"
                        onPress={() => router.push('/(tabs)/extras/ideas' as any)}
                    />
                </View>

            </ScrollView>
        </View>
    );
}

import {
    Alert
} from 'react-native';

function FeatureCard({ icon, title, description, variant, comingSoon, infoText }: { icon: React.ReactNode, title: string, description: string, variant: any, comingSoon?: boolean, infoText?: string }) {
    return (
        <TouchableOpacity className="w-[48%] active:scale-95" onPress={() => {
            if (infoText) Alert.alert(title, infoText);
        }}>
            <Surface variant={variant} className="p-4 h-40 justify-between relative overflow-hidden" rounded="2xl">
                {comingSoon && (
                    <View className="absolute top-3 right-3 bg-black/5 px-2 py-0.5 rounded-md">
                        <Typography variant="small" weight="bold" className="text-[10px] uppercase text-black/40">Soon</Typography>
                    </View>
                )}
                <View className="flex-row justify-between w-full">
                    <View className="w-10 h-10 bg-white/50 rounded-xl items-center justify-center">
                        {icon}
                    </View>
                    {/* {infoText && (
                        <TouchableOpacity onPress={() => Alert.alert(title, infoText)} hitSlop={10}>
                            <InfoCircle size={20} color="#6B7280" />
                        </TouchableOpacity>
                    )} */}
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
    return (
        <TouchableOpacity className="flex-row items-center p-4 bg-muted rounded-2xl border border-gray-100" onPress={onPress}>
            <View className="w-10 h-10 bg-white rounded-xl items-center justify-center mr-4 shadow-sm">
                {icon}
            </View>
            <View className="flex-1">
                <Typography variant="body" weight="bold">{title}</Typography>
                <Typography variant="small" color="gray">{subtitle}</Typography>
            </View>
            <ArrowRight size={18} color="#9CA3AF" />
        </TouchableOpacity>
    );
}
