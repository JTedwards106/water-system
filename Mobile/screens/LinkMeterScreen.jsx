import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    ActivityIndicator,
    Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../utils/auth';

const LinkMeterScreen = ({ navigation, onLinked, onLogout, isPlural }) => {
    const [deviceId, setDeviceId] = useState('');
    const [loading, setLoading] = useState(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const startPulse = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        ).start();
    };

    const handleLink = async () => {
        if (!deviceId) {
            Alert.alert('Missing Number', 'Please enter your Meter Number to proceed.');
            return;
        }

        setLoading(true);
        startPulse();
        try {
            const response = await api.post('/api/v1/user/link', {
                deviceId,
                premiseId: 'AUTOLINK',
                ownerName: 'USER',
                cropType: 'New Field'
            });

            if (response.data) {
                const newMeter = {
                    deviceId,
                    premiseId: 'AUTOLINK',
                    ownerName: 'USER',
                    cropType: 'New Field'
                };

                Alert.alert(
                    'System Connected',
                    'Your AgriFlow Node has been securely verified and linked to your profile.',
                    [{
                        text: 'Enter Dashboard', onPress: () => {
                            onLinked(newMeter);
                            if (isPlural) navigation.goBack();
                        }
                    }]
                );
            }
        } catch (error) {
            console.error('Linking error:', error);
            Alert.alert('Verification Failed', 'Could not find a meter with that serial number. Please check the label on your device.');
        } finally {
            setLoading(false);
            pulseAnim.stopAnimation();
            pulseAnim.setValue(1);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }} showsVerticalScrollIndicator={false}>

                    <View className="flex-row justify-between items-center mb-12">
                        <TouchableOpacity
                            className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 items-center justify-center"
                            onPress={() => navigation.canGoBack() ? navigation.goBack() : onLogout()}
                        >
                            <Ionicons name="arrow-back" size={24} color="#64748b" />
                        </TouchableOpacity>
                        <TouchableOpacity className="px-5 py-2.5 rounded-2xl bg-red-50" onPress={onLogout}>
                            <Text className="text-red-600 text-[13px] font-black uppercase">Sign Out</Text>
                        </TouchableOpacity>
                    </View>

                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }} className="items-center mb-12">
                        <View className="w-28 h-28 rounded-[40px] bg-indigo-50 items-center justify-center shadow-xl shadow-indigo-100">
                            <Ionicons name="bluetooth" size={48} color="#4f46e5" />
                        </View>
                    </Animated.View>

                    <View className="mb-10 items-center">
                        <Text className="text-[34px] font-black text-slate-900 tracking-tight text-center">Add Meter</Text>
                        <Text className="text-[16px] text-slate-500 text-center mt-3 font-medium leading-6 px-4">
                            Enter the unique serial number found on the back of your AgriFlow device.
                        </Text>
                    </View>

                    <View className="gap-6 flex-1">
                        <View className="gap-3">
                            <Text className="text-[12px] font-black text-slate-400 ml-2 uppercase tracking-widest">Device Serial Number</Text>
                            <View className="flex-row items-center bg-slate-50 rounded-3xl border border-slate-200 h-[72px] px-6">
                                <Ionicons name="barcode" size={24} color="#94A3B8" />
                                <TextInput
                                    className="flex-1 text-[18px] text-slate-900 font-black ml-4"
                                    placeholder="e.g. SIM-NODE-001"
                                    placeholderTextColor="#cbd5e1"
                                    value={deviceId}
                                    onChangeText={setDeviceId}
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        <View className="flex-row items-center bg-indigo-50/50 p-5 rounded-[32px] gap-4 mb-4 border border-indigo-100/50">
                            <View className="w-10 h-10 rounded-full bg-white items-center justify-center">
                                <Ionicons name="shield-checkmark" size={22} color="#4f46e5" />
                            </View>
                            <Text className="flex-1 text-[13px] text-indigo-700 font-bold leading-5">
                                Real-time verification ensures you're connecting to an authentic AgriFlow node.
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.9}
                        className={`h-[72px] rounded-[32px] items-center justify-center shadow-2xl ${!deviceId ? 'bg-slate-200' : 'bg-indigo-600 shadow-indigo-300'}`}
                        onPress={handleLink}
                        disabled={loading || !deviceId}
                    >
                        {loading ? (
                            <View className="flex-row items-center gap-3">
                                <ActivityIndicator color="#FFF" />
                                <Text className="text-white text-base font-black uppercase tracking-widest">Searching...</Text>
                            </View>
                        ) : (
                            <Text className="text-white text-base font-black uppercase tracking-widest">Connect Device</Text>
                        )}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default LinkMeterScreen;
