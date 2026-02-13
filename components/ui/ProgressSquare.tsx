import React from 'react';
import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

interface ProgressSquareProps {
    progress: number; // 0 to 1
    size?: number;
    strokeWidth?: number;
    borderRadius?: number;
    color?: string;
    backgroundColor?: string;
}

export const ProgressSquare = ({
    progress,
    size = 60,
    strokeWidth = 3,
    borderRadius = 12,
    color = '#000000',
    backgroundColor = '#F3F4F6'
}: ProgressSquareProps) => {
    // Correct calculation for perimeter of a rounded rectangle
    // P = 2 * (w + h) - 8 * r + 2 * PI * r
    // For square: P = 4 * s - 8 * r + 2 * PI * r
    const s = size - strokeWidth;
    const r = borderRadius;
    const circumference = (4 * s) - (8 * r) + (2 * Math.PI * r);
    const strokeDashoffset = circumference - (progress * circumference);

    return (
        <View style={{ width: size, height: size }}>
            <Svg width={size} height={size}>
                {/* Background Square */}
                <Rect
                    x={strokeWidth / 2}
                    y={strokeWidth / 2}
                    width={s}
                    height={s}
                    rx={r}
                    stroke={backgroundColor}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
                {/* Progress Square */}
                <Rect
                    x={strokeWidth / 2}
                    y={strokeWidth / 2}
                    width={s}
                    height={s}
                    rx={r}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                // Rotate so it starts from top center if possible, 
                // though Rect starts from (x, y) which is top-left.
                // To start from top center, we might need a Path instead or 
                // just accept top-left start.
                />
            </Svg>
        </View>
    );
};
