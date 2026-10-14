import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Cpu, User, Zap, Wifi, LogOut } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import { StatBadge } from '../common/StatBadge';
import { ActionButton } from '../common/ActionButton';
import { isLiveConfigured } from '../../services/firebase';

export const Header = ({ onLogout }) => {
  const { alerts, applySurge, surgePercent } = useHospital();
  const { activeRole, setActiveRole, ROLES } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const unackCriticalCount = alerts?.filter(a => a.severity === 'CRITICAL' && !a.acknowledged).length || 0;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 px-6 sm:px-10 lg:px-12 py-3.5 shadow-xs">
      <div className="max-w-[1560px] 2xl:max-w-[1720px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative p-3 rounded-xl bg-cyan-700 text-white shadow-sm">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black tracking-tight text-slate-950 font-heading">
                MedTwin <span className="text-cyan-700 font-bold text-xs border border-cyan-200 px-2.5 py-0.5 rounded-lg bg-cyan-50">Operations Center</span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>Hospital capacity, live telemetry, and AI emergency dispatch hub</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap justify-center">
          {isLiveConfigured ? (
            <StatBadge type="success" label="Live sync" icon={Wifi} />
          ) : (
            <StatBadge type="info" label="Simulator" icon={Cpu} />
          )}

          {unackCriticalCount > 0 && (
            <StatBadge
              type="critical"
              label={`${unackCriticalCount} critical`}
              icon={ShieldAlert}
              pulse
            />
          )}

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm">
            <Zap className="w-4 h-4 text-amber-600" />
            <label htmlFor="surge-level" className="text-slate-600 font-medium">Demand:</label>
            <select
              id="surge-level"
              value={surgePercent}
              onChange={(e) => applySurge(Number(e.target.value))}
              className="bg-white text-slate-900 font-semibold rounded-md px-2 py-1 outline-none border border-slate-200"
            >
              <option value={0}>Normal</option>
              <option value={15}>+15% patients</option>
              <option value={30}>+30% patients</option>
              <option value={50}>+50% patients</option>
            </select>
          </div>

          <div className="hidden xl:flex flex-col text-right text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-950">{time.toLocaleTimeString()}</span>
            <span className="text-[10px] text-slate-400">{time.toLocaleDateString()}</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm">
            <User className="w-4 h-4 text-cyan-700" />
            <label htmlFor="active-role" className="sr-only">Role</label>
            <select
              id="active-role"
              value={activeRole.id}
              onChange={(e) => {
                const role = ROLES.find(r => r.id === e.target.value);
                if (role) setActiveRole(role);
              }}
              className="bg-transparent text-slate-900 font-semibold outline-none cursor-pointer text-xs"
            >
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.roleName || r.name}
                </option>
              ))}
            </select>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition-all"
              title="Sign out & return to Login"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
