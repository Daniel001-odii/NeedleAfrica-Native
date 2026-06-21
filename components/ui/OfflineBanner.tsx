import React, { useState, useEffect } from 'react';
import { View, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Typography } from './Typography';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_BAR_HEIGHT = 5;

export function OfflineBanner() {
    const [isOffline, setIsOffline] = useState(false);
    const [animation] = useState(new Animated.Value(150)); // Start below screen
    const insets = useSafeAreaInsets();
    const bottomOffset = TAB_BAR_HEIGHT + (insets.bottom > 10 ? insets.bottom - 30 : insets.bottom);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            const offline = state.isConnected === false;
            setIsOffline(offline);

            Animated.spring(animation, {
                toValue: offline ? 0 : 150,
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
                bottom: bottomOffset,
                left: 0,
                right: 0,
                zIndex: 9999,
                // backgroundColor: '#000', // Amber 500
            }}
        >
            <View className="px-4 py-2 items-center justify-center">
                <Typography variant="small" weight="bold" color="black" className="text-center">
                    📍 you're offline some features maybe limited
                </Typography>
            </View>
        </Animated.View>
    );
}
