
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-6 hover:shadow-royal-purple/30 transition-shadow duration-300 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
