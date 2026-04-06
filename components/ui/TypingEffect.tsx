import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  useSharedValue,
} from 'react-native-reanimated';
import { Typography, TypographyProps } from './Typography';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface TypingEffectProps extends TypographyProps {
    text?: string;
    texts?: string[];
    className?: string;
    rotationInterval?: number;
    speed?: number;
    showCursor?: boolean;
    onComplete?: () => void;
}

const DEMO = ['Design', 'Development', 'Marketing'];

export const TypingEffect = ({
    text,
    texts,
    className,
    rotationInterval = 3000,
    speed = 150,
    showCursor = true,
    onComplete,
    ...props
}: TypingEffectProps) => {
    const [displayedText, setDisplayedText] = useState('');
    const [currentTextIndex, setCurrentTextIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);

    const activeTexts = texts || (text ? [text] : DEMO);
    const currentText = activeTexts[currentTextIndex % activeTexts.length];

    // Cursor animation using reanimated
    const opacity = useSharedValue(1);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0, { duration: 400 }),
                withTiming(1, { duration: 400 })
            ),
            -1,
            true
        );
    }, []);

    useEffect(() => {
        if (!currentText) return;

        if (charIndex < currentText.length) {
            const typingTimeout = setTimeout(() => {
                setDisplayedText((prev) => prev + currentText.charAt(charIndex));
                setCharIndex(charIndex + 1);
            }, speed);
            return () => clearTimeout(typingTimeout);
        } else {
            // Typing is complete for the current text
            if (activeTexts.length > 1) {
                // Rotate if there are multiple texts
                const changeLabelTimeout = setTimeout(() => {
                    setDisplayedText('');
                    setCharIndex(0);
                    setCurrentTextIndex((prev) => (prev + 1) % activeTexts.length);
                }, rotationInterval);
                return () => clearTimeout(changeLabelTimeout);
            } else {
                // Done with single text
                onComplete?.();
            }
        }
    }, [charIndex, currentText, rotationInterval, speed, activeTexts.length]);

    const cursorStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    // Help determine background color for cursor
    const getCursorColor = () => {
        if (props.color === 'white') return '#FFFFFF';
        if (props.color === 'primary') return '#2563EB'; // Blue-600 roughly
        if (props.color === 'red') return '#EF4444';
        return '#000000';
    };

    return (
        <View className={cn('relative flex-row items-center', className)}>
            <Typography {...props}>
                {displayedText}
            </Typography>
            {showCursor && (
                <Animated.View
                    className="ml-1 w-[2px] rounded-sm"
                    style={[
                        cursorStyle,
                        { 
                            height: '80%', 
                            backgroundColor: getCursorColor(),
                        }
                    ]}
                />
            )}
        </View>
    );
};

export default TypingEffect;
