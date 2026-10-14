import React, { useState } from 'react';
import { Network, ArrowRight, AlertTriangle, CheckCircle2, Clock, Users, Activity, ShieldAlert } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { GlassCard } from '../common/GlassCard';
import { StatBadge } from '../common/StatBadge';

export const DigitalTwinFlow = () => {
  const { flowNodes } = useHospital();
  const [selectedNode, setSelectedNode] = useState(flowNodes[2] || flowNodes[0]);

  return (
    <div className="space-y-6">
      {/* Flow Header */}
      <GlassCard className="border-violet-500/30 bg-gradient-to-r from-violet-950/20 via-slate-900 to-slate-950">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2 font-heading">
              <Network className="w-6 h-6 text-violet-400" /> Patient Flow & Admission Digital Twin Graph
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              End-to-end patient pathway tracking from Intake &rarr; Triage &rarr; ER/ICU &rarr; Ward &rarr; Discharge
            </p>
          </div>
          <StatBadge type="info" label="Graph Flow Engine Active" icon={Activity} pulse />
        </div>
      </GlassCard>

      {/* Graphical Flow Node Diagram */}
      <GlassCard title="Patient Transfer Velocity & Bottleneck Map" subtitle="Click any node to inspect queue latency & transfer throughput">
        <div className="py-6 overflow-x-auto">
          <div className="min-w-[800px] flex items-center justify-between gap-2 px-4 relative">
            {flowNodes.map((node, index) => {
              const isSelected = selectedNode?.id === node.id;
              const isBottleneck = node.status.includes('BOTTLENECK');
              const isCritical = node.status === 'CRITICAL_BOTTLENECK';

              return (
                <React.Fragment key={node.id}>
                  {/* Node Box */}
                  <div
                    onClick={() => setSelectedNode(node)}
                    className={`flex-1 p-4 rounded-2xl border cursor-pointer transition-all duration-300 relative ${
                      isSelected
                        ? 'bg-violet-900/40 border-violet-400 shadow-[0_0_25px_rgba(139,92,246,0.3)] scale-105'
                        : isCritical
                        ? 'bg-rose-950/40 border-rose-500/60 hover:border-rose-400'
                        : isBottleneck
                        ? 'bg-amber-950/30 border-amber-500/40 hover:border-amber-400'
                        : 'bg-slate-900/80 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {/* Node Stage Number */}
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Stage 0{index + 1}</span>
                    <h4 className="text-xs font-bold text-white mt-1 line-clamp-1">{node.stage}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{node.label}</p>

                    <div className="mt-4 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Queue:</span>
                      <strong className={`font-mono ${isCritical ? 'text-rose-400' : 'text-cyan-400'}`}>{node.activeQueue} pts</strong>
                    </div>

                    <div className="mt-2">
                      <StatBadge
                        type={isCritical ? 'critical' : isBottleneck ? 'warning' : 'success'}
                        label={node.status.replace('_', ' ')}
                        pulse={isCritical}
                      />
                    </div>
                  </div>

                  {/* Flow Arrow Connector */}
                  {index < flowNodes.length - 1 && (
                    <div className="flex flex-col items-center px-1">
                      <svg className="w-8 h-6 text-violet-400/60" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12h14m-6-6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </GlassCard>

      {/* Selected Node Telemetry & Bottleneck Inspector */}
      {selectedNode && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GlassCard title={`Node Detail: ${selectedNode.stage}`} subtitle={selectedNode.label} className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2 text-xs">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                <span className="text-slate-400">Throughput Velocity</span>
                <p className="text-2xl font-bold text-white font-mono">{selectedNode.throughputPerHour} / hr</p>
                <p className="text-[10px] text-slate-500">Target: 15 / hr</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                <span className="text-slate-400">Active Stage Queue</span>
                <p className="text-2xl font-bold text-cyan-400 font-mono">{selectedNode.activeQueue} Patients</p>
                <p className="text-[10px] text-slate-500">Wait latency: ~18 mins</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                <span className="text-slate-400">Operational Health</span>
                <div className="pt-1">
                  <StatBadge
                    type={selectedNode.status.includes('CRITICAL') ? 'critical' : selectedNode.status.includes('BOTTLENECK') ? 'warning' : 'success'}
                    label={selectedNode.status}
                  />
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard title="Node Bottleneck Mitigation" subtitle="AI recommended workflow for latency resolution">
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <ShieldAlert className="w-4 h-4" /> Bottleneck Advisory
              </div>
              <p className="leading-relaxed opacity-90">
                {selectedNode.status.includes('BOTTLENECK')
                  ? `Stage '${selectedNode.stage}' is operating at ${selectedNode.activeQueue} active queue depth. Divert 3 non-critical patients to secondary intake.`
                  : 'Stage is operating smoothly without throughput latency.'}
              </p>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
