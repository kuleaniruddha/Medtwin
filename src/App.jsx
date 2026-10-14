import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { HospitalProvider, useHospital } from './context/HospitalContext';
import { Header } from './components/layout/Header';
import { NavigationTabs } from './components/layout/NavigationTabs';
import { AlertBanner } from './components/layout/AlertBanner';

import { OverviewView } from './components/views/OverviewView';
import { BedManagerView } from './components/views/BedManagerView';
import { ResourceTrackerView } from './components/views/ResourceTrackerView';
import { ForecastView } from './components/views/ForecastView';
import { DigitalTwinFlow } from './components/views/DigitalTwinFlow';
import { AlertsView } from './components/views/AlertsView';
import { MedTwinChat } from './components/views/MedTwinChat';
import { AnalyticsView } from './components/views/AnalyticsView';
import { LandingPage } from './components/views/LandingPage';

import './styles/landing.css';

const MainContent = () => {
  const { activeTab, isLoading } = useHospital();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-600">Loading hospital dashboard...</p>
      </div>
    );
  }

  return (
    <main className="w-full max-w-7xl mx-auto px-6 py-6 transition-all duration-300">
      {activeTab === 'overview' && <OverviewView />}
      {activeTab === 'bed-manager' && <BedManagerView />}
      {activeTab === 'resources' && <ResourceTrackerView />}
      {activeTab === 'forecast' && <ForecastView />}
      {activeTab === 'digital-twin' && <DigitalTwinFlow />}
      {activeTab === 'alerts' && <AlertsView />}
      {activeTab === 'chat' && <MedTwinChat />}
      {activeTab === 'analytics' && <AnalyticsView />}
    </main>
  );
};

const Dashboard = () => (
  <AuthProvider>
    <HospitalProvider>
      <div className="app-shell min-h-screen flex flex-col selection:bg-cyan-200 selection:text-slate-950">
        <Header />
        <AlertBanner />
        <NavigationTabs />
        <div className="flex-1">
          <MainContent />
        </div>
        <footer className="border-t border-slate-200 bg-white/80 py-4 px-6 text-center text-xs text-slate-500">
          <p>MedTwin Hospital Operations Dashboard</p>
        </footer>
      </div>
    </HospitalProvider>
  </AuthProvider>
);

export default function App() {
  const [showDashboard, setShowDashboard] = useState(false);

  if (!showDashboard) {
    return <LandingPage onEnter={() => setShowDashboard(true)} />;
  }

  return <Dashboard />;
}
