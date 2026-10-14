import React, { useState } from 'react';
import { 
  BedDouble, Wind, Pill, Users, ArrowUpRight, ShieldAlert, Zap, 
  Radio, ArrowRight, UserPlus, UserMinus, RefreshCw, CheckCircle2
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { GlassCard } from '../common/GlassCard';
import { StatBadge } from '../common/StatBadge';
import { ProgressBar } from '../common/ProgressBar';
import { ActionButton } from '../common/ActionButton';
import { Modal } from '../common/Modal';

export const OverviewView = () => {
  const { 
    metrics, wards, beds, inventory, alerts, setActiveTab, 
    restockInventory, quickAdmit, quickDischarge, restockAllMedications,
    isLiveSimulationActive, toggleLiveSimulation, lastLivePulse
  } = useHospital();

  const [isQuickActionModalOpen, setIsQuickActionModalOpen] = useState(false);
  const [quickOxygenPSI, setQuickOxygenPSI] = useState(885);
  const [quickActionNotice, setQuickActionNotice] = useState('');

  // ── 1. Dynamic Bed Capacity Calculations ──
  const totalBeds = wards && wards.length > 0 
    ? wards.reduce((sum, w) => sum + (Number(w.total) || 0), 0) 
    : (metrics?.totalBeds || 90);

  const occupiedBeds = beds && beds.length > 0
    ? beds.filter(b => b.status === 'occupied').length
    : (wards && wards.length > 0 
        ? wards.reduce((sum, w) => sum + (Number(w.occupied) || 0), 0) 
        : (metrics?.occupiedBeds || 76));

  const availableBeds = Math.max(0, totalBeds - occupiedBeds);
  const occRate = totalBeds > 0 ? Number(((occupiedBeds / totalBeds) * 100).toFixed(1)) : 84.4;

  // ── 2. Dynamic Oxygen Supply Calculations ──
  const o2Percent = inventory?.oxygen?.tankPercentage != null 
    ? inventory.oxygen.tankPercentage 
    : (metrics?.oxygenTankLevelPercent || 88.5);

  const o2PSI = inventory?.oxygen?.pressurePSI != null 
    ? inventory.oxygen.pressurePSI 
    : (metrics?.oxygenTankPSI || Math.round(o2Percent * 10));

  const o2BurnRate = inventory?.oxygen?.burnRateLmin != null 
    ? inventory.oxygen.burnRateLmin 
    : (metrics?.oxygenBurnRateLmin || 44.2);

  const o2HoursRemaining = Number(((o2Percent / 100) * 12500 / (o2BurnRate * 60)).toFixed(1));

  // ── 3. Dynamic Medication Status Calculations ──
  const medList = inventory?.medications || [];
  const lowMeds = medList.filter(m => (m.currentStock || 0) <= (m.minThreshold || 0));

  // ── 4. Dynamic Staffing & ER Wait Time ──
  const erWard = wards?.find(w => w.id === 'er');
  const erWaitTime = metrics?.erWaitTimeMinutes || (erWard ? Math.round(10 + (erWard.occupied / erWard.total) * 12) : 18);
  const staffRatio = occupiedBeds > 0 ? `1:${(occupiedBeds / 24).toFixed(1)}` : (metrics?.staffToPatientRatio || "1:3.2");

  // Handlers for instant real-time live demonstrations
  const handleAdmit = async () => {
    const success = await quickAdmit('er');
    if (success) {
      setQuickActionNotice("Admitted patient to Emergency Ward. Occupancy +1 bed.");
      setTimeout(() => setQuickActionNotice(''), 3000);
    }
  };

  const handleDischarge = async () => {
    const success = await quickDischarge();
    if (success) {
      setQuickActionNotice("Discharged stable patient. Bed moved to cleaning -> available.");
      setTimeout(() => setQuickActionNotice(''), 3000);
    }
  };

  const handleRefillOxygen = () => {
    const newPSI = Math.min(1000, o2PSI + 100);
    const newPercent = Number(((newPSI / 1000) * 100).toFixed(1));
    restockInventory('oxygen', {
      pressurePSI: newPSI,
      tankPercentage: newPercent
    });
    setQuickActionNotice(`Oxygen tank refilled to ${newPSI} PSI (${newPercent}%).`);
    setTimeout(() => setQuickActionNotice(''), 3000);
  };

  const handleRestockMeds = () => {
    restockAllMedications();
    setQuickActionNotice("Restocked all medications to full warehouse quota.");
    setTimeout(() => setQuickActionNotice(''), 3000);
  };

  const handleSaveOxygenModal = () => {
    const percent = Number(((quickOxygenPSI / 1000) * 100).toFixed(1));
    restockInventory('oxygen', {
      pressurePSI: Number(quickOxygenPSI),
      tankPercentage: percent
    });
    setIsQuickActionModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* ── Mumbai Incident AI Surveillance Banner ── */}
      <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-white border border-rose-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-xs">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-rose-800">
                Mumbai Emergency AI Radar Active
              </span>
              <span className="text-[10px] font-semibold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-300">
                Hugging Face DistilBERT
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Live Mumbai news & disaster surveillance: predicts bed reserve quotas, O2 pipeline spike & trauma medicines.
            </p>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('mumbai-radar')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors self-start md:self-center whitespace-nowrap cursor-pointer"
        >
          <span>Open Mumbai Radar</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Live Hospital Telemetry Controller Bar ── */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isLiveSimulationActive ? 'bg-emerald-400' : 'bg-slate-400'
            }`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              isLiveSimulationActive ? 'bg-emerald-500' : 'bg-slate-400'
            }`} />
          </span>
          <span className="font-bold text-slate-900">
            Digital Twin Telemetry: {isLiveSimulationActive ? 'STREAMING LIVE (7s pulse)' : 'PAUSED'}
          </span>
          <span className="text-slate-400 text-[11px] hidden sm:inline">
            • Last reading: {lastLivePulse ? lastLivePulse.toLocaleTimeString() : 'Just now'}
          </span>
        </div>

        {/* Tactile Live Test Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleAdmit}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-cyan-50 hover:text-cyan-800 border border-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
            title="Admit patient to available bed"
          >
            <UserPlus className="w-3.5 h-3.5 text-cyan-600" />
            <span>+ Admit Patient</span>
          </button>

          <button
            onClick={handleDischarge}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
            title="Discharge an occupied bed"
          >
            <UserMinus className="w-3.5 h-3.5 text-amber-600" />
            <span>- Discharge</span>
          </button>

          <button
            onClick={handleRefillOxygen}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
            title="Refill oxygen tank"
          >
            <Wind className="w-3.5 h-3.5 text-emerald-600" />
            <span>Refill O₂</span>
          </button>

          <button
            onClick={toggleLiveSimulation}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
              isLiveSimulationActive 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-slate-100 text-slate-600 border-slate-300'
            }`}
          >
            {isLiveSimulationActive ? 'Pause Pulse' : 'Resume Pulse'}
          </button>
        </div>
      </div>

      {/* Notice bar when live action triggered */}
      {quickActionNotice && (
        <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-900 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-cyan-700" />
          <span>{quickActionNotice}</span>
        </div>
      )}

      {/* ── 4 Key Dynamic Metrics Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Bed Capacity (100% Calculated from live beds/wards) */}
        <GlassCard variant="interactive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bed capacity</span>
            <div className="p-2 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-100">
              <BedDouble className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-950 font-mono transition-all">
                {occupiedBeds}
              </span>
              <span className="text-xs text-slate-500">of {totalBeds} occupied</span>
            </div>
            <ProgressBar value={occRate} label="Occupancy Rate" className="mt-3" />
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Available: <strong className="text-emerald-700 font-mono">{availableBeds} beds</strong></span>
            <button onClick={() => setActiveTab('bed-manager')} className="text-cyan-700 hover:underline flex items-center gap-0.5 font-medium cursor-pointer">
              Manage <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </GlassCard>

        {/* Card 2: Oxygen Supply (100% Calculated from live inventory & burn rate) */}
        <GlassCard variant="interactive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Oxygen supply</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Wind className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-950 font-mono transition-all">
                {o2Percent}%
              </span>
              <span className="text-xs text-slate-500">({o2PSI} PSI)</span>
            </div>
            <ProgressBar value={o2Percent} label="Main Tank Reserves" className="mt-3" />
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Remaining: <strong className="text-cyan-700 font-mono">{o2HoursRemaining} hrs</strong></span>
            <button onClick={() => setActiveTab('resources')} className="text-emerald-700 hover:underline flex items-center gap-0.5 font-medium cursor-pointer">
              Tracker <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </GlassCard>

        {/* Card 3: Medications (100% Calculated from live inventory stock vs threshold) */}
        <GlassCard variant="interactive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Medications</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
              <Pill className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-950 font-heading">
                {lowMeds.length > 0 ? "Needs review" : "Optimal stock"}
              </span>
              <span className={`text-xs font-bold ${lowMeds.length > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                {lowMeds.length > 0 ? `${lowMeds.length} low` : 'All normal'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2 line-clamp-2">
              {lowMeds.length > 0 
                ? `${lowMeds.map(m => m.name).join(', ')} are near minimum stock.` 
                : 'All pharmaceuticals are above required reserve thresholds.'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            {lowMeds.length > 0 ? (
              <button 
                onClick={handleRestockMeds}
                className="text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded font-bold transition-colors cursor-pointer"
              >
                Restock All
              </button>
            ) : (
              <StatBadge type="success" label="Safe Buffer" />
            )}
            <button onClick={() => setActiveTab('resources')} className="text-amber-700 hover:underline flex items-center gap-0.5 font-medium cursor-pointer">
              Inventory <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </GlassCard>

        {/* Card 4: Staffing and ER (Calculated from occupied beds & ER patient load) */}
        <GlassCard variant="interactive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Staffing and ER</span>
            <div className="p-2 rounded-lg bg-violet-50 text-violet-700 border border-violet-100">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-950 font-mono transition-all">
                {staffRatio}
              </span>
              <span className="text-xs text-slate-400">Staff-to-Patient</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
              <span>Average ER wait:</span>
              <strong className="text-cyan-700 font-mono">{erWaitTime} min</strong>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <StatBadge type="info" label="Optimal Shift" />
            <button onClick={() => setActiveTab('digital-twin')} className="text-violet-700 hover:underline flex items-center gap-0.5 font-medium cursor-pointer">
              Patient Flow <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </GlassCard>

      </div>

      {/* ── Ward Capacity List & Recent Alerts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dynamic Ward Capacity Grid */}
        <div className="lg:col-span-2 space-y-4">
          <GlassCard
            title="Ward Capacity"
            subtitle="Live occupancy across hospital units"
            action={
              <ActionButton size="sm" variant="outline" icon={Zap} onClick={() => setIsQuickActionModalOpen(true)}>
                Update Oxygen
              </ActionButton>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              {wards.map((ward) => {
                const total = Number(ward.total) || 15;
                const occupied = Number(ward.occupied) || 0;
                const wardOcc = Number(((occupied / total) * 100).toFixed(0));
                const available = Math.max(0, total - occupied);
                const isCritical = wardOcc >= 90;

                return (
                  <div
                    key={ward.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-cyan-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-950">{ward.name}</span>
                        <StatBadge
                          type={isCritical ? 'critical' : wardOcc >= 75 ? 'warning' : 'success'}
                          label={`${occupied}/${total}`}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Lead: {ward.manager} - Code: {ward.code}</p>
                    </div>

                    <div className="mt-4 space-y-2">
                      <ProgressBar value={wardOcc} />
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Available: <strong className="text-emerald-700">{available} beds</strong></span>
                        <span>Ratio: <strong className="text-slate-700">{ward.criticalStaffRatio}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>

        {/* Dynamic Recent Alerts Column */}
        <div className="space-y-4">
          <GlassCard
            title="Recent Alerts"
            subtitle="Live priority events and disaster notices"
            action={
              <button onClick={() => setActiveTab('alerts')} className="text-xs text-cyan-700 hover:underline cursor-pointer">
                View All ({alerts?.length || 0})
              </button>
            }
          >
            <div className="space-y-3 mt-2">
              {alerts && alerts.length > 0 ? (
                alerts.slice(0, 4).map((alert) => (
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
                      <span className="text-[10px] uppercase font-bold opacity-75">{alert.severity}</span>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed line-clamp-2">{alert.message}</p>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  No active critical alerts.
                </div>
              )}
            </div>
          </GlassCard>
        </div>

      </div>

      {/* Oxygen Quick Adjustment Modal */}
      <Modal
        isOpen={isQuickActionModalOpen}
        onClose={() => setIsQuickActionModalOpen(false)}
        title="Adjust Main Oxygen Supply Pipeline"
        footer={
          <div className="flex justify-end gap-2">
            <ActionButton variant="outline" size="sm" onClick={() => setIsQuickActionModalOpen(false)}>
              Cancel
            </ActionButton>
            <ActionButton size="sm" onClick={handleSaveOxygenModal}>
              Save Pressure
            </ActionButton>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <p className="text-sm text-slate-600">
            Calibrate central hospital cryo-tank pressure. The digital twin will immediately adjust available hours and burn rates.
          </p>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Target Pressure (PSI): {quickOxygenPSI} PSI ({Number(((quickOxygenPSI / 1000) * 100).toFixed(1))}%)
            </label>
            <input
              type="range"
              min="500"
              max="1000"
              step="10"
              value={quickOxygenPSI}
              onChange={(e) => setQuickOxygenPSI(Number(e.target.value))}
              className="w-full accent-cyan-600 cursor-pointer"
            />
          </div>
        </div>
      </Modal>

    </div>
  );
};
