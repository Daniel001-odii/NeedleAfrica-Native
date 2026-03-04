import React, { useState, useEffect } from 'react';
import { View, Animated, Dimensions } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Typography } from './Typography';
import { CloudCross } from 'iconsax-react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function OfflineBanner() {
    const [isOffline, setIsOffline] = useState(false);
    const [animation] = useState(new Animated.Value(-200)); // Start off-screen
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            const offline = state.isConnected === false;
            setIsOffline(offline);

            Animated.spring(animation, {
                toValue: offline ? 0 : -100,
                useNativeDriver: true,
                friction: 8,
                tension: 40
            }).start();
        });

        return () => unsubscribe();
    }, []);

    return (
        <Animated.View
            style={{
                transform: [{ translateY: animation }],
                position: 'absolute',
                top: -25,
                left: 0,
                right: 0,
                zIndex: 9999,
                paddingTop: insets.top,
                backgroundColor: '#F59E0B', // Amber 500
            }}
        >
            <View className="px-4 py-3 flex-row items-center justify-center shadow-lg">
                <Typography variant="small" weight="bold" color="white" className="text-center">
                    📍 you're offline some features maybe limited
                </Typography>
            </View>
        </Animated.View>
    );
}
