import React from 'react';
import { motion } from 'framer-motion';

const Button = ({ children, onClick, type = 'button', variant = 'primary', disabled = false, icon, className = '', ...props }) => {
  const getBtnClass = () => {
    switch (variant) {
      case 'secondary': return 'btn btn-secondary';
      case 'success': return 'btn btn-success';
      case 'danger': return 'btn btn-danger';
      case 'icon': return 'btn btn-secondary btn-icon';
      default: return 'btn btn-primary';
    }
  };

  return (
    <motion.button
      type={type}
      className={`${getBtnClass()} ${className}`}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.97 }}
      whileHover={disabled ? {} : { scale: 1.02, y: -1 }}
      transition={{ 
        duration: 0.2, 
        ease: [0.16, 1, 0.3, 1],
        type: 'spring',
        stiffness: 400,
        damping: 20
      }}
      {...props}
    >
      {icon && <span style={{ display: 'inline-flex', fontSize: '1rem' }}>{icon}</span>}
      {children}
    </motion.button>
  );
};

export default Button;
