// pages/Dashboard.jsx
import KpiCards from '../components/ui/KpiCards';
import FlowLineChart from '../components/charts/FlowLineChart';
import UsageBarChart from '../components/charts/UsageBarChart';
import AlertsPanel from '../components/ui/AlertsPanel';
import InsightsPanel from '../components/ui/InsightsPanel';
import DevicePanel from '../components/ui/DevicePanel';
import MeterSelector from '../components/ui/MeterSelector';
import { useDashboard } from '../hooks/useDashboard';

export default function Dashboard() {
  const {
    meters,
    selectedMeter,
    onMeterChange,
    kpis,
    flowHistory,
    dailyUsage,
    alerts,
    insights,
    device,
    isLoading,
    error
  } = useDashboard();

  return (
    <main className="flex-grow p-6 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading dashboard data...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading dashboard data</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meter Selector */}
      <div className="flex justify-center">
        <MeterSelector
          meters={meters}
          selectedMeter={selectedMeter}
          onMeterChange={onMeterChange}
        />
      </div>

      {/* BEGIN: KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-purpose="kpi-section">
        <KpiCards kpis={kpis} />
      </section>
      {/* END: KPI Cards */}
      {/* BEGIN: Charts & Side Panel Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Side: Main Charts */}
        <div className="xl:col-span-2 space-y-6">
          <FlowLineChart data={flowHistory} />
          <UsageBarChart data={dailyUsage} />
        </div>
        {/* Right Side: Sidebar Panels */}
        <div className="space-y-6">
          <AlertsPanel alerts={alerts} />
          <InsightsPanel insights={insights} />
          <DevicePanel device={device} />
        </div>
      </div>
      {/* END: Charts & Side Panel Layout */}
    </main>
  );
}