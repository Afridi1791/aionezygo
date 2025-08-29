import React from 'react';
import { UserData } from '../../services/firebase';
import { 
  UsersIcon, 
  UserIcon, 
  CrownIcon, 
  CalendarIcon, 
  MessageIcon 
} from './AdminIcons';

interface DashboardProps {
  allUsers: UserData[];
}

const Dashboard: React.FC<DashboardProps> = ({ allUsers }) => {
  const stats = [
    {
      title: 'Total Users',
      value: allUsers.length,
      icon: UsersIcon,
      color: 'blue',
      description: 'Registered users'
    },
    {
      title: 'Total Messages',
      value: allUsers.reduce((sum, user) => sum + (user.totalMessages || 0), 0),
      icon: MessageIcon,
      color: 'green',
      description: 'AI messages sent'
    },
    {
      title: 'Pro Users',
      value: allUsers.filter(user => (user.plan || 'free') === 'pro').length,
      icon: CrownIcon,
      color: 'purple',
      description: 'Premium subscribers'
    },
    {
      title: 'Active Today',
      value: allUsers.filter(user => {
        if (!user.createdAt) return false;
        const today = new Date();
        const userDate = new Date(user.createdAt);
        return userDate.toDateString() === today.toDateString();
      }).length,
      icon: CalendarIcon,
      color: 'orange',
      description: 'Users active today'
    }
  ];

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card-modern">
              <div className="flex items-center space-x-4">
                <div className={`p-3 bg-${stat.color}-500/20 rounded-xl`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-400`} />
                </div>
                <div>
                  <p className="text-text-secondary text-sm font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold text-text-primary">{stat.value}</p>
                  <p className="text-text-muted text-xs">{stat.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="card-modern">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {allUsers.slice(0, 5).map((user, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-bg-glass-light rounded-lg">
              <div className="w-8 h-8 bg-accent-primary/20 rounded-full flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-accent-primary" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-text-primary">{user.displayName}</div>
                <div className="text-xs text-text-secondary">{user.email}</div>
              </div>
              <div className="text-xs text-text-muted">
                {user.createdAt ? formatDate(new Date(user.createdAt)) : 'N/A'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
