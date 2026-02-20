import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'iconsax-react-native';
import Svg, { Rect, Circle, Line, Defs, Pattern, Path } from 'react-native-svg';
import { Typography } from '../../../components/ui/Typography';
import { Surface } from '../../../components/ui/Surface';

export default function PatternsList() {
    const router = useRouter();

    const patterns = [
        {
            name: "Classic Polka Dot",
            description: "Uniformly spaced circles, ideal for elegant or vintage designs.",
            svgContent: (
                <Svg width="100%" height="200" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <Defs>
                        <Pattern id="polka" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                            <Circle cx="10" cy="10" r="4" fill="#6366f1" opacity="0.8" />
                        </Pattern>
                    </Defs>
                    <Rect x="0" y="0" width="100%" height="100%" fill="#EEF2FF" />
                    <Rect x="0" y="0" width="100%" height="100%" fill="url(#polka)" />
                </Svg>
            )
        },
        {
            name: "Pinstripe",
            description: "Vertical thin stripes giving a sleek and formal appearance.",
            svgContent: (
                <Svg width="100%" height="200" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <Defs>
                        <Pattern id="stripes" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                            <Line x1="5" y1="0" x2="5" y2="10" stroke="#1F2937" strokeWidth="1" opacity="0.6" />
                        </Pattern>
                    </Defs>
                    <Rect x="0" y="0" width="100%" height="100%" fill="#F3F4F6" />
                    <Rect x="0" y="0" width="100%" height="100%" fill="url(#stripes)" />
                </Svg>
            )
        },
        {
            name: "Gingham Check",
            description: "A checkered pattern typical with classic cotton woven fabrics.",
            svgContent: (
                <Svg width="100%" height="200" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <Defs>
                        <Pattern id="gingham" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                            <Rect x="0" y="0" width="20" height="10" fill="#EF4444" opacity="0.3" />
                            <Rect x="0" y="0" width="10" height="20" fill="#EF4444" opacity="0.3" />
                        </Pattern>
                    </Defs>
                    <Rect x="0" y="0" width="100%" height="100%" fill="#FEF2F2" />
                    <Rect x="0" y="0" width="100%" height="100%" fill="url(#gingham)" />
                </Svg>
            )
        },
        {
            name: "Chevron Zigzag",
            description: "A continuous zigzag pattern for a dynamic and sharp look.",
            svgContent: (
                <Svg width="100%" height="200" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <Defs>
                        <Pattern id="chevron" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                            <Path d="M0 10 L10 0 L20 10" fill="none" stroke="#10B981" strokeWidth="2" />
                            <Path d="M0 20 L10 10 L20 20" fill="none" stroke="#10B981" strokeWidth="2" />
                        </Pattern>
                    </Defs>
                    <Rect x="0" y="0" width="100%" height="100%" fill="#ECFDF5" />
                    <Rect x="0" y="0" width="100%" height="100%" fill="url(#chevron)" />
                </Svg>
            )
        }
    ];

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center p-4 border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 bg-gray-50 rounded-full">
                    <ArrowLeft size={24} color="black" />
                </TouchableOpacity>
                <Typography variant="h3" weight="bold">Basic Patterns</Typography>
            </View>

            <ScrollView contentContainerClassName="p-6 pb-20" showsVerticalScrollIndicator={false}>
                <Typography variant="body" color="gray" className="mb-6">
                    A collection of pre-defined SVG patterns to inspire your next tailored designs. Try bringing these into your design concepts.
                </Typography>

                <View className="gap-6">
                    {patterns.map((item, index) => (
                        <Surface key={index} variant="white" className="overflow-hidden border border-gray-100" rounded="2xl">
                            <View className="h-32 w-full bg-muted">
                                {item.svgContent}
                            </View>
                            <View className="p-4">
                                <Typography variant="subtitle" weight="bold" className="mb-1">{item.name}</Typography>
                                <Typography variant="body" color="gray">{item.description}</Typography>
                            </View>
                        </Surface>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
