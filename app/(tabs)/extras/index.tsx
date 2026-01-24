import React from 'react';
import { View, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    MagicStar,
    ArrowRight,
    Brush,
    Mirror,
    Scan,
    Diagram,
    SearchFavorite,
    CloudChange
} from 'iconsax-react-native';
import { Surface } from '../../../components/ui/Surface';
import { Typography } from '../../../components/ui/Typography';
import { IconButton } from '../../../components/ui/IconButton';

export default function Extras() {
    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <ScrollView contentContainerClassName="p-6 pb-32" showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View className="flex-row justify-between items-center mb-8">
                    <Typography variant="h2" weight="bold">AI Extras</Typography>
                    <Surface variant="lavender" className="px-4 py-2" rounded="full">
                        <View className="flex-row items-center">
                            <MagicStar size={16} color="#6366f1" variant="Bold" />
                            <Typography variant="small" weight="bold" className="ml-2 text-brand-primary">PRO</Typography>
                        </View>
                    </Surface>
                </View>

                {/* Hero Feature: Sketch to Design */}
                <TouchableOpacity activeOpacity={0.9}>
                    <Surface variant="dark" className="p-6 mb-8 relative overflow-hidden" rounded="3xl">
                        <View className="z-10 w-3/5">
                            <Typography variant="subtitle" weight="bold" color="white" className="mb-2">Sketch to Design</Typography>
                            <Typography variant="caption" className="text-gray-400 mb-6">
                                Turn your hand-drawn sketches into high-fidelity fashion renders in seconds.
                            </Typography>
                            <Surface variant="white" className="self-start px-4 py-2" rounded="full">
                                <Typography variant="small" weight="bold">Try Now</Typography>
                            </Surface>
                        </View>

                        {/* Featured Image */}
                        <Image
                            source={{ uri: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&fit=crop' }}
                            className="absolute -right-12 top-0 w-48 h-full opacity-60"
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
                    />
                    <FeatureCard
                        icon={<Scan size={24} color="#FDB022" variant="Bulk" />}
                        title="Fabric Scanner"
                        description="Identify materials"
                        variant="peach"
                    />
                    <FeatureCard
                        icon={<CloudChange size={24} color="#12D39D" variant="Bulk" />}
                        title="Style Transfer"
                        description="Apply patterns easily"
                        variant="green"
                    />
                    <FeatureCard
                        icon={<Diagram size={24} color="#9B8AFB" variant="Bulk" />}
                        title="Trend AI"
                        description="Market predictions"
                        variant="lavender"
                    />
                </View>

                {/* More Features List */}
                <Typography variant="subtitle" weight="bold" className="mb-4">Discovery</Typography>
                <View className="gap-4">
                    <DiscoveryItem
                        icon={<Brush size={20} color="black" />}
                        title="Pattern Generator"
                        subtitle="Create unique repeating textures"
                    />
                    <DiscoveryItem
                        icon={<SearchFavorite size={20} color="black" />}
                        title="Visual Search"
                        subtitle="Find outfits from references"
                    />
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

function FeatureCard({ icon, title, description, variant }: { icon: React.ReactNode, title: string, description: string, variant: any }) {
    return (
        <TouchableOpacity className="w-[48%] active:scale-95">
            <Surface variant={variant} className="p-4 h-40 justify-between" rounded="2xl">
                <View className="w-10 h-10 bg-white/50 rounded-xl items-center justify-center">
                    {icon}
                </View>
                <View>
                    <Typography variant="body" weight="bold" className="mb-1">{title}</Typography>
                    <Typography variant="small" color="gray" numberOfLines={2}>{description}</Typography>
                </View>
            </Surface>
        </TouchableOpacity>
    );
}

function DiscoveryItem({ icon, title, subtitle }: { icon: React.ReactNode, title: string, subtitle: string }) {
    return (
        <TouchableOpacity className="flex-row items-center p-4 bg-muted rounded-2xl border border-gray-100">
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
