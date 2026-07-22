import { motion } from 'framer-motion';

const TrustGrid = ({ items = [], darkMode, reducedMotion }) => {
  return (
    <div className="grid grid-cols-2 gap-1">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: 0.35 + idx * 0.03 }}
            whileHover={!reducedMotion ? { y: -1, scale: 1.01 } : {}}
            className={`flex items-center gap-1 border rounded-lg px-1.5 py-0.5 transition-all ${
              darkMode
                ? 'bg-white/[0.01] border-white/[0.03] hover:bg-white/[0.03]'
                : 'bg-[#FAFAFA] border-slate-100 hover:bg-emerald-50/50 hover:border-emerald-200/30'
            }`}
          >
            <Icon size={9} className={darkMode ? 'text-[#1DBA74]' : 'text-[#16A34A]'} />
            <span
              className={`text-[8px] font-bold ${
                darkMode ? 'text-gray-300' : 'text-slate-600'
              }`}
            >
              {item.text}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};

export default TrustGrid;
