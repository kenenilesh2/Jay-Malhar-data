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
    const current = await getEntries(); // await in case we switch implementation later
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
    const s = localStorage.getItem(LS_KEYS.ENTRIES);
    return s ? JSON.parse(s) : [];
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
    const current = await getPayments();
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
    const s = localStorage.getItem(LS_KEYS.PAYMENTS);
    return s ? JSON.parse(s) : [];
  }
};

// --- USERS ---

export const getUsers = async (): Promise<User[]> => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('app_users').select('*').order('name');
    
    // Seed users if table is empty
    if (!error && (!data || data.length === 0)) {
      console.log("Seeding initial users...");
      const seedData = INITIAL_USERS.map(u => ({
        username: u.username,
        name: u.name,
        role: u.role,
        password_hash: u.passwordHash
      }));
      const { error: seedError } = await supabase.from('app_users').insert(seedData);
      if (seedError) {
        console.error("Error seeding users:", seedError);
      } else {
        // Return seeded users immediately
        return INITIAL_USERS;
      }
    }

    if (error) {
      console.error("Error fetching users from Supabase:", error);
      return INITIAL_USERS; // Fallback to memory constants in case of query error
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
    return JSON.parse(s);
  }
};

export const updateUserPassword = async (username: string, newPass: string): Promise<boolean> => {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase
      .from('app_users')
      .update({ password_hash: newPass })
      .eq('username', username);
    
    if (error) {
      console.error("Error updating password in Supabase:", error);
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
