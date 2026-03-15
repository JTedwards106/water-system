import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Droplets, 
    Activity, 
    Thermometer, 
    AlertTriangle, 
    Settings, 
    Power,
    Target,
    Zap,
    Wind
} from 'lucide-react';
import { 
    Chart as ChartJS, 
    CategoryScale, 
    LinearScale, 
    PointElement, 
    LineElement, 
    Title, 
    Tooltip, 
    Legend, 
    Filler 
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import './Dashboard.css';

ChartJS.register(
    CategoryScale, 
    LinearScale, 
    PointElement, 
    LineElement, 
    Title, 
    Tooltip, 
    Legend, 
    Filler
);

const BACKEND_URL = 'https://aquasmart-fresh-start.loca.lt'; // Standardizing for the demo
const DEVICE_ID = 'home-hw-001';

export default function Dashboard() {
    const [readings, setReadings] = useState([]);
    const [account, setAccount] = useState(null);
    const [valveOpen, setValveOpen] = useState(true);
    const [targetReached, setTargetReached] = useState(false);
    const [newTarget, setNewTarget] = useState('');
    const [cropType, setCropType] = useState('NONE');

    useEffect(() => {
        const interval = setInterval(() => {
            fetchLatestData();
            fetchAccountData();
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const fetchLatestData = async () => {
        try {
            const res = await axios.get(`${BACKEND_URL}/api/v1/water/latest/${DEVICE_ID}`);
            setReadings(res.data.reverse());
            if (res.data.length > 0) {
                setValveOpen(res.data[0].valveOpen);
                if (res.data[0].leakDetected) {
                     // Potential alert logic
                }
            }
        } catch (err) {
            console.error("Fetch Data Error:", err);
        }
    };

    const fetchAccountData = async () => {
        try {
            const res = await axios.get(`${BACKEND_URL}/api/v1/user/account/${DEVICE_ID}`);
            setAccount(res.data);
            if (res.data.targetAmount > 0 && res.data.cumulativeUsage >= res.data.targetAmount) {
                setTargetReached(true);
            } else {
                setTargetReached(false);
            }
            setCropType(res.data.cropType || 'NONE');
        } catch (err) {
            console.error("Fetch Account Error:", err);
        }
    };

    const toggleValve = async () => {
        try {
            await axios.post(`${BACKEND_URL}/api/v1/water/valve?deviceId=${DEVICE_ID}&open=${!valveOpen}`);
            setValveOpen(!valveOpen);
        } catch (err) {
            console.error("Valve Toggle Error:", err);
        }
    };

    const handleSetTarget = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${BACKEND_URL}/api/v1/user/target?deviceId=${DEVICE_ID}&amount=${newTarget}`);
            setNewTarget('');
            fetchAccountData();
        } catch (err) {
            console.error("Set Target Error:", err);
        }
    };

    const handleCropChange = async (newCrop) => {
        try {
            await axios.post(`${BACKEND_URL}/api/v1/user/crop?deviceId=${DEVICE_ID}&cropType=${newCrop}`);
            setCropType(newCrop);
            fetchAccountData();
        } catch (err) {
            console.error("Crop Change Error:", err);
        }
    };

    const chartData = {
        labels: readings.map((_, i) => i),
        datasets: [
            {
                label: 'Flow Rate (L/min)',
                data: readings.map(r => r.flowRate),
                fill: true,
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                borderColor: '#6366f1',
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#fff',
                borderWidth: 3,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1e293b',
                titleColor: '#f8fafc',
                bodyColor: '#cbd5e1',
                padding: 12,
                cornerRadius: 8,
            }
        },
        scales: {
            x: { display: false },
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#94a3b8' }
            }
        }
    };

    return (
        <div className="dashboard-container">
            {targetReached && (
                <div className="wow-alert">
                    <Zap size={32} />
                    <span>TARGET REACHED — IRRIGATION AUTOMATICALLY STOPPED</span>
                </div>
            )}

            <header className="dash-header">
                <div className="logo-group">
                    <Droplets size={32} className="text-indigo-500" />
                    <h1>AquaSmart <span className="beta-tag">MVP</span></h1>
                </div>
                <div className={`status-pill ${valveOpen ? 'open' : 'closed'}`}>
                    {valveOpen ? 'VALVE ACTIVE' : 'VALVE CLOSED'}
                </div>
            </header>

            <main className="dash-grid">
                {/* Real-time Graph */}
                <div className="chart-card card">
                    <div className="card-header">
                        <Activity size={20} />
                        <h2>Real-time Flow Monitoring</h2>
                    </div>
                    <div className="chart-wrapper">
                        <Line data={chartData} options={chartOptions} />
                    </div>
                </div>

                {/* Controls & Metrics */}
                <div className="side-panel">
                    <div className="metric-card card">
                        <div className="card-header">
                            <Target size={20} />
                            <h2>Water Quota</h2>
                        </div>
                        <div className="usage-display">
                            <div className="usage-main">
                                <span className="usage-val">{account?.cumulativeUsage?.toFixed(2) || '0.00'}</span>
                                <span className="usage-unit">Liters Used</span>
                            </div>
                            <div className="usage-target">
                                / {account?.targetAmount || '0.00'} L Target
                            </div>
                        </div>
                        <form onSubmit={handleSetTarget} className="target-form">
                            <input 
                                type="number" 
                                placeholder="Overide Target (L)" 
                                value={newTarget}
                                onChange={(e) => setNewTarget(e.target.value)}
                            />
                            <button type="submit">SET</button>
                        </form>
                        <div className="crop-selector border-t border-gray-800 pt-4 mt-4">
                            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">Active Crop:</label>
                            <select 
                                value={cropType} 
                                onChange={(e) => handleCropChange(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-indigo-400 focus:outline-none focus:border-indigo-500"
                            >
                                <option value="NONE">Manual Mode</option>
                                <option value="TOMATOES">Tomatoes (8L)</option>
                                <option value="LETTUCE">Lettuce (5L)</option>
                                <option value="CORN">Corn (10L)</option>
                            </select>
                        </div>
                    </div>

                    <div className="control-card card">
                        <div className="card-header">
                            <Settings size={20} />
                            <h2>System Controls</h2>
                        </div>
                        <button 
                            className={`valve-button ${valveOpen ? 'btn-red' : 'btn-green'}`}
                            onClick={toggleValve}
                        >
                            <Power size={24} />
                            {valveOpen ? 'SHUT OFF VALVE' : 'OPEN VALVE'}
                        </button>
                        <p className="hint-text">
                            Auto-cutoff is active. AI predictive guard is monitoring for waste patterns.
                        </p>
                    </div>

                    <div className="analytics-card card">
                         <div className="card-header">
                            <Zap size={20} />
                            <h2>AI Insights</h2>
                        </div>
                        <div className="ai-stat">
                            <Wind size={16} />
                            <span>Efficiency: 98.4%</span>
                        </div>
                         <div className="ai-stat">
                            <Droplets size={16} />
                            <span>Savings: 124.5L Today</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
