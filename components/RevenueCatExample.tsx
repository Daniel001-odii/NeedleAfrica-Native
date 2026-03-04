import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRevenueCat } from '../hooks/useRevenueCat';

export const RevenueCatExample: React.FC = () => {
    const { isPro, isLoading, error, refreshCustomerInfo } = useRevenueCat();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>RevenueCat Integration Test</Text>
            
            <View style={styles.statusContainer}>
                <Text style={styles.label}>Subscription Status:</Text>
                <Text style={[styles.status, isPro && styles.proStatus]}>
                    {isPro ? 'PRO' : 'FREE'}
                </Text>
            </View>

            {isLoading && (
                <Text style={styles.loading}>Loading...</Text>
            )}

            {error && (
                <Text style={styles.error}>Error: {error}</Text>
            )}

            <TouchableOpacity
                style={styles.button}
                onPress={refreshCustomerInfo}
            >
                <Text style={styles.buttonText}>Refresh Status</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        margin: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    statusContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        padding: 12,
        backgroundColor: 'white',
        borderRadius: 6,
    },
    label: {
        fontSize: 16,
        color: '#333',
    },
    status: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#666',
    },
    proStatus: {
        color: '#9333EA',
    },
    loading: {
        textAlign: 'center',
        color: '#666',
        marginBottom: 8,
    },
    error: {
        textAlign: 'center',
        color: 'red',
        marginBottom: 8,
    },
    button: {
        backgroundColor: '#9333EA',
        padding: 12,
        borderRadius: 6,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
