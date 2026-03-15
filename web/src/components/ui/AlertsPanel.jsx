// components/ui/AlertsPanel.jsx
export default function AlertsPanel({ alerts }) {
  const getAlertStyle = (type) => {
    switch (type) {
      case 'warning':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-100',
          iconColor: 'text-amber-600',
          titleColor: 'text-amber-900',
          textColor: 'text-amber-700',
          timeColor: 'text-amber-500',
          icon: (
            <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
          )
        };
      case 'info':
        return {
          bg: 'bg-slate-50',
          border: 'border-slate-100',
          iconColor: 'text-slate-400',
          titleColor: 'text-slate-700',
          textColor: 'text-slate-500',
          timeColor: 'text-slate-400',
          icon: (
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
          )
        };
      default:
        return {
          bg: 'bg-slate-50',
          border: 'border-slate-100',
          iconColor: 'text-slate-400',
          titleColor: 'text-slate-700',
          textColor: 'text-slate-500',
          timeColor: 'text-slate-400',
          icon: (
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
          )
        };
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
        <svg className="h-5 w-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" fillRule="evenodd"></path>
        </svg>
        Recent Alerts
      </h3>
      <div className="space-y-3">
        {alerts.map((alert) => {
          const style = getAlertStyle(alert.type);
          return (
            <div key={alert.id} className={`flex items-start p-3 ${style.bg} border ${style.border} rounded-xl`}>
              <div className="mt-0.5 mr-3">
                {style.icon}
              </div>
              <div>
                <p className={`text-sm font-semibold ${style.titleColor} leading-none`}>{alert.title}</p>
                <p className={`text-xs ${style.textColor} mt-1`}>{alert.message}</p>
                <span className={`text-[10px] ${style.timeColor} font-medium uppercase mt-2 inline-block`}>{alert.ago}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
          