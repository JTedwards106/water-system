// components/ui/InsightsPanel.jsx
export default function InsightsPanel({ insights }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Farm Insights</h3>
      <div className="space-y-4">
        <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Recommended Today</p>
          <div className="flex justify-between items-end mt-1">
            <p className="text-2xl font-bold text-slate-800">{insights.recommendedToday.toLocaleString()} L</p>
            <p className="text-xs text-slate-500">Based on weather</p>
          </div>
        </div>
        <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-100">
          <p className="text-xs font-bold text-teal-600 uppercase tracking-wider">System Efficiency</p>
          <div className="flex justify-between items-end mt-1">
            <p className="text-2xl font-bold text-slate-800">{insights.efficiency}%</p>
            <div className="flex items-center text-xs text-green-600 font-bold">
              <svg className="h-3 w-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path clipRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" fillRule="evenodd"></path>
              </svg>
              {insights.efficiencyDelta}% vs last week
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}