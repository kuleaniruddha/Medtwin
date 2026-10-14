import React, { useState } from 'react';
import { 
  BedDouble, UserPlus, Filter, CheckCircle2, UserCheck, 
  Sparkles, Search, ArrowRight, ShieldCheck, RefreshCw, AlertCircle, 
  Stethoscope, Activity, Heart, Clock
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { GlassCard } from '../common/GlassCard';
import { StatBadge } from '../common/StatBadge';
import { ActionButton } from '../common/ActionButton';
import { Modal } from '../common/Modal';
import { ProgressBar } from '../common/ProgressBar';

export const BedManagerView = () => {
  const { wards, beds, updateBedStatus } = useHospital();

  const [selectedWardFilter, setSelectedWardFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Intake Modal State
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);
  const [targetBedForIntake, setTargetBedForIntake] = useState(null);
  const [patientForm, setPatientForm] = useState({
    name: '',
    age: '42',
    gender: 'Female',
    diagnosis: 'Acute Inflow Observation',
    acuityScore: '2.5',
    oxygenReq: '4'
  });

  // Calculate live counts
  const totalBedsCount = beds.length;
  const occupiedCount = beds.filter(b => b.status === 'occupied').length;
  const availableCount = beds.filter(b => b.status === 'available').length;
  const cleaningCount = beds.filter(b => b.status === 'cleaning').length;
  const maintenanceCount = beds.filter(b => b.status === 'maintenance').length;

  // Selected ward metadata
  const currentWardData = wards.find(w => w.id === selectedWardFilter);

  const filteredBeds = beds.filter((bed) => {
    const matchesWard = selectedWardFilter === 'all' || bed.wardId === selectedWardFilter;
    const matchesStatus = selectedStatusFilter === 'all' || bed.status === selectedStatusFilter;
    const matchesSearch = !searchQuery.trim() || 
      bed.bedNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bed.patient?.name && bed.patient.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (bed.patient?.diagnosis && bed.patient.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesWard && matchesStatus && matchesSearch;
  });

  const handleOpenIntakeModal = (bed) => {
    setTargetBedForIntake(bed);
    const ward = wards.find(w => w.id === bed.wardId);
    setPatientForm({
      name: '',
      age: '45',
      gender: bed.wardId === 'gen_male' ? 'Male' : (bed.wardId === 'gen_female' ? 'Female' : 'Male'),
      diagnosis: bed.wardId === 'icu' ? 'Severe Respiratory Distress' : (bed.wardId === 'er' ? 'Acute Trauma Triage' : 'General Inpatient Observation'),
      acuityScore: bed.wardId === 'icu' ? '4.5' : '2.8',
      oxygenReq: bed.wardId === 'icu' ? '10' : (bed.wardId === 'er' ? '5' : '0')
    });
    setIsIntakeModalOpen(true);
  };

  const handleSaveIntake = async () => {
    if (!targetBedForIntake || !patientForm.name.trim()) return;

    const patientData = {
      name: patientForm.name.trim(),
      age: Number(patientForm.age) || 45,
      gender: patientForm.gender,
      diagnosis: patientForm.diagnosis,
      admittedAt: new Date().toISOString(),
      targetDischarge: new Date(Date.now() + 48 * 3600000).toISOString(),
      acuityScore: Number(patientForm.acuityScore) || 2.5,
      oxygenSupportReqLmin: Number(patientForm.oxygenReq) || 0
    };

    await updateBedStatus(targetBedForIntake.id, 'occupied', patientData);
    setIsIntakeModalOpen(false);
  };

  const handleDischargeToCleaning = async (bedId) => {
    await updateBedStatus(bedId, 'cleaning', null);
  };

  const handleMarkAvailable = async (bedId) => {
    await updateBedStatus(bedId, 'available', null);
  };

  // Quick 1-click admit to first available bed in current view
  const handleQuickAdmitAny = () => {
    const candidate = filteredBeds.find(b => b.status === 'available') || beds.find(b => b.status === 'available');
    if (candidate) {
      handleOpenIntakeModal(candidate);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ── Top Header and Summary Metrics ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 font-heading flex items-center gap-2">
                <BedDouble className="w-6 h-6 text-cyan-700" />
                <span>Bed Capacity & Patient Management</span>
              </h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
                {totalBedsCount} Beds Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Live hospital bed allocation across all 6 clinical departments. Admit, discharge, and track turnarounds in real-time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleQuickAdmitAny}
              disabled={availableCount === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-700 hover:bg-cyan-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Admit Patient</span>
            </button>
          </div>
        </div>

        {/* 4 Quick Stat Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-xs text-slate-500 font-medium">Occupied Beds</div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">
              {occupiedCount} <span className="text-xs text-slate-400 font-sans font-normal">/ {totalBedsCount}</span>
            </div>
            <div className="text-[11px] text-cyan-700 font-semibold mt-0.5">
              {totalBedsCount > 0 ? ((occupiedCount / totalBedsCount) * 100).toFixed(0) : 0}% Occupancy
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
            <div className="text-xs text-emerald-800 font-medium">Ready & Available</div>
            <div className="text-2xl font-black text-emerald-700 font-mono mt-0.5">
              {availableCount}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Immediate Admissions</div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200">
            <div className="text-xs text-amber-800 font-medium">Sanitizing / Cleaning</div>
            <div className="text-2xl font-black text-amber-700 font-mono mt-0.5">
              {cleaningCount}
            </div>
            <div className="text-[11px] text-amber-600 font-semibold mt-0.5">Turnaround in progress</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-xs text-slate-500 font-medium">Under Maintenance</div>
            <div className="text-2xl font-black text-slate-700 font-mono mt-0.5">
              {maintenanceCount}
            </div>
            <div className="text-[11px] text-slate-500 font-semibold mt-0.5">Equipment calibration</div>
          </div>
        </div>
      </div>

      {/* ── Ward Navigation Tabs (All 6 Wards Pill Bar) ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-cyan-600" />
            Select Ward ({wards.length} Units):
          </span>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bed, patient, diagnosis..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedWardFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedWardFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Wards ({totalBedsCount})
          </button>

          {wards.map((ward) => {
            const wardBeds = beds.filter(b => b.wardId === ward.id);
            const isSelected = selectedWardFilter === ward.id;
            return (
              <button
                key={ward.id}
                onClick={() => setSelectedWardFilter(ward.id)}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-700 text-white font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{ward.name.split('(')[0].trim()}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-cyan-800 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {wardBeds.length || ward.total}
                </span>
              </button>
            );
          })}
        </div>

        {/* Status Filter Row */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-semibold text-slate-400 mr-1.5">Status:</span>
            {[
              { id: 'all', label: 'All Beds', count: beds.filter(b => selectedWardFilter === 'all' || b.wardId === selectedWardFilter).length },
              { id: 'available', label: 'Available', count: beds.filter(b => (selectedWardFilter === 'all' || b.wardId === selectedWardFilter) && b.status === 'available').length },
              { id: 'occupied', label: 'Occupied', count: beds.filter(b => (selectedWardFilter === 'all' || b.wardId === selectedWardFilter) && b.status === 'occupied').length },
              { id: 'cleaning', label: 'Cleaning', count: beds.filter(b => (selectedWardFilter === 'all' || b.wardId === selectedWardFilter) && b.status === 'cleaning').length },
              { id: 'maintenance', label: 'Maintenance', count: beds.filter(b => (selectedWardFilter === 'all' || b.wardId === selectedWardFilter) && b.status === 'maintenance').length }
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStatusFilter(st.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedStatusFilter === st.id
                    ? 'bg-cyan-50 text-cyan-800 border border-cyan-300 font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st.label} ({st.count})
              </button>
            ))}
          </div>

          {currentWardData && (
            <div className="text-[11px] text-slate-500 font-medium">
              Lead: <strong className="text-slate-800">{currentWardData.manager}</strong> • Ratio: <strong className="text-slate-800">{currentWardData.criticalStaffRatio}</strong>
            </div>
          )}
        </div>
      </div>

      {/* ── Active Ward Clinical Banner (When specific ward is selected) ── */}
      {currentWardData && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="font-bold text-slate-900 text-sm">
              {currentWardData.name} ({currentWardData.code})
            </div>
            <div className="text-slate-500 mt-0.5">
              Supervising Lead: <strong>{currentWardData.manager}</strong> • Critical Staff Ratio: <strong>{currentWardData.criticalStaffRatio}</strong>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="font-bold text-slate-900">
                {currentWardData.occupied} of {currentWardData.total} occupied
              </span>
              <span className="text-[11px] text-emerald-700 block font-medium">
                {currentWardData.total - currentWardData.occupied} beds ready for intake
              </span>
            </div>
            <div className="w-24">
              <ProgressBar value={Number(((currentWardData.occupied / currentWardData.total) * 100).toFixed(0))} />
            </div>
          </div>
        </div>
      )}

      {/* ── Beds Grid View (All Beds Rendered Dynamically) ── */}
      {filteredBeds.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBeds.map((bed) => {
            const isOccupied = bed.status === 'occupied';
            const isAvailable = bed.status === 'available';
            const isCleaning = bed.status === 'cleaning';
            const isMaintenance = bed.status === 'maintenance';
            const bedWard = wards.find(w => w.id === bed.wardId);

            return (
              <div
                key={bed.id}
                className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                  isOccupied
                    ? 'bg-white border-slate-200 hover:border-cyan-300 shadow-xs'
                    : isAvailable
                    ? 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-400 shadow-xs'
                    : isCleaning
                    ? 'bg-amber-50/60 border-amber-200 shadow-xs'
                    : 'bg-rose-50/60 border-rose-200 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-extrabold text-slate-900 font-mono">
                      {bed.bedNumber}
                    </span>
                    <StatBadge
                      type={isOccupied ? 'neutral' : isAvailable ? 'success' : isCleaning ? 'warning' : 'critical'}
                      label={bed.status.toUpperCase()}
                    />
                  </div>

                  <div className="text-[11px] font-semibold text-slate-400 mb-2">
                    {bedWard ? bedWard.name.split('(')[0].trim() : bed.wardId}
                  </div>

                  {/* Occupied Patient Details */}
                  {isOccupied && bed.patient ? (
                    <div className="space-y-1.5 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between text-slate-900 font-bold">
                        <span className="truncate">{bed.patient.name}</span>
                        <span className="text-[10px] text-cyan-700 font-mono flex-shrink-0">
                          {bed.patient.gender}, {bed.patient.age}y
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {bed.patient.diagnosis}
                      </p>
                      <div className="pt-1.5 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-200/60">
                        <span>Acuity: <strong className="text-amber-700">{bed.patient.acuityScore} / 5.0</strong></span>
                        {bed.patient.oxygenSupportReqLmin > 0 && (
                          <span className="text-cyan-700 font-mono font-bold">
                            O2: {bed.patient.oxygenSupportReqLmin} L/m
                          </span>
                        )}
                      </div>
                    </div>
                  ) : isAvailable ? (
                    <div className="py-4 text-center">
                      <div className="inline-flex p-2 rounded-xl bg-emerald-100 text-emerald-800 mb-1.5">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="text-xs font-bold text-emerald-900">Bed Sanitized & Ready</div>
                      <div className="text-[11px] text-emerald-700">Available for intake</div>
                    </div>
                  ) : isCleaning ? (
                    <div className="py-4 text-center">
                      <div className="inline-flex p-2 rounded-xl bg-amber-100 text-amber-800 mb-1.5">
                        <Sparkles className="w-5 h-5 animate-pulse" />
                      </div>
                      <div className="text-xs font-bold text-amber-900">Terminal Cleaning</div>
                      <div className="text-[11px] text-amber-700">Sanitation protocol active</div>
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <div className="inline-flex p-2 rounded-xl bg-rose-100 text-rose-800 mb-1.5">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div className="text-xs font-bold text-rose-900">Under Maintenance</div>
                      <div className="text-[11px] text-rose-700">Engineering inspection</div>
                    </div>
                  )}
                </div>

                {/* Bed Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  {isOccupied ? (
                    <button
                      onClick={() => handleDischargeToCleaning(bed.id)}
                      className="w-full py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Discharge Patient
                    </button>
                  ) : isAvailable ? (
                    <button
                      onClick={() => handleOpenIntakeModal(bed)}
                      className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      + Admit Patient
                    </button>
                  ) : isCleaning ? (
                    <button
                      onClick={() => handleMarkAvailable(bed.id)}
                      className="w-full py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      Complete Cleaning (Ready)
                    </button>
                  ) : (
                    <button
                      onClick={() => handleMarkAvailable(bed.id)}
                      className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Return to Service
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <BedDouble className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No beds match current filters</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try resetting your ward or status filters to view all 90 active hospital beds.
          </p>
          <button
            onClick={() => {
              setSelectedWardFilter('all');
              setSelectedStatusFilter('all');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Reset Filters (Show All 90 Beds)
          </button>
        </div>
      )}

      {/* ── Patient Admission / Intake Modal ── */}
      <Modal
        isOpen={isIntakeModalOpen}
        onClose={() => setIsIntakeModalOpen(false)}
        title={`Admit Patient to ${targetBedForIntake?.bedNumber || 'Bed'}`}
        footer={
          <div className="flex justify-end gap-2">
            <ActionButton variant="outline" size="sm" onClick={() => setIsIntakeModalOpen(false)}>
              Cancel
            </ActionButton>
            <ActionButton size="sm" onClick={handleSaveIntake}>
              Confirm Admission
            </ActionButton>
          </div>
        }
      >
        <div className="space-y-4 py-2 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Patient Full Name</label>
            <input
              type="text"
              value={patientForm.name}
              onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
              placeholder="e.g. Priya Sharma"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-cyan-600"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Age</label>
              <input
                type="number"
                value={patientForm.age}
                onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-cyan-600"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Gender</label>
              <select
                value={patientForm.gender}
                onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:border-cyan-600"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Primary Clinical Diagnosis</label>
            <input
              type="text"
              value={patientForm.diagnosis}
              onChange={(e) => setPatientForm({ ...patientForm, diagnosis: e.target.value })}
              placeholder="e.g. Post-Op Laparotomy Observation"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-cyan-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Acuity Score (1.0 - 5.0)</label>
              <select
                value={patientForm.acuityScore}
                onChange={(e) => setPatientForm({ ...patientForm, acuityScore: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:border-cyan-600"
              >
                <option value="1.5">1.5 - Minimal Observation</option>
                <option value="2.5">2.5 - Moderate Stable</option>
                <option value="3.5">3.5 - High Vigilance</option>
                <option value="4.5">4.5 - Critical Care Needed</option>
                <option value="5.0">5.0 - Emergency Resuscitation</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Oxygen Support (L/min)</label>
              <input
                type="number"
                min="0"
                max="15"
                value={patientForm.oxygenReq}
                onChange={(e) => setPatientForm({ ...patientForm, oxygenReq: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-cyan-600"
              />
            </div>
          </div>
        </div>
      </Modal>

    </div>
  );
};
