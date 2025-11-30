
import React, { useState, useEffect, useCallback } from 'react';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import EntryForm from './components/EntryForm';
import PaymentForm from './components/PaymentForm';
import DataTable from './components/DataTable';
import InvoiceGenerator from './components/InvoiceGenerator';
import ChequeManager from './components/ChequeManager';
import ClientLedger from './components/ClientLedger';
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
const IDLE_TIMEOUT_MS = 15 * 60 * 1000;

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [page, setPage] = useState<PageView>('dashboard');
  const [entries, setEntries] = useState<MaterialEntry[]>([]);
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [cheques, setCheques] = useState<ChequeEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MaterialEntry | undefined>(undefined);
  const [editingPayment, setEditingPayment] = useState<SupplierPayment | undefined>(undefined);
  const [filterMaterial, setFilterMaterial] = useState<string | undefined>(undefined);
  
  const [adminSelectedUser, setAdminSelectedUser] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      if (currentUser) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          alert("Session timed out due to inactivity.");
          handleLogout();
        }, IDLE_TIMEOUT_MS);
      }
    };
    if (currentUser) {
      window.addEventListener('mousemove', resetTimer);
      window.addEventListener('keydown', resetTimer);
      window.addEventListener('click', resetTimer);
      resetTimer(); 
    }
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, [currentUser]);

  useEffect(() => {
    const savedSession = localStorage.getItem(SESSION_KEY);
    if (savedSession) {
      try {
        const user = JSON.parse(savedSession);
        if (user && user.username) {
          setCurrentUser(user);
        }
      } catch (e) {
        localStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

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

  const handleSaveEntry = async (entryData: any) => {
    if (entryData.id) { await updateEntry(entryData.id, entryData); } 
    else { await addEntry(entryData); }
    await loadData();
    setShowEntryForm(false);
    setEditingEntry(undefined);
  };

  const handleEditEntry = (entry: MaterialEntry) => {
    setEditingEntry(entry);
    setShowEntryForm(true);
  };

  const handleDeleteEntry = async (entry: MaterialEntry) => {
    if (window.confirm(`Delete Challan: ${entry.challanNumber}?`)) {
      try { await deleteEntry(entry.id); await loadData(); } 
      catch (e: any) { alert(e.message); }
    }
  };

  const handleSavePayment = async (paymentData: any) => {
    if (paymentData.id) { await updatePayment(paymentData.id, paymentData); } 
    else { await addPayment(paymentData); }
    await loadData();
    setShowPaymentForm(false);
    setEditingPayment(undefined);
  };

  const handleEditPayment = (payment: SupplierPayment) => {
    setEditingPayment(payment);
    setShowPaymentForm(true);
  };

  const handleDeletePayment = async (payment: SupplierPayment) => {
    if (window.confirm(`Delete payment of ₹${payment.amount}?`)) {
      try { await deletePayment(payment.id); await loadData(); } 
      catch (e: any) { alert(e.message); }
    }
  };

  const handleAddCheque = async (chequeData: any) => {
    await addCheque(chequeData);
    await loadData();
  };

  const handleDeleteCheque = async (id: string) => {
    if (window.confirm("Delete this cheque entry?")) {
      try { await deleteCheque(id); await loadData(); } 
      catch (e: any) { alert(e.message); }
    }
  };

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
        alert('Password updated');
        setNewPassword('');
        const updatedUsers = await getUsers();
        setUsers(updatedUsers);
      } else {
        alert('Failed to update password');
      }
    } catch (e) {
      alert('Error updating password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

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
          onCancel={() => { setShowEntryForm(false); setEditingEntry(undefined); }} 
        />
      );
    }

    if (showPaymentForm) {
      return (
        <PaymentForm 
          currentUser={currentUser.name}
          initialData={editingPayment}
          onSubmit={handleSavePayment} 
          onCancel={() => { setShowPaymentForm(false); setEditingPayment(undefined); }} 
        />
      );
    }

    switch (page) {
      case 'dashboard':
        return <Dashboard entries={entries} payments={payments} onFilterRequest={handleDashboardFilter} onNavigatePayments={() => setPage('payments')} />;
      case 'entries':
        return (
          <DataTable<MaterialEntry>
            title="Material Entries"
            data={entries}
            filterValue={filterMaterial}
            onClearFilter={() => setFilterMaterial(undefined)}
            onAddClick={() => { setEditingEntry(undefined); setShowEntryForm(true); }}
            enableExport={true}
            enableDateFilter={true}
            onEdit={isAdmin ? handleEditEntry : undefined}
            onDelete={isAdmin ? handleDeleteEntry : undefined}
            columns={[
              { header: 'Date', accessor: (i) => new Date(i.date).toLocaleDateString() },
              { header: 'Challan', accessor: (i) => i.challanNumber },
              { header: 'Material', accessor: (i) => i.material },
              { header: 'Qty', accessor: (i) => `${i.quantity} ${i.unit}` },
              { header: 'Vehicle', accessor: (i) => i.vehicleNumber || '-' },
            ]}
          />
        );
      case 'payments':
        return (
          <DataTable<SupplierPayment>
            title="Supplier Payments"
            data={payments}
            onAddClick={() => { setEditingPayment(undefined); setShowPaymentForm(true); }}
            enableExport={true}
            enableDateFilter={true}
            onEdit={isAdmin ? handleEditPayment : undefined}
            onDelete={isAdmin ? handleDeletePayment : undefined}
            columns={[
              { header: 'Date', accessor: (i) => new Date(i.date).toLocaleDateString() },
              { header: 'Supplier', accessor: (i) => i.supplierName },
              { header: 'Amount', accessor: (i) => `₹${i.amount.toLocaleString()}` },
              { header: 'Mode', accessor: (i) => i.paymentMode },
              { header: 'Notes', accessor: (i) => i.notes || '-' },
            ]}
          />
        );
      case 'cheques':
        return <ChequeManager currentUser={currentUser.name} cheques={cheques} onAddCheque={handleAddCheque} onDeleteCheque={handleDeleteCheque} isAdmin={isAdmin} />;
      case 'invoices':
        return <InvoiceGenerator entries={entries} />;
      case 'client-ledger':
        return <ClientLedger />;
      case 'admin':
        if (!isAdmin) return <div>Access Denied</div>;
        return (
          <div className="bg-white p-8 rounded-xl shadow-sm max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-6">Admin Settings</h2>
            <div className="mb-8">
              <h3 className="font-medium mb-4">Change User Passwords</h3>
              <select className="w-full border p-2 rounded mb-2" value={adminSelectedUser} onChange={(e) => setAdminSelectedUser(e.target.value)}>
                <option value="">-- Select User --</option>
                {users.map(u => <option key={u.id} value={u.username}>{u.name}</option>)}
              </select>
              <input type="text" className="w-full border p-2 rounded mb-2" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New Password" />
              <button onClick={handleChangePassword} disabled={isUpdatingPassword} className="bg-brand-600 text-white px-4 py-2 rounded">Update</button>
            </div>
            <div>
              <p>{isSupabaseConfigured() ? '✅ Connected to Supabase' : '⚠️ Local Mode'}</p>
            </div>
          </div>
        );
      default:
        return <div>Page not found</div>;
    }
  };

  return <Layout user={currentUser} currentPage={page} onNavigate={(p) => { setPage(p); setShowEntryForm(false); setShowPaymentForm(false); }} onLogout={handleLogout}>{renderContent()}</Layout>;
}

export default App;
