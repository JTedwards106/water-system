import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export const BACKEND_URL = 'https://agriflow-pro-2026.loca.lt';

// Shared Axios instance with tunnel bypass header and 30s timeout
export const api = axios.create({
    baseURL: BACKEND_URL,
    timeout: 30000, // 30 seconds
    headers: {
        'bypass-tunnel-reminder': 'true',
        'Content-Type': 'application/json',
    },
});

// Attach JWT token to every request automatically
api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('jwt_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const storeToken = (token) => {
    if (token) return AsyncStorage.setItem('jwt_token', token);
    return Promise.resolve();
};
export const storeUser = (user) => {
    if (user) return AsyncStorage.setItem('user', JSON.stringify(user));
    return Promise.resolve();
};
export const getToken = () => AsyncStorage.getItem('jwt_token');
export const getUser = async () => {
    const raw = await AsyncStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
};
export const logout = async () => {
    await AsyncStorage.removeItem('jwt_token');
    await AsyncStorage.removeItem('user');
};
