import React, { useState, useEffect, useCallback } from 'react';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import EntryForm from './components/EntryForm';
import PaymentForm from './components/PaymentForm';
import DataTable from './components/DataTable';
import { User, MaterialEntry, SupplierPayment, PageView, MaterialType, UserRole } from './types';
import { getEntries, getPayments, addEntry, addPayment, getUsers, updateUserPassword } from './services/dataService';
import { isSupabaseConfigured } from './services/supabaseClient';

function App() {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Navigation State
  const [page, setPage] = useState<PageView>('dashboard');
  
  // Data State
  const [entries, setEntries] = useState<MaterialEntry[]>([]);
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // UI State
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [filterMaterial, setFilterMaterial] = useState<string | undefined>(undefined);
  
  // Admin UI State
  const [adminSelectedUser, setAdminSelectedUser] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');

  // Initial Data Load
  const loadData = useCallback(async () => {
    try {
      const [e, p, u] = await Promise.all([getEntries(), getPayments(), getUsers()]);
      setEntries(e);
      setPayments(p);
      setUsers(u);
    } catch (err) {
      console.error("Error loading data:", err);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, loadData]);

  // Handlers
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setPage('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setEntries([]);
    setPayments([]);
  };

  const handleAddEntry = async (entry: Omit<MaterialEntry, 'id' | 'timestamp'>) => {
    await addEntry(entry);
    await loadData();
    setShowEntryForm(false);
  };

  const handleAddPayment = async (payment: Omit<SupplierPayment, 'id' | 'timestamp'>) => {
    await addPayment(payment);
    await loadData();
    setShowPaymentForm(false);
  };

  const handleDashboardFilter = (material?: MaterialType) => {
    setFilterMaterial(material);
    setPage('entries');
  };

  const handleChangePassword = async () => {
    if (!adminSelectedUser || !newPassword) return;
    try {
      const success = await updateUserPassword(adminSelectedUser, newPassword);
      if (success) {
        alert('Password updated successfully');
        setNewPassword('');
        // Reload users to get updated hashes if needed locally, though simple auth checks local object in Login
        const updatedUsers = await getUsers();
        setUsers(updatedUsers);
      } else {
        alert('Failed to update password');
      }
    } catch (e) {
      console.error(e);
      alert('Error updating password');
    }
  };

  // Render Logic
  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    if (showEntryForm) {
      return (
        <EntryForm 
          currentUser={currentUser.name}
          onSubmit={handleAddEntry} 
          onCancel={() => setShowEntryForm(false)} 
        />
      );
    }

    if (showPaymentForm) {
      return (
        <PaymentForm 
          currentUser={currentUser.name}
          onSubmit={handleAddPayment} 
          onCancel={() => setShowPaymentForm(false)} 
        />
      );
    }

    switch (page) {
      case 'dashboard':
        return (
          <Dashboard 
            entries={entries} 
            payments={payments} 
            onFilterRequest={handleDashboardFilter} 
            onNavigatePayments={() => setPage('payments')}
          />
        );
      case 'entries':
        return (
          <DataTable<MaterialEntry>
            title="Material Entries"
            data={entries}
            filterValue={filterMaterial}
            onClearFilter={() => setFilterMaterial(undefined)}
            onAddClick={() => setShowEntryForm(true)}
            columns={[
              { header: 'Date', accessor: (i) => new Date(i.date).toLocaleDateString() },
              { header: 'Challan', accessor: (i) => <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{i.challanNumber}</span> },
              { header: 'Material', accessor: (i) => <span className="font-medium">{i.material}</span> },
              { header: 'Quantity', accessor: (i) => `${i.quantity} ${i.unit}` },
              { header: 'Vehicle', accessor: (i) => i.vehicleNumber || '-' },
              { header: 'Added By', accessor: (i) => i.createdBy },
            ]}
          />
        );
      case 'payments':
        return (
          <DataTable<SupplierPayment>
            title="Supplier Payments"
            data={payments}
            onAddClick={() => setShowPaymentForm(true)}
            columns={[
              { header: 'Date', accessor: (i) => new Date(i.date).toLocaleDateString() },
              { header: 'Supplier', accessor: (i) => <span className="font-medium">{i.supplierName}</span> },
              { header: 'Amount', accessor: (i) => <span className="text-green-600 font-bold">₹{i.amount.toLocaleString()}</span> },
              { header: 'Mode', accessor: (i) => i.paymentMode },
              { header: 'Notes', accessor: (i) => <span className="text-slate-500 text-xs truncate max-w-[150px] inline-block">{i.notes || '-'}</span> },
              { header: 'Added By', accessor: (i) => i.createdBy },
            ]}
          />
        );
      case 'admin':
        if (currentUser.role !== UserRole.ADMIN) return <div>Access Denied</div>;
        return (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-6 text-slate-800">Admin Settings</h2>
            
            <div className="mb-8">
              <h3 className="font-medium text-slate-700 mb-4 pb-2 border-b">Change User Passwords</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Select User</label>
                  <select 
                    className="w-full border p-2 rounded"
                    value={adminSelectedUser}
                    onChange={(e) => setAdminSelectedUser(e.target.value)}
                  >
                    <option value="">-- Select User --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.username}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">New Password</label>
                  <input 
                    type="text" 
                    className="w-full border p-2 rounded"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
              </div>
              <button 
                onClick={handleChangePassword}
                className="mt-4 bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-700"
              >
                Update Password
              </button>
            </div>

            <div>
              <h3 className="font-medium text-slate-700 mb-4 pb-2 border-b">System Status</h3>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isSupabaseConfigured() ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="text-sm text-slate-600">
                  {isSupabaseConfigured() ? 'Connected to Supabase' : 'Running in Local Storage Mode (Add Supabase URL/Key to env to connect)'}
                </span>
              </div>
            </div>
          </div>
        );
      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <Layout 
      user={currentUser} 
      currentPage={page} 
      onNavigate={(p) => {
        setPage(p);
        setShowEntryForm(false);
        setShowPaymentForm(false);
      }}
      onLogout={handleLogout}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;
