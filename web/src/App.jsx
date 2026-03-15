// App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/ui/Header';
import Dashboard from './pages/Dashboard';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import { useDashboard } from './hooks/useDashboard';

export default function App() {
  const { lastTick, isLive, setIsLive } = useDashboard();

  return (
    <Router>
      <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
        <Routes>
          {/* Auth routes - no header */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Dashboard route - with header */}
          <Route path="/dashboard" element={
            <>
              <Header lastTick={lastTick} isLive={isLive} setIsLive={setIsLive} />
              <Dashboard />
            </>
          } />

          {/* Default route - redirect to sign in */}
          <Route path="/" element={<SignIn />} />
        </Routes>
      </div>
    </Router>
  );
}