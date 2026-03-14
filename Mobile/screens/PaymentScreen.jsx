import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView,
    TouchableOpacity, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wallet, Zap, Check, AlertTriangle, ArrowRight } from 'lucide-react-native';
import { api } from '../utils/auth';

const AMOUNTS = ['500', '1000', '2500', '5000'];

export default function PaymentScreen({ user, meters, activeMeter, navigation }) {
    const [deviceId, setDeviceId] = useState(activeMeter?.deviceId);
    const [account, setAccount] = useState(null);
    const [selected, setSelected] = useState('1000');
    const [custom, setCustom] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchAccount = () => {
        if (!deviceId) return;
        api.get(`/api/v1/user/account/${deviceId}`)
            .then(r => setAccount(r.data))
            .catch(() => { });
    };

    useEffect(() => { fetchAccount(); }, [deviceId]);

    const handleTopup = async () => {
        const amount = custom.trim() || selected;
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid numeric amount to top up.');
            return;
        }
        setLoading(true);
        try {
            const res = await api.post(`/api/v1/user/topup?deviceId=${deviceId}&amount=${amount}`);
            setAccount(res.data);
            setCustom('');
            Alert.alert('Payment Successful', `A total of $${parseFloat(amount).toFixed(2)} JMD has been deposited into your wallet.`);
        } catch (e) {
            Alert.alert('Payment Failed', 'The transaction could not be completed at this time. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const balance = account?.balance ?? 0;
    const isLow = balance < 50;

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
                <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">

                    {/* Minimal Header */}
                    <View className="mb-8 mt-3">
                        <Text className="text-[32px] font-black text-slate-800 tracking-tight mb-1.5">Payments</Text>
                        <Text className="text-[15px] font-medium text-slate-500">Manage your wallet balance and top-ups.</Text>
                    </View>

                    {/* Meter Switcher for Payment */}
                    {meters.length > 1 && (
                        <View className="mb-8">
                            <Text className="text-[13px] font-bold text-slate-500 uppercase tracking-wide mb-3">Select Meter to Pay For</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {meters.map(m => {
                                    const isSel = m.deviceId === deviceId;
                                    return (
                                        <TouchableOpacity
                                            key={m.deviceId}
                                            onPress={() => setDeviceId(m.deviceId)}
                                            className={`mr-3 px-4 py-3 rounded-xl border ${isSel ? 'bg-blue-50 border-blue-600' : 'bg-white border-slate-200'}`}
                                        >
                                            <Text className={`text-[14px] font-bold ${isSel ? 'text-blue-700' : 'text-slate-600'}`}>{m.cropType}</Text>
                                            <Text className={`text-[10px] font-medium mt-0.5 ${isSel ? 'text-blue-500' : 'text-slate-400'}`}>{m.deviceId}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    )}

                    {/* Balance Card - Clean Slate Look */}
                    <View className="bg-slate-50 rounded-[20px] p-6 border border-slate-200 mb-5">
                        <View className="flex-row items-center gap-4">
                            <View className={`w-12 h-12 rounded-[14px] bg-white items-center justify-center border border-slate-200 ${user?.accountType === 'STANDARD' ? 'bg-blue-50 border-blue-200' : ''}`}>
                                <Wallet color={user?.accountType === 'STANDARD' ? '#2563eb' : '#0f172a'} size={20} />
                            </View>
                            <View>
                                <Text className="text-[13px] font-bold text-slate-500 uppercase tracking-wide mb-1">{user?.accountType === 'STANDARD' ? 'Outstanding Bill' : 'Current Balance'}</Text>
                                <Text className="text-4xl font-black text-slate-800 tracking-tight">
                                    ${(user?.accountType === 'STANDARD' ? 1250 : balance).toFixed(2)}
                                    <Text className="text-base text-slate-400 font-semibold"> JMD</Text>
                                </Text>
                            </View>
                        </View>

                        <View className="h-[1px] bg-slate-200 my-5" />

                        <View className="flex-row items-center gap-2">
                            {user?.accountType === 'STANDARD' ? (
                                <>
                                    <AlertTriangle color="#f59e0b" size={16} />
                                    <Text className="text-sm font-bold text-amber-700">Due in 4 days</Text>
                                </>
                            ) : (
                                <>
                                    {isLow ? <AlertTriangle color="#dc2626" size={16} /> : <Check color="#10b981" size={16} />}
                                    <Text className={`text-sm font-bold ${isLow ? 'text-red-700' : 'text-emerald-600'}`}>
                                        {isLow ? 'Balance Low: Grace Period Active' : 'Account in Good Standing'}
                                    </Text>
                                </>
                            )}
                        </View>
                    </View>

                    {/* Grace Period Minimal Info */}
                    {user?.accountType !== 'STANDARD' && (
                        <View className="flex-row items-start gap-3.5 bg-amber-50 rounded-2xl p-4 border border-amber-200 mb-10">
                            <Zap color="#d97706" size={18} />
                            <View className="flex-1">
                                <Text className="text-amber-800 text-sm font-extrabold mb-1">Humanity Grace Period</Text>
                                <Text className="text-amber-800 text-[13px] leading-5">
                                    If your balance reaches $0, a 50L emergency reserve applies before the main valve shuts off.
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Top Up Section */}
                    <View className="flex-1">
                        <Text className="text-xl font-extrabold text-slate-800 tracking-tight mb-5">{user?.accountType === 'STANDARD' ? 'Payment Amount' : 'Add Funds'}</Text>

                        {/* Quick Amounts Grid */}
                        <Text className="text-[13px] font-bold text-slate-600 mb-3">Quick Select</Text>
                        <View className="flex-row flex-wrap gap-3 mb-6">
                            {AMOUNTS.map(amt => {
                                const isSelected = selected === amt && !custom;
                                return (
                                    <TouchableOpacity
                                        key={amt}
                                        className={`flex-1 min-w-[45%] rounded-xl py-4 items-center border ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}
                                        onPress={() => { setSelected(amt); setCustom(''); }}
                                    >
                                        <Text className={`text-base font-bold ${isSelected ? 'text-white' : 'text-slate-700'}`}>${amt}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Custom Amount */}
                        <Text className="text-[13px] font-bold text-slate-600 mb-3">Or Enter Custom Amount</Text>
                        <View className="flex-row items-center bg-white rounded-xl border border-slate-300 px-4 mb-8">
                            <Text className="text-base font-bold text-slate-400 mr-3">JMD</Text>
                            <TextInput
                                className="flex-1 text-lg text-slate-800 font-semibold py-4"
                                placeholder="0.00"
                                placeholderTextColor="#cbd5e1"
                                keyboardType="decimal-pad"
                                value={custom}
                                onChangeText={(val) => {
                                    setCustom(val);
                                    if (val) setSelected('');
                                    else setSelected('1000'); // Revert to default if cleared
                                }}
                            />
                        </View>

                        {/* Payment Button */}
                        <TouchableOpacity className="bg-blue-600 rounded-[14px] py-[18px] flex-row items-center justify-center gap-2.5 shadow-lg shadow-blue-600/30 elevation-sm mb-5" onPress={handleTopup} disabled={loading}>
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Text className="text-white font-extrabold text-base">Process Payment</Text>
                                    <ArrowRight color="#fff" size={20} />
                                </>
                            )}
                        </TouchableOpacity>

                        <Text className="text-slate-400 text-xs leading-[18px] text-center px-4">
                            {user?.accountType === 'STANDARD'
                                ? 'Payments securely processed. Settle your balance to avoid late fees or account suspension.'
                                : 'Payments are securely processed. Funds are available immediately and restore water flow if previously restricted.'}
                        </Text>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
