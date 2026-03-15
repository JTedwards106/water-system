// components/ui/Header.jsx
export default function Header() {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center space-x-4">
        <img src="/water-logo.png" alt="Smart Farm Water Monitoring Logo" className="h-10 w-10 object-contain" />
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">Smart Farm Water Monitoring</h1>
          <p className="text-sm text-slate-500">Real-time irrigation analytics</p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors relative">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">John Farmer</p>
            <p className="text-xs text-slate-500">Farm Manager</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-slate-200 border-2 border-slate-100 flex items-center justify-center cursor-pointer overflow-hidden">
            <svg className="h-6 w-6 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
}
