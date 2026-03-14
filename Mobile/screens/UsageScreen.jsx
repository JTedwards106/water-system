import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView,
    TouchableOpacity, RefreshControl, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { Activity, BarChart3, Calendar, Filter, Droplets, Leaf } from 'lucide-react-native';
import { api } from '../utils/auth';

const { width } = Dimensions.get('window');

export default function UsageScreen({ user, activeMeter, setActiveMeter, meters }) {
    const deviceId = activeMeter?.deviceId;
    const [history, setHistory] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [period, setPeriod] = useState('7D'); // 24H, 7D, 30D

    const fetchUsage = useCallback(async () => {
        if (!deviceId) return;
        try {
            const histRes = await api.get(`/api/v1/water/history/${deviceId}?days=${period === '7D' ? 7 : (period === '24H' ? 1 : 30)}`);
            setHistory(histRes.data || []);
        } catch (e) {
            console.error('UsageScreen fetch error:', e.message);
        }
    }, [deviceId, period]);

    useEffect(() => {
        fetchUsage();
    }, [fetchUsage]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchUsage().finally(() => setRefreshing(false));
    }, [fetchUsage]);

    const chartLabels = history.slice(-7).map(h => h.hour?.split(' ')[1] || h.hour?.split('-')[2] || '');
    const chartValues = history.slice(-7).map(h => parseFloat(h.avgFlow) || 0);
    const hasChart = chartValues.length > 1;

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
                showsVerticalScrollIndicator={false}
            >
                {/* Vibrant Header */}
                <View className="px-6 pt-6 pb-8 bg-indigo-600 rounded-b-[48px] shadow-xl shadow-indigo-200">
                    <Text className="text-indigo-100 text-[14px] font-bold tracking-widest uppercase mb-1">Consumption Intelligence</Text>
                    <Text className="text-white text-[32px] font-black tracking-tight mb-6">Water Usage</Text>

                    {/* Global Meter Switcher */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {meters.map((m) => {
                            const isSel = m.deviceId === deviceId;
                            return (
                                <TouchableOpacity
                                    key={m.deviceId}
                                    onPress={() => setActiveMeter(m)}
                                    className={`mr-3 px-6 py-2.5 rounded-full border ${isSel ? 'bg-white border-white' : 'bg-indigo-500/30 border-indigo-400/50'}`}
                                >
                                    <View className="flex-row items-center gap-2">
                                        <Leaf color={isSel ? '#4f46e5' : '#c7d2fe'} size={14} />
                                        <Text className={`text-[13px] font-extrabold ${isSel ? 'text-indigo-700' : 'text-indigo-100'}`}>
                                            {m.cropType || m.deviceId}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Period Selector */}
                <View className="px-6 flex-row gap-2 mt-8 mb-6">
                    {['24H', '7D', '30D'].map(p => (
                        <TouchableOpacity
                            key={p}
                            onPress={() => setPeriod(p)}
                            className={`px-6 py-3 rounded-2xl border ${period === p ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-100'}`}
                        >
                            <Text className={`text-[13px] font-black ${period === p ? 'text-indigo-600' : 'text-slate-400'}`}>{p}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Big Analytics Card */}
                <View className="px-6 mb-8">
                    <View className="bg-white rounded-[40px] border border-slate-100 p-6 shadow-sm shadow-slate-200">
                        <View className="flex-row justify-between items-center mb-8">
                            <View>
                                <Text className="text-slate-400 text-[12px] font-bold uppercase tracking-widest mb-1">Avg Flow Rate</Text>
                                <Text className="text-slate-900 text-[28px] font-black">
                                    {(chartValues.reduce((a, b) => a + b, 0) / (chartValues.length || 1)).toFixed(2)} L/min
                                </Text>
                            </View>
                            <View className="w-12 h-12 rounded-2xl bg-indigo-50 items-center justify-center">
                                <BarChart3 color="#4f46e5" size={24} />
                            </View>
                        </View>

                        {hasChart ? (
                            <LineChart
                                data={{
                                    labels: chartLabels,
                                    datasets: [{ data: chartValues }]
                                }}
                                width={width - 80}
                                height={220}
                                chartConfig={{
                                    backgroundColor: '#ffffff',
                                    backgroundGradientFrom: '#ffffff',
                                    backgroundGradientTo: '#ffffff',
                                    decimalPlaces: 1,
                                    color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
                                    labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
                                    style: { borderRadius: 16 },
                                    propsForBackgroundLines: { strokeDasharray: "" },
                                    fillShadowGradientFrom: '#6366f1',
                                    fillShadowGradientTo: '#ffffff',
                                    fillShadowGradientFromOpacity: 0.2,
                                    fillShadowGradientToOpacity: 0,
                                }}
                                bezier
                                style={{ marginVertical: 8, borderRadius: 16, paddingRight: 40 }}
                                withInnerLines={false}
                                withOuterLines={false}
                            />
                        ) : (
                            <View className="h-40 items-center justify-center">
                                <Activity color="#cbd5e1" size={32} />
                                <Text className="text-slate-400 font-bold mt-4">Analyzing historical data...</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Detailed List Breakdown */}
                <View className="px-6">
                    <Text className="text-[20px] font-black text-slate-900 tracking-tight mb-4 ml-2">Recent Intervals</Text>
                    {history.slice(0, 5).map((h, i) => (
                        <View key={i} className="flex-row items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-3xl mb-3">
                            <View className="flex-row items-center gap-4">
                                <View className="w-10 h-10 rounded-xl bg-white items-center justify-center shadow-sm">
                                    <Droplets color="#6366f1" size={20} />
                                </View>
                                <View>
                                    <Text className="text-slate-800 font-black text-[15px]">{h.hour || 'Interval'}</Text>
                                    <Text className="text-slate-400 text-[11px] font-bold uppercase">{period === '24H' ? 'HOURLY REPORT' : 'DAILY REPORT'}</Text>
                                </View>
                            </View>
                            <View className="items-end">
                                <Text className="text-indigo-600 font-black text-[16px]">{parseFloat(h.avgFlow || 0).toFixed(1)}L</Text>
                                <Text className="text-slate-400 text-[10px] font-bold">AVG FL</Text>
                            </View>
                        </View>
                    ))}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}
