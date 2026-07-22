import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ children, style, className = '', ...props }) => {
  return (
    <motion.div
      className={`glass-card ${className}`}
      whileHover={{ 
        y: -5, 
        boxShadow: '0 20px 40px -8px rgba(59, 130, 246, 0.1), 0 8px 16px -4px rgba(15, 23, 42, 0.06)',
        borderColor: 'rgba(59, 130, 246, 0.2)'
      }}
      transition={{ 
        duration: 0.4, 
        ease: [0.16, 1, 0.3, 1],
        type: 'spring',
        stiffness: 300,
        damping: 25
      }}
      style={style}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;
