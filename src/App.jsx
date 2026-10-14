import React, { useState, Component } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
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
import { LoginPage } from './components/views/LoginPage';
import { MumbaiEmergencyRadar } from './components/views/MumbaiEmergencyRadar';

import './styles/landing.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md shadow-lg">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mx-auto mb-4 font-bold text-lg">!</div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-xs text-slate-500 mb-4">{this.state.error?.message || "An unexpected error occurred."}</p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Reload MedTwin
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
      {activeTab === 'mumbai-radar' && <MumbaiEmergencyRadar />}
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

const AppContent = () => {
  const { logout } = useAuth();
  // Screen states: 'landing' | 'login' | 'dashboard'
  const [screen, setScreen] = useState('landing');

  if (screen === 'landing') {
    return (
      <LandingPage
        onGetStarted={() => setScreen('login')}
        onEnter={() => setScreen('login')}
      />
    );
  }

  if (screen === 'login') {
    return (
      <LoginPage
        onLoginSuccess={() => setScreen('dashboard')}
        onBackToHome={() => setScreen('landing')}
      />
    );
  }

  return (
    <HospitalProvider>
      <div className="app-shell min-h-screen flex flex-col selection:bg-cyan-200 selection:text-slate-950">
        <Header onLogout={() => {
          logout();
          setScreen('login');
        }} />
        <AlertBanner />
        <NavigationTabs />
        <div className="flex-1">
          <MainContent />
        </div>
        <footer className="border-t border-slate-200 bg-white/80 py-4 px-6 text-center text-xs text-slate-500">
          <p>MedTwin Hospital Operations Dashboard • Connected to Firebase medtwin-83f0f</p>
        </footer>
      </div>
    </HospitalProvider>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
