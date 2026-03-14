import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export const BACKEND_URL = 'https://aquasmart-fresh-start.loca.lt';

// Shared Axios instance with tunnel bypass header and 15s timeout
export const api = axios.create({
    baseURL: BACKEND_URL,
    timeout: 15000, // 15 seconds
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

export const storeToken = (token) => AsyncStorage.setItem('jwt_token', token);
export const storeUser = (user) => AsyncStorage.setItem('user', JSON.stringify(user));
export const getToken = () => AsyncStorage.getItem('jwt_token');
export const getUser = async () => {
    const raw = await AsyncStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
};
export const logout = async () => {
    await AsyncStorage.removeItem('jwt_token');
    await AsyncStorage.removeItem('user');
};
