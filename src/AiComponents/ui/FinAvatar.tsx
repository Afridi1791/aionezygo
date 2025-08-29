

import React from 'react';

const FinAvatar: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center border border-neutral-700/80 shadow-md ${className}`}>
        <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-accent"
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
    </div>
);

export default FinAvatar;