import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function LoadingScreen() {
    const { isDark } = useTheme();
    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#fff' }]}>
            <ActivityIndicator size="large" color="#3B82F6" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
