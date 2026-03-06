import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Image, ActivityIndicator, Dimensions, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../contexts/AuthContext';
import Animated, {
    useSharedValue,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    interpolate,
    Extrapolation,
    SharedValue
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.8;
const ITEM_SPACING = (width - ITEM_WIDTH) / 2;

const SLIDES = [
    {
        id: '1',
        image: require('../../assets/images/onboarding_1.png'),
        title: 'Organize Your Workshop',
        description: 'Track every order and measurement with ease.'
    },
    {
        id: '2',
        image: require('../../assets/images/onboarding_2.png'),
        title: 'Design with Precision',
        description: 'Store client preferences and design sketches in one place.'
    },
    {
        id: '3',
        image: require('../../assets/images/onboarding_3.png'),
        title: 'Grow Your Business',
        description: 'Focus on your craft while we handle the management.'
    }
];

function CarouselItem({ item, index, scrollX }: { item: any, index: number, scrollX: SharedValue<number> }) {
    const { isDark } = useTheme();
    const animatedStyle = useAnimatedStyle(() => {
        const inputRange = [
            (index - 1) * ITEM_WIDTH,
            index * ITEM_WIDTH,
            (index + 1) * ITEM_WIDTH,
        ];

        const scale = interpolate(
            scrollX.value,
            inputRange,
            [0.85, 1, 0.85],
            Extrapolation.CLAMP
        );

        const translateY = interpolate(
            scrollX.value,
            inputRange,
            [40, 0, 40],
            Extrapolation.CLAMP
        );

        const rotate = interpolate(
            scrollX.value,
            inputRange,
            [12, 0, -12],
            Extrapolation.CLAMP
        );

        const opacity = interpolate(
            scrollX.value,
            inputRange,
            [0.5, 1, 0.5],
            Extrapolation.CLAMP
        );

        return {
            transform: [
                { scale },
                { rotate: `${rotate}deg` },
                { translateY }
            ],
            opacity,
            zIndex: interpolate(
                scrollX.value,
                inputRange,
                [1, 10, 1],
                Extrapolation.CLAMP
            )
        };
    });

    return (
        <View style={{ width: ITEM_WIDTH, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View
                style={[
                    {
                        width: ITEM_WIDTH,
                        height: ITEM_WIDTH * 1.1,
                        borderRadius: 32,
                        overflow: 'hidden',
                        backgroundColor: isDark ? '#1C1C1E' : 'white',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.2,
                        shadowRadius: 20,
                        elevation: 10,
                    },
                    animatedStyle
                ]}
            >
                <Image
                    source={item.image}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                />
            </Animated.View>
        </View>
    );
}

export default function Welcome() {
    const { isDark } = useTheme();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const router = useRouter();
    const { signInWithGoogle, isActionLoading, isNewUser } = useAuth();

    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Logged in with Google'
            });
            // Force push
            router.replace(isNewUser ? '/onboarding' : '/(tabs)');
        } catch (error: any) {
            if (error.code !== 'ASYNC_OP_IN_PROGRESS') {
                Toast.show({
                    type: 'error',
                    text1: 'Google Sign-In Failed',
                    text2: error.message || 'Check your internet and try again'
                });
            }
        }
    };

    const scrollX = useSharedValue(0);

    const onScroll = useAnimatedScrollHandler((event) => {
        scrollX.value = event.contentOffset.x;
    });

    useEffect(() => {
        const interval = setInterval(() => {
            let nextIndex = currentIndex + 1;
            if (nextIndex >= SLIDES.length) {
                nextIndex = 0;
            }

            flatListRef.current?.scrollToIndex({
                index: nextIndex,
                animated: true,
                viewPosition: 0 // Centers the item
            });
        }, 4000);

        return () => clearInterval(interval);
    }, [currentIndex]);

    const animatedTextContainerStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(
                scrollX.value % ITEM_WIDTH,
                [0, ITEM_WIDTH / 4, ITEM_WIDTH * 3 / 4, ITEM_WIDTH],
                [1, 0, 0, 1],
                Extrapolation.CLAMP
            )
        };
    });

    const activeIndex = useSharedValue(0);
    const onMomentumScrollEnd = (event: any) => {
        activeIndex.value = Math.round(event.nativeEvent.contentOffset.x / ITEM_WIDTH);
    };

    return (
        <View className="flex-1 bg-muted dark:bg-background-dark">
            {/* Carousel Section */}
            <View style={{ height: ITEM_WIDTH * 1.25, marginTop: 80 }}>
                <Animated.FlatList
                    ref={flatListRef}
                    data={SLIDES}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item, index }) => (
                        <CarouselItem item={item} index={index} scrollX={scrollX} />
                    )}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={ITEM_WIDTH}
                    snapToAlignment="center"
                    decelerationRate="fast"
                    onScroll={onScroll}
                    onMomentumScrollEnd={(event) => {
                        const index = Math.round(event.nativeEvent.contentOffset.x / ITEM_WIDTH);
                        setCurrentIndex(index);
                    }}
                    scrollEventThrottle={16}
                    getItemLayout={(_, index) => ({
                        length: ITEM_WIDTH,
                        offset: ITEM_WIDTH * index,
                        index,
                    })}
                    onScrollToIndexFailed={(info) => {
                        const wait = new Promise(resolve => setTimeout(resolve, 500));
                        wait.then(() => {
                            flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.5 });
                        });
                    }}
                    contentContainerStyle={{
                        paddingHorizontal: ITEM_SPACING,
                        alignItems: 'center'
                    }}
                />
            </View>

            {/* Pagination Dots */}
            <View className="flex-row justify-center mt-2">
                {SLIDES.map((_, index) => {
                    const dotStyle = useAnimatedStyle(() => {
                        const inputRange = [
                            (index - 1) * ITEM_WIDTH,
                            index * ITEM_WIDTH,
                            (index + 1) * ITEM_WIDTH,
                        ];

                        const opacity = interpolate(
                            scrollX.value,
                            inputRange,
                            [0.3, 1, 0.3],
                            Extrapolation.CLAMP
                        );

                        const scale = interpolate(
                            scrollX.value,
                            inputRange,
                            [0.8, 1.2, 0.8],
                            Extrapolation.CLAMP
                        );

                        return {
                            opacity,
                            transform: [{ scale }]
                        };
                    });

                    return (
                        <Animated.View
                            key={index}
                            style={[
                                {
                                    width: 8,
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: isDark ? '#FFFFFF' : '#000000',
                                    marginHorizontal: 4,
                                },
                                dotStyle
                            ]}
                        />
                    );
                })}
            </View>

            {/* Content */}
            <Animated.View style={[animatedTextContainerStyle, { paddingHorizontal: 20, justifyContent: 'center', flex: 1, marginTop: -100 }]}>
                <View style={{ marginBottom: 10 }}>
                    <Typography variant="h1" weight="bold" className="text-4xl text-center leading-[42px]">
                        {SLIDES[currentIndex].title}
                    </Typography>
                    <Typography variant="body" color="gray" className="text-center text-lg px-2">
                        {SLIDES[currentIndex].description}
                    </Typography>
                </View>
            </Animated.View>

            {/* Actions & Footer Section */}
            <View className="px-10 pb-12 -mt-20">
                {/* Actions */}
                <View className="gap-4">
                    <Button
                        onPress={() => router.push('/(auth)/login')}
                        className="bg-dark dark:bg-white h-16 rounded-full border-0"
                        textClassName="text-white dark:text-black text-lg font-bold"
                    >
                        Get started
                    </Button>
                    <TouchableOpacity
                        onPress={handleGoogleSignIn}
                        disabled={isActionLoading}
                        className="h-14 rounded-full bg-gray-100 dark:bg-dark-800 border border-gray-300 dark:border-dark-700 flex-row items-center justify-center active:opacity-70"
                    >
                        {isActionLoading ? (
                            <ActivityIndicator color={isDark ? "white" : "black"} />
                        ) : (
                            <>
                                <Image
                                    source={require('../../assets/images/google_logo.png')}
                                    className="w-5 h-5 mr-3"
                                    resizeMode="contain"
                                />
                                <Typography color={isDark ? "white" : "black"} weight="semibold">Continue with Google</Typography>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Footer Links */}
                <View className="mt-8 items-center">
                    <Typography color="gray" variant="small" className="opacity-60 text-center">
                        By proceeding to use NeedleAfrica, you agree to our {'\n'}
                        <Typography variant="small" weight="bold" color="primary" className="underline">Terms of use</Typography> and acknowledge <Typography color="primary" variant="small" weight="bold" className="underline">Privacy policy</Typography>
                    </Typography>
                </View>
            </View>
        </View >
    );
}
