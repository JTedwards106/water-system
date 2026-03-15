import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    Alert, KeyboardAvoidingView,
    Platform, ScrollView, ActivityIndicator, Image
} from 'react-native';
import { Droplets, ArrowRight } from 'lucide-react-native';
import { api, storeToken, storeUser } from '../utils/auth';

export default function RegisterScreen({ navigation, onLogin }) {
    const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
    const [loading, setLoading] = useState(false);

    const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

    const handleRegister = async () => {
        if (!form.name || !form.email || !form.password) {
            Alert.alert('Missing fields', 'Name, email, and password are required.');
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/api/auth/register', {
                name: form.name.trim(),
                email: form.email.trim(),
                password: form.password,
                phone: form.phone.trim()
            });
            console.log('Registration Response:', res.data);

            if (res.data && res.data.token) {
                await storeToken(res.data.token);
                await storeUser(res.data.user);
                onLogin(res.data.user);
            } else {
                throw new Error('No token received from server');
            }
        } catch (err) {
            console.error('Registration Error:', err);
            let msg = 'Registration failed. Try again.';
            if (err.code === 'ECONNABORTED') {
                msg = 'Connection timed out. Please check your tunnel (Localtunnel) and try again.';
            } else if (err.response) {
                msg = err.response.data?.error || `Server Error: ${err.response.status}`;
            } else if (err.request) {
                msg = 'Network Error: Backend not reachable via tunnel.';
            }
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView className="flex-1 bg-white" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 32, paddingTop: 60, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

                {/* Header */}
                <View className="mb-9">
                    <View className="w-16 h-16 rounded-2xl bg-white items-center justify-center mb-5 shadow-sm overflow-hidden">
                        <Image source={require('../assets/water-logo.png')} className="w-full h-full" resizeMode="contain" />
                    </View>
                    <Text className="text-[28px] font-extrabold text-slate-800 mb-2.5 tracking-tight">Create Account</Text>
                    <Text className="text-sm text-slate-500 font-medium leading-[22px]">Join AgriFlow and manage your water usage intelligently.</Text>
                </View>

                {/* Form */}
                <View className="flex-1">
                    {[
                        { key: 'name', label: 'Full Name', placeholder: 'Jane Smith', keyboard: 'default' },
                        { key: 'email', label: 'Email Address', placeholder: 'you@example.com', keyboard: 'email-address' },
                        { key: 'password', label: 'Password', placeholder: '••••••••', keyboard: 'default', secure: true },
                        { key: 'phone', label: 'Phone Number', placeholder: '+1 876 XXX XXXX', keyboard: 'phone-pad' },
                    ].map(({ key, label, placeholder, keyboard, secure }) => (
                        <View className="mb-4" key={key}>
                            <Text className="text-[13px] font-bold text-slate-700 mb-2">{label}</Text>
                            <TextInput
                                className="bg-white rounded-xl px-4 py-3.5 text-[15px] text-slate-800 border border-slate-300"
                                placeholder={placeholder}
                                placeholderTextColor="#94a3b8"
                                value={form[key]}
                                onChangeText={set(key)}
                                keyboardType={keyboard}
                                autoCapitalize="none"
                                secureTextEntry={!!secure}
                            />
                        </View>
                    ))}

                    <TouchableOpacity className="bg-blue-600 rounded-xl py-[18px] flex-row items-center justify-center gap-2 mt-3 shadow-lg shadow-blue-600/30 elevation-md" onPress={handleRegister} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text className="text-white font-bold text-base mr-2">Create Account</Text>
                                <ArrowRight color="#fff" size={20} />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View className="flex-row justify-center items-center mt-8">
                    <Text className="text-slate-500 text-sm font-medium">Already have an account?</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text className="text-blue-600 text-sm font-bold ml-1"> Sign In</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}
