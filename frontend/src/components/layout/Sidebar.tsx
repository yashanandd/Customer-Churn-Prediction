import React from 'react';
import { LayoutDashboard, Activity, PieChart, Settings, Users, LogOut, ArrowLeft, User, ShieldAlert } from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onBackToUploads: () => void;
  onLogout: () => void;
  onChangePasswordOpen: () => void;
  user: any;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  onBackToUploads, 
  onLogout, 
  onChangePasswordOpen,
  user
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'insights', label: 'AI Recommendations', icon: Activity },
    { id: 'customers', label: 'Customer Risk', icon: Users },
    { id: 'predictor', label: 'Single Predictor', icon: ShieldAlert },
  ];

  return (
    <aside className="w-64 bg-surface border-r border-white/5 h-screen flex flex-col fixed left-0 top-0 z-20">
      {/* Brand Header */}
      <div className="p-6 flex items-center gap-3 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center shrink-0">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          ChurnAI
        </h1>
      </div>

      {/* Return to uploads header button */}
      <div className="px-4 pt-4">
        <button 
          onClick={onBackToUploads}
          className="w-full flex items-center gap-2 px-4 py-2.5 bg-white/3 border border-white/5 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-all hover:bg-white/5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Uploads
        </button>
      </div>

      {/* Navigation tabs */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
                isActive 
                  ? "bg-primary/10 text-primary font-bold border-l-2 border-primary pl-[14px]" 
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
              )}
            >
              <Icon className={clsx("w-5 h-5", isActive ? "text-primary" : "text-gray-400")} />
              <span className="text-sm font-semibold">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Active User profile details */}
      {user && (
        <div className="mx-4 p-3 bg-white/3 border border-white/5 rounded-xl flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">{user.username}</p>
            <p className="text-[10px] text-gray-500 truncate mt-0.5">{user.email}</p>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="p-4 border-t border-white/5 space-y-1">
        <button 
          onClick={onChangePasswordOpen}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded-xl text-sm font-medium transition-all"
        >
          <Settings className="w-5 h-5" />
          Change Password
        </button>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-danger hover:bg-danger/10 rounded-xl text-sm font-medium transition-all"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
