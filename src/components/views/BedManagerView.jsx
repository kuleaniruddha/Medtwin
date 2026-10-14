import React, { useState } from 'react';
import { BedDouble, UserPlus, Filter, CheckCircle, UserCheck } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { GlassCard } from '../common/GlassCard';
import { StatBadge } from '../common/StatBadge';
import { ActionButton } from '../common/ActionButton';
import { Modal } from '../common/Modal';

export const BedManagerView = () => {
  const { wards, beds, updateBedStatus } = useHospital();

  const [selectedWardFilter, setSelectedWardFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  
  // Intake Modal State
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);
  const [targetBedForIntake, setTargetBedForIntake] = useState(null);
  const [patientForm, setPatientForm] = useState({
    name: '',
    age: '45',
    gender: 'Male',
    diagnosis: 'Acute Inflow Observation',
    acuityScore: '2.5',
    oxygenReq: '4'
  });

  const filteredBeds = beds.filter((bed) => {
    const matchesWard = selectedWardFilter === 'all' || bed.wardId === selectedWardFilter;
    const matchesStatus = selectedStatusFilter === 'all' || bed.status === selectedStatusFilter;
    return matchesWard && matchesStatus;
  });

  const handleOpenIntakeModal = (bed) => {
    setTargetBedForIntake(bed);
    setPatientForm({
      name: '',
      age: '45',
      gender: bed.wardId === 'gen_male' ? 'Male' : (bed.wardId === 'gen_female' ? 'Female' : 'Male'),
      diagnosis: 'Acute Respiratory Inflow',
      acuityScore: '3.0',
      oxygenReq: '5'
    });
    setIsIntakeModalOpen(true);
  };

  const handleSaveIntake = async () => {
    if (!targetBedForIntake || !patientForm.name.trim()) return;

    const patientData = {
      name: patientForm.name,
      age: Number(patientForm.age),
      gender: patientForm.gender,
      diagnosis: patientForm.diagnosis,
      admittedAt: new Date().toISOString(),
      targetDischarge: new Date(Date.now() + 48 * 3600000).toISOString(),
      acuityScore: Number(patientForm.acuityScore),
      oxygenSupportReqLmin: Number(patientForm.oxygenReq)
    };

    await updateBedStatus(targetBedForIntake.id, 'occupied', patientData);
    setIsIntakeModalOpen(false);
  };

  const handleQuickDischarge = async (bedId) => {
    await updateBedStatus(bedId, 'cleaning', null);
  };

  const handleMarkAvailable = async (bedId) => {
    await updateBedStatus(bedId, 'available', null);
  };

  return (
    <div className="space-y-6">
      <GlassCard className="border-cyan-500/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950 flex items-center gap-2">
              <BedDouble className="w-6 h-6 text-cyan-700" /> Bed Management
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Review status, admit patients, and return cleaned beds to service across {beds.length} beds.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm">
              <Filter className="w-3.5 h-3.5 text-cyan-700" />
              <label htmlFor="ward-filter" className="text-slate-600">Ward</label>
              <select
                id="ward-filter"
                value={selectedWardFilter}
                onChange={(e) => setSelectedWardFilter(e.target.value)}
                className="bg-transparent text-slate-950 font-medium outline-none cursor-pointer"
              >
                <option value="all">All Wards ({wards.length})</option>
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs">
              {['all', 'available', 'occupied', 'cleaning', 'maintenance'].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                    selectedStatusFilter === st
                      ? 'bg-cyan-700 text-white font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredBeds.map((bed) => {
          const isOccupied = bed.status === 'occupied';
          const isAvailable = bed.status === 'available';
          const isCleaning = bed.status === 'cleaning';
          const isMaintenance = bed.status === 'maintenance';

          return (
            <div
              key={bed.id}
              className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                isOccupied
                  ? 'bg-white border-slate-200 hover:border-cyan-300'
                  : isAvailable
                  ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-400'
                  : isCleaning
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-rose-50 border-rose-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-slate-950 font-mono">{bed.bedNumber}</span>
                  <StatBadge
                    type={isOccupied ? 'neutral' : isAvailable ? 'success' : isCleaning ? 'warning' : 'critical'}
                    label={bed.status.toUpperCase()}
                  />
                </div>

                {isOccupied && bed.patient ? (
                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-800 font-bold">
                      <span>{bed.patient.name}</span>
                      <span className="text-[10px] text-cyan-700 font-mono">{bed.patient.gender}, {bed.patient.age}y</span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">Diagnosis: {bed.patient.diagnosis}</p>
                    <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-200">
                      <span>Acuity: <strong className="text-amber-700">{bed.patient.acuityScore} / 5.0</strong></span>
                      {bed.patient.oxygenSupportReqLmin > 0 && (
                        <span className="text-cyan-700 font-mono">O2: {bed.patient.oxygenSupportReqLmin} L/m</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 py-4 text-center text-xs text-slate-400 italic">
                    {isAvailable ? 'Bed Ready for Intake' : isCleaning ? 'Disinfection in progress' : 'Out of Service'}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center gap-2">
                {isAvailable && (
                  <ActionButton
                    size="sm"
                    variant="primary"
                    className="w-full"
                    icon={UserPlus}
                    onClick={() => handleOpenIntakeModal(bed)}
                  >
                    Admit Patient
                  </ActionButton>
                )}

                {isOccupied && (
                  <ActionButton
                    size="sm"
                    variant="secondary"
                    className="w-full text-xs"
                    icon={UserCheck}
                    onClick={() => handleQuickDischarge(bed.id)}
                  >
                    Discharge Bed
                  </ActionButton>
                )}

                {(isCleaning || isMaintenance) && (
                  <ActionButton
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    icon={CheckCircle}
                    onClick={() => handleMarkAvailable(bed.id)}
                  >
                    Mark Available
                  </ActionButton>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Patient Admission Modal */}
      <Modal
        isOpen={isIntakeModalOpen}
        onClose={() => setIsIntakeModalOpen(false)}
        title={`Admit Patient - ${targetBedForIntake?.bedNumber || ''}`}
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setIsIntakeModalOpen(false)}>Cancel</ActionButton>
            <ActionButton variant="primary" onClick={handleSaveIntake}>Admit Patient</ActionButton>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Full patient name</label>
            <input
              type="text"
              placeholder="e.g. Jonathan Mercer"
              value={patientForm.name}
              onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
              className="w-full input-glass"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Age</label>
              <input
                type="number"
                value={patientForm.age}
                onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
                className="w-full input-glass"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Gender</label>
              <select
                value={patientForm.gender}
                onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                className="w-full input-glass"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Primary diagnosis</label>
            <input
              type="text"
              value={patientForm.diagnosis}
              onChange={(e) => setPatientForm({ ...patientForm, diagnosis: e.target.value })}
              className="w-full input-glass"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Acuity score (1.0 - 5.0)</label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
                value={patientForm.acuityScore}
                onChange={(e) => setPatientForm({ ...patientForm, acuityScore: e.target.value })}
                className="w-full input-glass"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Oxygen support (L/min)</label>
              <input
                type="number"
                value={patientForm.oxygenReq}
                onChange={(e) => setPatientForm({ ...patientForm, oxygenReq: e.target.value })}
                className="w-full input-glass"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
