import React, { useState, useEffect } from 'react';
import { 
  Radio, AlertTriangle, Flame, ShieldAlert, Cpu, BedDouble, 
  RefreshCw, CheckCircle2, ArrowRight, MapPin, Clock, 
  Droplet, Wind, Zap, HeartPulse, Building2, Truck
} from 'lucide-react';
import { fetchMumbaiIncidents, applyIncidentSurge } from '../../services/mumbaiService';
import { useHospital } from '../../context/HospitalContext';

export const MumbaiEmergencyRadar = () => {
  const { refreshData } = useHospital();

  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [activatedIncidents, setActivatedIncidents] = useState(new Set());
  const [actionNotice, setActionNotice] = useState('');

  const loadIncidents = async () => {
    setLoading(true);
    const data = await fetchMumbaiIncidents();
    setIncidents(data);
    if (data && data.length > 0 && !selectedIncident) {
      setSelectedIncident(data[0]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  const handleApplySurge = async (incident) => {
    if (!incident) return;
    setActionNotice(`Activating emergency protocol for ${incident.location}...`);
    
    const success = await applyIncidentSurge(incident);
    if (success) {
      setActivatedIncidents(prev => new Set(prev).add(incident.id));
      setActionNotice(`✅ Hospital emergency protocol activated! Beds reserved & O2 buffer boosted.`);
      if (refreshData) refreshData();
      setTimeout(() => setActionNotice(''), 4000);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'FIRE_BURNS': return Flame;
      case 'TRANSIT_CRASH': return Truck;
      case 'COLLAPSE_TRAUMA': return Building2;
      case 'CHEMICAL_HAZARD': return AlertTriangle;
      default: return HeartPulse;
    }
  };

  const filteredIncidents = incidents.filter(item => {
    if (filter === 'ALL') return true;
    if (filter === 'FIRES') return item.category === 'FIRE_BURNS';
    if (filter === 'TRANSIT') return item.category === 'TRANSIT_CRASH';
    if (filter === 'COLLAPSE') return item.category === 'COLLAPSE_TRAUMA';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ── Top Header Banner ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 shadow-xs">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 font-heading">
                  Mumbai Real-Time Incident Radar
                </h2>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                  Live City Surveillance
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                <span>Catchment Area: <strong>Mumbai Metropolitan Region (MMR)</strong></span>
                <span>•</span>
                <span>AI Model: <strong>Hugging Face DistilBERT (distilbert-base-uncased)</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadIncidents}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin text-cyan-600' : ''}`} />
              <span>Scan Live Mumbai News</span>
            </button>
          </div>
        </div>

        {/* Action feedback notice */}
        {actionNotice && (
          <div className="mt-4 p-3 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-900 text-xs font-medium flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-cyan-700 flex-shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}
      </div>

      {/* ── Quick KPI Metric Badges ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Monitored Incidents</span>
            <Radio className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-heading">
            {incidents.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Across Greater Mumbai</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Predicted Bed Demand</span>
            <BedDouble className="w-3.5 h-3.5 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-cyan-700 font-heading">
            {selectedIncident?.bedsToReserve?.total || 18} Beds
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">ICU + Trauma reservation</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Oxygen Surge Spike</span>
            <Wind className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700 font-heading">
            +{selectedIncident?.oxygenSurge?.additionalBurnRateLmin || 28.5} <span className="text-sm font-semibold">L/min</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Requires 6-8 reserve tanks</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>HF Confidence Score</span>
            <Cpu className="w-3.5 h-3.5 text-violet-600" />
          </div>
          <div className="text-2xl font-black text-violet-700 font-heading">
            {Math.round((selectedIncident?.hfModelScore || 0.92) * 100)}%
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Zero-shot emergency triage</p>
        </div>
      </div>

      {/* ── Main Split View: Feed on Left, Hospital Impact on Right ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Live Incident Feed (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>Live Mumbai Incident Feed</span>
            </h3>

            {/* Quick Filter */}
            <div className="flex items-center gap-1 text-[11px]">
              {['ALL', 'FIRES', 'TRANSIT'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                    filter === f ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredIncidents.map((incident) => {
              const Icon = getCategoryIcon(incident.category);
              const isSelected = selectedIncident?.id === incident.id;
              const isActivated = activatedIncidents.has(incident.id);

              return (
                <div
                  key={incident.id}
                  onClick={() => setSelectedIncident(incident)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'border-cyan-600 bg-cyan-50/50 shadow-xs ring-1 ring-cyan-600/30'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${
                        incident.category === 'FIRE_BURNS' ? 'bg-amber-100 text-amber-800' :
                        incident.category === 'TRANSIT_CRASH' ? 'bg-rose-100 text-rose-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        {incident.category.replace('_', ' ')}
                      </span>
                    </div>

                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      incident.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                      'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {incident.severity}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                    {incident.title}
                  </h4>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 font-medium">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {incident.location.split(',')[0]}
                    </span>

                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3 h-3" />
                      {incident.published.slice(-8)}
                    </span>
                  </div>

                  {isActivated && (
                    <div className="mt-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Hospital Protocol Activated</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: AI Surge Recommendation Deep Dive (7 cols) */}
        <div className="lg:col-span-7">
          {selectedIncident ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
              
              {/* Incident Header Details */}
              <div className="border-b border-slate-200 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-slate-900 text-white">
                      AI Impact Assessment
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Source: {selectedIncident.source}
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    {selectedIncident.casualtyEstimate}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {selectedIncident.title}
                </h3>

                <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-rose-600" />
                  <span>Impacted Area: <strong>{selectedIncident.location}</strong></span>
                </p>
              </div>

              {/* Actionable AI Triage Directive */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2 mb-1">
                  <ShieldAlert className="w-4 h-4 text-cyan-700" />
                  <span>Chief Medical Officer Action Directive:</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {selectedIncident.actionableRecommendation}
                </p>
              </div>

              {/* 1. Bed Reservation Requirements */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <BedDouble className="w-4 h-4 text-cyan-600" />
                    <span>Emergency Beds Required to Reserve</span>
                  </h4>
                  <span className="text-xs font-bold text-cyan-800">
                    Total: {selectedIncident.bedsToReserve?.total || 18} Beds
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl border border-slate-200 bg-white text-center">
                    <div className="text-lg font-black text-slate-900">
                      {selectedIncident.bedsToReserve?.icu || 4}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500">ICU Beds</div>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 bg-white text-center">
                    <div className="text-lg font-black text-slate-900">
                      {selectedIncident.bedsToReserve?.emergency || 8}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500">Trauma / ER Beds</div>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 bg-white text-center">
                    <div className="text-lg font-black text-slate-900">
                      {selectedIncident.bedsToReserve?.burns || 0}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500">Burn / Isolation Beds</div>
                  </div>
                </div>
              </div>

              {/* 2. Oxygen Demand Spike */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2">
                  <Wind className="w-4 h-4 text-blue-600" />
                  <span>Projected Medical Oxygen Demand</span>
                </h4>

                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-blue-950">
                      Spike: +{selectedIncident.oxygenSurge?.additionalBurnRateLmin || 28.5} L/min
                    </div>
                    <div className="text-[11px] text-blue-800 mt-0.5">
                      Estimated volume: {selectedIncident.oxygenSurge?.extraLitersRequired || 2500} Liters
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="font-bold text-blue-950">
                      Reserve: +{selectedIncident.oxygenSurge?.reserveCylindersNeeded || 6} H-Type Tanks
                    </div>
                    <div className="text-[11px] text-blue-800 mt-0.5">
                      Minimum buffer: {selectedIncident.oxygenSurge?.recommendedTankBufferHours || 24} Hours
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Critical Medications & Blood Bank Checklist */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2">
                  <Droplet className="w-4 h-4 text-rose-600" />
                  <span>Critical Pharmaceuticals & Blood Units Checklist</span>
                </h4>

                <div className="space-y-1.5">
                  {selectedIncident.criticalMedicines?.map((med, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="font-medium text-slate-800">{med.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{med.requiredUnits} units</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          med.urgency === 'IMMEDIATE' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {med.urgency}
                        </span>
                      </div>
                    </div>
                  ))}

                  {selectedIncident.bloodBankReserves && (
                    <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-rose-50/70 border border-rose-200 text-rose-900">
                      <span className="font-bold">Emergency Blood Bank Dispatch</span>
                      <span>
                        O-Universal: <strong>{selectedIncident.bloodBankReserves.oNegative} units</strong> • Plasma: <strong>{selectedIncident.bloodBankReserves.plasmaUnits} units</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Primary Action: Execute Surge Protocol ── */}
              <div className="pt-2">
                <button
                  onClick={() => handleApplySurge(selectedIncident)}
                  className="w-full py-3 px-4 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs shadow-md shadow-cyan-700/20 flex items-center justify-center gap-2 transition-all"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Execute AI Surge Protocol: Reserve Beds & Boost O2 Buffer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
              Select an incident from the left to view the AI hospital surge assessment.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
