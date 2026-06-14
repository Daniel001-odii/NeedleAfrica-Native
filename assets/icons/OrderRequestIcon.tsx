import React from 'react';
import Svg, { G, Path } from 'react-native-svg';

interface OrderRequestIconProps {
  size?: number;
  color?: string;
}

export default function OrderRequestIcon({ size = 32, color = 'white' }: OrderRequestIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}>
        <Path d="M14.5 8a5 5 0 1 0-10 0a5 5 0 0 0 10 0" />
        <Path d="M2.5 20A7 7 0 0 1 13 13.937m2.5.909c0-1.02.895-1.846 2-1.846s2 .827 2 1.846c0 .368-.116.71-.317.998c-.598.857-1.683 1.175-1.683 2.194v.462m-.01 2.5h.01" />
      </G>
    </Svg>
  );
}