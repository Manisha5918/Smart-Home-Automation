import { useReducedMotion as useFmReducedMotion } from 'framer-motion';

const useReducedMotion = () => {
  try {
    return useFmReducedMotion();
  } catch {
    return false;
  }
};

export default useReducedMotion;
