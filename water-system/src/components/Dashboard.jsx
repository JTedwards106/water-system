import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { 
  Droplet, 
  Activity, 
  AlertTriangle, 
  Zap, 
  Power, 
  RefreshCcw,
  BarChart3,
  Waves
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

const DEVICE_ID = "home-hw-001";
const API_BASE = "http://localhost:8081/api/v1/water";
const USER_API = "http://localhost:8081/api/v1/user";

export default function Dashboard() {
  const [readings, setReadings] = useState([]);
  const [account, setAccount] = useState({ cumulativeUsage: 0, targetAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [valveOpen, setValveOpen] = useState(true);
  const [isAIActive, setIsAIActive] = useState(true);
  const [newTarget, setNewTarget] = useState("");

  const fetchData = async () => {
    try {
      // 1. Fetch Latest Readings
      const resReadings = await fetch(`${API_BASE}/latest/${DEVICE_ID}`);
      const data = await resReadings.json();
      setReadings(data.reverse()); 
      if (data.length > 0) {
        setValveOpen(data[0].valveOpen);
      }

      // 2. Fetch Account Info (Cumulative Usage & Target)
      const resAccount = await fetch(`${USER_API}/account/${DEVICE_ID}`);
      if (resAccount.ok) {
        const accData = await resAccount.json();
        setAccount(accData);
      }

      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 1000); // 1s polling for aggressive "Real-time" feel
    return () => clearInterval(interval);
  }, []);

  const toggleValve = async () => {
    const nextState = !valveOpen;
    try {
      await fetch(`${API_BASE}/valve?deviceId=${DEVICE_ID}&open=${nextState}`, { method: 'POST' });
      setValveOpen(nextState);
    } catch (err) {
      console.error("Failed to toggle valve", err);
    }
  };

  const handleSetTarget = async (e) => {
    e.preventDefault();
    if (!newTarget) return;
    try {
      await fetch(`${USER_API}/target?deviceId=${DEVICE_ID}&amount=${newTarget}`, { method: 'POST' });
      setNewTarget("");
      fetchData(); // Refresh immediately
    } catch (err) {
      console.error("Failed to set target", err);
    }
  };

  const currentReading = readings[readings.length - 1] || {};
  const isTargetReached = account.targetAmount > 0 && account.cumulativeUsage >= account.targetAmount;

  const chartData = {
    labels: readings.map(r => new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })),
    datasets: [
      {
        fill: true,
        label: 'Flow Rate (L/min)',
        data: readings.map(r => r.flowRate),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.2)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
      x: { grid: { display: false } }
    },
  };

  return (
    <div className="dashboard-container">
      {isTargetReached && (
        <div className="wow-alert">
          <AlertTriangle size={48} />
          <div className="alert-content">
            <h2>TARGET REACHED!</h2>
            <p>Irrigation stopped automatically at {account.cumulativeUsage?.toFixed(2)} Liters</p>
          </div>
        </div>
      )}

      <header className="dash-header">
        <div className="logo-section">
          <Waves className="logo-icon" size={32} />
          <h1>AquaSmart <span>Pro</span></h1>
        </div>
        <div className="status-badge">
          <Activity size={16} />
          SYSTEM LIVE
        </div>
      </header>

      <main className="dash-grid">
        <div className="stats-cards">
          <div className="card stat-card blue">
            <div className="card-icon"><Droplet /></div>
            <div className="card-info">
              <label>Current Flow</label>
              <div className="value">{currentReading.flowRate?.toFixed(2) || "0.00"} <span>L/min</span></div>
            </div>
          </div>

          <div className="card stat-card purple">
            <div className="card-icon"><BarChart3 /></div>
            <div className="card-info">
              <label>Total Usage (This Session)</label>
              <div className="value">{account.cumulativeUsage?.toFixed(2) || "0.00"} <span>Liters</span></div>
            </div>
          </div>

          <div className="card stat-card orange">
            <div className="card-icon"><Zap /></div>
            <div className="card-info">
              <label>Target Threshold</label>
              <div className="value">{account.targetAmount?.toFixed(2) || "0.00"} <span>Liters</span></div>
            </div>
          </div>
        </div>

        <div className="card chart-card">
          <div className="card-header">
            <h3><BarChart3 size={20} /> Real-Time Consumption</h3>
            <div className="tag">Live Feed</div>
          </div>
          <div className="chart-wrapper">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="card control-card">
          <h3>Control Center</h3>
          
          <div className="target-setting">
             <form onSubmit={handleSetTarget}>
                <label>Set Target Limit (Liters)</label>
                <div className="input-group">
                  <input 
                    type="number" 
                    placeholder="e.g. 5.0" 
                    value={newTarget} 
                    onChange={(e) => setNewTarget(e.target.value)}
                  />
                  <button type="submit">SET</button>
                </div>
             </form>
          </div>

          <div className="divider" />

          <div className="control-item">
            <div className="ctrl-info">
              <strong>Manual Valve Override</strong>
              <button 
                className={`power-btn ${valveOpen ? 'on' : 'off'}`}
                onClick={toggleValve}
              >
                <Power size={20} />
                {valveOpen ? 'OPEN' : 'CLOSED'}
              </button>
            </div>
          </div>

          <div className="divider" />

          <div className="control-item">
            <div className="ctrl-info">
              <strong>AI Predictive Guard</strong>
              <div className={`ai-toggle ${isAIActive ? 'active' : ''}`} onClick={() => setIsAIActive(!isAIActive)}>
                 <RefreshCcw size={16} className={isAIActive ? 'spin' : ''} />
                 {isAIActive ? 'AI PROTECTED' : 'DISABLED'}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
