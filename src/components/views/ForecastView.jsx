import React from 'react';
import { TrendingUp, Zap, ShieldAlert, Cpu, Activity, BarChart2, Compass } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useSurgeSimulation } from '../../hooks/useSurgeSimulation';
import { GlassCard } from '../common/GlassCard';
import { StatBadge } from '../common/StatBadge';
import { ActionButton } from '../common/ActionButton';

export const ForecastView = () => {
  const { surgeInput, handleSimulate, forecastData, queueModel, monteCarloResults } = useSurgeSimulation();

  return (
    <div className="space-y-6">
      {/* Interactive Surge Sandbox Controller Header */}
      <GlassCard className="border-cyan-500/30 bg-gradient-to-r from-cyan-950/20 via-slate-900 to-slate-950">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2 font-heading">
              <TrendingUp className="w-6 h-6 text-cyan-400" /> AI Predictive Surge & Occupancy Forecast
            </h2>
            <p className="text-xs text-slate-400">
              72-Hour predictive ARIMA machine learning model & Erlang-C queuing stress test
            </p>
          </div>

          {/* Interactive Slider Sandbox */}
          <div className="w-full lg:w-1/2 p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" /> What-If Mass Casualty / Epidemic Inflow Surge:
              </span>
              <span className="font-mono text-cyan-400 text-sm font-bold">+{surgeInput}% Inflow</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={surgeInput}
              onChange={(e) => handleSimulate(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Baseline (0%)</span>
              <span>+25% Moderate</span>
              <span>+50% Severe</span>
              <span>+100% Critical Disaster</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Recharts Predictive Visualization & Queuing Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts Occupancy Projection Curve */}
        <GlassCard
          title="72-Hour Occupancy Trajectory & Confidence Envelope"
          subtitle="Real-time predictive curve showing lower/upper bounds under current surge baseline"
          className="lg:col-span-2"
        >
          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorUpper" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
                <YAxis domain={[40, 100]} stroke="#64748b" fontSize={11} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Area type="monotone" dataKey="upperBound" stroke="#f43f5e" strokeDasharray="3 3" fillOpacity={1} fill="url(#colorUpper)" name="Upper Bound Risk" />
                <Area type="monotone" dataKey="projectedOccupancy" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorProjected)" name="AI Projected Occupancy %" />
                <Area type="monotone" dataKey="lowerBound" stroke="#10b981" strokeDasharray="3 3" fill="none" name="Lower Bound Minimum" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 mt-4 pt-3 border-t border-white/5">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span> Projected Bed Occupancy</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Upper Risk Limit</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span> Optimistic Minimum</span>
          </div>
        </GlassCard>

        {/* Queuing Theory & Monte Carlo Analysis Side Column */}
        <div className="space-y-4">
          {/* M/M/c Erlang Queue Calculator */}
          <GlassCard title="M/M/c Queue & ER Telemetry" subtitle="Queuing equations for patient delay estimation">
            <div className="space-y-3 mt-2 text-xs">
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900/60 border border-white/5">
                <span className="text-slate-400">System Utilization Rate:</span>
                <strong className="font-mono text-cyan-400 text-sm">{queueModel.systemUtilization}%</strong>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900/60 border border-white/5">
                <span className="text-slate-400">Est. ER Wait Time:</span>
                <strong className="font-mono text-amber-400 text-sm">{queueModel.expectedWaitMinutes} Mins</strong>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900/60 border border-white/5">
                <span className="text-slate-400">Queue Depth (Triage):</span>
                <strong className="font-mono text-rose-400 text-sm">{queueModel.queueLength} Patients</strong>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <span className="text-slate-400">Surge Status:</span>
                <StatBadge
                  type={queueModel.riskStatus === 'CRITICAL_SURGE' ? 'critical' : queueModel.riskStatus === 'HIGH_RISK' ? 'warning' : 'success'}
                  label={queueModel.riskStatus}
                />
              </div>
            </div>
          </GlassCard>

          {/* Monte Carlo Risk Stress Test Box */}
          <GlassCard title="Monte Carlo Stress Test" subtitle="500 Stochastic Iterations Analysis">
            <div className="space-y-3 mt-2 text-xs">
              <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 text-rose-200 space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>Bed Overflow Probability:</span>
                  <span className="font-mono font-bold">{monteCarloResults.overflowProbabilityPercent}%</span>
                </div>
                <p className="text-[11px] opacity-80">Risk of total facility capacity saturation within 24h.</p>
              </div>

              <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-cyan-200 space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>Max Oxygen Burn Peak:</span>
                  <span className="font-mono font-bold">{monteCarloResults.maxOxygenBurnLmin} L/min</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* AI Operational Directive Recommendation Footer */}
      <GlassCard variant="critical">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
            <Compass className="w-6 h-6 animate-spin" style={{ animationDuration: '10s' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Operational Directive Recommendation</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{monteCarloResults.recommendation}</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
