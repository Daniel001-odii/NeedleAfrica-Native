import React from 'react';
import Svg, { Path, G } from 'react-native-svg';

export interface IconProps {
    size?: number;
    color?: string;
    style?: any;
}

export function VirtualTryOnIcon({ size = 24, color = 'currentColor', style }: IconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
            <G fill="none" stroke={color} strokeWidth="1.5">
                <Path d="M12.998 7h-1.996c-2.87 0-4.805 3.07-3.674 5.828a1 1 0 0 0 .918.633h.703c.237 0 .444.17.501.41l.905 3.786c.189.79.867 1.343 1.645 1.343s1.456-.554 1.645-1.343l.905-3.786a.52.52 0 0 1 .5-.41h.704a1 1 0 0 0 .918-.633C17.804 10.069 15.869 7 12.999 7Z" />
                <Path d="M14.5 4.5a2.5 2.5 0 1 1-5 0a2.5 2.5 0 0 1 5 0Z" />
                <Path strokeLinecap="round" d="M19 19c0 1.657-3.134 3-7 3s-7-1.343-7-3" />
            </G>
        </Svg>
    );
}

export function SelectDesignIcon({ size = 24, color = 'currentColor', style }: IconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
            <G fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
                <Path d="M5.947 9.003s-2.264 2.249-2.93 1.974c-.94-.389-1.346-4.157-.707-4.732l2.457-2.212C5.9 3.01 5.93 3 7.439 3h1.518C9.183 4.36 10.496 5.992 12 5.992S14.816 4.36 15.043 3h1.518c1.508 0 1.538.011 2.672 1.033l2.457 2.212c.64.575.233 4.343-.707 4.732c-.666.275-2.934-1.974-2.934-1.974" />
                <Path d="M6 8v10.527c0 .705.12 1.082.755 1.423c2.613 1.4 7.877 1.4 10.49 0c.635-.34.755-.718.755-1.423V8" />
                <Path d="M6 10c2 2.667 10 2.667 12 0" />
            </G>
        </Svg>
    );
}
