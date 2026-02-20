import React from 'react';
import { View, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'iconsax-react-native';
import { Typography } from '../../../components/ui/Typography';

const { width } = Dimensions.get('window');

const CLOTH_IDEAS = [
    { id: '1', url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop', height: 250 },
    { id: '2', url: 'https://images.unsplash.com/photo-1550614000-4b95dd247ed4?w=600&auto=format&fit=crop', height: 180 },
    { id: '3', url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop', height: 300 },
    { id: '4', url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&auto=format&fit=crop', height: 220 },
    { id: '5', url: 'https://images.unsplash.com/photo-1434389678232-067ab2071545?w=600&auto=format&fit=crop', height: 200 },
    { id: '6', url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&auto=format&fit=crop', height: 260 },
    { id: '7', url: 'https://images.unsplash.com/photo-1495385794356-15371f348c31?w=600&auto=format&fit=crop', height: 190 },
    { id: '8', url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop', height: 280 },
    { id: '9', url: 'https://images.unsplash.com/photo-1583391733958-d25e07fac66a?w=600&auto=format&fit=crop', height: 240 },
    { id: '10', url: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&auto=format&fit=crop', height: 210 },
];

export default function ClothIdeas() {
    const router = useRouter();

    const leftColumn = CLOTH_IDEAS.filter((_, index) => index % 2 === 0);
    const rightColumn = CLOTH_IDEAS.filter((_, index) => index % 2 !== 0);

    return (
        <View className="flex-1 bg-white">
            <View className="flex-row items-center p-4 border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 bg-gray-50 rounded-full">
                    <ArrowLeft size={24} color="black" />
                </TouchableOpacity>
                <Typography variant="h3" weight="bold">Cloth Ideas</Typography>
            </View>

            <ScrollView contentContainerClassName="p-6 pb-20" showsVerticalScrollIndicator={false}>
                <Typography variant="body" color="gray" className="mb-6">
                    Discover creative fashion styles and designs to inspire your next tailoring project.
                </Typography>

                <View className="flex-row justify-between">
                    <View className="flex-1 mr-2" style={{ gap: 16 }}>
                        {leftColumn.map(item => (
                            <Image
                                key={item.id}
                                source={{ uri: item.url }}
                                style={{ width: '100%', height: item.height, borderRadius: 16 }}
                            />
                        ))}
                    </View>
                    <View className="flex-1 ml-2" style={{ gap: 16 }}>
                        {rightColumn.map(item => (
                            <Image
                                key={item.id}
                                source={{ uri: item.url }}
                                style={{ width: '100%', height: item.height, borderRadius: 16 }}
                            />
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
