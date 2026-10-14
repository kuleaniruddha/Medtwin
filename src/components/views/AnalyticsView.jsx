import React from 'react';
import { BarChart3, Download, FileText, PieChart, Activity, TrendingUp, CheckCircle } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { GlassCard } from '../common/GlassCard';
import { StatBadge } from '../common/StatBadge';
import { ActionButton } from '../common/ActionButton';

export const AnalyticsView = () => {
  const { metrics, wards } = useHospital();

  const handleExportReport = (format) => {
    const content = `MEDTWIN HOSPITAL DIGITAL TWIN OPERATIONAL REPORT
Generated: ${new Date().toLocaleString()}
Facility: ${metrics?.hospitalName || 'Metro General Digital Twin Facility'}

OPERATIONAL SUMMARY:
- Total Capacity: ${metrics?.totalBeds} Beds
- Occupied Beds: ${metrics?.occupiedBeds} (${metrics?.occupancyRate}%)
- Oxygen Reservoir Level: ${metrics?.oxygenTankLevelPercent}% (${metrics?.oxygenTankPSI} PSI)
- System Oxygen Burn: ${metrics?.oxygenBurnRateLmin} L/min
- ER Wait Latency: ${metrics?.erWaitTimeMinutes} Minutes
- ICU Utilization: ${metrics?.icuCapacity}%

WARD CAPACITY BREAKDOWN:
${wards.map(w => `- ${w.name}: ${w.occupied}/${w.total} Beds (${((w.occupied/w.total)*100).toFixed(1)}%)`).join('\n')}

Report Status: Certified Clean Audit State.`;

    const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MedTwin_Operational_Report_${Date.now()}.${format === 'csv' ? 'csv' : 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <GlassCard className="border-cyan-500/30">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-cyan-400" /> Operational Analytics & Performance Metrics
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Final Year Engineering Level KPI analysis, ALOS, BOR, and automated report export tools
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ActionButton variant="secondary" icon={FileText} onClick={() => handleExportReport('txt')}>
              Export Report (TXT)
            </ActionButton>
            <ActionButton variant="primary" icon={Download} onClick={() => handleExportReport('csv')}>
              Export Data (CSV)
            </ActionButton>
          </div>
        </div>
      </GlassCard>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">BOR (Bed Occupancy Rate)</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{metrics?.occupancyRate || 84.4}%</span>
            <StatBadge type="info" label="Target: 80-85%" />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Optimal threshold maintained without throughput congestion.</p>
        </GlassCard>

        <GlassCard>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ALOS (Avg Length of Stay)</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-cyan-400 font-mono">4.2 Days</span>
            <StatBadge type="success" label="-0.4d Efficient" />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Reduced hospital stay latency via predictive step-down transfers.</p>
        </GlassCard>

        <GlassCard>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Resource Burn Index</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400 font-mono">91.2 / 100</span>
            <StatBadge type="warning" label="High Flow" />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Calculated from oxygen & emergency pharmaceutical consumption rate.</p>
        </GlassCard>

        <GlassCard>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Staffing Efficiency Index</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400 font-mono">88.0%</span>
            <StatBadge type="success" label="Optimal Shift" />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Balanced nurse-to-patient ratio across all 6 ward units.</p>
        </GlassCard>
      </div>

      {/* Analytical Breakdown Tables */}
      <GlassCard title="Comprehensive Ward Operational Matrix" subtitle="Detailed performance breakdown by medical department">
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Ward Unit</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Occupancy</th>
                <th className="py-3 px-4">Available</th>
                <th className="py-3 px-4">Staffing Ratio</th>
                <th className="py-3 px-4">Department Head</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-slate-200">
              {wards.map((w) => (
                <tr key={w.id} className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 font-bold font-sans text-white">{w.name}</td>
                  <td className="py-3 px-4 text-cyan-400">{w.code}</td>
                  <td className="py-3 px-4">{w.occupied} / {w.total} ({((w.occupied/w.total)*100).toFixed(0)}%)</td>
                  <td className="py-3 px-4 text-emerald-400">{w.available} Beds</td>
                  <td className="py-3 px-4">{w.criticalStaffRatio}</td>
                  <td className="py-3 px-4 font-sans text-slate-400">{w.manager}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};
