import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({ icon: Icon = Inbox, title = 'No data available', description = '', action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-4">
        <Icon className="text-[var(--text-tertiary)]" size={28} />
      </div>
      <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-xs text-center">{description}</p>
      )}
      {action && action}
    </div>
  );
};

export default EmptyState;
