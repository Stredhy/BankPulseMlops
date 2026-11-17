import { useCallback, useEffect, useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { Sidebar } from './components/Sidebar';
import type { ActiveSection, DashboardSummary } from './types/dashboard';

const apiBaseUrl = 'http://localhost:8000';

export function App() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ActiveSection>('overview');

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/dashboard/summary`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data: DashboardSummary = await response.json();
      setSummary(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo conectar con FastAPI'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    const intervalId = window.setInterval(fetchSummary, 15000);
    return () => window.clearInterval(intervalId);
  }, [fetchSummary]);

  return (
    <div className="min-h-screen bg-[#0d070a] text-[#f8eff2] flex">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        apiConnected={Boolean(summary?.api.connected && !error)}
        airflowConnected={Boolean(summary?.airflow.connected)}
      />

      <Dashboard
        summary={summary}
        loading={loading}
        error={error}
        activeSection={activeSection}
        apiBaseUrl={apiBaseUrl}
        onRefresh={fetchSummary}
      />
    </div>
  );
}

export default App;
