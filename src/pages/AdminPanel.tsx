import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin';
import { useAuth } from '../context/AuthContext';
import { UserData } from '../services/firebase';
import Dashboard from './AdminPanel/Dashboard';
import UserManagement from './AdminPanel/UserManagement';
import { 
  DashboardIcon, 
  UsersIcon, 
  UserIcon, 
  CrownIcon, 
  LogoutIcon 
} from './AdminPanel/AdminIcons';

type AdminSection = 'dashboard' | 'users';

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, allUsers, loading, updateUserPlan, deleteUser, resetUserCredits } = useAdmin();
  const { currentUser: user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-4">Access Denied</h1>
          <p className="text-text-secondary">You don't have admin privileges.</p>
        </div>
      </div>
    );
  }

  const handleUpdatePlan = async (plan: 'free' | 'basic' | 'pro') => {
    if (!selectedUser) return;
    
    const credits = {
      free: 3,
      basic: 100,
      pro: 500
    };
    
    try {
      await updateUserPlan(selectedUser.uid, plan, credits[plan]);
      setShowPlanModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating plan:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId);
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleResetCredits = async (userId: string) => {
    if (window.confirm('Reset user credits to 3?')) {
      try {
        await resetUserCredits(userId);
      } catch (error) {
        console.error('Error resetting credits:', error);
      }
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleSignOut = () => {
    // Navigate to home page
    navigate('/');
  };

  const sidebarItems = [
    {
      id: 'dashboard' as AdminSection,
      label: 'Dashboard',
      icon: DashboardIcon,
      description: 'Overview and analytics'
    },
    {
      id: 'users' as AdminSection,
      label: 'User Management',
      icon: UsersIcon,
      description: 'Manage user accounts'
    }
  ];

  return (
    <div className="min-h-screen bg-bg-primary flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-bg-secondary border-r border-border-primary flex flex-col flex-shrink-0">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-border-primary">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-accent rounded-lg flex items-center justify-center">
              <CrownIcon className="w-5 h-5 text-text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary">Admin Panel</h1>
              <p className="text-xs text-text-secondary">Administrative Control</p>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
                  activeSection === item.id
                    ? 'bg-gradient-accent text-text-primary shadow-accent'
                    : 'text-text-secondary hover:bg-bg-glass hover:text-text-primary'
                }`}
              >
                <Icon className="w-5 h-5" />
                <div>
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs opacity-75">{item.description}</div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border-primary">
          <div className="flex items-center space-x-3 px-4 py-3 text-text-secondary">
            <UserIcon className="w-5 h-5" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.email}</div>
              <div className="text-xs opacity-75">Administrator</div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-text-secondary hover:bg-bg-glass hover:text-text-primary transition-all duration-200"
          >
            <LogoutIcon className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Content Header */}
        <div className="glass border-b border-border-primary p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">
                {activeSection === 'dashboard' ? 'Dashboard' : 'User Management'}
              </h2>
              <p className="text-text-secondary mt-1">
                {activeSection === 'dashboard' 
                  ? 'Overview of system statistics and analytics' 
                  : 'Manage user accounts, plans, and permissions'
                }
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-4 py-2 glass-light rounded-lg border border-border-secondary">
                <div className="w-2 h-2 bg-accent-primary rounded-full animate-pulse"></div>
                <span className="text-sm text-text-secondary font-medium">Admin Mode</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto min-w-0">
          {activeSection === 'dashboard' ? (
            <Dashboard allUsers={allUsers} />
          ) : (
            <UserManagement 
              allUsers={allUsers}
              loading={loading}
              selectedUser={selectedUser}
              setSelectedUser={setSelectedUser}
              showPlanModal={showPlanModal}
              setShowPlanModal={setShowPlanModal}
              handleUpdatePlan={handleUpdatePlan}
              handleDeleteUser={handleDeleteUser}
              handleResetCredits={handleResetCredits}
              formatDate={formatDate}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
