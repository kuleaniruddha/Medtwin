import React, { useState } from 'react';
import { Bell, ShieldAlert, CheckCircle, PlusCircle, Filter, Check, Trash2, Zap, AlertTriangle, Clock } from 'lucide-react';
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

  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
  const urgentCount = alerts.filter(a => a.severity === 'URGENT').length;
  const warningCount = alerts.filter(a => a.severity === 'WARNING').length;
  const ackedCount = alerts.filter(a => a.acknowledged).length;

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
    <div className="space-y-8 lg:space-y-10 w-full pb-16">
      {/* ── Top Header Banner (Spacious & Clean Light Theme) ── */}
      <div className="p-7 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
              <Bell className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
                  Priority Alerts & Incident Dispatch Console
                </h1>
                <span className="px-3 py-1 text-xs font-bold bg-rose-100 text-rose-800 rounded-full border border-rose-200">
                  {alerts.length} Active Records
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                Hospital incident lifecycle management, telemetry breach alerts, and rapid clinical escalation protocols.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-rose-700 hover:bg-rose-800 text-white text-sm font-bold rounded-xl shadow-md shadow-rose-700/20 transition-all cursor-pointer w-full sm:w-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Raise Manual Alert</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Active Alerts</div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono mt-1">{alerts.length}</div>
            <div className="text-xs text-slate-500 font-medium mt-1">Facility-wide logs</div>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-rose-50/70 border border-rose-200 shadow-xs">
            <div className="text-xs text-rose-800 font-bold uppercase tracking-wider">Critical Severity</div>
            <div className="text-3xl sm:text-4xl font-black text-rose-700 font-mono mt-1">{criticalCount}</div>
            <div className="text-xs text-rose-700 font-medium mt-1">Requires immediate response</div>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-xs">
            <div className="text-xs text-amber-800 font-bold uppercase tracking-wider">Urgent Warnings</div>
            <div className="text-3xl sm:text-4xl font-black text-amber-700 font-mono mt-1">{urgentCount}</div>
            <div className="text-xs text-amber-700 font-medium mt-1">Approaching safety thresholds</div>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-xs">
            <div className="text-xs text-emerald-800 font-bold uppercase tracking-wider">Acknowledged / In-Hand</div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-700 font-mono mt-1">{ackedCount}</div>
            <div className="text-xs text-emerald-700 font-medium mt-1">Staff assigned & investigating</div>
          </div>
        </div>
      </div>

      {/* ── Filter Tabs Bar ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Filter Severity:</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'ALL', label: 'All Alerts', count: alerts.length },
            { id: 'CRITICAL', label: 'Critical', count: criticalCount },
            { id: 'URGENT', label: 'Urgent', count: urgentCount },
            { id: 'WARNING', label: 'Warning', count: warningCount }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSeverityFilter(item.id)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
                severityFilter === item.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{item.label}</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                severityFilter === item.id ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {item.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Spacious Alert Cards List ── */}
      <div className="space-y-4">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isUrgent = alert.severity === 'URGENT';

            return (
              <div
                key={alert.id}
                className={`p-6 sm:p-7 rounded-2xl border transition-all duration-200 bg-white ${
                  isCritical
                    ? 'border-rose-300 shadow-sm shadow-rose-100/50 hover:border-rose-400'
                    : isUrgent
                    ? 'border-amber-300 shadow-sm shadow-amber-100/50 hover:border-amber-400'
                    : 'border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <StatBadge
                        type={isCritical ? 'critical' : isUrgent ? 'warning' : 'info'}
                        label={alert.severity}
                        pulse={isCritical && !alert.acknowledged}
                      />
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight font-heading">
                        {alert.title}
                      </h3>
                      <span className="text-xs text-slate-500 font-mono flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed max-w-4xl">
                      {alert.description}
                    </p>

                    {alert.recommendedAction && (
                      <div className="p-3.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-900 text-sm font-medium flex items-center gap-2">
                        <span className="text-base">💡</span>
                        <span><strong>Recommended Action Protocol:</strong> {alert.recommendedAction}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions & Ack Status */}
                  <div className="flex items-center gap-3 self-end lg:self-center shrink-0">
                    {!alert.acknowledged ? (
                      <button
                        onClick={() => acknowledgeAlert(alert.id, 'Chief Medical Officer')}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Acknowledge</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-bold border border-emerald-200">
                        <CheckCircle className="w-4 h-4 text-emerald-700" />
                        <span>Acked by {alert.acknowledgedBy || 'CMO'}</span>
                      </div>
                    )}

                    <button
                      onClick={() => resolveAlert(alert.id)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Resolve</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center rounded-3xl bg-white border border-slate-200">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900">No Active Alerts in this Category</h3>
            <p className="text-sm text-slate-500 mt-1">All hospital telemetry streams and wards are operating within standard parameters.</p>
          </div>
        )}
      </div>

      {/* ── Create Custom Alert Modal ── */}
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
        <div className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Alert Title:</label>
            <input
              type="text"
              placeholder="e.g. Oxygen Line Pressure Drop in Surgical-B"
              value={customAlertForm.title}
              onChange={(e) => setCustomAlertForm({ ...customAlertForm, title: e.target.value })}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Severity Level:</label>
              <select
                value={customAlertForm.severity}
                onChange={(e) => setCustomAlertForm({ ...customAlertForm, severity: e.target.value })}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-cyan-600"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="URGENT">URGENT</option>
                <option value="WARNING">WARNING</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Category:</label>
              <select
                value={customAlertForm.category}
                onChange={(e) => setCustomAlertForm({ ...customAlertForm, category: e.target.value })}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-cyan-600"
              >
                <option value="BED_CAPACITY">BED CAPACITY</option>
                <option value="SUPPLY_CHAIN">SUPPLY CHAIN</option>
                <option value="MEDICATION">MEDICATION</option>
                <option value="STAFFING">STAFFING</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Incident Description:</label>
            <textarea
              rows={3}
              value={customAlertForm.description}
              onChange={(e) => setCustomAlertForm({ ...customAlertForm, description: e.target.value })}
              placeholder="Describe the clinical or operational situation..."
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-600"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Recommended Action Protocol:</label>
            <input
              type="text"
              placeholder="e.g. Call emergency engineering dispatch"
              value={customAlertForm.recommendedAction}
              onChange={(e) => setCustomAlertForm({ ...customAlertForm, recommendedAction: e.target.value })}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-600"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
