import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';

export const AlertBanner = () => {
  const { alerts, setActiveTab, acknowledgeAlert } = useHospital();

  const criticalAlert = alerts?.find(a => a.severity === 'CRITICAL' && !a.acknowledged);

  if (!criticalAlert) return null;

  return (
    <div className="bg-rose-50 text-rose-950 px-6 py-3 border-b border-rose-200">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-white text-rose-700 border border-rose-200">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-rose-800 mr-2">Critical:</span>
            <span className="font-medium text-rose-950">{criticalAlert.title}</span>
            <span className="hidden lg:inline text-rose-700 ml-2">- {criticalAlert.description}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => acknowledgeAlert(criticalAlert.id, 'Chief Medical Officer')}
            className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg text-xs transition-colors"
          >
            Acknowledge
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className="flex items-center gap-1 text-rose-800 hover:text-rose-950 font-semibold text-xs transition-colors"
          >
            View Alerts <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
