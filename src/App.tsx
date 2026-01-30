import { useState } from 'react';
import { AppShell } from './components/layout';
import { ExecutiveDashboard, OBODashboard, MetricDefinitions } from './pages';

function App() {
    const [activePage, setActivePage] = useState<'executive' | 'obo' | 'metrics'>('executive');

    return (
        <AppShell activePage={activePage} onPageChange={setActivePage}>
            {activePage === 'executive' ? (
                <ExecutiveDashboard />
            ) : activePage === 'obo' ? (
                <OBODashboard />
            ) : (
                <MetricDefinitions />
            )}
        </AppShell>
    );
}

export default App;
