import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView,
    TouchableOpacity, Alert, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User as UserIcon, Phone, Mail, Cpu, LogOut, Wallet, ShieldCheck, ChevronRight, Leaf, Zap, HelpCircle } from 'lucide-react-native';
import { api, logout } from '../utils/auth';

export default function ProfileScreen({ user, meters, onLogout, navigation }) {
    const handleLogout = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); onLogout(); } }
        ]);
    };

    const InfoRow = ({ icon: Icon, label, value, color = "#4f46e5" }) => (
        <View className="flex-row items-center p-5">
            <View style={{ backgroundColor: `${color}15` }} className="w-11 h-11 rounded-2xl items-center justify-center mr-4">
                <Icon color={color} size={20} strokeWidth={2.5} />
            </View>
            <View className="flex-1 justify-center">
                <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</Text>
                <Text className="text-[16px] font-black text-slate-800 tracking-tight">{value || 'Not Set'}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

                {/* Visionary Header - Vibrant */}
                <View className="px-6 pt-10 pb-14 bg-indigo-600 rounded-b-[60px] mb-8 shadow-2xl shadow-indigo-200">
                    <View className="flex-row items-center justify-between mb-8">
                        <Text className="text-white text-[24px] font-black tracking-tight italic">agriflow.</Text>
                        <TouchableOpacity className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 items-center justify-center">
                            <ShieldCheck color="#ffffff" size={24} />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row items-center">
                        <View className="relative">
                            <View className="w-24 h-24 rounded-[36px] bg-white items-center justify-center shadow-lg">
                                <Text className="text-indigo-600 text-[44px] font-black uppercase">{user?.name?.[0] || 'A'}</Text>
                            </View>
                            <View className="absolute -bottom-1 -right-1 bg-amber-400 w-10 h-10 rounded-2xl items-center justify-center border-4 border-indigo-600">
                                <Zap color="#ffffff" size={16} strokeWidth={3} />
                            </View>
                        </View>
                        <View className="ml-6 flex-1">
                            <Text className="text-white text-[30px] font-black tracking-tight mb-1">{user?.name || 'AgriFlow User'}</Text>
                            <View className="flex-row items-center">
                                <View className="bg-emerald-400 px-3 py-1 rounded-full">
                                    <Text className="text-emerald-900 text-[10px] font-black uppercase tracking-widest">Active System</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Account Activity Summary */}
                <View className="px-6 flex-row gap-4 mb-10 -mt-6">
                    <View className="flex-1 bg-white p-6 rounded-[36px] border border-slate-100 shadow-xl shadow-slate-200/50">
                        <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-1">Meters</Text>
                        <Text className="text-[28px] font-black text-slate-900">{meters.length}</Text>
                    </View>
                    <View className="flex-1 bg-white p-6 rounded-[36px] border border-slate-100 shadow-xl shadow-slate-200/50">
                        <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-1">Status</Text>
                        <Text className="text-[20px] font-black text-emerald-500 uppercase">Premium</Text>
                    </View>
                </View>

                {/* Secure Information */}
                <View className="px-6 mb-10">
                    <Text className="text-[20px] font-black text-slate-900 tracking-tight mb-6 ml-2">Digital Profile</Text>
                    <View className="bg-slate-50 rounded-[44px] border border-slate-100 overflow-hidden">
                        <InfoRow icon={Mail} label="Cloud Email" value={user?.email} color="#6366f1" />
                        <View className="h-[1px] bg-slate-200/50 mx-8" />
                        <InfoRow icon={Phone} label="Contact Line" value={user?.phone} color="#8b5cf6" />
                    </View>
                </View>

                {/* Linked Infrastructure */}
                <View className="px-6 mb-10">
                    <View className="flex-row justify-between items-end mb-6 ml-2">
                        <Text className="text-[20px] font-black text-slate-900 tracking-tight">Infrastructure</Text>
                    </View>

                    {/* Highly Visible Add Button */}
                    <TouchableOpacity
                        onPress={() => navigation.navigate('LinkMeter')}
                        activeOpacity={0.8}
                        className="bg-indigo-600 rounded-[44px] p-6 mb-6 flex-row items-center justify-between shadow-xl shadow-indigo-200"
                    >
                        <View className="flex-row items-center gap-4">
                            <View className="w-12 h-12 rounded-2xl bg-white/20 items-center justify-center">
                                <Plus color="#ffffff" size={24} strokeWidth={3} />
                            </View>
                            <View>
                                <Text className="text-white text-[18px] font-black">Link New Meter</Text>
                                <Text className="text-indigo-100 text-[12px] font-bold uppercase tracking-widest">Add System Node</Text>
                            </View>
                        </View>
                        <ChevronRight color="#ffffff" size={20} />
                    </TouchableOpacity>

                    {meters.map((m, idx) => (
                        <View key={m.deviceId} className={`bg-slate-50 rounded-[44px] border border-slate-100 overflow-hidden ${idx !== 0 ? 'mt-4' : ''}`}>
                            <InfoRow icon={Leaf} label="Target Crop" value={m.cropType} color="#10b981" />
                            <View className="h-[1px] bg-slate-200/50 mx-8" />
                            <InfoRow icon={Cpu} label="Node Serial" value={m.deviceId} color="#f59e0b" />
                            <View className="h-[1px] bg-slate-200/50 mx-8" />
                            <InfoRow icon={ShieldCheck} label="Premise Code" value={m.premiseId} color="#ef4444" />
                        </View>
                    ))}
                </View>

                {/* Logout Action */}
                <View className="px-6 mt-4">
                    <TouchableOpacity
                        className="flex-row items-center justify-center gap-4 p-8 bg-slate-900 rounded-[44px] shadow-2xl shadow-slate-400"
                        onPress={handleLogout}
                    >
                        <LogOut color="#ffffff" size={24} strokeWidth={3} />
                        <Text className="text-white font-black text-[18px] tracking-tight uppercase">Terminate Session</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}
