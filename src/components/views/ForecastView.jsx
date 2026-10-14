import React from 'react';
import { TrendingUp, Zap, ShieldAlert, Cpu, Activity, BarChart2, Compass, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useSurgeSimulation } from '../../hooks/useSurgeSimulation';
import { GlassCard } from '../common/GlassCard';
import { StatBadge } from '../common/StatBadge';

export const ForecastView = () => {
  const { surgeInput, handleSimulate, forecastData, queueModel, monteCarloResults } = useSurgeSimulation();

  return (
    <div className="space-y-8 lg:space-y-10">
      {/* Interactive Surge Sandbox Controller Header */}
      <GlassCard className="border-cyan-500/20 bg-gradient-to-r from-cyan-50/60 via-white to-blue-50/50 p-7 sm:p-8 rounded-3xl shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-cyan-100 text-cyan-800 border border-cyan-200">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading flex items-center gap-2">
                  AI Predictive Surge & Occupancy Forecast
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  72-Hour predictive ARIMA machine learning model & Erlang-C queuing stress test
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Slider Sandbox */}
          <div className="w-full lg:w-1/2 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
              <span className="text-slate-700 flex items-center gap-2 font-bold">
                <Zap className="w-4 h-4 text-amber-500" /> What-If Mass Casualty / Epidemic Inflow Surge:
              </span>
              <span className="font-mono text-cyan-700 text-base font-black bg-cyan-50 px-2.5 py-0.5 rounded-lg border border-cyan-200">
                +{surgeInput}% Inflow
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={surgeInput}
              onChange={(e) => handleSimulate(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
            />
            <div className="flex justify-between text-xs text-slate-400 font-mono font-medium">
              <span>Baseline (0%)</span>
              <span>+25% Moderate</span>
              <span>+50% Severe</span>
              <span>+100% Critical Disaster</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Recharts Predictive Visualization & Queuing Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recharts Occupancy Projection Curve (8 cols) */}
        <div className="lg:col-span-8">
          <GlassCard
            title="72-Hour Bed Occupancy Trajectory & Confidence Envelope"
            subtitle="Real-time predictive curve showing lower/upper bounds under current simulated surge inflow"
            className="p-7 rounded-3xl"
          >
            <div className="h-[420px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData} margin={{ top: 15, right: 25, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0891b2" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0891b2" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorUpper" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e11d48" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="hour" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis domain={[40, 100]} stroke="#64748b" fontSize={12} unit="%" tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '16px', fontSize: '13px', boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}
                    itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="upperBound" stroke="#e11d48" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorUpper)" name="Upper Bound Risk" />
                  <Area type="monotone" dataKey="projectedOccupancy" stroke="#0891b2" strokeWidth={3.5} fillOpacity={1} fill="url(#colorProjected)" name="AI Projected Occupancy %" />
                  <Area type="monotone" dataKey="lowerBound" stroke="#059669" strokeWidth={2} strokeDasharray="4 4" fill="none" name="Lower Bound Minimum" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-slate-600 mt-5 pt-4 border-t border-slate-100">
              <span className="flex items-center gap-2 font-semibold">
                <span className="w-3 h-3 rounded-full bg-cyan-600 inline-block"></span> Projected Bed Occupancy
              </span>
              <span className="flex items-center gap-2 font-semibold">
                <span className="w-3 h-3 rounded-full bg-rose-600 inline-block"></span> Upper Risk Capacity Limit
              </span>
              <span className="flex items-center gap-2 font-semibold">
                <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span> Optimistic Minimum
              </span>
            </div>
          </GlassCard>
        </div>

        {/* Queuing Theory & Monte Carlo Analysis Side Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* M/M/c Erlang Queue Calculator */}
          <GlassCard
            title="M/M/c Queue & ER Telemetry"
            subtitle="Queuing equations for patient delay estimation"
            className="p-6 sm:p-7 rounded-3xl"
          >
            <div className="space-y-3.5 mt-3 text-xs sm:text-sm">
              <div className="flex justify-between items-center p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600 font-medium">System Utilization:</span>
                <strong className="font-mono text-cyan-700 text-base">{queueModel.systemUtilization}%</strong>
              </div>

              <div className="flex justify-between items-center p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600 font-medium">Est. ER Wait Time:</span>
                <strong className="font-mono text-amber-700 text-base">{queueModel.expectedWaitMinutes} Mins</strong>
              </div>

              <div className="flex justify-between items-center p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600 font-medium">Queue Depth (Triage):</span>
                <strong className="font-mono text-rose-700 text-base">{queueModel.queueLength} Patients</strong>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <span className="text-slate-600 font-medium">Surge Status:</span>
                <StatBadge
                  type={queueModel.riskStatus === 'CRITICAL_SURGE' ? 'critical' : queueModel.riskStatus === 'HIGH_RISK' ? 'warning' : 'success'}
                  label={queueModel.riskStatus}
                />
              </div>
            </div>
          </GlassCard>

          {/* Monte Carlo Risk Stress Test Box */}
          <GlassCard
            title="Monte Carlo Stress Test"
            subtitle="500 Stochastic Iterations Analysis"
            className="p-6 sm:p-7 rounded-3xl"
          >
            <div className="space-y-3 mt-3 text-xs sm:text-sm">
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Bed Overflow Probability:</span>
                  <span className="font-mono font-black text-base text-rose-700">{monteCarloResults.overflowProbabilityPercent}%</span>
                </div>
                <p className="text-xs text-rose-800 opacity-90">Risk of facility bed capacity saturation within 24h.</p>
              </div>

              <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-950 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Max Oxygen Burn Peak:</span>
                  <span className="font-mono font-black text-base text-cyan-800">{monteCarloResults.maxOxygenBurnLmin} L/min</span>
                </div>
                <p className="text-xs text-cyan-800 opacity-90">Projected peak cryogenic demand across ICU circuits.</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* AI Operational Directive Recommendation Footer */}
      <GlassCard className="border-amber-200 bg-amber-50/70 p-7 sm:p-8 rounded-3xl">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
            <Compass className="w-6 h-6 animate-spin" style={{ animationDuration: '15s' }} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-amber-950 uppercase tracking-wider font-heading">
              AI Operational Directive & Surge Advisory
            </h3>
            <p className="text-xs sm:text-sm text-amber-900 mt-1 leading-relaxed">
              {monteCarloResults.recommendation}
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
