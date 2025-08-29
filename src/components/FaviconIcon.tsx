import React from 'react';

interface FaviconIconProps {
  className?: string;
  size?: number;
}

const FaviconIcon: React.FC<FaviconIconProps> = ({ className = '', size = 16 }) => {
  return (
    <img 
      src="/favicon.ico" 
      alt="Favicon"
      className={className}
      style={{ 
        width: size, 
        height: size,
        minWidth: size,
        minHeight: size,
        objectFit: 'contain',
        display: 'block',
        transform: 'scale(1.5)'
      }}
    />
  );
};

export default FaviconIcon;
