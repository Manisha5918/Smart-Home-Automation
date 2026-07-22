import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ArrowRight, LayoutDashboard, Cpu, Bot, Mic, CloudSun, Zap, ShieldCheck, Smartphone, Sparkles
} from 'lucide-react';
import useReducedMotion from '../../utils/useReducedMotion';

const features = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    label: 'Smart Dashboard',
    desc: 'A unified control center displaying real-time status of every connected device in your home.',
    color: '#16A34A',
  },
  {
    id: 'devices',
    icon: Cpu,
    label: 'Device Management',
    desc: 'Connect, monitor, and control all your smart devices from a single, elegant interface.',
    color: '#2563EB',
  },
  {
    id: 'ai',
    icon: Bot,
    label: 'AI Assistant',
    desc: 'An intelligent assistant that learns your preferences, predicts needs, and automates routines.',
    color: '#7C3AED',
  },
  {
    id: 'voice',
    icon: Mic,
    label: 'Voice Control',
    desc: 'Control your entire home with natural voice commands. Adjust lights, temperature, and more.',
    color: '#DC2626',
  },
  {
    id: 'energy',
    icon: Zap,
    label: 'Energy Analytics',
    desc: 'Track, analyze, and optimize your energy consumption with detailed insights and reports.',
    color: '#F59E0B',
  },
  {
    id: 'weather',
    icon: CloudSun,
    label: 'Weather Automation',
    desc: 'Intelligent routines that respond to weather — blinds adjust, heating responds, alerts prepare you.',
    color: '#10B981',
  },
  {
    id: 'security',
    icon: ShieldCheck,
    label: 'Security Monitoring',
    desc: 'Enterprise-grade encryption with zero-knowledge architecture. Your data stays yours.',
    color: '#EC4899',
  },
  {
    id: 'mobile',
    icon: Smartphone,
    label: 'Mobile App',
    desc: 'Access your smart home from anywhere with our mobile app for iOS and Android.',
    color: '#0891B2',
  },
];

const OnboardingWalkthrough = ({ onClose, setIsRegistering }) => {
  const reducedMotion = useReducedMotion();
  const [selected, setSelected] = useState(0);

  const goNext = useCallback(() => {
    if (selected < features.length - 1) setSelected(s => s + 1);
    else { onClose(); setIsRegistering(true); }
  }, [selected, onClose, setIsRegistering]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowUp') setSelected(s => Math.max(0, s - 1));
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter') goNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, onClose]);

  const isLast = selected === features.length - 1;
  const feat = features[selected];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-md" />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[640px] bg-white rounded-[32px] overflow-hidden shadow-2xl"
        style={{ boxShadow: '0 50px 120px rgba(15,23,42,0.15), 0 10px 40px rgba(15,23,42,0.06)' }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#16A34A] to-[#15803D] flex items-center justify-center shadow-sm">
              <Sparkles size={13} className="text-white" />
            </div>
            <span className="text-[13px] font-[700] text-[#111827] tracking-[0.3px]">Interactive Tour</span>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#F8FCFA] flex items-center justify-center cursor-pointer text-[#64748B] hover:text-[#111827] hover:bg-[#E7F5EC] transition-all">
            <X size={13} />
          </button>
        </div>

        <div className="flex" style={{ minHeight: '380px' }}>
          {/* Left: Feature list */}
          <div className="w-[200px] shrink-0 border-r border-[#E7F5EC] py-2 px-2">
            {features.map((f, i) => {
              const isActive = i === selected;
              const Icon = f.icon;
              return (
                <button key={f.id} onClick={() => setSelected(i)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[12px] text-left transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'bg-[#F0FDF4]'
                      : 'hover:bg-[#F8FCFA]'
                  }`}>
                  <div className={`w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isActive ? 'shadow-sm' : ''
                  }`}
                    style={{
                      background: isActive ? `linear-gradient(135deg, ${f.color}, ${f.color}dd)` : '#F1F5F9',
                    }}>
                    <Icon size={13} className={isActive ? 'text-white' : 'text-[#94A3B8]'} />
                  </div>
                  <span className={`text-[12px] font-[600] transition-colors duration-300 ${
                    isActive ? 'text-[#111827]' : 'text-[#64748B]'
                  }`}>{f.label}</span>
                  {isActive && (
                    <motion.div layoutId="activeDot" className="w-1 h-1 rounded-full bg-[#16A34A] ml-auto shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right: Detail panel */}
          <div className="flex-1 flex flex-col justify-between px-6 py-4">
            <AnimatePresence mode="wait">
              <motion.div key={selected}
                initial={reducedMotion ? {} : { opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reducedMotion ? {} : { opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${feat.color}, ${feat.color}dd)` }}>
                    <feat.icon size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-[800] text-[#111827]">{feat.label}</h3>
                    <div className="w-4 h-[2px] rounded-full mt-0.5"
                      style={{ background: `linear-gradient(90deg, ${feat.color}, ${feat.color}44)` }} />
                  </div>
                </div>
                <p className="text-[13px] font-[500] text-[#475569] leading-relaxed">
                  {feat.desc}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-auto pt-4">
              <div className="flex items-center gap-1.5">
                {features.map((_, i) => (
                  <button key={i} onClick={() => setSelected(i)}
                    className={`rounded-full transition-all duration-300 cursor-pointer ${
                      i === selected
                        ? 'w-5 h-1.5 bg-[#16A34A]'
                        : i < selected
                          ? 'w-1.5 h-1.5 bg-[#16A34A]/40'
                          : 'w-1.5 h-1.5 bg-[#D1D5DB]'
                    }`} />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {!isLast && (
                  <button onClick={() => setSelected(features.length - 1)}
                    className="h-[38px] px-3 rounded-[10px] text-[11px] font-[600] text-[#94A3B8] hover:text-[#475569] cursor-pointer transition-colors">
                    Skip
                  </button>
                )}
                <button onClick={goNext}
                  className="h-[38px] px-4 rounded-[10px] text-[12px] font-[700] text-white flex items-center gap-1.5 cursor-pointer hover:-translate-y-0.5 transition-all"
                  style={{
                    background: 'linear-gradient(90deg, #16A34A, #22c55e)',
                    boxShadow: '0 4px 16px rgba(22,163,74,0.25)',
                  }}>
                  <span>{isLast ? 'Get Started' : 'Next'}</span>
                  <ArrowRight size={12} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingWalkthrough;
