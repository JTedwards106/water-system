import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView,
    TouchableOpacity, RefreshControl, Dimensions, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { Svg, Circle, Path, G } from 'react-native-svg';
import { Droplets, Activity, Power, AlertTriangle, Wallet, Leaf, ChevronRight, Settings } from 'lucide-react-native';
import { api } from '../utils/auth';

const { width } = Dimensions.get('window');

const Gauge = ({ value = 0, max = 100, label = "L/min", color = "#2563eb" }) => {
    const size = width * 0.55;
    const strokeWidth = 18;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const halfCircumference = circumference / 2;

    // We want a semi-circle (180 degrees)
    // Offset for semi-circle
    const progress = Math.min(Math.max(value, 0), max) / max;
    const dashOffset = halfCircumference * (1 - progress);

    return (
        <View style={{ width: size, height: size * 0.6, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size}>
                <G rotation="-180" origin={`${size / 2}, ${size / 2}`}>
                    {/* Background Arc */}
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="#f1f5f9"
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeDasharray={`${halfCircumference} ${circumference}`}
                        strokeLinecap="round"
                    />
                    {/* Progress Arc */}
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeDasharray={`${halfCircumference} ${circumference}`}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="round"
                    />
                </G>
            </Svg>
            <View style={{ position: 'absolute', top: '45%', alignItems: 'center' }}>
                <Text style={{ fontSize: 42, fontWeight: '900', color: '#0f172a', letterSpacing: -1 }}>{value.toFixed(1)}</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginTop: -4 }}>{label}</Text>
            </View>
        </View>
    );
};

export default function HomeScreen({ user, activeMeter, setActiveMeter, meters, navigation }) {
    const deviceId = activeMeter?.deviceId;
    const [sensorData, setSensorData] = useState(null);
    const [history, setHistory] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    const fetchAll = useCallback(async () => {
        if (!deviceId) return;
        try {
            const [sensorRes, histRes] = await Promise.all([
                api.get(`/api/v1/water/latest/${deviceId}`),
                api.get(`/api/v1/water/history/${deviceId}?days=7`),
            ]);
            if (sensorRes.data?.length > 0) setSensorData(sensorRes.data[0]);
            setHistory(histRes.data || []);
        } catch (e) {
            console.error('HomeScreen fetch error:', e.message);
        }
    }, [deviceId]);

    useEffect(() => {
        fetchAll();
        const interval = setInterval(fetchAll, 4000);
        return () => clearInterval(interval);
    }, [fetchAll]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAll().finally(() => setRefreshing(false));
    }, [fetchAll]);

    const toggleValve = async () => {
        try {
            await api.post(`/api/v1/water/valve?deviceId=${deviceId}&open=${!sensorData?.valveOpen}`);
            setSensorData(prev => prev ? { ...prev, valveOpen: !prev.valveOpen } : null);
        } catch (e) { console.error(e); }
    };

    const isFlowing = sensorData?.valveOpen;

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
                showsVerticalScrollIndicator={false}
            >
                {/* Colorful Header */}
                <View className="px-6 pt-6 pb-10 bg-emerald-500 rounded-b-[48px] shadow-lg shadow-emerald-100 mb-6">
                    <View className="flex-row justify-between items-center mb-8">
                        <View>
                            <Text className="text-emerald-50 text-[14px] font-bold tracking-widest uppercase mb-1">Live Environment</Text>
                            <Text className="text-white text-[32px] font-black tracking-tight">
                                {activeMeter?.cropType || 'AgriFlow'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 items-center justify-center"
                            onPress={() => navigation.navigate('LinkMeter')}
                        >
                            <Plus color="#ffffff" size={24} strokeWidth={3} />
                        </TouchableOpacity>
                    </View>

                    {/* Meter Chips - Vibrant */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {meters.map((m) => {
                            const isSel = m.deviceId === deviceId;
                            return (
                                <TouchableOpacity
                                    key={m.deviceId}
                                    onPress={() => setActiveMeter(m)}
                                    className={`mr-3 px-6 py-2.5 rounded-full border ${isSel ? 'bg-white border-white shadow-md' : 'bg-emerald-600/30 border-emerald-400/50'}`}
                                >
                                    <Text className={`text-[13px] font-extrabold ${isSel ? 'text-emerald-700' : 'text-emerald-50'}`}>
                                        {m.cropType || m.deviceId}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                        {/* Inline Add Button */}
                        <TouchableOpacity
                            onPress={() => navigation.navigate('LinkMeter')}
                            className="px-5 py-2.5 rounded-full bg-emerald-600/30 border border-emerald-400/50 flex-row items-center"
                        >
                            <Plus color="#ecfdf5" size={14} strokeWidth={3} />
                            <Text className="text-[13px] font-extrabold text-emerald-50 ml-1.5">Add Meter</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* The Gauge Section */}
                <View className="items-center justify-center py-6 mb-4">
                    <Gauge value={sensorData?.flowRate || 0} max={15} label="L/min Flow" color={isFlowing ? "#10b981" : "#cbd5e1"} />

                    <View className={`mt-4 flex-row items-center px-5 py-2.5 rounded-full ${isFlowing ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50 border border-slate-100'}`}>
                        <View className={`w-2.5 h-2.5 rounded-full mr-2.5 ${isFlowing ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <Text className={`text-[13px] font-black uppercase tracking-widest ${isFlowing ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {isFlowing ? 'Irrigating Now' : 'Flow Suspended'}
                        </Text>
                    </View>
                </View>

                {/* Colorful Stat Cards */}
                <View className="px-6 flex-row gap-4 mb-8">
                    <View className="flex-1 bg-cyan-50 rounded-[36px] p-6 border border-cyan-100">
                        <View className="w-12 h-12 rounded-2xl bg-white items-center justify-center mb-4 shadow-sm">
                            <Droplets color="#0891b2" size={24} />
                        </View>
                        <Text className="text-[28px] font-black text-cyan-900 tracking-tight">{sensorData?.tankLevel || '--'}%</Text>
                        <Text className="text-[12px] font-bold text-cyan-600 uppercase tracking-widest mt-1">Water Supply</Text>
                    </View>
                    <View className="flex-1 bg-amber-50 rounded-[36px] p-6 border border-amber-100">
                        <View className="w-12 h-12 rounded-2xl bg-white items-center justify-center mb-4 shadow-sm">
                            <Activity color="#d97706" size={24} />
                        </View>
                        <Text className="text-[28px] font-black text-amber-900 tracking-tight">{sensorData?.flowRate?.toFixed(1) || '0.0'}</Text>
                        <Text className="text-[12px] font-bold text-amber-600 uppercase tracking-widest mt-1">Live Rate</Text>
                    </View>
                </View>

                {/* Primary Action Button */}
                <View className="px-6">
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={toggleValve}
                        className={`flex-row items-center justify-between p-7 rounded-[40px] shadow-2xl ${isFlowing ? 'bg-emerald-600 shadow-emerald-200' : 'bg-slate-900 shadow-slate-300'}`}
                    >
                        <View className="flex-row items-center gap-5">
                            <View className="w-14 h-14 rounded-2xl bg-white/20 items-center justify-center">
                                <Power color="#ffffff" size={28} strokeWidth={3} />
                            </View>
                            <View>
                                <Text className="text-white text-[20px] font-black tracking-tight">{isFlowing ? 'Deactivate Valve' : 'Start Irrigation'}</Text>
                                <Text className="text-white/60 text-[13px] font-bold uppercase tracking-widest">Hydraulic Control</Text>
                            </View>
                        </View>
                        <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
                            <ChevronRight color="#ffffff" size={24} />
                        </View>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}
