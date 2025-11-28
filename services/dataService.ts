import { MaterialEntry, SupplierPayment, User } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { INITIAL_USERS } from '../constants';

// Keys for LocalStorage fallback
const LS_KEYS = {
  ENTRIES: 'jay_malhar_entries',
  PAYMENTS: 'jay_malhar_payments',
  USERS: 'jay_malhar_users'
};

// Helper to log errors safely
const logSupabaseError = (context: string, error: any) => {
  // Check for "relation does not exist" (Postgres 42P01)
  if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
    console.warn(`[${context}] Table not found in Supabase. Please run the SQL setup script in your Supabase SQL Editor.`);
  } else {
    console.error(`[${context}] Error:`, JSON.stringify(error, null, 2));
  }
};

// Safe JSON parse helper
const safeJsonParse = <T>(jsonString: string | null, fallback: T): T => {
  if (!jsonString) return fallback;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.warn("Failed to parse local storage data, using fallback:", e);
    return fallback;
  }
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
    
    if (error) {
      logSupabaseError('addEntry', error);
      throw error;
    }
    
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
    const current = await getEntries(); // await in case we switch implementation later
    localStorage.setItem(LS_KEYS.ENTRIES, JSON.stringify([...current, newEntry]));
    return newEntry;
  }
};

export const getEntries = async (): Promise<MaterialEntry[]> => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('entries').select('*').order('date', { ascending: false });
    
    if (error) {
      logSupabaseError('getEntries', error);
      // Return empty array instead of throwing to prevent app crash if table missing
      return []; 
    }
    
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
    const s = localStorage.getItem(LS_KEYS.ENTRIES);
    return safeJsonParse(s, []);
  }
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

    if (error) {
      logSupabaseError('addPayment', error);
      throw error;
    }

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
    const current = await getPayments();
    localStorage.setItem(LS_KEYS.PAYMENTS, JSON.stringify([...current, newPayment]));
    return newPayment;
  }
};

export const getPayments = async (): Promise<SupplierPayment[]> => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('payments').select('*').order('date', { ascending: false });
    
    if (error) {
      logSupabaseError('getPayments', error);
      return [];
    }

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
    const s = localStorage.getItem(LS_KEYS.PAYMENTS);
    return safeJsonParse(s, []);
  }
};

// --- USERS ---

export const getUsers = async (): Promise<User[]> => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('app_users').select('*').order('name');
    
    if (error) {
      logSupabaseError('getUsers', error);
      // Fallback to memory constants in case of query error (e.g., table missing)
      return INITIAL_USERS;
    }
    
    // Seed users if table is empty
    if (!data || data.length === 0) {
      console.log("Seeding initial users...");
      const seedData = INITIAL_USERS.map(u => ({
        username: u.username,
        name: u.name,
        role: u.role,
        password_hash: u.passwordHash
      }));
      const { error: seedError } = await supabase.from('app_users').insert(seedData);
      if (seedError) {
        logSupabaseError('seedUsers', seedError);
      } else {
        // Return seeded users immediately
        return INITIAL_USERS;
      }
    }
    
    return data.map((d: any) => ({
      id: d.id,
      username: d.username,
      name: d.name,
      role: d.role,
      passwordHash: d.password_hash
    }));
  } else {
    // Local Storage logic
    const s = localStorage.getItem(LS_KEYS.USERS);
    if (!s) {
      localStorage.setItem(LS_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return safeJsonParse(s, INITIAL_USERS);
  }
};

export const updateUserPassword = async (username: string, newPass: string): Promise<boolean> => {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase
      .from('app_users')
      .update({ password_hash: newPass })
      .eq('username', username);
    
    if (error) {
      logSupabaseError('updateUserPassword', error);
      return false;
    }
    return true;
  } else {
    const users = await getUsers();
    const index = users.findIndex(u => u.username === username);
    if (index !== -1) {
      users[index].passwordHash = newPass;
      localStorage.setItem(LS_KEYS.USERS, JSON.stringify(users));
      return true;
    }
    return false;
  }
};