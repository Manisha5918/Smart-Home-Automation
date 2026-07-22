import { motion } from 'framer-motion';
import { Cpu, Wifi, Zap, Shield } from 'lucide-react';

export default function AICore({ mousePos, darkMode, reducedMotion }) {
  const px = mousePos?.x ?? 0;

  return (
    <motion.div
      className="relative mx-auto w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] lg:w-[480px] lg:h-[480px]"
      animate={{ y: reducedMotion ? 0 : [0, -5, 0], x: px * 0.5 }}
      transition={{ y: { duration: 6, repeat: Infinity, ease: 'easeInOut' } }}
    >
      {/* Outer bloom glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[360px] h-[360px] sm:w-[450px] sm:h-[450px] lg:w-[540px] lg:h-[540px] rounded-full" style={{
          background: 'radial-gradient(circle at center, rgba(16,185,129,0.12) 0%, transparent 65%)',
          filter: 'blur(50px)',
          animation: reducedMotion ? 'none' : 'bloomPulse 5s ease-in-out infinite',
        }} />
      </div>

      {/* Glass sphere */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] lg:w-[480px] lg:h-[480px] rounded-full backdrop-blur-[4px]" style={{
          background: darkMode
            ? 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.06) 0%, rgba(16,185,129,0.02) 40%, transparent 100%)'
            : 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.15) 40%, transparent 100%)',
          border: darkMode ? '1px solid rgba(16,185,129,0.12)' : '1px solid rgba(16,185,129,0.08)',
          boxShadow: darkMode
            ? '0 0 80px rgba(16,185,129,0.06), inset 0 0 50px rgba(16,185,129,0.02)'
            : '0 8px 50px rgba(0,0,0,0.05), inset 0 0 40px rgba(255,255,255,0.25)',
        }} />
      </div>

      {/* Orbital rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute w-[260px] h-[260px] sm:w-[330px] sm:h-[330px] lg:w-[400px] lg:h-[400px] rounded-full" style={{
          border: '2px solid rgba(52,211,153,0.06)',
          animation: reducedMotion ? 'none' : 'ringSpin 20s linear infinite',
        }} />
        <div className="absolute w-[200px] h-[200px] sm:w-[260px] sm:h-[260px] lg:w-[320px] lg:h-[320px] rounded-full" style={{
          border: '2px solid rgba(52,211,153,0.04)',
          animation: reducedMotion ? 'none' : 'ringSpinReverse 14s linear infinite',
        }} />
        <div className="absolute w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] lg:w-[230px] lg:h-[230px] rounded-full" style={{
          border: '2px solid rgba(52,211,153,0.05)',
          animation: reducedMotion ? 'none' : 'ringSpin 10s linear infinite',
        }} />
      </div>

      {/* Signal wave rings */}
      {[0, 1, 2].map(i => (
        <div key={i} className="absolute inset-0 flex items-center justify-center">
          <div className={`w-[${120 + i * 60}px] h-[${120 + i * 60}px] rounded-full`} style={{
            width: `${130 + i * 55}px`,
            height: `${130 + i * 55}px`,
            border: '1px solid rgba(16,185,129,0.12)',
            animation: reducedMotion ? 'none' : `signalPulse ${2 + i * 0.5}s ease-out infinite ${i * 0.6}s`,
          }} />
        </div>
      ))}

      {/* Neural network connections */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 400 400" className="w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] lg:w-[430px] lg:h-[430px]" fill="none" stroke="rgba(16,185,129,0.3)" strokeWidth="1">
          {/* Connection lines */}
          {[
            ['M120,100 L200,200', 0],
            ['M200,100 L200,200', 0.3],
            ['M280,100 L200,200', 0.6],
            ['M100,200 L200,200', 0.9],
            ['M300,200 L200,200', 1.2],
            ['M120,300 L200,200', 1.5],
            ['M200,300 L200,200', 1.8],
            ['M280,300 L200,200', 2.1],
          ].map(([d, delay], i) => (
            <motion.path key={i} d={d} strokeDasharray="4 4"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', delay }} />
          ))}
          {/* Data packets */}
          {[
            { path: 'M120,100 L200,200', delay: 0 },
            { path: 'M280,100 L200,200', delay: 1.2 },
            { path: 'M100,200 L200,200', delay: 0.6 },
            { path: 'M300,200 L200,200', delay: 1.8 },
          ].map((item, i) => (
            <motion.circle key={`p${i}`} r="2.5" fill="rgba(16,185,129,0.7)"
              initial={{ offsetDistance: '0%' }} animate={{ offsetDistance: '100%' }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', delay: item.delay }}
              style={{ offsetPath: `path('${item.path}')` }} />
          ))}
          {/* Neural nodes */}
          {[
            [120, 100], [200, 100], [280, 100],
            [100, 200], [300, 200],
            [120, 300], [200, 300], [280, 300],
          ].map(([cx, cy], i) => (
            <circle key={`n${i}`} cx={cx} cy={cy} r="4" fill="rgba(16,185,129,0.4)"
              style={{ animation: reducedMotion ? 'none' : `nodePulse 2.5s ease-in-out infinite ${i * 0.3}s` }} />
          ))}
        </svg>
      </div>

      {/* Smart home device icons floating around */}
      {[
        { Icon: Zap, angle: 0, delay: 0, label: 'Energy' },
        { Icon: Shield, angle: 72, delay: 0.4, label: 'Security' },
        { Icon: Wifi, angle: 144, delay: 0.8, label: 'Network' },
        { Icon: Cpu, angle: 216, delay: 1.2, label: 'AI Core' },
        { Icon: Zap, angle: 288, delay: 1.6, label: 'Automation' },
      ].map(({ Icon: DevIcon, angle, delay, label }, i) => {
        const rad = (angle * Math.PI) / 180;
        const orbitR = 130;
        return (
          <motion.div key={i} className="absolute" style={{
            left: `calc(50% + ${Math.cos(rad) * orbitR}px - 14px)`,
            top: `calc(50% + ${Math.sin(rad) * orbitR}px - 14px)`,
          }}
            animate={reducedMotion ? {} : {
              y: [0, -8, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay }}
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center backdrop-blur-[4px]" style={{
              background: darkMode ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.15)',
              boxShadow: '0 0 15px rgba(16,185,129,0.1)',
            }}>
              <DevIcon size={13} className="text-emerald-500" />
            </div>
          </motion.div>
        );
      })}

      {/* Center core */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div className="w-[52px] h-[52px] sm:w-[64px] sm:h-[64px] lg:w-[78px] lg:h-[78px] rounded-full flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle at 40% 40%, rgba(16,185,129,0.35) 0%, rgba(16,185,129,0.12) 60%, rgba(16,185,129,0.05) 100%)',
            boxShadow: '0 0 40px rgba(16,185,129,0.15), 0 0 80px rgba(16,185,129,0.05)',
            animation: reducedMotion ? 'none' : 'coreBreathe 3s ease-in-out infinite',
          }}
          animate={reducedMotion ? {} : { scale: [1, 1.06, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Cpu size={26} className="text-emerald-400/60" />
        </motion.div>
      </div>

      {/* Orbiting glow particles */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const r = 100 + i * 4;
        return (
          <div key={`orbit-${i}`} className="absolute w-[3px] h-[3px] rounded-full" style={{
            left: `calc(50% + ${Math.cos(rad) * r}px)`,
            top: `calc(50% + ${Math.sin(rad) * r}px)`,
            background: 'rgba(16,185,129,0.5)',
            boxShadow: '0 0 6px rgba(16,185,129,0.3)',
            animation: reducedMotion ? 'none' : `particleFloat ${4 + i * 0.5}s ease-in-out infinite ${i * 0.4}s`,
          }} />
        );
      })}
    </motion.div>
  );
}
