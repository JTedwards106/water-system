// components/ui/KpiCards.jsx
export default function KpiCards({ kpis }) {
  const cards = [
    {
      key: 'flowRate',
      label: 'Current Flow Rate',
      unit: 'L/min',
      icon: (
        <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
        </svg>
      ),
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      value: kpis.flowRate.toFixed(1),
    },
    {
      key: 'totalWaterToday',
      label: 'Total Water Today',
      unit: 'Litres',
      icon: (
        <svg className="h-8 w-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.628.288a2 2 0 01-1.663.008l-.63-.285a6 6 0 00-3.96-.523l-2.492.44a2 2 0 00-1.641 1.397 17.114 17.114 0 000 10.107 2 2 0 001.61 1.487l2.245.401a6 6 0 003.833-.495l.522-.24a2 2 0 011.592-.008l.547.253a6 6 0 003.841.549l2.453-.437a2 2 0 001.665-1.394 17.02 17.02 0 000-10.255z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
        </svg>
      ),
      bg: 'bg-teal-50',
      text: 'text-teal-600',
      value: kpis.totalWaterToday.toLocaleString(),
    },
    {
      key: 'irrigationRuntime',
      label: 'Irrigation Runtime',
      unit: 'min',
      icon: (
        <svg className="h-8 w-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
        </svg>
      ),
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      value: kpis.irrigationRuntime,
    },
    {
      key: 'systemStatus',
      label: 'System Status',
      unit: null,
      icon: (
        <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
        </svg>
      ),
      bg: 'bg-green-50',
      text: 'text-green-600',
      value: kpis.systemStatus,
      special: true,
    },
  ];

  return (
    <>
      {cards.map((card) => (
        <div key={card.key} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className={`${card.bg} p-3 rounded-xl`}>
            {card.icon}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            {card.special ? (
              <div className="flex items-center space-x-2">
                <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                <p className="text-2xl font-bold text-slate-900">{card.value}</p>
              </div>
            ) : (
              <p className="text-2xl font-bold text-slate-900">
                {card.value} <span className="text-sm font-normal text-slate-400">{card.unit}</span>
              </p>
            )}
          </div>
        </div>
      ))}
    </>
  );
}