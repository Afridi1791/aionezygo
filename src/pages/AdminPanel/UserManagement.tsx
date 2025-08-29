import React from 'react';
import { UserData } from '../../services/firebase';
import { 
  UserIcon, 
  TrashIcon, 
  RefreshIcon 
} from './AdminIcons';

interface UserManagementProps {
  allUsers: UserData[];
  loading: boolean;
  selectedUser: UserData | null;
  setSelectedUser: (user: UserData | null) => void;
  showPlanModal: boolean;
  setShowPlanModal: (show: boolean) => void;
  handleUpdatePlan: (plan: 'free' | 'basic' | 'pro') => Promise<void>;
  handleDeleteUser: (userId: string) => Promise<void>;
  handleResetCredits: (userId: string) => Promise<void>;
  formatDate: (date: Date) => string;
}

const UserManagement: React.FC<UserManagementProps> = ({ 
  allUsers, 
  loading, 
  selectedUser, 
  setSelectedUser, 
  showPlanModal, 
  setShowPlanModal,
  handleUpdatePlan,
  handleDeleteUser,
  handleResetCredits,
  formatDate
}) => {
  return (
    <div className="space-y-6">
      {/* Users Table */}
      <div className="card-modern">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-text-primary">All Users</h3>
          <div className="flex items-center space-x-2">
            <button className="btn-modern bg-bg-glass-light hover:bg-bg-glass">
              <RefreshIcon className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
            <p className="text-text-secondary mt-2">Loading users...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-secondary">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary uppercase tracking-wider">Credits</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary uppercase tracking-wider">Messages</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-secondary">
                {allUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-bg-glass-light transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-accent-primary/20 rounded-full flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-accent-primary" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-text-primary">{user.displayName}</div>
                          <div className="text-sm text-text-secondary">{user.email}</div>
                          {user.isAdmin && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent-primary/20 text-accent-primary border border-accent-primary/30">
                              Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        (user.plan || 'free') === 'pro' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                        (user.plan || 'free') === 'basic' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                        'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                      }`}>
                        {(user.plan || 'free').charAt(0).toUpperCase() + (user.plan || 'free').slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                      {user.credits || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                      {user.totalMessages || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {user.createdAt ? formatDate(user.createdAt) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowPlanModal(true);
                          }}
                          className="btn-modern bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary"
                        >
                          Edit Plan
                        </button>
                        <button
                          onClick={() => handleResetCredits(user.uid)}
                          className="btn-modern bg-orange-500/10 hover:bg-orange-500/20 text-orange-400"
                        >
                          Reset Credits
                        </button>
                        {!user.isAdmin && (
                          <button
                            onClick={() => handleDeleteUser(user.uid)}
                            className="btn-modern bg-red-500/10 hover:bg-red-500/20 text-red-400"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Plan Update Modal */}
      {showPlanModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="card-modern w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-text-primary mb-4">
              Update Plan for {selectedUser.displayName}
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={() => handleUpdatePlan('free')}
                className="w-full p-4 border border-border-secondary rounded-lg hover:border-accent-primary transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-text-primary">Free Plan</h4>
                    <p className="text-sm text-text-secondary">3 credits</p>
                  </div>
                  <span className="text-accent-primary">₹0</span>
                </div>
              </button>
              
              <button
                onClick={() => handleUpdatePlan('basic')}
                className="w-full p-4 border border-border-secondary rounded-lg hover:border-accent-primary transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-text-primary">Basic Plan</h4>
                    <p className="text-sm text-text-secondary">100 credits</p>
                  </div>
                  <span className="text-accent-primary">₹800</span>
                </div>
              </button>
              
              <button
                onClick={() => handleUpdatePlan('pro')}
                className="w-full p-4 border border-border-secondary rounded-lg hover:border-accent-primary transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-text-primary">Pro Plan</h4>
                    <p className="text-sm text-text-secondary">500 credits</p>
                  </div>
                  <span className="text-accent-primary">₹1799</span>
                </div>
              </button>
            </div>
            
            <button
              onClick={() => setShowPlanModal(false)}
              className="mt-6 w-full btn-modern bg-bg-glass-light hover:bg-bg-glass"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
