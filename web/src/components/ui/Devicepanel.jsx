// components/ui/DevicePanel.jsx
export default function DevicePanel({ device }) {
  return (
    <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-lg overflow-hidden relative">
      <div className="relative z-10">
        <h3 className="text-sm font-medium text-slate-400 mb-4">Device Status</h3>
        <div className="flex items-center space-x-3 mb-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse"></div>
            </div>
          </div>
          <div>
            <p className="text-lg font-bold">{device.gatewayId}</p>
            <p className="text-xs text-green-400 font-medium">{device.status}</p>
          </div>
        </div>
        <div className="pt-4 border-t border-slate-800 flex justify-between text-xs text-slate-400">
          <span>Signal Strength</span>
          <span className="text-white font-bold">{device.signalStrength} dBm</span>
        </div>
        <div className="pt-2 flex justify-between text-xs text-slate-400">
          <span>Last Updated</span>
          <span className="text-white font-bold">{device.lastUpdated}</span>
        </div>
      </div>
      {/* Decorative bg pattern */}
      <svg className="absolute right-0 bottom-0 text-slate-800 opacity-20 w-32 h-32 transform translate-x-8 translate-y-8" fill="currentColor" viewBox="0 0 100 100">
        <path d="M50 0 L100 50 L50 100 L0 50 Z"></path>
      </svg>
    </div>
  );
}