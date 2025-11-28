import { MaterialEntry, SupplierPayment, User } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { INITIAL_USERS } from '../constants';

// Keys for LocalStorage fallback
const LS_KEYS = {
  ENTRIES: 'jay_malhar_entries',
  PAYMENTS: 'jay_malhar_payments',
  USERS: 'jay_malhar_users'
};

// --- ENTRIES ---

export const addEntry = async (entry: Omit<MaterialEntry, 'id' | 'timestamp'>): Promise<MaterialEntry> => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('entries')
      .insert([{ 
        date: entry.date,
        challan_number: entry.challanNumber,
        material: entry.material,
        quantity: entry.quantity,
        unit: entry.unit,
        vehicle_number: entry.vehicleNumber,
        site_name: entry.siteName,
        created_by: entry.createdBy
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      ...entry,
      id: data.id,
      timestamp: new Date(data.created_at).getTime()
    };
  } else {
    // Local Fallback
    const newEntry: MaterialEntry = {
      ...entry,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };
    const current = getLocalEntries();
    localStorage.setItem(LS_KEYS.ENTRIES, JSON.stringify([...current, newEntry]));
    return newEntry;
  }
};

export const getEntries = async (): Promise<MaterialEntry[]> => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('entries').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data.map((d: any) => ({
      id: d.id,
      date: d.date,
      challanNumber: d.challan_number,
      material: d.material,
      quantity: Number(d.quantity),
      unit: d.unit,
      vehicleNumber: d.vehicle_number,
      siteName: d.site_name,
      createdBy: d.created_by,
      timestamp: new Date(d.created_at).getTime()
    }));
  } else {
    return getLocalEntries();
  }
};

const getLocalEntries = (): MaterialEntry[] => {
  const s = localStorage.getItem(LS_KEYS.ENTRIES);
  return s ? JSON.parse(s) : [];
};

// --- PAYMENTS ---

export const addPayment = async (payment: Omit<SupplierPayment, 'id' | 'timestamp'>): Promise<SupplierPayment> => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('payments')
      .insert([{
        date: payment.date,
        supplier_name: payment.supplierName,
        amount: payment.amount,
        payment_mode: payment.paymentMode,
        notes: payment.notes,
        created_by: payment.createdBy
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      ...payment,
      id: data.id,
      timestamp: new Date(data.created_at).getTime()
    };
  } else {
    const newPayment: SupplierPayment = {
      ...payment,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };
    const current = getLocalPayments();
    localStorage.setItem(LS_KEYS.PAYMENTS, JSON.stringify([...current, newPayment]));
    return newPayment;
  }
};

export const getPayments = async (): Promise<SupplierPayment[]> => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('payments').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data.map((d: any) => ({
      id: d.id,
      date: d.date,
      supplierName: d.supplier_name,
      amount: Number(d.amount),
      paymentMode: d.payment_mode,
      notes: d.notes,
      createdBy: d.created_by,
      timestamp: new Date(d.created_at).getTime()
    }));
  } else {
    return getLocalPayments();
  }
};

const getLocalPayments = (): SupplierPayment[] => {
  const s = localStorage.getItem(LS_KEYS.PAYMENTS);
  return s ? JSON.parse(s) : [];
};

// --- USERS (Local only for simplicity unless Auth service is fully integrated) ---

export const getUsers = (): User[] => {
  const s = localStorage.getItem(LS_KEYS.USERS);
  if (!s) {
    localStorage.setItem(LS_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }
  return JSON.parse(s);
};

export const updateUserPassword = (username: string, newPass: string) => {
  const users = getUsers();
  const index = users.findIndex(u => u.username === username);
  if (index !== -1) {
    users[index].passwordHash = newPass;
    localStorage.setItem(LS_KEYS.USERS, JSON.stringify(users));
    return true;
  }
  return false;
};
