import { Tabs, router } from 'expo-router';
import { View, Image, Text, Animated } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Home, User, People, Calendar } from 'iconsax-react-native';
import Svg, { G, Path } from 'react-native-svg';
import { LimitedOfflineBanner } from '../../components/LimitedOfflineBanner';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useUnreadOrderRequests } from '../../hooks/useUnreadOrderRequests';
import { useCatalog } from '../../hooks/useCatalog';
import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { usePostHog } from 'posthog-react-native';


const TAB_BAR_HEIGHT = 5;

export default function TabLayout() {
    // const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { isDark } = useTheme();
    const { unreadCount } = useUnreadOrderRequests();
    const { needsVisibility } = useCatalog();
    const posthog = usePostHog();

    const totalUnread = unreadCount + (needsVisibility ? 1 : 0);

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
        <View className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-white'}`}>
            {/* <LimitedOfflineBanner /> */}
            <SafeAreaView style={{ flex: 1, paddingBottom: insets.bottom }} edges={['top']}>
                <Tabs
                    screenOptions={{
                        headerShown: false,
                        tabBarActiveTintColor: isDark ? '#FFFFFF' : '#1C1C1E',
                        tabBarInactiveTintColor: isDark ? '#9CA3AF' : '#9CA3AF',

                        tabBarStyle: {
                            backgroundColor: isDark ? '#000000' : '#FFFFFF',
                            borderTopWidth: 1,
                            borderTopColor: isDark ? '#374151' : '#E5E7EB',
                            height: 60 + (insets.bottom > 10 ? insets.bottom - 30 : insets.bottom), // dynamic height
                            paddingTop: 6,
                            paddingBottom: insets.bottom > 10 ? insets.bottom - 30 : insets.bottom, // safe area aware
                            elevation: 0
                        },

                        tabBarLabelStyle: {
                            fontSize: 11,
                            fontWeight: '600',
                            marginTop: 4,
                        },
                    }}
                    screenListeners={{
                        tabPress: (e) => {
                            const targetKey = (e.target as any)?.split('-')[0];
                            if (targetKey) {
                                posthog.capture('tab_changed', { tab: targetKey });
                            }
                        },
                    }}
                >
                    {/* Main tabs */}
                    <Tabs.Screen
                        name="index"
                        options={{
                            title: 'Home',
                            tabBarIcon: ({ color, focused }) => (
                                <View>
                                    <Home size={24} color={color as string} variant={focused ? 'Bold' : 'Linear'} />
                                    {totalUnread > 0 && (
                                        <View className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] rounded-full bg-red-500 border-2 border-white dark:border-black items-center justify-center px-0.5">
                                            <Text style={{ fontSize: 9, fontWeight: 'bold', color: 'white', lineHeight: 11 }}>
                                                {totalUnread > 99 ? '99+' : totalUnread}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            ),
                        }}
                    />

                    <Tabs.Screen
                        name="customers"
                        options={{
                            title: 'Customers',
                            tabBarIcon: ({ color, focused }) => (
                                <People size={24} color={color as string} variant={focused ? 'Bold' : 'Linear'} />
                            ),
                        }}
                    />

                    <Tabs.Screen
                        name="orders"
                        options={{
                            title: 'Orders',
                            tabBarIcon: ({ color, focused }) => (
                                <Calendar size={24} color={color as string} variant={focused ? 'Bold' : 'Linear'} />
                            ),
                        }}
                    />

                    <Tabs.Screen
                        name="extras"
                        options={{
                            title: 'Extras',
                            tabBarIcon: ({ color, focused }) => (
                                <Svg width="22" height="22" viewBox="0 0 24 24">
                                    <Path fill={focused ? color : 'none'} stroke={color} stroke-width="1.5" d="M15.5 6.5a3.5 3.5 0 1 1-7 0a3.5 3.5 0 0 1 7 0Zm6.5 11a3.5 3.5 0 1 1-7 0a3.5 3.5 0 0 1 7 0Zm-13 0a3.5 3.5 0 1 1-7 0a3.5 3.5 0 0 1 7 0Z" />
                                </Svg>
                            ),
                        }}
                    />

                    <Tabs.Screen
                        name="profile"
                        options={{
                            title: 'Profile',
                            tabBarIcon: ({ color, focused }) => (
                                user?.profilePicture ? (
                                    <Image
                                        source={{ uri: user.profilePicture }}
                                        style={{
                                            width: 26,
                                            height: 26,
                                            borderRadius: 13,
                                            opacity: focused ? 1 : 0.7
                                        }}
                                    />
                                ) : (
                                    <User size={24} color={color as string} variant={focused ? 'Bold' : 'Linear'} />
                                )
                            ),
                        }}
                    />
                </Tabs>
            </SafeAreaView>
        </View>
    );
}
