
import React from 'react';

interface PageViewProps {
  title: string;
  children: React.ReactNode;
}

const PageView: React.FC<PageViewProps> = ({ title, children }) => {
  return (
    <div className="w-full h-full overflow-y-auto bg-bg-primary animate-page-in">
      <div className="max-w-6xl mx-auto px-6 py-12 sm:px-8 sm:py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-text-primary mb-4">{title}</h1>
          <div className="w-24 h-1 bg-gradient-accent mx-auto rounded-full"></div>
        </div>
        <div className="flex justify-center">
          <div className="w-full max-w-4xl">
            {children}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes page-in {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-page-in {
            animation: page-in 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default PageView;
