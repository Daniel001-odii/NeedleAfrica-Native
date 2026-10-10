import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const ENV = (process.env.EXPO_PUBLIC_APP_ENV as 'development' | 'staging' | 'production') ||
    (__DEV__ ? 'development' : 'production');

const hostUri = Constants.expoConfig?.hostUri;
const ip = hostUri?.split(':')[0] ?? 'localhost';

const SOCKET_URL_CONFIG = {
    development: `http://${ip}:5001`,
    staging: `http://${ip}:5001`,
    production: 'https://needle-africa-api.vercel.app',
};

export const SOCKET_BASE_URL = SOCKET_URL_CONFIG[ENV];

let _socket: Socket | null = null;

export async function getSocket(): Promise<Socket> {
    if (_socket?.connected) return _socket;

    const token = await SecureStore.getItemAsync('auth_token');
    if (!token) throw new Error('No auth token available');

    if (_socket) {
        _socket.disconnect();
        _socket = null;
    }

    _socket = io(SOCKET_BASE_URL, {
        auth: { token: `Bearer ${token}` },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1500,
        reconnectionAttempts: 5,
        timeout: 10000,
    });

    return _socket;
}

export function disconnectSocket(): void {
    if (_socket) {
        _socket.disconnect();
        _socket = null;
    }
}
