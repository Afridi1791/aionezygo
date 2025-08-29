
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from '../AiComponents/ui/Logo';
import LoginModal from '../AiComponents/modals/LoginModal';
import PlanUpgradeModal from '../AiComponents/modals/PlanUpgradeModal';
import { useAuth } from '../context/AuthContext';

// Professional SVG Icons
const KeyIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const UserIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const MenuIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CrownIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const LogoutIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const LoginIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
  </svg>
);

type NavLink = { name: string; path: string };

interface HeaderProps {
    onOpenApiKey?: () => void;
    isApiConfigured?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onOpenApiKey, isApiConfigured = false }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isPlanUpgradeModalOpen, setIsPlanUpgradeModalOpen] = useState(false);
    const location = useLocation();
    const { currentUser: user, userData, loading, logout } = useAuth();

    const navLinks: NavLink[] = [
        { name: 'Home', path: '/' },
        { name: 'Pricing', path: '/pricing' },
    ];

    const handleLinkClick = () => {
      setIsMenuOpen(false);
    };

    const handleLogout = async () => {
      try {
        await logout();
      } catch (error) {
        console.error('Logout error:', error);
      }
    };

    return (
        <>
        <header className="glass border-b border-border-primary sticky top-0 z-50 flex-shrink-0 shadow-glass">
            <div className="relative flex items-center justify-between h-16 px-6 lg:px-8">
                {/* Left: Logo */}
                <div className="flex items-center">
                    <Link to="/" onClick={handleLinkClick} aria-label="Go to workspace" className="flex items-center space-x-3 hover:scale-105 transition-transform duration-300">
                      <Logo className="h-8" />
                      <span className="hidden sm:block text-text-primary font-bold text-xl tracking-tight">OneZygo</span>
                    </Link>
                </div>

                {/* Center: Desktop Menu */}
                <nav className="hidden lg:flex items-center space-x-2 absolute left-1/2 -translate-x-1/2">
                    {navLinks.map((link) => (
                        <Link 
                            key={link.name} 
                            to={link.path} 
                            onClick={handleLinkClick} 
                            className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105 ${
                                location.pathname === link.path 
                                    ? 'text-text-primary bg-gradient-accent shadow-accent animate-glow' 
                                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-glass-light hover:shadow-glass'
                            }`}
                        >
                            {link.name}
                        </Link>
                    ))}
                </nav>

                {/* Right: Actions */}
                <div className="flex items-center space-x-4">
                    {/* API Key Button - Only show for logged in users */}
                    {user && (
                      <button
                      onClick={() => {
                        if (userData?.plan === 'free') {
                          setIsPlanUpgradeModalOpen(true);
                        } else {
                          onOpenApiKey && onOpenApiKey();
                        }
                      }}
                      title={
                        userData?.plan === 'free' 
                          ? 'Upgrade to Basic/Pro for API key access' 
                          : isApiConfigured 
                            ? 'API key configured' 
                            : 'Set your API key'
                      }
                      className={`hidden sm:inline-flex items-center space-x-3 px-4 py-3 rounded-xl border transition-all duration-300 hover:scale-105 hover:shadow-accent ${
                        userData?.plan === 'free'
                          ? 'border-amber-500/50 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                          : isApiConfigured 
                            ? 'border-green-500/50 bg-green-500/10 text-green-400 hover:bg-green-500/20 animate-glow' 
                            : 'border-border-primary bg-bg-glass-light text-text-secondary hover:text-text-primary hover:bg-bg-glass hover:border-accent-primary'
                      }`}
                      aria-label={
                        userData?.plan === 'free' 
                          ? 'Upgrade for API key access' 
                          : 'Set API key'
                      }
                    >
                      <KeyIcon className="w-5 h-5" />
                      <span className="text-sm font-semibold hidden md:block">
                        {userData?.plan === 'free' 
                          ? 'Upgrade for API' 
                          : isApiConfigured 
                            ? 'API Ready' 
                            : 'Set API'
                        }
                      </span>
                      </button>
                    )}

                    {/* Login/User Button */}
                    {!loading ? (
                      user ? (
                        <div className="flex items-center space-x-3">
                          <div className="hidden sm:flex items-center space-x-3 px-4 py-3 rounded-xl border border-border-primary bg-bg-glass-light hover:bg-bg-glass transition-all duration-300">
                            <UserIcon className="w-5 h-5 text-text-secondary" />
                            <span className="text-sm font-semibold text-text-primary">
                              {user.email?.split('@')[0] || 'User'}
                            </span>
                          </div>
                          {userData?.isAdmin && (
                            <a
                              href="/admin"
                              className="inline-flex items-center space-x-2 px-4 py-3 rounded-xl border border-accent-primary bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 transition-all duration-300 hover:scale-105"
                              title="Admin Panel"
                            >
                              <CrownIcon className="w-4 h-4" />
                              <span className="text-sm font-semibold">Admin</span>
                            </a>
                          )}
                          {user?.email === 'afridigt7@gmail.com' && !userData?.isAdmin && (
                            <button
                              onClick={async () => {
                                try {
                                  const { forceUpdateAdmin } = await import('../services/firebase');
                                  const success = await forceUpdateAdmin('afridigt7@gmail.com');
                                  if (success) {
                                    alert('Admin status updated! Please refresh the page.');
                                  } else {
                                    alert('Failed to update admin status');
                                  }
                                } catch (error) {
                                  console.error('Error updating admin status:', error);
                                  alert('Error updating admin status');
                                }
                              }}
                              className="inline-flex items-center space-x-2 px-4 py-3 rounded-xl border border-orange-500 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-all duration-300 hover:scale-105"
                              title="Force Make Admin"
                            >
                              <CrownIcon className="w-4 h-4" />
                              <span className="text-sm font-semibold">Force Admin</span>
                            </button>
                          )}
                          <button
                            onClick={handleLogout}
                            className="inline-flex items-center space-x-2 px-4 py-3 rounded-xl border border-border-primary bg-bg-glass-light text-text-secondary hover:text-text-primary hover:bg-bg-glass transition-all duration-300 hover:scale-105"
                            title="Sign out"
                          >
                            <LogoutIcon className="w-4 h-4" />
                            <span className="text-sm font-semibold">Sign Out</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsLoginModalOpen(true)}
                          className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl border border-accent-primary bg-gradient-accent text-text-primary hover:shadow-accent transition-all duration-300 hover:scale-105 font-semibold"
                          title="Sign in"
                        >
                          <LoginIcon className="w-4 h-4" />
                          <span className="text-sm">Sign In</span>
                        </button>
                      )
                    ) : (
                      // Loading state
                      <div className="flex items-center space-x-3">
                        <div className="hidden sm:flex items-center space-x-3 px-4 py-3 rounded-xl border border-border-primary bg-bg-glass-light">
                          <div className="w-5 h-5 border-2 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm font-semibold text-text-secondary">Loading...</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Hamburger Button */}
                    <div className="lg:hidden flex items-center">
                        <button 
                          onClick={() => setIsMenuOpen(!isMenuOpen)} 
                          className="inline-flex items-center justify-center p-3 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-glass transition-all duration-300 hover:scale-105"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isMenuOpen ? <CloseIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <nav className="lg:hidden glass border-t border-border-primary animate-fade-in-up">
                    <div className="px-6 py-4 space-y-3">
                        {/* API Key entry in mobile menu */}
                        <button
                          onClick={() => {
                            if (userData?.plan === 'free') {
                              setIsPlanUpgradeModalOpen(true);
                              setIsMenuOpen(false);
                            } else {
                              onOpenApiKey && onOpenApiKey();
                              setIsMenuOpen(false);
                            }
                          }}
                          className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                            userData?.plan === 'free'
                              ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                              : isApiConfigured 
                                ? 'bg-green-500/10 border border-green-500/30 text-green-400' 
                                : 'bg-bg-glass-light border border-border-primary text-text-secondary hover:bg-bg-glass hover:text-text-primary'
                          }`}
                        >
                          <KeyIcon className="w-5 h-5" />
                          <div>
                            <div className="font-semibold">
                              {userData?.plan === 'free' 
                                ? 'Upgrade for API Key' 
                                : isApiConfigured 
                                  ? 'API Key Configured' 
                                  : 'Set API Key'
                              }
                            </div>
                            <div className="text-xs text-text-muted">
                              {userData?.plan === 'free'
                                ? 'Basic/Pro users only'
                                : isApiConfigured 
                                  ? 'Ready to use' 
                                  : 'Required for AI features'
                              }
                            </div>
                          </div>
                        </button>
                        
                        {/* Navigation Links */}
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                onClick={() => setIsMenuOpen(false)}
                                className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                                    location.pathname === link.path
                                        ? 'bg-gradient-accent text-text-primary shadow-accent'
                                        : 'text-text-secondary hover:bg-bg-glass-light hover:text-text-primary'
                                }`}
                            >
                                <span className="font-semibold">{link.name}</span>
                            </Link>
                        ))}
                    </div>
                </nav>
            )}
        </header>

        {/* Login Modal */}
        <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
        
        {/* Plan Upgrade Modal */}
        <PlanUpgradeModal isOpen={isPlanUpgradeModalOpen} onClose={() => setIsPlanUpgradeModalOpen(false)} />
        </>
    );
};

export default Header;