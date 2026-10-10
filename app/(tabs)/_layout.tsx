import { Tabs, router, usePathname } from 'expo-router';
import { View, Image, Text, Animated, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Home, User, People, Calendar, Messages1 } from 'iconsax-react-native';
import Svg, { Path } from 'react-native-svg';
import { LimitedOfflineBanner } from '../../components/LimitedOfflineBanner';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useUnreadOrderRequests } from '../../hooks/useUnreadOrderRequests';
import { useCatalog } from '../../hooks/useCatalog';
import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { usePostHog } from 'posthog-react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CustomTabBarProps {
    state: any;
    descriptors: any;
    navigation: any;
    insets: { top: number; right: number; bottom: number; left: number };
    isDark: boolean;
    totalUnread: number;
    userProfilePicture?: string;
    hideTabBar: boolean;
    onTabPress: (tabName: string) => void;
}

function CustomTabBar({
    state,
    descriptors,
    navigation,
    insets,
    isDark,
    totalUnread,
    userProfilePicture,
    hideTabBar,
    onTabPress,
}: CustomTabBarProps) {
    if (hideTabBar) return null;

    return (
        <View
            style={{
                width: '100%',
                backgroundColor: isDark ? '#000000' : '#FFFFFF',
                borderTopWidth: 1,
                borderTopColor: isDark ? '#27272a' : '#E5E7EB',
                paddingTop: 12,
                paddingBottom: insets.bottom > 0 ? insets.bottom + 6 : 14,
                elevation: 0,
            }}
        >
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    paddingHorizontal: 12,
                }}
            >
                {state.routes.map((route: any, index: number) => {
                    const isHidden = descriptors[route.key]?.options?.href === null;
                    if (isHidden) return null;

                    const isFocused = state.index === index;
                    const inactiveColor = '#9CA3AF';
                    const activeColor = '#FF5678';

                    let label = 'Home';
                    let iconNode: React.ReactNode = null;

                    if (route.name === 'index') {
                        label = 'Home';
                        iconNode = (
                            <View style={{ position: 'relative' }}>
                                <Home
                                    size={22}
                                    color={isFocused ? activeColor : inactiveColor}
                                    variant={isFocused ? 'Bold' : 'Linear'}
                                />
                                {totalUnread > 0 && (
                                    <View
                                        style={{
                                            position: 'absolute',
                                            top: -5,
                                            right: -8,
                                            minWidth: 16,
                                            height: 16,
                                            borderRadius: 8,
                                            backgroundColor: '#EF4444',
                                            borderWidth: 2,
                                            borderColor: isDark ? '#000000' : '#FFFFFF',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            paddingHorizontal: 2,
                                        }}
                                    >
                                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: 'white', lineHeight: 11 }}>
                                            {totalUnread > 99 ? '99+' : totalUnread}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        );
                    } else if (route.name === 'customers') {
                        label = 'Customers';
                        iconNode = (
                            <People
                                size={22}
                                color={isFocused ? activeColor : inactiveColor}
                                variant={isFocused ? 'Bold' : 'Linear'}
                            />
                        );
                    } else if (route.name === 'orders') {
                        label = 'Orders';
                        iconNode = (
                            <Calendar
                                size={22}
                                color={isFocused ? activeColor : inactiveColor}
                                variant={isFocused ? 'Bold' : 'Linear'}
                            />
                        );
                    } else if (route.name === 'chats') {
                        label = 'Chats';
                        iconNode = (
                            <Messages1
                                size={22}
                                color={isFocused ? activeColor : inactiveColor}
                                variant={isFocused ? 'Bold' : 'Linear'}
                            />
                        );
                    } else if (route.name === 'extras') {
                        label = 'Extras';
                        iconNode = (
                            <Svg width="22" height="22" viewBox="0 0 24 24">
                                <Path
                                    fill={isFocused ? activeColor : 'none'}
                                    stroke={isFocused ? activeColor : inactiveColor}
                                    strokeWidth="1.5"
                                    d="M15.5 6.5a3.5 3.5 0 1 1-7 0a3.5 3.5 0 0 1 7 0Zm6.5 11a3.5 3.5 0 1 1-7 0a3.5 3.5 0 0 1 7 0Zm-13 0a3.5 3.5 0 1 1-7 0a3.5 3.5 0 0 1 7 0Z"
                                />
                            </Svg>
                        );
                    } else if (route.name === 'profile') {
                        label = 'Profile';
                        iconNode = userProfilePicture ? (
                            <Image
                                source={{ uri: userProfilePicture }}
                                style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: 12,
                                    borderWidth: isFocused ? 1.5 : 0,
                                    borderColor: activeColor,
                                    opacity: isFocused ? 1 : 0.75,
                                }}
                            />
                        ) : (
                            <User
                                size={22}
                                color={isFocused ? activeColor : inactiveColor}
                                variant={isFocused ? 'Bold' : 'Linear'}
                            />
                        );
                    }

                    const onPress = () => {
                        if (route.name === 'chats') {
                            onTabPress('chats');
                            router.push('/chats');
                            return;
                        }

                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            onTabPress(route.name);
                            try {
                                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            } catch { }
                            navigation.navigate(route.name);
                        }
                    };

                    if (isFocused) {
                        return (
                            <TouchableOpacity
                                key={route.key}
                                onPress={onPress}
                                activeOpacity={0.8}
                                accessibilityRole="tab"
                                accessibilityState={{ selected: true }}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: isDark ? 'rgba(255, 86, 120, 0.16)' : 'rgba(255, 86, 120, 0.1)',
                                    paddingVertical: 9,
                                    paddingHorizontal: 13,
                                    borderRadius: 22,
                                    gap: 6,
                                }}
                            >
                                {iconNode}
                                <Text
                                    numberOfLines={1}
                                    style={{
                                        color: activeColor,
                                        fontSize: 13,
                                        fontWeight: '700',
                                        letterSpacing: -0.2,
                                    }}
                                >
                                    {label}
                                </Text>
                            </TouchableOpacity>
                        );
                    }

                    return (
                        <TouchableOpacity
                            key={route.key}
                            onPress={onPress}
                            activeOpacity={0.65}
                            accessibilityRole="tab"
                            accessibilityState={{ selected: false }}
                            style={{
                                alignItems: 'center',
                                justifyContent: 'center',
                                paddingVertical: 9,
                                paddingHorizontal: 10,
                                borderRadius: 20,
                            }}
                        >
                            {iconNode}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

export default function TabLayout() {
    const { user } = useAuth();
    const { isDark } = useTheme();
    const { unreadCount } = useUnreadOrderRequests();
    const { needsVisibility } = useCatalog();
    const posthog = usePostHog();
    const insets = useSafeAreaInsets();

    const totalUnread = unreadCount + (needsVisibility ? 1 : 0);

    const pathname = usePathname();
    const hideTabBar = [
        '/profile/catalog',
        '/profile/personal',
        '/profile/preferences',
        '/profile/analytics',
        '/profile/backup',
        '/profile/learn',
    ].includes(pathname);

    const [isOffline, setIsOffline] = useState(false);
    const [animation] = useState(new Animated.Value(150)); // Start below screen

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            const offline = state.isConnected === false;
            setIsOffline(offline);

            Animated.spring(animation, {
                toValue: offline ? 0 : 150,
                useNativeDriver: true,
                friction: 8,
                tension: 40,
            }).start();
        });

        return () => unsubscribe();
    }, []);

    return (
        <View className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-white'}`}>
            {/* <LimitedOfflineBanner /> */}
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <Tabs
                    tabBar={(props) => (
                        <CustomTabBar
                            {...props}
                            isDark={isDark}
                            totalUnread={totalUnread}
                            userProfilePicture={user?.profilePicture}
                            hideTabBar={hideTabBar}
                            onTabPress={(tabName) => {
                                posthog.capture('tab_changed', { tab: tabName });
                            }}
                        />
                    )}
                    screenOptions={{
                        headerShown: false,
                    }}
                >
                    <Tabs.Screen
                        name="index"
                        options={{
                            title: 'Home',
                        }}
                    />

                    <Tabs.Screen
                        name="customers"
                        options={{
                            title: 'Customers',
                        }}
                    />

                    <Tabs.Screen
                        name="orders"
                        options={{
                            title: 'Orders',
                        }}
                    />

                    {/* Chats tab right after Orders */}
                    <Tabs.Screen
                        name="chats"
                        options={{
                            title: 'Chats',
                        }}
                        listeners={{
                            tabPress: (e) => {
                                e.preventDefault();
                                router.push('/chats');
                            },
                        }}
                    />

                    <Tabs.Screen
                        name="extras"
                        options={{
                            title: 'Extras',
                        }}
                    />

                    <Tabs.Screen
                        name="profile"
                        options={{
                            title: 'Profile',
                        }}
                    />
                </Tabs>
            </SafeAreaView>
        </View>
    );
}
