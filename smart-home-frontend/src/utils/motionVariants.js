export const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

export const staggerFast = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
};

export const slideRight = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

export const slideUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export const cardHover = {
  rest: { y: 0, boxShadow: 'var(--shadow-sm)' },
  hover: {
    y: -4,
    boxShadow: 'var(--shadow-xl)',
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};

export const iconHover = {
  rest: { scale: 1 },
  hover: { scale: 1.1, transition: { duration: 0.15 } },
};

export const chipHover = {
  rest: { scale: 1 },
  hover: { scale: 1.02, transition: { duration: 0.15 } },
  tap: { scale: 0.98 },
};

export const springTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 25,
};
