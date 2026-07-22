import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useMemo } from 'react';

const SmartHomePreview = ({ devices = [], mousePos, darkMode, reducedMotion }) => {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  useMemo(() => {
    mx.set(mousePos?.x ?? 0);
    my.set(mousePos?.y ?? 0);
  }, [mousePos, mx, my]);

  const tx = useTransform(mx, [0, 1], [-6, 6]);
  const ty = useTransform(my, [0, 1], [-4, 4]);

  const isGreen = (status) => {
    const s = (status || '').toLowerCase();
    return s === 'on' || s === 'locked' || s === 'protected';
  };

  return (
    <motion.div
      className="w-full h-[180px] lg:h-[200px] rounded-xl overflow-hidden flex-shrink-0 relative"
      whileHover={!reducedMotion ? { scale: 1.002, y: -1 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      style={{ transform: `translate(${tx}px, ${ty}px)` }}
    >
      {/* Glass background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-white/35 to-emerald-50/25 backdrop-blur-[2px] border border-emerald-200/15 rounded-xl" />

      {/* Top gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-100/15 via-transparent to-transparent" />

      {/* Bottom gradient */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-emerald-50/20 to-transparent" />

      {/* Glass reflection strip */}
      {!reducedMotion && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* House SVG */}
      <svg
        viewBox="0 0 220 140"
        className="absolute w-[220px] h-[140px] bottom-0 left-1/2 -translate-x-1/2"
      >
        {/* Body */}
        <motion.path
          d="M38,85 L110,38 L182,85 L182,132 L38,132 Z"
          fill="rgba(255,255,255,0.45)"
          stroke="rgba(34,197,94,0.3)"
          strokeWidth="1.5"
          animate={{
            strokeOpacity: [0.3, 0.6, 0.3],
            fillOpacity: [0.45, 0.55, 0.45],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Roof */}
        <motion.path
          d="M28,85 L110,30 L192,85"
          fill="rgba(255,255,255,0.25)"
          stroke="rgba(34,197,94,0.25)"
          strokeWidth="1"
        />

        {/* Door */}
        <rect x="96" y="104" width="28" height="28" rx="2" fill="rgba(34,197,94,0.03)" />

        {/* Door knob */}
        <circle cx="114" cy="118" r="1.8" fill="rgba(34,197,94,0.12)" />

        {/* Left window */}
        <rect x="48" y="92" width="22" height="17" rx="1.5" fill="rgba(34,197,94,0.06)" stroke="rgba(34,197,94,0.2)" strokeWidth="0.8" />

        {/* Right window */}
        <rect x="150" y="92" width="22" height="17" rx="1.5" fill="rgba(34,197,94,0.06)" stroke="rgba(34,197,94,0.2)" strokeWidth="0.8" />

        {/* Upper window */}
        <rect x="92" y="58" width="36" height="22" rx="1.5" fill="rgba(34,197,94,0.06)" stroke="rgba(34,197,94,0.2)" strokeWidth="0.8" />

        {/* Solar panels */}
        <rect x="86" y="34" width="48" height="12" rx="1" fill="rgba(34,197,94,0.15)" stroke="rgba(34,197,94,0.3)" strokeWidth="0.6" />

        {/* Panel lines */}
        <line x1="96" y1="34" x2="96" y2="46" stroke="rgba(34,197,94,0.3)" strokeWidth="0.5" />
        <line x1="110" y1="34" x2="110" y2="46" stroke="rgba(34,197,94,0.3)" strokeWidth="0.5" />
        <line x1="124" y1="34" x2="124" y2="46" stroke="rgba(34,197,94,0.3)" strokeWidth="0.5" />

        {/* Ground */}
        <motion.path
          d="M0,132 Q30,128 55,132 T110,130 T165,132 T220,130"
          fill="none"
          stroke="rgba(34,197,94,0.2)"
          strokeWidth="1"
          animate={{
            d: [
              'M0,132 Q30,128 55,132 T110,130 T165,132 T220,130',
              'M0,131 Q30,134 55,130 T110,132 T165,130 T220,132',
              'M0,132 Q30,128 55,132 T110,130 T165,132 T220,130',
            ],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Left bush */}
        <ellipse cx="34" cy="118" rx="7" ry="9" fill="rgba(34,197,94,0.12)" />

        {/* Right bush */}
        <ellipse cx="186" cy="117" rx="7" ry="9" fill="rgba(34,197,94,0.12)" />

        {/* LED dots */}
        <motion.circle
          cx="110"
          cy="118"
          r="1.5"
          fill="rgba(34,197,94,0.8)"
          animate={{ fillOpacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.circle
          cx="59"
          cy="100"
          r="1"
          fill="rgba(34,197,94,0.7)"
          animate={{ fillOpacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />
        <motion.circle
          cx="161"
          cy="100"
          r="1"
          fill="rgba(34,197,94,0.7)"
          animate={{ fillOpacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />

        {/* Dashed connection lines to device positions */}
        {devices.map((device, i) => (
          <motion.line
            key={`line-${i}`}
            x1="110"
            y1="85"
            x2={device.x * 220}
            y2={device.y * 140}
            stroke="rgba(34,197,94,0.15)"
            strokeWidth="0.8"
            strokeDasharray="3 3"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: device.delay + 0.3 }}
          />
        ))}
      </svg>

      {/* Device chips */}
      {devices.map((device, i) => (
        <motion.div
          key={`chip-${i}`}
          className="absolute pointer-events-none"
          style={{ left: `${device.x * 100}%`, top: `${device.y * 100}%` }}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: device.delay }}
        >
          <div
            className="px-1.5 py-0.5 rounded-md text-[7px] font-bold tracking-tight flex items-center gap-1"
            style={{
              background: 'rgba(255,255,255,0.65)',
              backdropFilter: 'blur(6px)',
              border: '0.5px solid rgba(34,197,94,0.05)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.015)',
              color: '#4B5563',
            }}
          >
            <span
              className={`w-0.5 h-0.5 rounded-full ${
                isGreen(device.status) ? 'bg-green-500' : 'bg-amber-500'
              }`}
            />
            <span>{device.label}</span>
            <span className="text-[#22C55E] font-bold">{device.status}</span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default SmartHomePreview;
