import React, { useState } from 'react';
import { User, UserRole, PageView } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, currentPage, onNavigate, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const NavItem = ({ page, icon, label }: { page: PageView; icon: string; label: string }) => {
    // Hide Admin tab for non-admins
    if (page === 'admin' && user.role !== UserRole.ADMIN) return null;

    const isActive = currentPage === page;
    return (
      <button
        onClick={() => {
          onNavigate(page);
          setIsMobileMenuOpen(false);
        }}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors mb-1 ${
          isActive 
            ? 'bg-brand-600 text-white shadow-md' 
            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <i className={`fas ${icon} w-5 text-center`}></i>
        <span className="font-medium">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:flex-col w-64 bg-slate-900 text-white shadow-xl z-20">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold bg-gradient-to-r from-brand-400 to-blue-300 bg-clip-text text-transparent">
            Jay Malhar Ent.
          </h1>
          <p className="text-xs text-slate-400 mt-1">Supply Chain Management</p>
        </div>
        
        <nav className="flex-1 px-3 py-6 overflow-y-auto">
          <NavItem page="dashboard" icon="fa-chart-line" label="Dashboard" />
          <NavItem page="entries" icon="fa-truck-loading" label="Material Entries" />
          <NavItem page="payments" icon="fa-money-bill-wave" label="Payments" />
          <NavItem page="admin" icon="fa-users-cog" label="User Management" />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-sm font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{user.role.toLowerCase()}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 rounded text-sm text-slate-300 transition-colors flex items-center justify-center space-x-2"
          >
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-slate-900 text-white z-30 h-16 flex items-center justify-between px-4 shadow-md">
        <h1 className="font-bold text-lg">Jay Malhar Ent.</h1>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-white p-2 focus:outline-none"
        >
          <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900 z-20 pt-20 px-4 md:hidden">
           <nav className="flex flex-col space-y-2">
            <NavItem page="dashboard" icon="fa-chart-line" label="Dashboard" />
            <NavItem page="entries" icon="fa-truck-loading" label="Material Entries" />
            <NavItem page="payments" icon="fa-money-bill-wave" label="Payments" />
            <NavItem page="admin" icon="fa-users-cog" label="User Management" />
            <button 
              onClick={onLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-400 hover:bg-slate-800 mt-4"
            >
              <i className="fas fa-sign-out-alt w-5 text-center"></i>
              <span className="font-medium">Logout</span>
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full pt-16 md:pt-0 bg-slate-50">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
