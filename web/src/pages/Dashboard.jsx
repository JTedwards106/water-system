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
    device
  } = useDashboard();

  return (
    <main className="flex-grow p-6 space-y-6 max-w-[1600px] mx-auto w-full">
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