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
    <div className={clsx(variantStyles[variant] || variantStyles.default, 'p-5 relative overflow-hidden', className)}>
      {(title || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
          <div>
            {title && <h3 className="text-lg font-bold tracking-tight text-slate-950 flex items-center gap-2">{title}</h3>}
            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
