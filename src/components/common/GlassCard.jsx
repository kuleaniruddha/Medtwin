import React from 'react';
import clsx from 'clsx';

export const GlassCard = ({ children, title, subtitle, action, variant = 'default', className = '' }) => {
  const variantStyles = {
    default: 'glass-panel',
    interactive: 'glass-panel glass-panel-interactive',
    critical: 'glass-panel glass-card-critical',
    warning: 'glass-panel glass-card-warning',
    success: 'glass-panel glass-card-success'
  };

  return (
    <div className={clsx(variantStyles[variant] || variantStyles.default, 'p-6 sm:p-7 rounded-2xl relative overflow-hidden transition-all duration-200', className)}>
      {(title || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3.5 border-b border-slate-200/90">
          <div>
            {title && <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-950 flex items-center gap-2 font-heading">{title}</h3>}
            {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed">{subtitle}</p>}
          </div>
          {action && <div className="self-start sm:self-center">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
