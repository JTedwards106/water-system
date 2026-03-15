import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView,
    TouchableOpacity, RefreshControl, Dimensions, Animated,
    Modal, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { Svg, Circle, Path, G } from 'react-native-svg';
import { Droplets, Activity, Power, AlertTriangle, Wallet, Leaf, ChevronRight, Settings, Plus } from 'lucide-react-native';
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
    const [accountData, setAccountData] = useState(null);
    const [history, setHistory] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [cropModalVisible, setCropModalVisible] = useState(false);
    const [meterModalVisible, setMeterModalVisible] = useState(false);
    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    // Fast fetch: sensor + account data (every 8 seconds)
    const fetchLive = useCallback(async () => {
        if (!deviceId) return;
        try {
            const [sensorRes, accountRes] = await Promise.all([
                api.get(`/api/v1/water/latest/${deviceId}`),
                api.get(`/api/v1/user/account/${deviceId}`)
            ]);
            if (sensorRes.data?.length > 0) setSensorData(sensorRes.data[0]);
            setAccountData(accountRes.data);
            // Sync crop type if changed on backend
            if (accountRes.data && activeMeter && accountRes.data.cropType !== activeMeter.cropType) {
                setActiveMeter(prev => ({ ...prev, cropType: accountRes.data.cropType }));
            }
        } catch (e) {
            if (e.code !== 'ECONNABORTED') console.error('HomeScreen live error:', e.message);
        }
    }, [deviceId, activeMeter?.cropType]);

    // Slow fetch: history (every 60 seconds)
    const fetchHistory = useCallback(async () => {
        if (!deviceId) return;
        try {
            const histRes = await api.get(`/api/v1/water/history/${deviceId}?days=7`);
            setHistory(Array.isArray(histRes.data) ? histRes.data : []);
        } catch (e) {
            if (e.code !== 'ECONNABORTED') console.error('HomeScreen history error:', e.message);
        }
    }, [deviceId]);

    // Combined refresh for pull-to-refresh
    const fetchAll = useCallback(async () => {
        await Promise.allSettled([fetchLive(), fetchHistory()]);
    }, [fetchLive, fetchHistory]);

    useEffect(() => {
        if (!deviceId) return;
        // Fetch everything on mount
        fetchLive();
        fetchHistory();
        // Live sensor updates every 8 seconds
        const liveInterval = setInterval(fetchLive, 8000);
        // History updates every 60 seconds
        const historyInterval = setInterval(fetchHistory, 60000);
        return () => {
            clearInterval(liveInterval);
            clearInterval(historyInterval);
        };
    }, [deviceId]);

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

    const updateCrop = async (newCrop) => {
        try {
            await api.post(`/api/v1/user/crop?deviceId=${deviceId}&cropType=${newCrop}`);
            setActiveMeter(prev => ({ ...prev, cropType: newCrop }));
            setCropModalVisible(false);
            fetchAll();
        } catch (e) {
            console.error('Update Crop error:', e);
        }
    };

    const isFlowing = sensorData?.valveOpen;
    const [lightOn, setLightOn] = useState(false);

    const toggleLight = async () => {
        const newState = !lightOn;
        try {
            await api.post(`/api/v1/water/light?deviceId=${deviceId}&on=${newState}`);
            setLightOn(newState);
        } catch (e) { console.error('Light toggle error:', e.message); }
    };

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
                        <TouchableOpacity 
                            onPress={() => setMeterModalVisible(true)}
                            activeOpacity={0.7}
                        >
                            <Text className="text-emerald-50 text-[14px] font-bold tracking-widest uppercase mb-1">Active Meter • Switch</Text>
                            <Text className="text-white text-[32px] font-black tracking-tight">
                                {activeMeter?.deviceId || 'Select Device'}
                            </Text>
                        </TouchableOpacity>
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
                                        {m.cropType && m.cropType !== 'NONE' ? m.cropType : `Meter: ${m.deviceId}`}
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

                    <TouchableOpacity 
                        onPress={() => setCropModalVisible(true)}
                        className="mt-4 px-4 py-2 bg-emerald-100 rounded-full border border-emerald-200"
                    >
                        <Text className="text-emerald-700 font-bold text-[13px]">
                            CROP: {accountData?.cropType || activeMeter?.cropType || 'NOT SET'} • CHANGE
                        </Text>
                    </TouchableOpacity>
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
                        <Text className="text-[28px] font-black text-amber-900 tracking-tight">{accountData?.cumulativeUsage?.toFixed(1) || '0.0'}</Text>
                        <Text className="text-[12px] font-bold text-amber-600 uppercase tracking-widest mt-1">Liters Used</Text>
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

                    {/* Light Control Button */}
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={toggleLight}
                        className={`flex-row items-center justify-between p-7 rounded-[40px] shadow-2xl mt-4 ${lightOn ? 'bg-amber-400 shadow-amber-200' : 'bg-slate-700 shadow-slate-300'}`}
                    >
                        <View className="flex-row items-center gap-5">
                            <View className="w-14 h-14 rounded-2xl bg-white/20 items-center justify-center">
                                <AlertTriangle color="#ffffff" size={28} strokeWidth={3} />
                            </View>
                            <View>
                                <Text className="text-white text-[20px] font-black tracking-tight">{lightOn ? 'Turn Light Off' : 'Turn Light On'}</Text>
                                <Text className="text-white/60 text-[13px] font-bold uppercase tracking-widest">Indicator LED</Text>
                            </View>
                        </View>
                        <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
                            <ChevronRight color="#ffffff" size={24} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Crop Selection Modal */}
                <Modal
                    visible={cropModalVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setCropModalVisible(false)}
                >
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
                        <View style={{ backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 32 }}>
                            <Text style={{ fontSize: 24, fontWeight: '900', color: '#0f172a', marginBottom: 24 }}>Select Crop Type</Text>
                            
                            {[
                                { id: 'TOMATOES', name: 'Tomatoes', icon: '🍅', limit: '8L' },
                                { id: 'LETTUCE', name: 'Lettuce', icon: '🥬', limit: '5L' },
                                { id: 'CORN', name: 'Corn', icon: '🌽', limit: '10L' },
                                { id: 'NONE', name: 'Manual Mode', icon: '🚜', limit: 'Off' }
                            ].map((crop) => (
                                <TouchableOpacity 
                                    key={crop.id}
                                    onPress={() => updateCrop(crop.id)}
                                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 20, borderRadius: 20, marginBottom: 12 }}
                                >
                                    <View style={{ width: 48, height: 48, backgroundColor: 'white', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                                        <Text style={{ fontSize: 24 }}>{crop.icon}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 18, fontWeight: '800', color: '#1e293b' }}>{crop.name}</Text>
                                        <Text style={{ fontSize: 13, color: '#64748b', fontWeight: 'bold' }}>TARGET: {crop.limit}</Text>
                                    </View>
                                    <ChevronRight size={20} color="#cbd5e1" />
                                </TouchableOpacity>
                            ))}

                            <TouchableOpacity 
                                onPress={() => setCropModalVisible(false)}
                                style={{ marginTop: 12, padding: 20, alignItems: 'center' }}
                            >
                                <Text style={{ fontSize: 16, fontWeight: '800', color: '#ef4444' }}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Meter Selection Modal */}
                <Modal
                    visible={meterModalVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setMeterModalVisible(false)}
                >
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
                        <View style={{ backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 32, maxHeight: '80%' }}>
                            <Text style={{ fontSize: 24, fontWeight: '900', color: '#0f172a', marginBottom: 24 }}>Switch Meter</Text>
                            
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {meters.map((m) => {
                                    const isSel = m.deviceId === deviceId;
                                    return (
                                        <TouchableOpacity 
                                            key={m.deviceId}
                                            onPress={() => {
                                                setActiveMeter(m);
                                                setMeterModalVisible(false);
                                            }}
                                            style={{ 
                                                flexDirection: 'row', 
                                                alignItems: 'center', 
                                                backgroundColor: isSel ? '#ecfdf5' : '#f8fafc', 
                                                padding: 20, 
                                                borderRadius: 24, 
                                                marginBottom: 12,
                                                borderWidth: 2,
                                                borderColor: isSel ? '#10b981' : 'transparent'
                                            }}
                                        >
                                            <View style={{ width: 48, height: 48, backgroundColor: 'white', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
                                                <Droplets color={isSel ? '#10b981' : '#94a3b8'} size={24} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 18, fontWeight: '800', color: isSel ? '#064e3b' : '#1e293b' }}>{m.deviceId}</Text>
                                                <Text style={{ fontSize: 13, color: isSel ? '#059669' : '#64748b', fontWeight: 'bold' }}>
                                                    {m.cropType && m.cropType !== 'NONE' ? m.cropType : 'No crop assigned'}
                                                </Text>
                                            </View>
                                            {isSel && <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' }}>
                                                <Plus color="white" size={16} style={{ transform: [{ rotate: '45deg' }] }} />
                                            </View>}
                                        </TouchableOpacity>
                                    );
                                })}
                                
                                <TouchableOpacity 
                                    onPress={() => {
                                        setMeterModalVisible(false);
                                        navigation.navigate('LinkMeter');
                                    }}
                                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', padding: 20, borderRadius: 24, marginBottom: 12, borderStyle: 'dashed', borderWidth: 2, borderColor: '#cbd5e1' }}
                                >
                                    <View style={{ width: 48, height: 48, backgroundColor: 'white', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                                        <Plus color="#64748b" size={24} />
                                    </View>
                                    <Text style={{ fontSize: 18, fontWeight: '800', color: '#475569' }}>Add New Meter</Text>
                                </TouchableOpacity>
                            </ScrollView>

                            <TouchableOpacity 
                                onPress={() => setMeterModalVisible(false)}
                                style={{ marginTop: 12, padding: 20, alignItems: 'center' }}
                            >
                                <Text style={{ fontSize: 16, fontWeight: '800', color: '#64748b' }}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

            </ScrollView>
        </SafeAreaView>
    );
}
