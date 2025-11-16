
import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 my-8">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-gold"></div>
      <p className="text-gold text-lg">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
