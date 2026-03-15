import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    Alert, KeyboardAvoidingView,
    Platform, ScrollView, ActivityIndicator, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Droplets, ArrowRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, storeToken, storeUser } from '../utils/auth';

export default function LoginScreen({ navigation, onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Missing fields', 'Please enter your email and password.');
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/api/auth/login', { email: email.trim(), password });
            console.log('Login Response:', res.data);

            if (res.data && res.data.token) {
                await storeToken(res.data.token);
                await storeUser(res.data.user);
                onLogin(res.data.user);
            } else {
                throw new Error('No token received from server');
            }
        } catch (err) {
            console.error('Login Error:', err);
            let msg = 'Login failed. Check your credentials.';
            if (err.code === 'ECONNABORTED') {
                msg = 'Connection timed out. Please check your tunnel (Localtunnel) and try again.';
            } else if (err.response) {
                msg = err.response.data?.error || `Server Error: ${err.response.status}`;
            } else if (err.request) {
                msg = 'Network Error: Backend not reachable via tunnel.';
            }
            Alert.alert('Login Failed', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView className="flex-1 bg-white" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 32, paddingTop: 80, paddingBottom: 40, justifyContent: 'space-between' }} keyboardShouldPersistTaps="handled">

                    {/* Header */}
                    <View className="mb-12">
                        <View className="w-20 h-20 rounded-[20px] bg-white items-center justify-center mb-6 shadow-sm overflow-hidden">
                            <Image source={require('../assets/water-logo.png')} className="w-full h-full" resizeMode="contain" />
                        </View>
                        <Text className="text-[32px] font-extrabold text-slate-800 mb-3 tracking-tight">Welcome back</Text>
                        <Text className="text-[15px] text-slate-500 font-medium leading-[22px]">Enter your details to access your AgriFlow dashboard.</Text>
                    </View>

                    {/* Form */}
                    <View className="flex-1">
                        <View className="mb-5">
                            <Text className="text-[13px] font-bold text-slate-700 mb-2">Email</Text>
                            <TextInput
                                className="bg-white rounded-xl px-4 py-4 text-base text-slate-800 border border-slate-300"
                                placeholder="you@example.com"
                                placeholderTextColor="#94a3b8"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View className="mb-5">
                            <Text className="text-[13px] font-bold text-slate-700 mb-2">Password</Text>
                            <TextInput
                                className="bg-white rounded-xl px-4 py-4 text-base text-slate-800 border border-slate-300"
                                placeholder="••••••••"
                                placeholderTextColor="#94a3b8"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity className="bg-blue-600 rounded-xl py-[18px] flex-row items-center justify-center gap-2 mt-3 shadow-lg shadow-blue-600/30 elevation-md" onPress={handleLogin} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text className="text-white font-bold text-base mr-2">Sign In</Text>
                                    <ArrowRight color="#fff" size={20} />
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View className="flex-row justify-center items-center mt-10">
                        <Text className="text-slate-500 text-sm font-medium">Don't have an account?</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text className="text-blue-600 text-sm font-bold ml-1"> Create one now</Text>
                        </TouchableOpacity>
                    </View>

                    {/* TEMPORARY: Reset Onboarding */}
                    <TouchableOpacity
                        className="mt-6 p-3 items-center"
                        onPress={async () => {
                            await AsyncStorage.removeItem('has_onboarded');
                            Alert.alert('Reset Complete', 'Onboarding state wiped. Press "r" in your Expo terminal to restart the app and view onboarding.');
                        }}
                    >
                        <Text className="text-red-500 font-bold text-[13px] underline">
                            Temporary: Reset Onboarding Flow
                        </Text>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView >
    );
}
