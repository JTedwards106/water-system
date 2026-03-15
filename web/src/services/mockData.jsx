// services/mockData.js

export const meters = [
  {
    id: 'meter-1',
    name: 'Main Irrigation Meter',
    location: 'North Field',
    status: 'online',
    battery: 87,
  },
  {
    id: 'meter-2',
    name: 'Zone A Flow Sensor',
    location: 'East Field',
    status: 'online',
    battery: 64,
  },
  {
    id: 'meter-3',
    name: 'Zone B Flow Sensor',
    location: 'South Field',
    status: 'online',
    battery: 91,
  },
  {
    id: 'meter-4',
    name: 'Backup Pump Meter',
    location: 'Pump Station',
    status: 'online',
    battery: 43,
  },
];

export const meterData = {
  'meter-1': {
    kpis: {
      flowRate: 42.8,
      totalWaterToday: 1240,
      irrigationRuntime: 145,
      systemStatus: 'Normal',
    },
    dailyUsage: [
      { day: 'Mon', usage: 1100, target: 1200 },
      { day: 'Tue', usage: 950,  target: 1200 },
      { day: 'Wed', usage: 1340, target: 1200 },
      { day: 'Thu', usage: 1050, target: 1200 },
      { day: 'Fri', usage: 1185, target: 1200 },
      { day: 'Sat', usage: 820,  target: 1200 },
      { day: 'Sun', usage: 1240, target: 1200 },
    ],
  },
  'meter-2': {
    kpis: {
      flowRate: 28.3,
      totalWaterToday: 890,
      irrigationRuntime: 98,
      systemStatus: 'Normal',
    },
    dailyUsage: [
      { day: 'Mon', usage: 780, target: 900 },
      { day: 'Tue', usage: 650,  target: 900 },
      { day: 'Wed', usage: 920, target: 900 },
      { day: 'Thu', usage: 710, target: 900 },
      { day: 'Fri', usage: 845, target: 900 },
      { day: 'Sat', usage: 580,  target: 900 },
      { day: 'Sun', usage: 890, target: 900 },
    ],
  },
  'meter-3': {
    kpis: {
      flowRate: 35.6,
      totalWaterToday: 1100,
      irrigationRuntime: 125,
      systemStatus: 'Warning',
    },
    dailyUsage: [
      { day: 'Mon', usage: 950, target: 1000 },
      { day: 'Tue', usage: 820,  target: 1000 },
      { day: 'Wed', usage: 1150, target: 1000 },
      { day: 'Thu', usage: 890, target: 1000 },
      { day: 'Fri', usage: 1020, target: 1000 },
      { day: 'Sat', usage: 720,  target: 1000 },
      { day: 'Sun', usage: 1100, target: 1000 },
    ],
  },
  'meter-4': {
    kpis: {
      flowRate: 15.2,
      totalWaterToday: 450,
      irrigationRuntime: 67,
      systemStatus: 'Normal',
    },
    dailyUsage: [
      { day: 'Mon', usage: 380, target: 400 },
      { day: 'Tue', usage: 320,  target: 400 },
      { day: 'Wed', usage: 480, target: 400 },
      { day: 'Thu', usage: 360, target: 400 },
      { day: 'Fri', usage: 420, target: 400 },
      { day: 'Sat', usage: 290,  target: 400 },
      { day: 'Sun', usage: 450, target: 400 },
    ],
  },
};

export const kpiData = {
  flowRate: 42.8,
  totalWaterToday: 1240,
  irrigationRuntime: 145,
  systemStatus: 'Normal', // 'Normal' | 'Warning' | 'Critical'
};

export const generateFlowHistory = () => {
  const now = new Date();
  return Array.from({ length: 24 }, (_, i) => {
    const t = new Date(now.getTime() - (23 - i) * 5 * 60 * 1000);
    const hour = t.getHours();
    const min = t.getMinutes().toString().padStart(2, '0');
    const base = 40 + Math.sin(i * 0.4) * 6;
    const noise = (Math.random() - 0.5) * 4;
    return {
      time: `${hour}:${min}`,
      flow: parseFloat((base + noise).toFixed(1)),
    };
  });
};

export const dailyUsageData = [
  { day: 'Mon', usage: 1100, target: 1200 },
  { day: 'Tue', usage: 950,  target: 1200 },
  { day: 'Wed', usage: 1340, target: 1200 },
  { day: 'Thu', usage: 1050, target: 1200 },
  { day: 'Fri', usage: 1185, target: 1200 },
  { day: 'Sat', usage: 820,  target: 1200 },
  { day: 'Sun', usage: 1240, target: 1200 },
];

export const alertsData = [
  {
    id: 'a1',
    type: 'warning',
    title: 'Possible Leak Detected',
    message: 'Sustained flow in Zone B after shutoff. Check valve integrity.',
    ago: '14 mins ago',
    zone: 'Zone B',
  },
  {
    id: 'a2',
    type: 'info',
    title: 'Extended Irrigation',
    message: 'Zone A running 15 min longer than scheduled cycle.',
    ago: '1 hr ago',
    zone: 'Zone A',
  },
  {
    id: 'a3',
    type: 'info',
    title: 'Pressure Drop',
    message: 'Inlet pressure dropped 8% below threshold at 07:42.',
    ago: '3 hrs ago',
    zone: 'Main Line',
  },
  {
    id: 'a4',
    type: 'resolved',
    title: 'Sensor Reconnected',
    message: 'Flow sensor FW-04 restored after brief disconnection.',
    ago: '5 hrs ago',
    zone: 'Zone C',
  },
];

export const insightsData = {
  recommendedToday: 1400,
  usedToday: 1240,
  efficiency: 92,
  efficiencyDelta: +2,
  soilMoisture: 68,
  weatherAdjustment: -15,
  nextIrrigationIn: '3h 22m',
};

export const deviceData = {
  gatewayId: 'GW-0421',
  status: 'Connected',
  signalStrength: -62,
  lastUpdated: '2 mins ago',
  sensors: [
    { id: 'FW-01', name: 'Zone A Flow', status: 'online', battery: 87 },
    { id: 'FW-02', name: 'Zone B Flow', status: 'online', battery: 64 },
    { id: 'FW-03', name: 'Zone C Flow', status: 'online', battery: 91 },
    { id: 'FW-04', name: 'Inlet Meter', status: 'online', battery: 43 },
  ],
};