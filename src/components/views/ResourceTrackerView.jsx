import React, { useState } from 'react';
import { Package, Wind, Droplet, Activity, ShoppingCart } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { GlassCard } from '../common/GlassCard';
import { StatBadge } from '../common/StatBadge';
import { ProgressBar } from '../common/ProgressBar';
import { ActionButton } from '../common/ActionButton';
import { Modal } from '../common/Modal';

export const ResourceTrackerView = () => {
  const { inventory, restockInventory } = useHospital();

  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockType, setRestockType] = useState('medications');
  const [selectedMedId, setSelectedMedId] = useState('med-02');
  const [restockAmount, setRestockAmount] = useState(50);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('O-');

  const o2 = inventory?.oxygen || {};
  const meds = inventory?.medications || [];
  const blood = inventory?.bloodBank || [];
  const equip = inventory?.equipment || [];

  const handleExecuteRestock = async () => {
    if (restockType === 'medications') {
      const currentMed = meds.find(m => m.id === selectedMedId);
      if (currentMed) {
        await restockInventory('medications', {
          id: selectedMedId,
          newStock: currentMed.currentStock + Number(restockAmount)
        });
      }
    } else if (restockType === 'bloodBank') {
      const currentBlood = blood.find(b => b.group === selectedBloodGroup);
      if (currentBlood) {
        await restockInventory('bloodBank', {
          group: selectedBloodGroup,
          units: currentBlood.units + Number(restockAmount)
        });
      }
    }
    setIsRestockModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <GlassCard className="border-emerald-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950 flex items-center gap-2">
              <Package className="w-6 h-6 text-emerald-700" /> Supplies
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Track oxygen, medication stock, blood units, and clinical equipment.
            </p>
          </div>
          <ActionButton icon={ShoppingCart} onClick={() => setIsRestockModalOpen(true)}>
            Restock
          </ActionButton>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard title="Oxygen Supply" subtitle="Tank level, pressure, and estimated time remaining" className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Tank Volume</span>
                <Wind className="w-4 h-4 text-cyan-700" />
              </div>
              <p className="text-2xl font-bold text-slate-950 font-mono">{o2.currentLevelLiters || 8850} L</p>
              <ProgressBar value={o2.tankPercentage || 88.5} size="sm" />
              <p className="text-[11px] text-slate-400">{o2.tankPercentage || 88.5}% of 10,000L</p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Line Pressure</span>
                <Activity className="w-4 h-4 text-emerald-700" />
              </div>
              <p className="text-2xl font-bold text-emerald-700 font-mono">{o2.pressurePSI || 885} PSI</p>
              <StatBadge type="success" label="Normal" />
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Usage Rate</span>
                <Wind className="w-4 h-4 text-amber-700" />
              </div>
              <p className="text-2xl font-bold text-amber-700 font-mono">{o2.burnRateLmin || 44.2} L/min</p>
              <p className="text-[11px] text-slate-400">Active High-Flow Cannulas: 22</p>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-cyan-50 border border-cyan-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-cyan-800">
            <span>Estimated time remaining: <strong className="text-slate-950 font-mono font-bold">34.5 hours</strong> at current use</span>
            <StatBadge type="info" label="48 reserve cylinders" />
          </div>
        </GlassCard>

        <GlassCard title="Medical Equipment" subtitle="Availability and current use">
          <div className="space-y-3 mt-2">
            {equip.map((item) => {
              const utilRate = Number(((item.inUse / item.total) * 100).toFixed(0));
              return (
                <div key={item.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-950">{item.type}</span>
                    <span className="font-mono text-cyan-700">{item.inUse} / {item.total}</span>
                  </div>
                  <ProgressBar value={utilRate} size="sm" showValue={false} />
                  <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                    <span>Available: <strong className="text-emerald-700">{item.available} units</strong></span>
                    <span>Util: <strong>{utilRate}%</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard title="ICU and Emergency Medications" subtitle="Current stock and minimum thresholds">
          <div className="space-y-2 mt-2">
            {meds.map((med) => (
              <div
                key={med.id}
                className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-950">{med.name}</h4>
                  <span className="text-[10px] text-slate-400">{med.category}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-950 text-sm">{med.currentStock}</span>
                    <span className="text-[10px] text-slate-400 ml-1">{med.unit}</span>
                    <div className="text-[10px] text-slate-500">Min: {med.minThreshold}</div>
                  </div>
                  <StatBadge
                    type={med.status === 'CRITICAL_LOW' ? 'critical' : med.status === 'LOW_WARNING' ? 'warning' : 'success'}
                    label={med.status}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard title="Blood Bank" subtitle="Units available by blood group">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
            {blood.map((b) => (
              <div
                key={b.group}
                className={`p-3 rounded-xl border text-center space-y-1 transition-all ${
                  b.status === 'CRITICAL'
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : b.status === 'LOW'
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <Droplet className="w-3.5 h-3.5 text-rose-500" />
                  <span className="font-extrabold text-sm font-heading">{b.group}</span>
                </div>
                <p className="text-2xl font-black font-mono">{b.units}</p>
                <p className="text-[10px] opacity-75">Min: {b.minRequired} Units</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <Modal
        isOpen={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        title="Restock Supplies"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setIsRestockModalOpen(false)}>Cancel</ActionButton>
            <ActionButton variant="primary" onClick={handleExecuteRestock}>Confirm Restock</ActionButton>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Category</label>
            <select
              value={restockType}
              onChange={(e) => setRestockType(e.target.value)}
              className="w-full input-glass"
            >
              <option value="medications">Medications</option>
              <option value="bloodBank">Blood bank</option>
            </select>
          </div>

          {restockType === 'medications' ? (
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Medication</label>
              <select
                value={selectedMedId}
                onChange={(e) => setSelectedMedId(e.target.value)}
                className="w-full input-glass"
              >
                {meds.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} (Current: {m.currentStock} {m.unit})</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Blood type</label>
              <select
                value={selectedBloodGroup}
                onChange={(e) => setSelectedBloodGroup(e.target.value)}
                className="w-full input-glass"
              >
                {blood.map((b) => (
                  <option key={b.group} value={b.group}>{b.group} (Current: {b.units} Units)</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Quantity / units</label>
            <input
              type="number"
              value={restockAmount}
              onChange={(e) => setRestockAmount(e.target.value)}
              className="w-full input-glass font-mono"
              min={1}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
