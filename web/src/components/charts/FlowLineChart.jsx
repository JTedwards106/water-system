// components/charts/FlowLineChart.jsx
import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

export default function FlowLineChart({ data }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');

      if (chartRef.current) {
        chartRef.current.destroy();
      }

      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.map(d => d.time),
          datasets: [{
            label: 'Water Flow (L/min)',
            data: data.map(d => d.flow),
            borderColor: '#0ea5e9',
            backgroundColor: 'rgba(14, 165, 233, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#fff',
            pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: false,
              grid: { color: '#f1f5f9' },
              border: { display: false }
            },
            x: {
              grid: { display: false },
              border: { display: false }
            }
          }
        }
      });
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm" data-purpose="line-chart-container">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Real-Time Water Flow (L/min)</h3>
        <select className="text-sm border-slate-200 rounded-lg text-slate-600 bg-slate-50 focus:ring-primary focus:border-primary">
          <option>Last 60 mins</option>
          <option>Last 24 hours</option>
        </select>
      </div>
      <div className="h-[300px] w-full relative">
        <canvas ref={canvasRef}></canvas>
      </div>
    </div>
  );
}