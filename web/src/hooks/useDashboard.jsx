// hooks/useDashboard.js
import { useState, useEffect, useCallback } from 'react';
import {
  meters,
  meterData,
  generateFlowHistory,
  alertsData,
  insightsData,
  deviceData,
} from '../services/mockData';

export function useDashboard() {
  const [selectedMeter, setSelectedMeter] = useState(meters[0]); // Default to first meter
  const [kpis, setKpis] = useState(meterData[meters[0].id].kpis);
  const [flowHistory, setFlowHistory] = useState(generateFlowHistory);
  const [dailyUsage] = useState(meterData[meters[0].id].dailyUsage);
  const [alerts] = useState(alertsData);
  const [insights] = useState(insightsData);
  const [device] = useState(deviceData);
  const [lastTick, setLastTick] = useState(new Date());
  const [isLive, setIsLive] = useState(true);

  // Update data when meter changes
  const handleMeterChange = useCallback((meter) => {
    setSelectedMeter(meter);
    setKpis(meterData[meter.id].kpis);
    // Reset flow history for new meter
    setFlowHistory(generateFlowHistory());
  }, []);

  // Simulate live sensor ticks every 5 seconds
  const tick = useCallback(() => {
    const now = new Date();
    const hour = now.getHours();
    const min = now.getMinutes().toString().padStart(2, '0');

    // Generate flow based on selected meter's characteristics
    const baseFlow = meterData[selectedMeter.id].kpis.flowRate;
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
    setIsLive
  };
}