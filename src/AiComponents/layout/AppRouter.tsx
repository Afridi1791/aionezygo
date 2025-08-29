import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PageView from './PageView';
import HomePage from '../../pages/HomePage';
import Pricing from '../../pages/Pricing';
import AdminPanel from '../../pages/AdminPanel';



// Error boundary component
const ErrorFallback = ({ error }: { error: Error }) => (
  <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
    <div className="text-center max-w-lg mx-auto">
      <div className="w-24 h-24 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
        <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-text-primary mb-4">Something went wrong</h2>
      <p className="text-text-secondary mb-6 text-lg leading-relaxed">
        We're sorry, but something unexpected happened. Please try reloading the page.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button 
          onClick={() => window.history.back()} 
          className="px-6 py-3 rounded-xl bg-bg-glass-light hover:bg-bg-glass text-text-primary font-medium transition-all duration-200 border border-border-secondary"
        >
          Go Back
        </button>
        <button 
          onClick={() => window.location.reload()} 
          className="px-6 py-3 rounded-xl bg-gradient-accent hover:shadow-accent-hover text-text-primary font-medium transition-all duration-200"
        >
          Reload Page
        </button>
      </div>
    </div>
  </div>
);

interface AppRouterProps {
  onProjectUpload?: (files: FileList) => void;
  onProjectDrop?: (dataTransfer: DataTransfer) => void;
  onScaffoldProject?: (prompt: string) => void;
  onOpenLogin?: () => void;
}

const AppRouter: React.FC<AppRouterProps> = ({ 
  onProjectUpload, 
  onProjectDrop, 
  onScaffoldProject, 
  onOpenLogin 
}) => {
  return (
    <Routes>
      {/* Home route - Main application */}
      <Route 
        path="/" 
        element={
          <HomePage 
            onProjectUpload={onProjectUpload} 
            onProjectDrop={onProjectDrop}
            onScaffoldProject={onScaffoldProject}
            onOpenLogin={onOpenLogin}
          />
        } 
      />
      
      {/* Pricing page - Professional pricing plans */}
      <Route 
        path="/pricing" 
        element={
          <PageView title="Pricing Plans">
            <Pricing />
          </PageView>
        } 
      />

      {/* Admin panel - Administrative interface */}
      <Route 
        path="/admin" 
        element={<AdminPanel />} 
      />

      {/* Legacy route redirects for SEO and user experience */}
      <Route path="/pricing-plans" element={<Navigate to="/pricing" replace />} />
      <Route path="/price" element={<Navigate to="/pricing" replace />} />
      <Route path="/admin-panel" element={<Navigate to="/admin" replace />} />
      <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
      
      {/* 404 - Catch all other routes and redirect to home */}
      <Route 
        path="*" 
        element={
          <PageView title="Page Not Found">
            <div className="text-center max-w-lg mx-auto">
              <div className="w-24 h-24 bg-gradient-accent rounded-3xl flex items-center justify-center mx-auto mb-8">
                <svg className="w-12 h-12 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-text-primary mb-4">Page Not Found</h2>
              <p className="text-text-secondary mb-8 text-lg">
                The page you're looking for doesn't exist or has been moved.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => window.history.back()} 
                  className="px-6 py-3 rounded-xl bg-bg-glass-light hover:bg-bg-glass text-text-primary font-medium transition-all duration-200 border border-border-secondary"
                >
                  Go Back
                </button>
                <button 
                  onClick={() => window.location.href = '/'} 
                  className="px-6 py-3 rounded-xl bg-gradient-accent hover:shadow-accent-hover text-text-primary font-medium transition-all duration-200"
                >
                  Go Home
                </button>
              </div>
            </div>
          </PageView>
        } 
      />
    </Routes>
  );
};

export default AppRouter;
