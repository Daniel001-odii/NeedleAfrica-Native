import React, { useState, useEffect } from 'react';
import { View, Animated, Dimensions } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Typography } from './Typography';
import { CloudCross } from 'iconsax-react-native';

export function OfflineBanner() {
    const [isOffline, setIsOffline] = useState(false);
    const [animation] = useState(new Animated.Value(-100)); // Start off-screen

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
                top: 0,
                left: 0,
                right: 0,
                zIndex: 9999,
            }}
        >
            <View className="bg-red-500 px-4 py-2 flex-row items-center justify-center shadow-md">
                <CloudCross size={16} color="white" variant="Bold" />
                <Typography variant="small" weight="bold" color="white" className="ml-2">
                    You are currently offline. Changes will sync when back online.
                </Typography>
            </View>
        </Animated.View>
    );
}
