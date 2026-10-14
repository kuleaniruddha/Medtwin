import React, { useState } from 'react';
import { BedDouble, Wind, Pill, Users, ArrowUpRight, ShieldAlert, Zap } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { GlassCard } from '../common/GlassCard';
import { StatBadge } from '../common/StatBadge';
import { ProgressBar } from '../common/ProgressBar';
import { ActionButton } from '../common/ActionButton';
import { Modal } from '../common/Modal';

export const OverviewView = () => {
  const { metrics, wards, alerts, setActiveTab, restockInventory } = useHospital();
  const [isQuickActionModalOpen, setIsQuickActionModalOpen] = useState(false);
  const [quickOxygenPSI, setQuickOxygenPSI] = useState(885);

  const occRate = metrics?.occupancyRate || 84.4;
  const o2Percent = metrics?.oxygenTankLevelPercent || 88.5;

  const handleUpdateOxygenQuick = () => {
    const percent = Number(((quickOxygenPSI / 1000) * 100).toFixed(1));
    restockInventory('oxygen', {
      pressurePSI: Number(quickOxygenPSI),
      tankPercentage: percent
    });
    setIsQuickActionModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard variant="interactive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bed capacity</span>
            <div className="p-2 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-100">
              <BedDouble className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-950 font-mono">{metrics?.occupiedBeds || 76}</span>
              <span className="text-xs text-slate-500">of {metrics?.totalBeds || 90} occupied</span>
            </div>
            <ProgressBar value={occRate} label="Occupancy Rate" className="mt-3" />
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Available: <strong className="text-emerald-700 font-mono">{metrics?.availableBeds || 14}</strong></span>
            <button onClick={() => setActiveTab('bed-manager')} className="text-cyan-700 hover:underline flex items-center gap-0.5 font-medium">
              Manage <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </GlassCard>

        <GlassCard variant="interactive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Oxygen supply</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Wind className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-950 font-mono">{o2Percent}%</span>
              <span className="text-xs text-slate-500">({metrics?.oxygenTankPSI || 885} PSI)</span>
            </div>
            <ProgressBar value={o2Percent} label="Main Tank Reserves" className="mt-3" />
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Remaining: <strong className="text-cyan-700 font-mono">{metrics?.oxygenHoursRemaining || 34.5} hrs</strong></span>
            <button onClick={() => setActiveTab('resources')} className="text-emerald-700 hover:underline flex items-center gap-0.5 font-medium">
              Tracker <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </GlassCard>

        <GlassCard variant="interactive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Medications</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
              <Pill className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-950">Needs review</span>
              <span className="text-xs text-amber-700 font-semibold">2 low</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Propofol and Heparin Sodium are near minimum stock.</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <StatBadge type="warning" label="Restock Required" />
            <button onClick={() => setActiveTab('resources')} className="text-amber-700 hover:underline flex items-center gap-0.5 font-medium">
              Inventory <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </GlassCard>

        <GlassCard variant="interactive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Staffing and ER</span>
            <div className="p-2 rounded-lg bg-violet-50 text-violet-700 border border-violet-100">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-950 font-mono">{metrics?.staffToPatientRatio || "1:3.2"}</span>
              <span className="text-xs text-slate-400">Staff-to-Patient</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
              <span>Average ER wait:</span>
              <strong className="text-cyan-700 font-mono">{metrics?.erWaitTimeMinutes || 18} min</strong>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <StatBadge type="info" label="Optimal Shift" />
            <button onClick={() => setActiveTab('digital-twin')} className="text-violet-700 hover:underline flex items-center gap-0.5 font-medium">
              Patient Flow <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <GlassCard
            title="Ward Capacity"
            subtitle="Current occupancy across hospital units"
            action={
              <ActionButton size="sm" variant="outline" icon={Zap} onClick={() => setIsQuickActionModalOpen(true)}>
                Update Oxygen
              </ActionButton>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              {wards.map((ward) => {
                const wardOcc = Number(((ward.occupied / ward.total) * 100).toFixed(1));
                const isCritical = wardOcc >= 90;
                return (
                  <div
                    key={ward.id}
                    className="p-4 rounded-lg bg-slate-50 border border-slate-200 hover:border-cyan-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-950">{ward.name}</span>
                        <StatBadge
                          type={isCritical ? 'critical' : wardOcc >= 75 ? 'warning' : 'success'}
                          label={`${ward.occupied}/${ward.total}`}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Lead: {ward.manager} - Code: {ward.code}</p>
                    </div>

                    <div className="mt-4 space-y-2">
                      <ProgressBar value={wardOcc} />
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Available: <strong className="text-emerald-700">{ward.available} beds</strong></span>
                        <span>Ratio: <strong className="text-slate-700">{ward.criticalStaffRatio}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>

        <div className="space-y-4">
          <GlassCard
            title="Recent Alerts"
            subtitle="Items that may need attention"
            action={
              <button onClick={() => setActiveTab('alerts')} className="text-xs text-cyan-700 hover:underline">
                View All ({alerts?.length || 0})
              </button>
            }
          >
            <div className="space-y-3 mt-2">
              {alerts?.slice(0, 4).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl border text-xs transition-all ${
                    alert.severity === 'CRITICAL'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : alert.severity === 'URGENT'
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" /> {alert.title}
                    </span>
                    <span className="text-[10px] opacity-75 font-mono">
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="mt-1 opacity-90 leading-relaxed">{alert.description}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      <Modal
        isOpen={isQuickActionModalOpen}
        onClose={() => setIsQuickActionModalOpen(false)}
        title="Update Oxygen Supply"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setIsQuickActionModalOpen(false)}>Cancel</ActionButton>
            <ActionButton variant="primary" onClick={handleUpdateOxygenQuick}>Save Oxygen Level</ActionButton>
          </>
        }
      >
        <p className="text-sm text-slate-600">Adjust the main oxygen tank pressure after a refill or usage change.</p>
        <div className="space-y-2 pt-2">
          <label className="text-sm font-semibold text-slate-700">Main tank pressure (PSI)</label>
          <input
            type="number"
            value={quickOxygenPSI}
            onChange={(e) => setQuickOxygenPSI(e.target.value)}
            className="w-full input-glass font-mono"
            min={100}
            max={1000}
          />
          <p className="text-[11px] text-slate-400">1000 PSI = 100% capacity (10,000 Liters)</p>
        </div>
      </Modal>
    </div>
  );
};
