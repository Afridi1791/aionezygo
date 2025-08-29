import React from 'react';
// Professional SVG Icons
const PlayIcon = ({ className = "w-3 h-3" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z"/>
  </svg>
);
import FaviconIcon from '../../components/FaviconIcon';



interface RunAppPromptProps {
  onRun: () => void;
  onIgnore: () => void;
}

const RunAppPrompt: React.FC<RunAppPromptProps> = ({ onRun, onIgnore }) => {
  const handleRunClick = () => {
    console.log('🎯 Run button clicked in RunAppPrompt');
    onRun();
  };

  const handleIgnoreClick = () => {
    console.log('❌ Ignore button clicked in RunAppPrompt');
    onIgnore();
  };

  return (
    <div className="mx-4 mb-4 bg-gradient-to-r from-neutral-900/90 to-neutral-800/90 border border-neutral-700/60 rounded-xl p-4 backdrop-blur-md shadow-lg animate-fade-in-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <div>
            <h3 className="text-white font-medium text-sm">Project Ready</h3>
            <p className="text-neutral-300 text-xs">Do you want to run this app?</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleIgnoreClick}
            className="px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-700/50 rounded-lg transition-all duration-200 hover:scale-105 border border-neutral-600/30"
          >
            Ignore
          </button>
          <button
            onClick={handleRunClick}
            className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-all duration-200 hover:scale-105 shadow-lg flex items-center space-x-1.5"
          >
            <PlayIcon className="w-3 h-3" />
            <span>Run</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RunAppPrompt;
