import React from 'react';
import { LayoutDashboard, BedDouble, Package, TrendingUp, Network, Bell, Bot, BarChart3 } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import clsx from 'clsx';

export const NavigationTabs = () => {
  const { activeTab, setActiveTab, alerts } = useHospital();

  const unackAlertsCount = alerts?.filter(a => !a.acknowledged).length || 0;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'bed-manager', label: 'Beds', icon: BedDouble },
    { id: 'resources', label: 'Supplies', icon: Package },
    { id: 'forecast', label: 'Forecast', icon: TrendingUp },
    { id: 'digital-twin', label: 'Patient Flow', icon: Network },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: unackAlertsCount },
    { id: 'chat', label: 'Assistant', icon: Bot },
    { id: 'analytics', label: 'Reports', icon: BarChart3 }
  ];

  return (
    <nav className="bg-white/85 border-b border-slate-200 px-6 py-2">
      <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto py-1" aria-label="Primary navigation">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={clsx(
                'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-200 border',
                isActive
                  ? 'bg-cyan-50 text-cyan-800 border-cyan-200 shadow-sm'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50 border-transparent'
              )}
            >
              <Icon className={clsx('w-4 h-4', isActive ? 'text-cyan-700' : 'text-slate-500')} />
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span className="min-w-5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-600 text-white text-center">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
