// hooks/useDashboard.js
import { useState, useEffect, useCallback } from 'react';
import { waterAPI, getUserFromToken } from '../services/api';
import {
  meters,
  alertsData,
  insightsData,
  deviceData,
} from '../services/mockData';

export function useDashboard() {
  const [selectedMeter, setSelectedMeter] = useState(meters[0]);
  const [kpis, setKpis] = useState({
    flowRate: 0,
    totalWaterToday: 0,
    irrigationRuntime: 0,
    systemStatus: 'Loading...',
  });
  const [flowHistory, setFlowHistory] = useState([]);
  const [dailyUsage, setDailyUsage] = useState([]);
  const [alerts] = useState(alertsData);
  const [insights] = useState(insightsData);
  const [device] = useState(deviceData);
  const [lastTick, setLastTick] = useState(new Date());
  const [isLive, setIsLive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from backend
  const fetchData = useCallback(async () => {
    try {
      setError(null);

      // Fetch latest readings for flow history
      const latestReadings = await waterAPI.getLatestReadings(selectedMeter.id);

      // Transform backend data to match frontend format
      const transformedFlowHistory = latestReadings
        .slice(0, 24)
        .reverse()
        .map((reading, index) => ({
          time: new Date(reading.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }),
          flow: reading.flowRate || 0,
        }));

      setFlowHistory(transformedFlowHistory);

      // Calculate KPIs from latest readings
      if (latestReadings.length > 0) {
        const latestReading = latestReadings[0];
        const totalWaterToday = latestReadings.reduce((sum, reading) =>
          sum + ((reading.flowRate || 0) * (5 / 60)), 0 // 5 minutes in hours
        );

        setKpis({
          flowRate: latestReading.flowRate || 0,
          totalWaterToday: Math.round(totalWaterToday),
          irrigationRuntime: Math.floor(Math.random() * 200) + 50, // Mock for now
          systemStatus: latestReading.status || 'Normal',
        });
      }

      // Fetch history data for daily usage
      const historyData = await waterAPI.getHistory(selectedMeter.id, 7);

      // Transform history data to match frontend format
      const transformedDailyUsage = historyData
        .slice(0, 7)
        .map((day, index) => ({
          day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index],
          usage: Math.round((day.totalL || 0) * 10) / 10,
          target: 1200, // Default target
        }));

      setDailyUsage(transformedDailyUsage);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
      // Fallback to mock data if API fails
      setFlowHistory([]);
      setKpis({
        flowRate: 0,
        totalWaterToday: 0,
        irrigationRuntime: 0,
        systemStatus: 'Error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedMeter]);

  // Update data when meter changes
  const handleMeterChange = useCallback((meter) => {
    setSelectedMeter(meter);
    setIsLoading(true);
  }, []);

  // Fetch data on mount and when meter changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Simulate live sensor ticks every 5 seconds
  const tick = useCallback(async () => {
    try {
      const realtimeData = await waterAPI.getLatestReadings(selectedMeter.id);
      
      const now = new Date();
      const hour = now.getHours();
      const min = now.getMinutes().toString().padStart(2, '0');

      // Use real data from API
      const newFlow = realtimeData.flowRate || 0;

      setFlowHistory(prev => {
        const next = [...prev.slice(1), { time: `${hour}:${min}`, flow: newFlow }];
        return next;
      });

      setKpis(prev => ({
        ...prev,
        flowRate: newFlow,
        totalWaterToday: realtimeData.totalWaterToday || prev.totalWaterToday,
        irrigationRuntime: realtimeData.irrigationRuntime || prev.irrigationRuntime,
      }));

      setLastTick(now);
    } catch (err) {
      console.error('Error fetching realtime data:', err);
      // Continue with mock data generation as fallback
      const now = new Date();
      const hour = now.getHours();
      const min = now.getMinutes().toString().padStart(2, '0');

      const baseFlow = kpis.flowRate || 0; // Use current flow rate as base
      const newFlow = parseFloat((baseFlow + Math.random() * 8 + Math.sin(Date.now() / 5000) * 3).toFixed(1));

      setFlowHistory(prev => {
        const next = [...prev.slice(1), { time: `${hour}:${min}`, flow: newFlow }];
        return next;
      });

      setKpis(prev => ({
        ...prev,
        flowRate: newFlow,
        totalWaterToday: parseFloat((prev.totalWaterToday + newFlow * (5 / 60)).toFixed(0)),
        irrigationRuntime: prev.irrigationRuntime + Math.round(Math.random()),
      }));

      setLastTick(now);
    }
  }, [selectedMeter]);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(tick, 5000);
    return () => clearInterval(interval);
  }, [tick, isLive]);

  return {
    meters,
    selectedMeter,
    onMeterChange: handleMeterChange,
    kpis,
    flowHistory,
    dailyUsage,
    alerts,
    insights,
    device,
    lastTick,
    isLive,
    setIsLive,
    isLoading,
    error
  };
}