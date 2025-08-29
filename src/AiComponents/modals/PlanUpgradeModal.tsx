import React from 'react';
import { Link } from 'react-router-dom';

// Professional SVG Icons
const CloseIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CrownIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const LockIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const ArrowRightIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

interface PlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PlanUpgradeModal: React.FC<PlanUpgradeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-bg-primary border border-border-primary rounded-2xl p-8 w-full max-w-lg shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-accent rounded-xl flex items-center justify-center">
              <LockIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-primary">
                Premium Feature
              </h2>
              <p className="text-text-secondary text-sm">
                Personal API Key requires upgrade
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-glass rounded-lg transition-all duration-200"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Feature Description */}
          <div className="bg-bg-glass-light border border-border-secondary rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <CrownIcon className="w-5 h-5 text-accent-primary mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Personal API Key Access
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Upgrade to Basic or Pro plan to use your own API key for unlimited AI interactions, 
                  faster responses, and better control over your AI experience.
                </p>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-text-primary">What you'll get:</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-text-secondary">Unlimited AI conversations</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-text-secondary">Faster response times</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-text-secondary">Personal API key control</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-text-secondary">Priority support</span>
              </div>
            </div>
          </div>

          {/* Current Plan Info */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
              <span className="text-amber-400 text-sm font-medium">Current Plan: Free</span>
            </div>
            <p className="text-amber-400/80 text-xs mt-1">
              Free users can use shared API with limited credits
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 space-y-3">
          <Link
            to="/pricing"
            onClick={onClose}
            className="w-full bg-gradient-accent hover:shadow-accent-hover text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <CrownIcon className="w-4 h-4" />
            <span>View Plans & Upgrade</span>
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
          
          <button
            onClick={onClose}
            className="w-full bg-bg-glass-light hover:bg-bg-glass border border-border-secondary text-text-primary py-3 px-6 rounded-xl font-semibold transition-all duration-200"
          >
            Continue with Free Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanUpgradeModal;
