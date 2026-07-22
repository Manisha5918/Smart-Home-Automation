import React from 'react';
import { useSignalR } from '../context/SignalRContext';

const STATUS_CONFIG = {
  connected: { bg: 'bg-green-500', label: 'Connected', dot: 'bg-green-500' },
  connecting: { bg: 'bg-yellow-500', label: 'Connecting...', dot: 'bg-yellow-500' },
  reconnecting: { bg: 'bg-yellow-500', label: 'Reconnecting...', dot: 'bg-yellow-500' },
  disconnected: { bg: 'bg-red-500', label: 'Disconnected', dot: 'bg-red-500' },
};

const ConnectionStatus = ({ className = '' }) => {
  const { connectionState } = useSignalR();
  const cfg = STATUS_CONFIG[connectionState] || STATUS_CONFIG.disconnected;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${connectionState === 'reconnecting' || connectionState === 'connecting' ? 'animate-pulse' : ''}`} />
      <span className="text-[10px] font-medium text-gray-400">{cfg.label}</span>
    </div>
  );
};

export default ConnectionStatus;
