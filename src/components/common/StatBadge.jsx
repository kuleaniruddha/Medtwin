import React from 'react';
import clsx from 'clsx';

export const StatBadge = ({ type = 'info', label, pulse = false, icon: Icon, className = '' }) => {
  const badgeStyles = {
    critical: 'bg-rose-50 text-rose-700 border-rose-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    info: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  const dotColors = {
    critical: 'bg-rose-500',
    warning: 'bg-amber-500',
    success: 'bg-emerald-500',
    info: 'bg-cyan-500',
    neutral: 'bg-slate-400'
  };

  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all',
      badgeStyles[type] || badgeStyles.info,
      className
    )}>
      {pulse ? (
        <span className="relative flex h-2 w-2">
          <span className={clsx('badge-pulse absolute inline-flex h-full w-full rounded-full opacity-75', dotColors[type])}></span>
          <span className={clsx('relative inline-flex rounded-full h-2 w-2', dotColors[type])}></span>
        </span>
      ) : Icon ? (
        <Icon className="w-3.5 h-3.5" />
      ) : null}
      {label}
    </span>
  );
};
