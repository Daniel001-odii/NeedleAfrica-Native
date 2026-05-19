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

export function UnsplashIcon({ size = 24, color = 'currentColor', style }: IconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
            <Path d="M15 4.5H9V8.5H15V4.5Z" fill={color} />
            <Path d="M4 10.5H9V14.5H15V10.5H20V19.5H4V10.5Z" fill={color} />
        </Svg>
    );
}

export function PinterestIcon({ size = 24, color = 'currentColor', style }: IconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 20 20" style={style}>
            <Path fill={color} d="M10.015 0C4.484 0 0 4.473 0 9.99c0 4.232 2.638 7.847 6.364 9.3c-.088-.79-.166-2.002.034-2.865c.183-.78 1.175-4.964 1.175-4.964s-.3-.6-.3-1.484c0-1.386.808-2.426 1.811-2.426c.855 0 1.268.64 1.268 1.406c0 .858-.545 2.14-.829 3.327c-.238.994.502 1.804 1.483 1.804c1.778 0 3.148-1.87 3.148-4.572c0-2.384-1.723-4.058-4.184-4.058c-2.848 0-4.518 2.135-4.518 4.333c0 .86.329 1.786.742 2.284c.083.1.094.188.071.288c-.075.312-.244.999-.279 1.135c-.044.188-.143.226-.335.138c-1.249-.575-2.032-2.398-2.032-3.872c0-3.146 2.296-6.043 6.616-6.043c3.474 0 6.175 2.472 6.175 5.769c0 3.446-2.178 6.218-5.207 6.218c-1.014 0-1.966-.524-2.304-1.149l-.625 2.374c-.225.87-.84 1.96-1.252 2.621A10 10 0 0 0 9.988 20C15.508 20 20 15.53 20 10.01C20 4.493 15.507.023 9.988.023z" />
        </Svg>
    );
}
