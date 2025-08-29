import React from 'react';

const ThinkingIndicator: React.FC = () => {
  return (
    <div className="flex items-center space-x-1.5">
      <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
      <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
      <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
    </div>
  );
};

export default ThinkingIndicator;
