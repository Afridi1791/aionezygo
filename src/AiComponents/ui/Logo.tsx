import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`h-full w-auto text-accent ${className}`}
        aria-label="OneZygo Logo"
    >
        <path
            d="M10 28C10 22.4772 14.4772 18 20 18H28"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M4 28V14C4 8.47715 8.47715 4 14 4H22"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export default Logo;