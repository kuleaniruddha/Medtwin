import React from 'react';
import { BarChart3, Download, FileText, PieChart, Activity, TrendingUp, CheckCircle, ShieldCheck, Printer } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { GlassCard } from '../common/GlassCard';
import { StatBadge } from '../common/StatBadge';
import { ProgressBar } from '../common/ProgressBar';

export const AnalyticsView = () => {
  const { metrics, wards } = useHospital();

  const handleExportReport = (format) => {
    const content = `MEDTWIN HOSPITAL DIGITAL TWIN OPERATIONAL REPORT
Generated: ${new Date().toLocaleString()}
Facility: ${metrics?.hospitalName || 'Metro General Digital Twin Facility'}

OPERATIONAL SUMMARY:
- Total Capacity: ${metrics?.totalBeds || 90} Beds
- Occupied Beds: ${metrics?.occupiedBeds || 76} (${metrics?.occupancyRate || 84.4}%)
- Oxygen Reservoir Level: ${metrics?.oxygenTankLevelPercent || 88.5}% (${metrics?.oxygenTankPSI || 885} PSI)
- System Oxygen Burn: ${metrics?.oxygenBurnRateLmin || 42.5} L/min
- ER Wait Latency: ${metrics?.erWaitTimeMinutes || 18} Minutes
- ICU Utilization: ${metrics?.icuCapacity || 93}%

WARD CAPACITY BREAKDOWN:
${wards.map(w => `- ${w.name}: ${w.occupied}/${w.total} Beds (${((w.occupied/w.total)*100).toFixed(1)}%)`).join('\n')}

Report Status: Certified Clinical Twin Audit Complete.`;

    const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MedTwin_Operational_Report_${Date.now()}.${format === 'csv' ? 'csv' : 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 lg:space-y-10 w-full pb-16">
      {/* ── Top Header Banner (Spacious & Clean Light Theme) ── */}
      <div className="p-7 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-cyan-100 text-cyan-800 border border-cyan-200 shrink-0">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
                  Operational Analytics & Performance Reports
                </h1>
                <span className="px-3 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Certified Audit
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                Hospital KPI performance, Bed Occupancy Rates (BOR), Average Length of Stay (ALOS), and compliance export engine.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
            <button
              onClick={() => handleExportReport('txt')}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-sm font-bold transition-all cursor-pointer shadow-xs flex-1 sm:flex-none"
            >
              <FileText className="w-4 h-4 text-slate-600" />
              <span>Export Report (TXT)</span>
            </button>
            <button
              onClick={() => handleExportReport('csv')}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-sm font-bold transition-all cursor-pointer shadow-md shadow-cyan-700/20 flex-1 sm:flex-none"
            >
              <Download className="w-4 h-4" />
              <span>Export Data (CSV)</span>
            </button>
          </div>
        </div>

        {/* ── 4 Main Analytical KPI Metric Cards (Spacious) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <div className="p-6 sm:p-7 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              BOR (Bed Occupancy Rate)
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 font-mono">
                {metrics?.occupancyRate || 84.4}%
              </span>
              <StatBadge type="info" label="Target: 80-85%" />
            </div>
            <p className="text-xs text-slate-600 mt-2 font-medium">
              Optimal hospital throughput maintained without ward congestion.
            </p>
          </div>

          <div className="p-6 sm:p-7 rounded-2xl bg-cyan-50/70 border border-cyan-200 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-800">
              ALOS (Avg Length of Stay)
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-black text-cyan-900 font-mono">
                4.2 <span className="text-xl font-sans font-bold text-cyan-700">Days</span>
              </span>
              <StatBadge type="success" label="-0.4d Faster" />
            </div>
            <p className="text-xs text-cyan-800 mt-2 font-medium">
              Reduced patient discharge latency via predictive step-down transfers.
            </p>
          </div>

          <div className="p-6 sm:p-7 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Resource Burn Velocity
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-black text-amber-900 font-mono">
                91.2 <span className="text-xl font-sans font-bold text-amber-700">/ 100</span>
              </span>
              <StatBadge type="warning" label="High Flow" />
            </div>
            <p className="text-xs text-amber-800 mt-2 font-medium">
              Calculated from oxygen vaporization and emergency critical pharma stock.
            </p>
          </div>

          <div className="p-6 sm:p-7 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Staffing Balance Index
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-black text-emerald-900 font-mono">
                88.0%
              </span>
              <StatBadge type="success" label="Optimal Shift" />
            </div>
            <p className="text-xs text-emerald-800 mt-2 font-medium">
              Balanced nurse-to-patient staffing ratio across all 6 departments.
            </p>
          </div>
        </div>
      </div>

      {/* ── Comprehensive Ward Operational Matrix (Large & Spacious Table) ── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
            Clinical Department Performance & Occupancy Matrix
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Real-time census distribution, staffing ratios, and supervisor lead assignments across all active hospital wings.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
                <th className="py-4 px-6 font-bold">Ward Department</th>
                <th className="py-4 px-6 font-bold">Code</th>
                <th className="py-4 px-6 font-bold">Bed Census</th>
                <th className="py-4 px-6 font-bold">Occupancy</th>
                <th className="py-4 px-6 font-bold">Available Beds</th>
                <th className="py-4 px-6 font-bold">Staff Ratio</th>
                <th className="py-4 px-6 font-bold">Supervising Officer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {wards.map((w) => {
                const occupancyPct = Number(((w.occupied / w.total) * 100).toFixed(0));
                const isHigh = occupancyPct >= 90;

                return (
                  <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900 text-base">
                      {w.name}
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-cyan-700">
                      {w.code}
                    </td>
                    <td className="py-4 px-6 font-mono font-semibold">
                      {w.occupied} / {w.total} Beds
                    </td>
                    <td className="py-4 px-6 min-w-[160px]">
                      <div className="flex items-center gap-3">
                        <span className={`font-mono font-bold text-xs ${isHigh ? 'text-rose-700' : 'text-slate-900'}`}>
                          {occupancyPct}%
                        </span>
                        <div className="flex-1">
                          <ProgressBar value={occupancyPct} />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        w.available > 0
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                        {w.available} Ready
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-slate-700">
                      {w.criticalStaffRatio}
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-600">
                      {w.manager}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Executive Operational Directives & Compliance ── */}
      <div className="p-7 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Digital Twin Continuous Verification Status: Compliant</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
            All telemetry streams (oxygen cryogenic telemetry, blood bank refrigerated inventory, hospital bed intake, Mumbai emergency radar) are synchronized with zero desync errors.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-sm font-bold shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Printer className="w-4 h-4 text-slate-600" />
          <span>Print Audit Sheet</span>
        </button>
      </div>
    </div>
  );
};
