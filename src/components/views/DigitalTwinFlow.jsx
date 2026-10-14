import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Network,
  Truck,
  Heart,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  ShieldAlert,
  ArrowRight,
  Radio,
  MapPin,
  Compass,
  PhoneCall,
  Video,
  Navigation,
  Fuel,
  Siren,
  SlidersHorizontal,
  RefreshCw,
  Zap,
  Info,
  Stethoscope,
  ChevronRight,
  UserCheck,
  Building2,
  Layers
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { GlassCard } from '../common/GlassCard';
import { StatBadge } from '../common/StatBadge';
import { ProgressBar } from '../common/ProgressBar';
import { ActionButton } from '../common/ActionButton';

// Initial realistic Hospital-Owned Ambulance Fleet with simulated Mumbai GPS tracks
const INITIAL_AMBULANCES = [
  {
    id: 'AMB-101',
    callsign: 'LIFELINE-ONE (ALS Mobile ICU)',
    regNumber: 'MH-02-ER-9912',
    type: 'Advanced Life Support (ALS)',
    hasPatient: true,
    patient: {
      name: 'Rahul Sharma',
      age: 42,
      gender: 'Male',
      condition: 'Acute STEMI (Anterolateral Myocardial Infarction)',
      triage: 'RED_CRITICAL',
      esiLevel: 'ESI Level 1 (Immediate)',
      vitals: {
        hr: 118,
        bp: '92/64',
        spo2: 91,
        rr: 24,
        gcs: '14/15',
        o2Flow: '12 L/min (High Flow NRB)'
      },
      interventions: [
        'Aspirin 325mg chewed, Ticagrelor 180mg given',
        '12-Lead ECG transmitted to MedTwin Cath Lab',
        'IV Normal Saline 500mL running via 18G cannula',
        'Sublingual Nitro held due to borderline BP'
      ],
      assignedBay: 'ER Resuscitation Bay 1 (Cath Lab Pre-Activated)'
    },
    crew: {
      leadParamedic: 'Paramedic P. Joshi (ALS Certified)',
      driver: 'K. Patil'
    },
    locationName: 'Bandra-Kurla Complex (BKC) Connector',
    coordinates: { lat: 19.0607, lng: 72.8682 },
    destination: 'MedTwin Central Hospital ER',
    speedKmH: 64,
    distanceKm: 2.3,
    etaMinutes: 5,
    sirenActive: true,
    fuelPercent: 88,
    status: 'INBOUND_PATIENT',
    // Route waypoints in % coordinates (0 to 100) on our SVG Mumbai Map
    waypoints: [
      { x: 74, y: 38 },
      { x: 67, y: 44 },
      { x: 59, y: 50 },
      { x: 48, y: 56 }
    ],
    progress: 0.35
  },
  {
    id: 'AMB-106',
    callsign: 'TRAUMA-SIX (Critical Resuscitation)',
    regNumber: 'MH-02-ER-7821',
    type: 'Trauma Mobile Unit',
    hasPatient: true,
    patient: {
      name: 'Vikram Salunke',
      age: 29,
      gender: 'Male',
      condition: 'High-Velocity Road Crash — Pelvic Trauma & Hemorrhagic Shock',
      triage: 'RED_CRITICAL',
      esiLevel: 'ESI Level 1 (Trauma Red Alert)',
      vitals: {
        hr: 132,
        bp: '86/52',
        spo2: 95,
        rr: 28,
        gcs: '12/15',
        o2Flow: '15 L/min Non-Rebreather'
      },
      interventions: [
        'Pelvic binder applied & secured in situ',
        'Bilateral large-bore 16G IV access established',
        'TXA (Tranexamic Acid) 1g IV infused over 10m',
        'C-spine immobilized with rigid cervical collar'
      ],
      assignedBay: 'ER Trauma Resuscitation Bay 3'
    },
    crew: {
      leadParamedic: 'Dr. N. Mehta (Trauma Fellow)',
      driver: 'R. Gaikwad'
    },
    locationName: 'Western Express Highway (Kalanagar Flyover)',
    coordinates: { lat: 19.0560, lng: 72.8480 },
    destination: 'MedTwin Central Hospital ER',
    speedKmH: 72,
    distanceKm: 1.4,
    etaMinutes: 3,
    sirenActive: true,
    fuelPercent: 92,
    status: 'INBOUND_PATIENT',
    waypoints: [
      { x: 53, y: 18 },
      { x: 52, y: 32 },
      { x: 50, y: 45 },
      { x: 48, y: 56 }
    ],
    progress: 0.65
  },
  {
    id: 'AMB-104',
    callsign: 'CARDIAC-FOUR (Mobile Coronary Care)',
    regNumber: 'MH-02-ER-4490',
    type: 'Advanced Cardiac Care',
    hasPatient: true,
    patient: {
      name: 'Meera Iyer',
      age: 68,
      gender: 'Female',
      condition: 'Severe Acute Respiratory Failure / Flash Pulmonary Edema',
      triage: 'YELLOW_URGENT',
      esiLevel: 'ESI Level 2 (Urgent)',
      vitals: {
        hr: 98,
        bp: '168/104',
        spo2: 93,
        rr: 22,
        gcs: '15/15',
        o2Flow: 'CPAP 8 cmH2O (FiO2 60%)'
      },
      interventions: [
        'Pre-hospital CPAP mask initiated and tolerated',
        'Sublingual Nitroglycerin spray x 2 doses given',
        'Furosemide 40mg IV administered',
        'Continuous pulse-oximetry and cardiac monitoring'
      ],
      assignedBay: 'ER Acute Medical Bay 4'
    },
    crew: {
      leadParamedic: 'Paramedic S. Kulkarni',
      driver: 'A. Sawant'
    },
    locationName: 'Mahim Causeway / Cadell Road',
    coordinates: { lat: 19.0380, lng: 72.8390 },
    destination: 'MedTwin Central Hospital ER',
    speedKmH: 46,
    distanceKm: 3.8,
    etaMinutes: 8,
    sirenActive: true,
    fuelPercent: 79,
    status: 'INBOUND_PATIENT',
    waypoints: [
      { x: 58, y: 78 },
      { x: 54, y: 69 },
      { x: 50, y: 62 },
      { x: 48, y: 56 }
    ],
    progress: 0.40
  },
  {
    id: 'AMB-102',
    callsign: 'RESCUE-TWO (Basic Life Support)',
    regNumber: 'MH-02-ER-3310',
    type: 'Basic Life Support (BLS)',
    hasPatient: false,
    patient: null,
    mission: 'Dispatched to scene: Senior citizen fall with suspected hip fracture',
    calloutDetails: {
      incidentLocation: 'Dharavi 90 Feet Road (Near Transit Camp)',
      caller: 'Family member',
      reportedCondition: 'Conscious, localized severe hip pain, unable to weight-bear'
    },
    crew: {
      leadParamedic: 'EMT D. Shinde',
      driver: 'S. Jadhav'
    },
    locationName: 'Sion-Bandra Link Road (En Route to Scene)',
    coordinates: { lat: 19.0490, lng: 72.8580 },
    destination: 'Scene (Dharavi 90 Ft Rd)',
    speedKmH: 52,
    distanceKm: 2.1,
    etaMinutes: 6,
    sirenActive: true,
    fuelPercent: 84,
    status: 'DISPATCHED_SCENE',
    waypoints: [
      { x: 48, y: 56 },
      { x: 58, y: 50 },
      { x: 68, y: 46 }
    ],
    progress: 0.50
  },
  {
    id: 'AMB-105',
    callsign: 'PEDI-FIVE (Neonatal / Pediatric Transport)',
    regNumber: 'MH-02-ER-5521',
    type: 'Neonatal & Pediatric Intensive Care',
    hasPatient: false,
    patient: null,
    mission: 'Returning to MedTwin Base after successful inter-hospital transfer',
    calloutDetails: {
      incidentLocation: 'Completed neonatal transfer to Wadia Children’s Hospital',
      caller: 'Pediatric ICU Lead',
      reportedCondition: 'Vehicle sanitized, incubator calibrated, available for dispatch'
    },
    crew: {
      leadParamedic: 'Neonatal Nurse P. Nair',
      driver: 'M. Qureshi'
    },
    locationName: 'Senapati Bapat Marg (Heading North)',
    coordinates: { lat: 19.0180, lng: 72.8310 },
    destination: 'MedTwin Ambulance Bay (Base)',
    speedKmH: 38,
    distanceKm: 4.9,
    etaMinutes: 12,
    sirenActive: false,
    fuelPercent: 71,
    status: 'RETURNING_BASE',
    waypoints: [
      { x: 55, y: 88 },
      { x: 52, y: 74 },
      { x: 49, y: 64 },
      { x: 48, y: 56 }
    ],
    progress: 0.25
  },
  {
    id: 'AMB-108',
    callsign: 'RAPID-EIGHT (First Responder SUV)',
    regNumber: 'MH-02-ER-8800',
    type: 'Rapid Medical Intervention Unit',
    hasPatient: false,
    patient: null,
    mission: 'Standby on coastal deployment post for rapid sea-link response',
    calloutDetails: {
      incidentLocation: 'Bandra Bandstand / Sea Face Standby Post',
      caller: 'City EMS Dispatch',
      reportedCondition: 'Ready for emergency rapid-deployment dispatch'
    },
    crew: {
      leadParamedic: 'Paramedic T. Roy',
      driver: 'V. Deshmukh'
    },
    locationName: 'Bandra Bandstand Deployment Post (Stationary)',
    coordinates: { lat: 19.0430, lng: 72.8190 },
    destination: 'Stationary Standby',
    speedKmH: 0,
    distanceKm: 0,
    etaMinutes: 0,
    sirenActive: false,
    fuelPercent: 95,
    status: 'STANDBY_READY',
    waypoints: [
      { x: 32, y: 62 },
      { x: 32, y: 62 }
    ],
    progress: 0
  }
];

export const DigitalTwinFlow = () => {
  const { flowNodes } = useHospital();

  // Active Main View Tab
  const [activeSubTab, setActiveSubTab] = useState('map'); // 'map' or 'stages'

  // Ambulance Fleet State & Live Movement
  const [ambulances, setAmbulances] = useState(INITIAL_AMBULANCES);
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState('AMB-101');
  const [fleetFilter, setFleetFilter] = useState('all'); // 'all', 'patient_only', 'available'
  const [isSimulatingTraffic, setIsSimulatingTraffic] = useState(true);
  const [actionNotice, setActionNotice] = useState(null);

  // Digital Twin Node Selection
  const [selectedNode, setSelectedNode] = useState(flowNodes?.[2] || flowNodes?.[0]);

  // Selected Ambulance object
  const selectedAmbulance = useMemo(() => {
    return ambulances.find((a) => a.id === selectedAmbulanceId) || ambulances[0];
  }, [ambulances, selectedAmbulanceId]);

  // Helper Toast
  const triggerNotice = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Live Telemetry GPS Movement Simulation (Updates coordinates & speed along routes)
  useEffect(() => {
    if (!isSimulatingTraffic) return;

    const interval = setInterval(() => {
      setAmbulances((prevList) =>
        prevList.map((amb) => {
          if (amb.status === 'STANDBY_READY') return amb;

          // Increment waypoint progress
          let newProgress = amb.progress + 0.012;
          if (newProgress >= 0.98) {
            newProgress = 0.05; // Loop route for demo
          }

          // Subtle speed fluctuation
          const jitter = (Math.random() - 0.5) * 4;
          const baseSpeed = amb.sirenActive ? 62 : 42;
          const newSpeed = Math.max(25, Math.min(85, Math.round(baseSpeed + jitter)));

          // Recalculate distance and ETA based on remaining progress
          const remainingFactor = Math.max(0.1, 1 - newProgress);
          const newDistance = Number((remainingFactor * 4.5).toFixed(1));
          const newEta = Math.max(1, Math.round((newDistance / (newSpeed / 60))));

          return {
            ...amb,
            progress: newProgress,
            speedKmH: newSpeed,
            distanceKm: newDistance,
            etaMinutes: newEta
          };
        })
      );
    }, 1200);

    return () => clearInterval(interval);
  }, [isSimulatingTraffic]);

  // Interpolate current (x, y) % on SVG Map given waypoints and progress
  const getAmbulanceMapPosition = (amb) => {
    const pts = amb.waypoints;
    if (!pts || pts.length < 2) return { x: 50, y: 50 };

    const totalSegments = pts.length - 1;
    const scaledProgress = amb.progress * totalSegments;
    const segIndex = Math.min(totalSegments - 1, Math.floor(scaledProgress));
    const t = scaledProgress - segIndex;

    const p0 = pts[segIndex];
    const p1 = pts[segIndex + 1] || pts[segIndex];

    const x = p0.x + (p1.x - p0.x) * t;
    const y = p0.y + (p1.y - p0.y) * t;

    return { x, y };
  };

  // Filtered Ambulance List
  const filteredAmbulances = useMemo(() => {
    return ambulances.filter((a) => {
      if (fleetFilter === 'patient_only') return a.hasPatient;
      if (fleetFilter === 'available') return !a.hasPatient;
      return true;
    });
  }, [ambulances, fleetFilter]);

  // Pre-Alert ER Resuscitation Bay
  const handlePreAlertER = (amb) => {
    triggerNotice(`⚡ Pre-Alert Transmitted to MedTwin ER & Trauma Team for ${amb.id} (${amb.patient?.name || 'Inbound Unit'})! Resuscitation Bay Prepared.`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Alert */}
      {actionNotice && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl shadow-emerald-950/20 text-xs sm:text-sm font-semibold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-white" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Top Header Card */}
      <GlassCard className="border-violet-500/20 bg-gradient-to-r from-violet-50/60 via-white to-cyan-50/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-violet-100 text-violet-800 border border-violet-200">
                <Network className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 font-heading flex items-center gap-2">
                  Patient Flow & Live Ambulance Fleet Radar
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-200">
                    Live GPS Telemetry
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Real-time hospital-owned ambulance tracking, pre-hospital patient vitals telemetry, and admission digital twin bottlenecks.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics & Simulation Switch */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsSimulatingTraffic((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition shadow-sm ${
                isSimulatingTraffic
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${isSimulatingTraffic ? 'text-emerald-600' : 'text-slate-400'}`} />
              {isSimulatingTraffic ? 'GPS Pulse: Active' : 'GPS Pulse: Paused'}
            </button>

            <ActionButton
              icon={PhoneCall}
              onClick={() => handlePreAlertER(selectedAmbulance)}
              className="bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-700/20"
            >
              Pre-Alert ER Bay ({selectedAmbulance.id})
            </ActionButton>
          </div>
        </div>

        {/* Fleet KPI Quick Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="font-medium">Active Hospital Fleet</span>
              <Truck className="w-4 h-4 text-violet-600" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold font-mono text-slate-900">{ambulances.length} Units</span>
              <span className="text-[11px] text-emerald-600 font-semibold">100% Operational</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Hospital-owned & crewed</p>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="font-medium">Patients Inbound</span>
              <Heart className="w-4 h-4 text-rose-600" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold font-mono text-rose-600">
                {ambulances.filter((a) => a.hasPatient).length} In Transit
              </span>
              <span className="text-[11px] text-rose-700 font-bold">2 Critical Red</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Average Inbound ETA: ~4.5 mins</p>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="font-medium">Available / Scene</span>
              <Navigation className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold font-mono text-slate-900">
                {ambulances.filter((a) => !a.hasPatient).length} Units
              </span>
              <span className="text-[11px] text-cyan-700 font-semibold">1 On Scene</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Ready for re-dispatch</p>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="font-medium">Intake Velocity</span>
              <Activity className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold font-mono text-slate-900">14 pts / hr</span>
              <span className="text-[11px] text-amber-700 font-semibold">ER Queue: 12</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">ESI Triage throughput normal</p>
          </div>
        </div>
      </GlassCard>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('map')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeSubTab === 'map'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Compass className="w-4 h-4 text-cyan-400" />
          <span>Live Ambulance GPS Map & Pre-Hospital Intake</span>
        </button>

        <button
          onClick={() => setActiveSubTab('stages')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeSubTab === 'stages'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Network className="w-4 h-4 text-violet-400" />
          <span>Patient Admission Digital Twin Pipeline</span>
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 1: LIVE AMBULANCE GPS MAP & FLEET TELEMETRY */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeSubTab === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive Map (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <GlassCard
              title="Live Mumbai Catchment & Ambulance Fleet Radar"
              subtitle="Hospital-owned GPS units with active telemetry corridors and real-time transit positions"
              action={
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setFleetFilter('all')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition ${
                      fleetFilter === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All ({ambulances.length})
                  </button>
                  <button
                    onClick={() => setFleetFilter('patient_only')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition ${
                      fleetFilter === 'patient_only'
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    With Patient ({ambulances.filter((a) => a.hasPatient).length})
                  </button>
                  <button
                    onClick={() => setFleetFilter('available')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition ${
                      fleetFilter === 'available'
                        ? 'bg-cyan-600 text-white'
                        : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100'
                    }`}
                  >
                    Empty / Available ({ambulances.filter((a) => !a.hasPatient).length})
                  </button>
                </div>
              }
            >
              {/* Interactive Vector Map of Mumbai Catchment */}
              <div className="relative w-full aspect-[4/3] rounded-2xl bg-gradient-to-br from-slate-100 via-sky-50 to-slate-200 border border-slate-300/80 shadow-inner overflow-hidden select-none">
                {/* SVG Map Geography, Coastlines & Roads */}
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full pointer-events-none"
                  preserveAspectRatio="none"
                >
                  {/* Subtle Radar Range Rings around MedTwin Base (48, 56) */}
                  <circle cx="48" cy="56" r="15" fill="none" stroke="#0ea5e9" strokeWidth="0.3" strokeDasharray="1,1" opacity="0.4" />
                  <circle cx="48" cy="56" r="30" fill="none" stroke="#0ea5e9" strokeWidth="0.3" strokeDasharray="1.5,1.5" opacity="0.3" />
                  <circle cx="48" cy="56" r="45" fill="none" stroke="#0ea5e9" strokeWidth="0.2" strokeDasharray="2,2" opacity="0.2" />

                  {/* Range Labels */}
                  <text x="48" y="40" fill="#0284c7" fontSize="2" opacity="0.5" textAnchor="middle">5 KM RADIUS</text>
                  <text x="48" y="25" fill="#0284c7" fontSize="2" opacity="0.4" textAnchor="middle">10 KM RADIUS</text>

                  {/* Arabian Sea Water Body & Mumbai Peninsula Coastline */}
                  <path
                    d="M 0,0 L 26,0 C 27,15 24,30 26,45 C 28,52 32,58 36,65 C 42,75 48,82 49,95 L 49,100 L 0,100 Z"
                    fill="#e0f2fe"
                    opacity="0.8"
                  />
                  {/* Mahim Bay / Mithi River inlet */}
                  <path
                    d="M 26,45 Q 38,48 42,52 Q 44,55 36,65 Z"
                    fill="#bae6fd"
                    opacity="0.9"
                  />
                  {/* Eastern Harbor Body */}
                  <path
                    d="M 85,0 Q 82,45 88,70 Q 94,88 100,95 L 100,0 Z"
                    fill="#e0f2fe"
                    opacity="0.7"
                  />

                  {/* Main Road Corridors */}
                  {/* Western Express Highway (WEH) */}
                  <path
                    d="M 52,0 L 53,25 L 50,45 L 48,56 L 54,76 L 56,100"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 52,0 L 53,25 L 50,45 L 48,56 L 54,76 L 56,100"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="0.8"
                    strokeDasharray="1,1"
                  />

                  {/* Bandra-Worli Sea Link (BWSL) */}
                  <path
                    d="M 36,62 Q 33,70 38,82 L 44,88"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />

                  {/* BKC Connector East-West */}
                  <path
                    d="M 50,45 L 65,42 L 80,40"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  {/* SV Road & Linking Road */}
                  <path
                    d="M 38,20 L 40,40 L 44,52 L 48,56"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="1.5"
                  />

                  {/* Simulated Route Trajectories for Active Ambulances */}
                  {ambulances.map((amb) => {
                    if (amb.waypoints.length < 2) return null;
                    const pathData = amb.waypoints.reduce(
                      (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`,
                      ''
                    );
                    const isSelected = selectedAmbulanceId === amb.id;

                    return (
                      <path
                        key={`path-${amb.id}`}
                        d={pathData}
                        fill="none"
                        stroke={amb.hasPatient ? '#f43f5e' : '#0284c7'}
                        strokeWidth={isSelected ? '1.5' : '0.8'}
                        strokeDasharray={isSelected ? 'none' : '1.5,1.5'}
                        opacity={isSelected ? 0.9 : 0.4}
                      />
                    );
                  })}
                </svg>

                {/* Geography Labels */}
                <div className="absolute top-3 left-3 text-[10px] font-bold text-sky-900/60 uppercase tracking-wider font-mono">
                  Arabian Sea
                </div>
                <div className="absolute top-1/2 left-4 text-[9px] font-bold text-sky-900/50 uppercase tracking-wider font-mono">
                  Mahim Bay
                </div>
                <div className="absolute top-1/4 right-4 text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  BKC Corridor
                </div>
                <div className="absolute bottom-4 right-4 text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Dadar / Parel
                </div>

                {/* ── Main Hospital Base Marker (MedTwin Central) ── */}
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
                  style={{ left: '48%', top: '56%' }}
                >
                  <div className="relative flex items-center justify-center">
                    <span className="absolute w-10 h-10 rounded-full bg-violet-400/30 animate-ping"></span>
                    <div className="w-8 h-8 rounded-full bg-violet-700 text-white flex items-center justify-center shadow-lg border-2 border-white group-hover:scale-110 transition-transform">
                      <Building2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/90 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-md pointer-events-none">
                    MedTwin Hospital Base (ER Bays)
                  </div>
                </div>

                {/* ── Partner Hospital Reference Markers ── */}
                <div className="absolute -translate-x-1/2 -translate-y-1/2 z-10" style={{ left: '72%', top: '38%' }}>
                  <div className="w-3.5 h-3.5 rounded-full bg-slate-400 border border-white"></div>
                  <span className="text-[8px] font-semibold text-slate-600 absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    BKC Clinic
                  </span>
                </div>
                <div className="absolute -translate-x-1/2 -translate-y-1/2 z-10" style={{ left: '54%', top: '78%' }}>
                  <div className="w-3.5 h-3.5 rounded-full bg-slate-400 border border-white"></div>
                  <span className="text-[8px] font-semibold text-slate-600 absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    Hinduja Mahim
                  </span>
                </div>
                <div className="absolute -translate-x-1/2 -translate-y-1/2 z-10" style={{ left: '53%', top: '16%' }}>
                  <div className="w-3.5 h-3.5 rounded-full bg-slate-400 border border-white"></div>
                  <span className="text-[8px] font-semibold text-slate-600 absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    WEH Kalanagar
                  </span>
                </div>

                {/* ── LIVE MOVING AMBULANCE MARKERS ── */}
                {filteredAmbulances.map((amb) => {
                  const pos = getAmbulanceMapPosition(amb);
                  const isSelected = selectedAmbulanceId === amb.id;
                  const hasPt = amb.hasPatient;

                  return (
                    <div
                      key={amb.id}
                      onClick={() => setSelectedAmbulanceId(amb.id)}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 z-30 cursor-pointer transition-all duration-300 group`}
                      style={{
                        left: `${pos.x}%`,
                        top: `${pos.y}%`
                      }}
                    >
                      {/* Siren Light Pulsing Halo */}
                      {amb.sirenActive && (
                        <span
                          className={`absolute -inset-2 rounded-full animate-ping ${
                            hasPt ? 'bg-rose-500/40' : 'bg-cyan-500/30'
                          }`}
                        ></span>
                      )}

                      {/* Ambulance Pin / Icon Badge */}
                      <div
                        className={`relative px-2 py-1 rounded-full flex items-center gap-1.5 shadow-lg border-2 transition-transform ${
                          isSelected
                            ? 'scale-125 z-40 ring-4 ring-violet-500/40 ' +
                              (hasPt
                                ? 'bg-rose-600 text-white border-white'
                                : 'bg-cyan-600 text-white border-white')
                            : hasPt
                            ? 'bg-rose-500 text-white border-white hover:scale-110'
                            : 'bg-white text-slate-800 border-slate-300 hover:scale-110'
                        }`}
                      >
                        <Truck className="w-3 h-3 flex-shrink-0" />
                        <span className="text-[9px] font-black font-mono tracking-tight">
                          {amb.id}
                        </span>

                        {hasPt && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                        )}
                      </div>

                      {/* Tooltip on Hover / Selected */}
                      <div
                        className={`absolute top-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded shadow-md text-[9px] font-semibold pointer-events-none transition-opacity ${
                          isSelected
                            ? 'bg-slate-900 text-white opacity-100 z-50'
                            : 'bg-white text-slate-800 border border-slate-200 opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <div>{amb.callsign.split(' ')[0]}</div>
                        <div className="font-mono text-[8px] opacity-80">
                          {hasPt ? `🚨 Pt: ${amb.patient.name} (${amb.etaMinutes}m ETA)` : 'Empty / Available'}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Map Compass & Legend Overlay */}
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs p-2 rounded-xl border border-slate-200/80 shadow-xs text-[10px] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Compass className="w-3.5 h-3.5 text-slate-600" />
                    <span>Mumbai South Catchment</span>
                  </div>
                  <div className="flex items-center gap-3 text-[9px] text-slate-500 pt-0.5">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span> Patient Onboard
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-cyan-500"></span> Empty / Dispatched
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-violet-700"></span> MedTwin Base
                    </span>
                  </div>
                </div>
              </div>

              {/* Fleet Quick Selector Table / Cards */}
              <div className="space-y-2 mt-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Live Fleet Directory (Click Vehicle to Inspect Telemetry)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredAmbulances.map((amb) => {
                    const isSelected = selectedAmbulanceId === amb.id;
                    const hasPt = amb.hasPatient;

                    return (
                      <div
                        key={amb.id}
                        onClick={() => setSelectedAmbulanceId(amb.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all text-xs flex items-center justify-between ${
                          isSelected
                            ? 'bg-violet-50 border-violet-400 ring-2 ring-violet-400/20 shadow-sm'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`p-2 rounded-lg ${
                              hasPt ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 font-mono">{amb.id}</span>
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                  hasPt
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {hasPt ? 'Patient Onboard' : 'Empty'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 truncate max-w-[140px]">
                              {hasPt ? amb.patient.name : amb.mission.slice(0, 24) + '...'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <span className="font-bold text-slate-900">{amb.speedKmH} km/h</span>
                          <p className="text-[10px] text-slate-400">
                            {amb.etaMinutes > 0 ? `${amb.etaMinutes}m ETA` : 'Standby'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Right Column: Detailed Ambulance Telemetry & Patient Vitals (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <GlassCard
              title={`Vehicle Telemetry: ${selectedAmbulance.id}`}
              subtitle={selectedAmbulance.callsign}
              action={
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    selectedAmbulance.hasPatient
                      ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {selectedAmbulance.hasPatient ? '🚨 PATIENT ON BOARD' : '🟢 NO PATIENT / EMPTY'}
                </span>
              }
            >
              {/* SECTION A: PATIENT INFORMATION (IF PATIENT ON BOARD) */}
              {selectedAmbulance.hasPatient && selectedAmbulance.patient ? (
                <div className="space-y-4">
                  {/* Patient Profile Banner */}
                  <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {selectedAmbulance.patient.name}
                        </h4>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {selectedAmbulance.patient.age} yrs • {selectedAmbulance.patient.gender}
                        </span>
                      </div>
                      <span className="px-2 py-1 rounded bg-rose-600 text-white font-bold text-[10px]">
                        {selectedAmbulance.patient.esiLevel}
                      </span>
                    </div>

                    <div className="text-slate-700 bg-white/80 p-2 rounded-lg border border-rose-100">
                      <span className="font-semibold text-rose-950">Primary Condition: </span>
                      <strong className="text-slate-900">{selectedAmbulance.patient.condition}</strong>
                    </div>

                    <div className="text-[11px] text-rose-900">
                      <span className="font-semibold">Assigned Intake: </span>
                      <strong className="text-slate-900">{selectedAmbulance.patient.assignedBay}</strong>
                    </div>
                  </div>

                  {/* Live Vitals Telemetry Monitor */}
                  <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                        In-Transit Life Signs Telemetry
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">TELE-LINK ACTIVE</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      <div className="p-2 rounded bg-slate-800/80">
                        <span className="text-[10px] text-slate-400">Heart Rate</span>
                        <p className="text-xl font-bold font-mono text-rose-400">
                          {selectedAmbulance.patient.vitals.hr}{' '}
                          <span className="text-[10px] text-slate-400 font-normal">bpm</span>
                        </p>
                      </div>

                      <div className="p-2 rounded bg-slate-800/80">
                        <span className="text-[10px] text-slate-400">Blood Pressure</span>
                        <p className="text-xl font-bold font-mono text-amber-300">
                          {selectedAmbulance.patient.vitals.bp}
                        </p>
                      </div>

                      <div className="p-2 rounded bg-slate-800/80">
                        <span className="text-[10px] text-slate-400">SpO2</span>
                        <p className="text-xl font-bold font-mono text-cyan-400">
                          {selectedAmbulance.patient.vitals.spo2}%
                        </p>
                      </div>

                      <div className="p-2 rounded bg-slate-800/80">
                        <span className="text-[10px] text-slate-400">GCS Scale</span>
                        <p className="text-xl font-bold font-mono text-slate-100">
                          {selectedAmbulance.patient.vitals.gcs}
                        </p>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-300 flex items-center justify-between pt-1">
                      <span>Oxygen Delivery: <strong className="text-white">{selectedAmbulance.patient.vitals.o2Flow}</strong></span>
                      <span>Resp: <strong className="text-white">{selectedAmbulance.patient.vitals.rr}/min</strong></span>
                    </div>
                  </div>

                  {/* Pre-Hospital Emergency Interventions */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Stethoscope className="w-3.5 h-3.5 text-violet-600" />
                      Interventions Administered En Route:
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px] pl-1">
                      {selectedAmbulance.patient.interventions.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                /* SECTION B: NO PATIENT / EMPTY VEHICLE STATUS */
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-2 text-center py-6">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <h4 className="font-bold text-slate-900 text-sm">
                      Vehicle Available & Patient Compartment Clean
                    </h4>
                    <p className="text-slate-600 text-xs max-w-xs mx-auto">
                      {selectedAmbulance.mission}
                    </p>
                    <span className="inline-block mt-1 px-2.5 py-1 rounded bg-emerald-600 text-white text-[10px] font-bold">
                      Ready For Immediate ER Dispatch
                    </span>
                  </div>

                  {selectedAmbulance.calloutDetails && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                      <span className="font-bold text-slate-800">Dispatch Target:</span>
                      <p className="text-slate-600 text-[11px]">
                        <strong>Location: </strong>{selectedAmbulance.calloutDetails.incidentLocation}
                      </p>
                      <p className="text-slate-600 text-[11px]">
                        <strong>Reported Incident: </strong>{selectedAmbulance.calloutDetails.reportedCondition}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* VEHICLE LOGISTICS & RUNNING TELEMETRY */}
              <div className="mt-4 pt-3 border-t border-slate-200 space-y-3 text-xs">
                <h4 className="font-bold text-slate-800">Vehicle Logistics & GPS Route</h4>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-400">Current Velocity:</span>
                    <p className="font-bold font-mono text-slate-900 text-sm">
                      {selectedAmbulance.speedKmH} km/h
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-400">Distance to Base:</span>
                    <p className="font-bold font-mono text-slate-900 text-sm">
                      {selectedAmbulance.distanceKm} km
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-400">Estimated Arrival:</span>
                    <p className="font-bold font-mono text-violet-700 text-sm">
                      {selectedAmbulance.etaMinutes > 0 ? `${selectedAmbulance.etaMinutes} mins` : 'Stationed'}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-400">Fuel / Battery:</span>
                    <p className="font-bold font-mono text-emerald-700 text-sm">
                      {selectedAmbulance.fuelPercent}%
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Lead Paramedic:</span>
                    <strong className="text-slate-900">{selectedAmbulance.crew.leadParamedic}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Driver Pilot:</span>
                    <strong className="text-slate-900">{selectedAmbulance.crew.driver}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Registration:</span>
                    <span className="font-mono text-slate-700">{selectedAmbulance.regNumber}</span>
                  </div>
                </div>

                {/* Direct Action Triggers */}
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => handlePreAlertER(selectedAmbulance)}
                    className="w-full py-2.5 px-3 text-xs font-bold rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Siren className="w-4 h-4" />
                    Pre-Alert ER Bay ({selectedAmbulance.id})
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() =>
                        triggerNotice(`📞 Establishing encrypted audio bridge with ${selectedAmbulance.crew.leadParamedic}...`)
                      }
                      className="py-2 px-2 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition flex items-center justify-center gap-1 border border-slate-200"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-slate-600" />
                      Radio Crew
                    </button>

                    <button
                      onClick={() =>
                        triggerNotice(`📹 Tele-Medicine Video Camera stream connected from ${selectedAmbulance.id}.`)
                      }
                      className="py-2 px-2 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition flex items-center justify-center gap-1 border border-slate-200"
                    >
                      <Video className="w-3.5 h-3.5 text-slate-600" />
                      Cab Video Feed
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 2: PATIENT ADMISSION DIGITAL TWIN GRAPH PIPELINE */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeSubTab === 'stages' && (
        <div className="space-y-6">
          <GlassCard
            title="Hospital Patient Pathway & Transfer Velocity Graph"
            subtitle="Click any stage node to inspect queue depth, latency bottlenecks, and diversion recommendations"
          >
            <div className="py-6 overflow-x-auto">
              <div className="min-w-[800px] flex items-center justify-between gap-2 px-4 relative">
                {(flowNodes || []).map((node, index) => {
                  const isSelected = selectedNode?.id === node.id;
                  const isBottleneck = node.status.includes('BOTTLENECK');
                  const isCritical = node.status === 'CRITICAL_BOTTLENECK';

                  return (
                    <React.Fragment key={node.id}>
                      {/* Flow Node Card */}
                      <div
                        onClick={() => setSelectedNode(node)}
                        className={`flex-1 p-4 rounded-2xl border cursor-pointer transition-all duration-300 relative ${
                          isSelected
                            ? 'bg-violet-50 border-violet-500 shadow-md scale-105'
                            : isCritical
                            ? 'bg-rose-50/80 border-rose-300 hover:border-rose-400'
                            : isBottleneck
                            ? 'bg-amber-50/80 border-amber-300 hover:border-amber-400'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                          Stage 0{index + 1}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">
                          {node.stage}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {node.label}
                        </p>

                        <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-400">Queue:</span>
                          <strong
                            className={`font-mono ${
                              isCritical ? 'text-rose-600' : 'text-slate-900'
                            }`}
                          >
                            {node.activeQueue} pts
                          </strong>
                        </div>

                        <div className="mt-2">
                          <StatBadge
                            type={
                              isCritical
                                ? 'critical'
                                : isBottleneck
                                ? 'warning'
                                : 'success'
                            }
                            label={node.status.replace('_', ' ')}
                            pulse={isCritical}
                          />
                        </div>
                      </div>

                      {/* Arrow Connector */}
                      {index < flowNodes.length - 1 && (
                        <div className="flex flex-col items-center px-1">
                          <ArrowRight className="w-5 h-5 text-violet-400" />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </GlassCard>

          {/* Selected Node Details & Bottleneck AI Advisor */}
          {selectedNode && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <GlassCard
                title={`Stage Detail: ${selectedNode.stage}`}
                subtitle={selectedNode.label}
                className="lg:col-span-2"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-500">Throughput Velocity</span>
                    <p className="text-2xl font-bold text-slate-900 font-mono">
                      {selectedNode.throughputPerHour} / hr
                    </p>
                    <p className="text-[10px] text-slate-400">Target Benchmark: 15 / hr</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-500">Active Stage Queue</span>
                    <p className="text-2xl font-bold text-violet-700 font-mono">
                      {selectedNode.activeQueue} Patients
                    </p>
                    <p className="text-[10px] text-slate-400">Wait latency: ~18 mins</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-500">Operational Health</span>
                    <div className="pt-1">
                      <StatBadge
                        type={
                          selectedNode.status.includes('CRITICAL')
                            ? 'critical'
                            : selectedNode.status.includes('BOTTLENECK')
                            ? 'warning'
                            : 'success'
                        }
                        label={selectedNode.status}
                      />
                    </div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard
                title="Node Bottleneck Advisory"
                subtitle="AI recommendation for latency mitigation"
              >
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <ShieldAlert className="w-4 h-4 text-amber-600" /> Bottleneck Advisory
                  </div>
                  <p className="leading-relaxed opacity-90">
                    {selectedNode.status.includes('BOTTLENECK')
                      ? `Stage '${selectedNode.stage}' is currently experiencing elevated backlog (${selectedNode.activeQueue} pts). Recommend step-down transfer to intermediate ward or opening auxiliary intake.`
                      : 'Stage is operating smoothly within standard transfer velocities.'}
                  </p>
                </div>
              </GlassCard>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
