import React, { useState, useEffect, useCallback } from 'react';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import EntryForm from './components/EntryForm';
import PaymentForm from './components/PaymentForm';
import DataTable from './components/DataTable';
import InvoiceGenerator from './components/InvoiceGenerator';
import ChequeManager from './components/ChequeManager';
import { User, MaterialEntry, SupplierPayment, PageView, MaterialType, UserRole, ChequeEntry } from './types';
import { 
  getEntries, getPayments, getUsers, getCheques,
  addEntry, updateEntry, deleteEntry,
  addPayment, updatePayment, deletePayment,
  addCheque, deleteCheque,
  updateUserPassword 
} from './services/dataService';
import { isSupabaseConfigured } from './services/supabaseClient';

const SESSION_KEY = 'jay_malhar_active_session';

function App() {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Navigation State
  const [page, setPage] = useState<PageView>('dashboard');
  
  // Data State
  const [entries, setEntries] = useState<MaterialEntry[]>([]);
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [cheques, setCheques] = useState<ChequeEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // UI State - Forms
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  
  // UI State - Editing
  const [editingEntry, setEditingEntry] = useState<MaterialEntry | undefined>(undefined);
  const [editingPayment, setEditingPayment] = useState<SupplierPayment | undefined>(undefined);

  // UI State - Filtering
  const [filterMaterial, setFilterMaterial] = useState<string | undefined>(undefined);
  
  // Admin UI State
  const [adminSelectedUser, setAdminSelectedUser] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Restore Session on Mount
  useEffect(() => {
    const savedSession = localStorage.getItem(SESSION_KEY);
    if (savedSession) {
      try {
        const user = JSON.parse(savedSession);
        if (user && user.username) {
          setCurrentUser(user);
        }
      } catch (e) {
        console.error("Failed to restore session", e);
        localStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  // Initial Data Load
  const loadData = useCallback(async () => {
    try {
      const [e, p, c, u] = await Promise.all([getEntries(), getPayments(), getCheques(), getUsers()]);
      setEntries(e);
      setPayments(p);
      setCheques(c);
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
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    setPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
    setEntries([]);
    setPayments([]);
  };

  // --- Entries Logic ---

  const handleSaveEntry = async (entryData: any) => {
    if (entryData.id) {
      // Update
      await updateEntry(entryData.id, entryData);
    } else {
      // Create
      await addEntry(entryData);
    }
    await loadData();
    setShowEntryForm(false);
    setEditingEntry(undefined);
  };

  const handleEditEntry = (entry: MaterialEntry) => {
    setEditingEntry(entry);
    setShowEntryForm(true);
  };

  const handleDeleteEntry = async (entry: MaterialEntry) => {
    if (window.confirm(`Are you sure you want to delete Challan: ${entry.challanNumber}?`)) {
      try {
        await deleteEntry(entry.id);
        await loadData();
      } catch (e: any) {
        console.error(e);
        alert(e.message || "Failed to delete entry. Check database permissions.");
      }
    }
  };

  // --- Payments Logic ---

  const handleSavePayment = async (paymentData: any) => {
    if (paymentData.id) {
      await updatePayment(paymentData.id, paymentData);
    } else {
      await addPayment(paymentData);
    }
    await loadData();
    setShowPaymentForm(false);
    setEditingPayment(undefined);
  };

  const handleEditPayment = (payment: SupplierPayment) => {
    setEditingPayment(payment);
    setShowPaymentForm(true);
  };

  const handleDeletePayment = async (payment: SupplierPayment) => {
    if (window.confirm(`Are you sure you want to delete payment of ₹${payment.amount}?`)) {
      try {
        await deletePayment(payment.id);
        await loadData();
      } catch (e: any) {
        console.error(e);
        alert(e.message || "Failed to delete payment. Check database permissions.");
      }
    }
  };

  // --- Cheque Logic ---
  const handleAddCheque = async (chequeData: any) => {
    await addCheque(chequeData);
    await loadData();
  };

  const handleDeleteCheque = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this cheque entry?")) {
      try {
        await deleteCheque(id);
        await loadData();
      } catch (e: any) {
        alert(e.message || "Failed to delete cheque.");
      }
    }
  };

  // --- Dashboard Logic ---

  const handleDashboardFilter = (material?: MaterialType) => {
    setFilterMaterial(material);
    setPage('entries');
  };

  const handleChangePassword = async () => {
    if (!adminSelectedUser || !newPassword) return;
    setIsUpdatingPassword(true);
    try {
      const success = await updateUserPassword(adminSelectedUser, newPassword);
      if (success) {
        alert('Password updated successfully');
        setNewPassword('');
        const updatedUsers = await getUsers();
        setUsers(updatedUsers);
      } else {
        alert('Failed to update password. Please check if the user exists in database.');
      }
    } catch (e) {
      console.error(e);
      alert('Error updating password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Render Logic
  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const isAdmin = currentUser.role === UserRole.ADMIN;

  const renderContent = () => {
    if (showEntryForm) {
      return (
        <EntryForm 
          currentUser={currentUser.name}
          initialData={editingEntry}
          onSubmit={handleSaveEntry} 
          onCancel={() => {
            setShowEntryForm(false);
            setEditingEntry(undefined);
          }} 
        />
      );
    }

    if (showPaymentForm) {
      return (
        <PaymentForm 
          currentUser={currentUser.name}
          initialData={editingPayment}
          onSubmit={handleSavePayment} 
          onCancel={() => {
            setShowPaymentForm(false);
            setEditingPayment(undefined);
          }} 
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
            onAddClick={() => {
              setEditingEntry(undefined);
              setShowEntryForm(true);
            }}
            enableExport={true}
            enableDateFilter={true}
            // Pass handlers ONLY if admin
            onEdit={isAdmin ? handleEditEntry : undefined}
            onDelete={isAdmin ? handleDeleteEntry : undefined}
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
            onAddClick={() => {
              setEditingPayment(undefined);
              setShowPaymentForm(true);
            }}
            enableExport={true}
            enableDateFilter={true}
            // Pass handlers ONLY if admin
            onEdit={isAdmin ? handleEditPayment : undefined}
            onDelete={isAdmin ? handleDeletePayment : undefined}
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
      case 'cheques':
        return (
          <ChequeManager 
            currentUser={currentUser.name}
            cheques={cheques}
            onAddCheque={handleAddCheque}
            onDeleteCheque={handleDeleteCheque}
            isAdmin={isAdmin}
          />
        );
      case 'invoices':
        return <InvoiceGenerator entries={entries} />;
      case 'admin':
        if (!isAdmin) return <div>Access Denied</div>;
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
                disabled={isUpdatingPassword}
                className="mt-4 bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-700 disabled:opacity-50 flex items-center"
              >
                 {isUpdatingPassword && <i className="fas fa-spinner fa-spin mr-2"></i>}
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
        setEditingEntry(undefined);
        setEditingPayment(undefined);
      }}
      onLogout={handleLogout}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;