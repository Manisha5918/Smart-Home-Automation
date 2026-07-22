import { motion } from 'framer-motion';

const FeatureCardGrid = ({ features = [], darkMode, reducedMotion }) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      {features.map((feature, idx) => {
        const Icon = feature.icon;
        return (
          <motion.div key={idx}
            className={`backdrop-blur-[10px] border rounded-2xl p-3 transition-all duration-300 ${
              darkMode
                ? 'bg-white/[0.05] border-white/[0.06] hover:border-[#1DBA74]/40 hover:shadow-[0_8px_32px_rgba(34,197,94,0.1)]'
                : 'bg-white/90 border-emerald-500/10 hover:border-emerald-400/30 hover:shadow-[0_8px_32px_rgba(22,163,74,0.08)]'
            }`}
            whileHover={!reducedMotion ? { y: -3, scale: 1.01 } : {}}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <motion.div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                darkMode ? 'bg-[#1DBA74]/15' : 'bg-[#16A34A]/10'
              }`}
                animate={!reducedMotion ? { scale: [1, 1.08, 1] } : {}}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Icon size={15} className={darkMode ? 'text-[#1DBA74]' : 'text-[#16A34A]'} />
              </motion.div>
              <span className="text-sm font-bold leading-none">{feature.label}</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-lg font-extrabold tracking-tight ${
                darkMode ? 'text-[#1DBA74]' : 'text-[#16A34A]'
              }`}>{feature.value}</span>
              <div className="relative w-2.5 h-2.5">
                <motion.span className={`absolute inset-0 rounded-full ${
                  darkMode ? 'bg-[#1DBA74]' : 'bg-[#16A34A]'
                }`} animate={!reducedMotion ? { scale: [1, 2.2], opacity: [0.5, 0] } : {}}
                  transition={{ duration: 1.8, repeat: Infinity }} />
                <span className={`absolute inset-0.5 rounded-full ${
                  darkMode ? 'bg-[#1DBA74]' : 'bg-[#16A34A]'
                }`} />
              </div>
            </div>
            <p className="text-[11px] font-semibold leading-tight text-gray-500">{feature.sub}</p>
          </motion.div>
        );
      })}
    </div>
  );
};

export default FeatureCardGrid;
