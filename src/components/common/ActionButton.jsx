import React from 'react';
import clsx from 'clsx';

export const ActionButton = ({ children, onClick, variant = 'primary', size = 'md', icon: Icon, disabled = false, className = '' }) => {
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base font-semibold'
  };

  const variantStyles = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    outline: 'border border-slate-300 text-cyan-700 bg-white hover:bg-cyan-50 hover:border-cyan-600 rounded-lg transition-all'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
    >
      {Icon && <Icon className={clsx(size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4')} />}
      {children}
    </button>
  );
};
