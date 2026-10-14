import React, { useState } from 'react';
import { Bell, ShieldAlert, CheckCircle, PlusCircle, Filter, Check, Trash2, Zap } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { GlassCard } from '../common/GlassCard';
import { StatBadge } from '../common/StatBadge';
import { ActionButton } from '../common/ActionButton';
import { Modal } from '../common/Modal';

export const AlertsView = () => {
  const { alerts, acknowledgeAlert, resolveAlert, createAlert } = useHospital();
  const [severityFilter, setSeverityFilter] = useState('ALL');

  // Custom Alert Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [customAlertForm, setCustomAlertForm] = useState({
    title: '',
    description: '',
    severity: 'WARNING',
    category: 'BED_CAPACITY',
    recommendedAction: ''
  });

  const filteredAlerts = alerts.filter((alert) => {
    if (severityFilter === 'ALL') return true;
    return alert.severity === severityFilter;
  });

  const handleCreateCustomAlert = async () => {
    if (!customAlertForm.title.trim()) return;
    await createAlert({
      title: customAlertForm.title,
      description: customAlertForm.description,
      severity: customAlertForm.severity,
      category: customAlertForm.category,
      recommendedAction: customAlertForm.recommendedAction || 'Monitor facility parameters.'
    });
    setIsCreateModalOpen(false);
    setCustomAlertForm({ title: '', description: '', severity: 'WARNING', category: 'BED_CAPACITY', recommendedAction: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <GlassCard className="border-rose-500/30">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Bell className="w-6 h-6 text-rose-400" /> Priority Alerts & Critical Dispatch Console
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Active incident lifecycle management, severity dispatch, and automated escalation logs
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
              {['ALL', 'CRITICAL', 'URGENT', 'WARNING'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-3 py-1 rounded-lg font-bold text-xs capitalize transition-all ${
                    severityFilter === sev
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            <ActionButton icon={PlusCircle} onClick={() => setIsCreateModalOpen(true)}>
              Raise Manual Alert
            </ActionButton>
          </div>
        </div>
      </GlassCard>

      {/* Alerts Grid / List */}
      <div className="space-y-3">
        {filteredAlerts.map((alert) => {
          const isCritical = alert.severity === 'CRITICAL';
          const isUrgent = alert.severity === 'URGENT';

          return (
            <GlassCard
              key={alert.id}
              variant={isCritical ? 'critical' : isUrgent ? 'warning' : 'default'}
              className="transition-all"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-3">
                    <StatBadge
                      type={isCritical ? 'critical' : isUrgent ? 'warning' : 'info'}
                      label={alert.severity}
                      pulse={isCritical && !alert.acknowledged}
                    />
                    <h3 className="text-base font-bold text-white">{alert.title}</h3>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{alert.description}</p>

                  {alert.recommendedAction && (
                    <p className="text-xs text-cyan-300 font-medium bg-cyan-950/30 border border-cyan-500/20 p-2 rounded-lg inline-block">
                      💡 Recommended Action: {alert.recommendedAction}
                    </p>
                  )}
                </div>

                {/* Workflow Buttons */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  {!alert.acknowledged ? (
                    <ActionButton
                      size="sm"
                      variant="primary"
                      icon={Check}
                      onClick={() => acknowledgeAlert(alert.id, 'Chief Medical Officer')}
                    >
                      Acknowledge
                    </ActionButton>
                  ) : (
                    <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                      <CheckCircle className="w-3.5 h-3.5" /> Acked by {alert.acknowledgedBy || 'CMO'}
                    </span>
                  )}

                  <ActionButton
                    size="sm"
                    variant="secondary"
                    icon={Trash2}
                    onClick={() => resolveAlert(alert.id)}
                  >
                    Resolve Incident
                  </ActionButton>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Create Custom Alert Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Raise Manual Hospital Priority Alert"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</ActionButton>
            <ActionButton variant="danger" onClick={handleCreateCustomAlert}>Dispatch Alert</ActionButton>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Alert Title:</label>
            <input
              type="text"
              placeholder="e.g. Oxygen Line Pressure Drop in Surgical-B"
              value={customAlertForm.title}
              onChange={(e) => setCustomAlertForm({ ...customAlertForm, title: e.target.value })}
              className="w-full input-glass"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Severity Level:</label>
              <select
                value={customAlertForm.severity}
                onChange={(e) => setCustomAlertForm({ ...customAlertForm, severity: e.target.value })}
                className="w-full input-glass bg-slate-900"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="URGENT">URGENT</option>
                <option value="WARNING">WARNING</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Category:</label>
              <select
                value={customAlertForm.category}
                onChange={(e) => setCustomAlertForm({ ...customAlertForm, category: e.target.value })}
                className="w-full input-glass bg-slate-900"
              >
                <option value="BED_CAPACITY">BED CAPACITY</option>
                <option value="SUPPLY_CHAIN">SUPPLY CHAIN</option>
                <option value="MEDICATION">MEDICATION</option>
                <option value="STAFFING">STAFFING</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Incident Description:</label>
            <textarea
              rows={3}
              value={customAlertForm.description}
              onChange={(e) => setCustomAlertForm({ ...customAlertForm, description: e.target.value })}
              className="w-full input-glass"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Recommended Action Protocol:</label>
            <input
              type="text"
              placeholder="e.g. Call emergency engineering dispatch"
              value={customAlertForm.recommendedAction}
              onChange={(e) => setCustomAlertForm({ ...customAlertForm, recommendedAction: e.target.value })}
              className="w-full input-glass"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
