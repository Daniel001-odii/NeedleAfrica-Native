import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COLORS = [
    '#FFD700', // Gold
    '#FF5678', // Coral
    '#FF8C00', // Dark Orange
    '#3b82f6', // Blue
    '#10B981', // Green
    '#8b5cf6', // Violet
    '#F43F5E', // Rose
    '#FF69B4', // Hot Pink
    '#00FFFF', // Cyan
];

interface ConfettiPieceProps {
    color: string;
    index: number;
}

const ConfettiPiece: React.FC<ConfettiPieceProps> = ({ color, index }) => {
    const translateY = useRef(new Animated.Value(-50)).current;
    const translateX = useRef(new Animated.Value(0)).current;
    const rotate = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;

    // Generate random animation values
    const sizeWidth = useRef(Math.random() * 8 + 6).current;
    const sizeHeight = useRef(Math.random() * 10 + 6).current;
    const borderRadius = useRef(Math.random() > 0.5 ? sizeWidth / 2 : 0).current;
    
    // Starting horizontal position
    const startX = useRef(Math.random() * SCREEN_WIDTH).current;
    
    // Animation configuration
    const duration = useRef(Math.random() * 2500 + 2000).current;
    const delay = useRef(Math.random() * 1500).current;
    const drift = useRef((Math.random() - 0.5) * 120).current; // Sway distance
    const totalRotation = useRef((Math.random() * 4 + 2) * 360).current; // Rotate multiple times

    useEffect(() => {
        // Run animations concurrently
        Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.parallel([
                    Animated.timing(translateY, {
                        toValue: SCREEN_HEIGHT + 100,
                        duration: duration,
                        easing: Easing.out(Easing.quad),
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateX, {
                        toValue: drift,
                        duration: duration,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }),
                    Animated.timing(rotate, {
                        toValue: totalRotation,
                        duration: duration,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }),
                    Animated.sequence([
                        Animated.timing(opacity, {
                            toValue: 1,
                            duration: 100,
                            useNativeDriver: true,
                        }),
                        Animated.timing(opacity, {
                            toValue: 0,
                            duration: duration * 0.3,
                            delay: duration * 0.7,
                            useNativeDriver: true,
                        }),
                    ]),
                ]),
                // Reset for next loop
                Animated.parallel([
                    Animated.timing(translateY, {
                        toValue: -50,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateX, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                    Animated.timing(rotate, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacity, {
                        toValue: 1,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                ]),
            ])
        ).start();
    }, []);

    const rotateStr = rotate.interpolate({
        inputRange: [0, 360],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <Animated.View
            style={[
                styles.confetti,
                {
                    backgroundColor: color,
                    width: sizeWidth,
                    height: sizeHeight,
                    borderRadius: borderRadius,
                    left: startX,
                    opacity: opacity,
                    transform: [
                        { translateY },
                        { translateX },
                        { rotate: rotateStr },
                    ],
                },
            ]}
        />
    );
};

export const Confetti: React.FC = () => {
    // Render 60 confetti pieces
    const pieces = Array.from({ length: 60 }).map((_, i) => {
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        return <ConfettiPiece key={i} index={i} color={color} />;
    });

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {pieces}
        </View>
    );
};

const styles = StyleSheet.create({
    confetti: {
        position: 'absolute',
        top: 0,
    },
});
