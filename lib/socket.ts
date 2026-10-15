import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from './axios';

export const SOCKET_BASE_URL = API_URL.replace(/\/api\/?$/, '');

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
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionDelay: 1500,
        reconnectionAttempts: 10,
        timeout: 15000,
    });

    _socket.on('connect_error', (err) => {
        console.warn('[socket] connection error:', err?.message || err);
    });

    return _socket;
}

export function disconnectSocket(): void {
    if (_socket) {
        _socket.disconnect();
        _socket = null;
    }
}
