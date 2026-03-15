// components/charts/UsageBarChart.jsx
import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

export default function UsageBarChart({ data }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');

      if (chartRef.current) {
        chartRef.current.destroy();
      }

      chartRef.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.map(d => d.day),
          datasets: [{
            label: 'Usage (L)',
            data: data.map(d => d.usage),
            backgroundColor: '#0ea5e9',
            borderRadius: 6,
            maxBarThickness: 40
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
              beginAtZero: true,
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
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm" data-purpose="bar-chart-container">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Daily Water Usage (Last 7 Days)</h3>
        <div className="flex space-x-2">
          <span className="flex items-center text-xs text-slate-500">
            <span className="w-3 h-3 bg-primary rounded-sm mr-1"></span> Usage (L)
          </span>
        </div>
      </div>
      <div className="h-[250px] w-full relative">
        <canvas ref={canvasRef}></canvas>
      </div>
    </div>
  );
}
                