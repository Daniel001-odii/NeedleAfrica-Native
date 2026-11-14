import { useEffect, useRef } from 'react';
import { LayoutChangeEvent } from 'react-native';
import { useSharedValue, withTiming, useAnimatedStyle, Easing } from 'react-native-reanimated';

type Rect = { x: number; y: number; width: number; height: number };

/**
 * Drives a sliding active-indicator for in-screen tab switchers / segmented controls.
 * Measures each tab via onLayout and animates an absolutely-positioned indicator
 * (translateX/Y + width/height) between them. Works for equal-width and content-width tabs.
 *
 * Usage:
 *   const { onTabLayout, indicatorStyle } = useSegmentSlider(activeKey);
 *   <View style={{ position: 'relative' }}>  // the row
 *     <Animated.View style={[{ position: 'absolute', borderRadius: 999, backgroundColor }, indicatorStyle]} />
 *     {tabs.map(t => <Pressable onLayout={onTabLayout(t.key)} ...>...</Pressable>)}
 *   </View>
 */
export function useSegmentSlider(activeKey: string) {
    const layouts = useRef<Record<string, Rect>>({});
    const placed = useRef(false);
    const x = useSharedValue(0);
    const y = useSharedValue(0);
    const w = useSharedValue(0);
    const h = useSharedValue(0);
    const opacity = useSharedValue(0);

    const place = (l: Rect, animate: boolean) => {
        if (animate) {
            const cfg = { duration: 260, easing: Easing.out(Easing.cubic) };
            x.value = withTiming(l.x, cfg);
            y.value = withTiming(l.y, cfg);
            w.value = withTiming(l.width, cfg);
            h.value = withTiming(l.height, cfg);
        } else {
            x.value = l.x;
            y.value = l.y;
            w.value = l.width;
            h.value = l.height;
        }
        opacity.value = withTiming(1, { duration: 150 });
    };

    const onTabLayout = (key: string) => (e: LayoutChangeEvent) => {
        const { x: lx, y: ly, width, height } = e.nativeEvent.layout;
        layouts.current[key] = { x: lx, y: ly, width, height };
        // First placement for the initially-active tab should not animate.
        if (key === activeKey && !placed.current) {
            place(layouts.current[key], false);
            placed.current = true;
        }
    };

    useEffect(() => {
        const l = layouts.current[activeKey];
        if (!l) return;
        place(l, placed.current);
        placed.current = true;
    }, [activeKey]);

    const indicatorStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: x.value }, { translateY: y.value }],
        width: w.value,
        height: h.value,
        opacity: opacity.value,
    }));

    return { onTabLayout, indicatorStyle };
}
