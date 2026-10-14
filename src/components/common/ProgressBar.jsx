import React from 'react';
import clsx from 'clsx';

export const ProgressBar = ({ value = 0, max = 100, label, showValue = true, size = 'md', className = '' }) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  let colorClass = 'bg-emerald-600';
  if (percentage >= 75) colorClass = 'bg-amber-500';
  if (percentage >= 90) colorClass = 'bg-rose-600';

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  };

  return (
    <div className={clsx('w-full space-y-1.5', className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center text-xs text-slate-600">
          {label && <span className="font-medium">{label}</span>}
          {showValue && <span className="font-mono font-semibold">{percentage}%</span>}
        </div>
      )}
      <div className={clsx('w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200', heightClasses[size])}>
        <div
          className={clsx('h-full rounded-full transition-all duration-500 ease-out', colorClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
