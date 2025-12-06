
import { MaterialEntry, SupplierPayment, User, ChequeEntry, ClientLedgerEntry, GeneratedInvoice, MaterialType } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { INITIAL_USERS, SITE_NAME } from '../constants';

// Keys for LocalStorage fallback
const LS_KEYS = {
  ENTRIES: 'jay_malhar_entries',
  PAYMENTS: 'jay_malhar_payments',
  USERS: 'jay_malhar_users',
  CHEQUES: 'jay_malhar_cheques',
  LEDGER: 'jay_malhar_client_ledger',
  INVOICES: 'jay_malhar_generated_invoices'
};

// Helper to log errors safely
const logSupabaseError = (context: string, error: any) => {
  if (error?.code === '42P01' || error?.code === 'PGRST205' || error?.message?.includes('does not exist')) {
    console.warn(`[${context}] Table not found in Supabase. Please run the SQL setup script in your Supabase SQL Editor.`);
  } else if (error?.code === 'PGRST204') {
    console.warn(`[${context}] Column mismatch in Supabase (PGRST204).`);
  } else {
    console.error(`[${context}] Error:`, JSON.stringify(error, null, 2));
  }
};

const safeJsonParse = <T>(jsonString: string | null, fallback: T): T => {
  if (!jsonString) return fallback;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return fallback;
  }
};

// --- FILE UPLOAD ---
export const uploadChequeFile = async (file: File): Promise<string | null> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('cheques')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('cheques').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (e) {
      console.error("File upload failed:", e);
      throw e;
    }
  }
  return null;
};

// --- CHEQUES ---
export const addCheque = async (cheque: Omit<ChequeEntry, 'id' | 'timestamp'>): Promise<ChequeEntry> => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('cheque_entries')
      .insert([{
        date: cheque.date,
        party_name: cheque.partyName,
        cheque_number: cheque.chequeNumber,
        bank_name: cheque.bankName,
        amount: cheque.amount,
        status: cheque.status,
        file_url: cheque.fileUrl,
        created_by: cheque.createdBy
      }])
      .select()
      .single();

    if (error) {
      logSupabaseError('addCheque', error);
      throw error;
    }

    return { ...cheque, id: data.id, timestamp: new Date(data.created_at).getTime() };
  } else {
    const newCheque: ChequeEntry = { ...cheque, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() };
    const current = await getCheques();
    localStorage.setItem(LS_KEYS.CHEQUES, JSON.stringify([...current, newCheque]));
    return newCheque;
  }
};

export const getCheques = async (): Promise<ChequeEntry[]> => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('cheque_entries').select('*').order('date', { ascending: false });
    if (error) { logSupabaseError('getCheques', error); return []; }
    return data.map((d: any) => ({
      id: d.id, date: d.date, partyName: d.party_name, chequeNumber: d.cheque_number, bankName: d.bank_name,
      amount: Number(d.amount), status: d.status, fileUrl: d.file_url, createdBy: d.created_by, timestamp: new Date(d.created_at).getTime()
    }));
  } else {
    return safeJsonParse(localStorage.getItem(LS_KEYS.CHEQUES), []);
  }
};

export const deleteCheque = async (id: string): Promise<void> => {
  if (isSupabaseConfigured() && supabase) {
    const { error, count } = await supabase.from('cheque_entries').delete({ count: 'exact' }).eq('id', id);
    if (error) { logSupabaseError('deleteCheque', error); throw error; }
    if (count === 0) throw new Error("ACCESS DENIED: The database blocked this deletion.");
  } else {
    const current = await getCheques();
    localStorage.setItem(LS_KEYS.CHEQUES, JSON.stringify(current.filter(c => c.id !== id)));
  }
};

// --- ENTRIES ---
export const addEntry = async (entry: Omit<MaterialEntry, 'id' | 'timestamp'>): Promise<MaterialEntry> => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('entries').insert([{ 
        date: entry.date, challan_number: entry.challanNumber, material: entry.material,
        quantity: entry.quantity, unit: entry.unit, vehicle_number: entry.vehicleNumber,
        site_name: entry.siteName, phase: entry.phase, created_by: entry.createdBy
      }]).select().single();
    if (error) { logSupabaseError('addEntry', error); throw error; }
    return { ...entry, id: data.id, timestamp: new Date(data.created_at).getTime() };
  } else {
    const newEntry: MaterialEntry = { ...entry, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() };
    const current = await getEntries(); 
    localStorage.setItem(LS_KEYS.ENTRIES, JSON.stringify([...current, newEntry]));
    return newEntry;
  }
};

export const bulkAddEntries = async (entries: Omit<MaterialEntry, 'id' | 'timestamp'>[]): Promise<void> => {
    if (isSupabaseConfigured() && supabase) {
        const dbEntries = entries.map(e => ({
            date: e.date,
            challan_number: e.challanNumber,
            material: e.material,
            quantity: e.quantity,
            unit: e.unit,
            vehicle_number: e.vehicleNumber,
            site_name: e.siteName,
            phase: e.phase,
            created_by: e.createdBy
        }));
        
        const { error } = await supabase.from('entries').insert(dbEntries);
        if (error) {
            logSupabaseError('bulkAddEntries', error);
            throw error;
        }
    } else {
        const current = await getEntries();
        const newEntries = entries.map(e => ({
            ...e,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now()
        }));
        localStorage.setItem(LS_KEYS.ENTRIES, JSON.stringify([...current, ...newEntries]));
    }
};

// UTILITY: BULK INSERT SPECIFIC SCENARIO
export const seedNovemberWaterEntries = async () => {
  if (isSupabaseConfigured() && supabase) {
    const entries = [];
    for (let day = 1; day <= 30; day++) {
      const dateStr = `2025-11-${String(day).padStart(2, '0')}`;
      entries.push({
        date: dateStr,
        challan_number: `AUTO/NOV25/${day}`,
        material: MaterialType.DRINKING_WATER,
        quantity: 1,
        unit: 'Tanker',
        vehicle_number: 'MH05K8980',
        site_name: SITE_NAME,
        created_by: 'Admin (Bulk Tool)'
      });
    }

    const { error } = await supabase.from('entries').insert(entries);
    if (error) {
      console.error("Bulk Insert Failed:", error);
      return false;
    }
    return true;
  }
  return false;
};

export const updateEntry = async (id: string, entry: Partial<MaterialEntry>): Promise<void> => {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.from('entries').update({
        date: entry.date, challan_number: entry.challanNumber, material: entry.material,
        quantity: entry.quantity, unit: entry.unit, vehicle_number: entry.vehicleNumber, 
        site_name: entry.siteName, phase: entry.phase
      }).eq('id', id);
    if (error) { logSupabaseError('updateEntry', error); throw error; }
  } else {
    const current = await getEntries();
    const index = current.findIndex(e => e.id === id);
    if (index !== -1) {
      current[index] = { ...current[index], ...entry };
      localStorage.setItem(LS_KEYS.ENTRIES, JSON.stringify(current));
    }
  }
};

export const deleteEntry = async (id: string): Promise<void> => {
  if (isSupabaseConfigured() && supabase) {
    const { error, count } = await supabase.from('entries').delete({ count: 'exact' }).eq('id', id);
    if (error) { logSupabaseError('deleteEntry', error); throw error; }
    if (count === 0) throw new Error("ACCESS DENIED.");
  } else {
    const current = await getEntries();
    localStorage.setItem(LS_KEYS.ENTRIES, JSON.stringify(current.filter(e => e.id !== id)));
  }
};

export const getEntries = async (): Promise<MaterialEntry[]> => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('entries').select('*').order('date', { ascending: false });
    if (error) { logSupabaseError('getEntries', error); return []; }
    return data.map((d: any) => ({
      id: d.id, date: d.date, challanNumber: d.challan_number, material: d.material,
      quantity: Number(d.quantity), unit: d.unit, vehicleNumber: d.vehicle_number,
      siteName: d.site_name, phase: d.phase, createdBy: d.created_by, timestamp: new Date(d.created_at).getTime()
    }));
  } else {
    return safeJsonParse(localStorage.getItem(LS_KEYS.ENTRIES), []);
  }
};

// --- PAYMENTS ---
export const addPayment = async (payment: Omit<SupplierPayment, 'id' | 'timestamp'>): Promise<SupplierPayment> => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('payments').insert([{
        date: payment.date, supplier_name: payment.supplierName, amount: payment.amount,
        payment_mode: payment.paymentMode, notes: payment.notes, created_by: payment.createdBy
      }]).select().single();
    if (error) { logSupabaseError('addPayment', error); throw error; }
    return { ...payment, id: data.id, timestamp: new Date(data.created_at).getTime() };
  } else {
    const newPayment: SupplierPayment = { ...payment, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() };
    const current = await getPayments();
    localStorage.setItem(LS_KEYS.PAYMENTS, JSON.stringify([...current, newPayment]));
    return newPayment;
  }
};

export const updatePayment = async (id: string, payment: Partial<SupplierPayment>): Promise<void> => {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.from('payments').update({
        date: payment.date, supplier_name: payment.supplierName, amount: payment.amount,
        payment_mode: payment.paymentMode, notes: payment.notes,
      }).eq('id', id);
    if (error) { logSupabaseError('updatePayment', error); throw error; }
  } else {
    const current = await getPayments();
    const index = current.findIndex(p => p.id === id);
    if (index !== -1) {
      current[index] = { ...current[index], ...payment };
      localStorage.setItem(LS_KEYS.PAYMENTS, JSON.stringify(current));
    }
  }
};

export const deletePayment = async (id: string): Promise<void> => {
  if (isSupabaseConfigured() && supabase) {
    const { error, count } = await supabase.from('payments').delete({ count: 'exact' }).eq('id', id);
    if (error) { logSupabaseError('deletePayment', error); throw error; }
    if (count === 0) throw new Error("ACCESS DENIED.");
  } else {
    const current = await getPayments();
    localStorage.setItem(LS_KEYS.PAYMENTS, JSON.stringify(current.filter(p => p.id !== id)));
  }
};

export const getPayments = async (): Promise<SupplierPayment[]> => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('payments').select('*').order('date', { ascending: false });
    if (error) { logSupabaseError('getPayments', error); return []; }
    return data.map((d: any) => ({
      id: d.id, date: d.date, supplierName: d.supplier_name, amount: Number(d.amount),
      paymentMode: d.payment_mode, notes: d.notes, createdBy: d.created_by, timestamp: new Date(d.created_at).getTime()
    }));
  } else {
    return safeJsonParse(localStorage.getItem(LS_KEYS.PAYMENTS), []);
  }
};

// --- USERS ---
export const getUsers = async (): Promise<User[]> => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('users').select('*').order('name');
    if (error) { logSupabaseError('getUsers', error); return INITIAL_USERS; }
    
    if (!data || data.length === 0) {
      const seedData = INITIAL_USERS.map(u => ({
        username: u.username, name: u.name, role: u.role, password_hash: u.passwordHash
      }));
      await supabase.from('users').insert(seedData);
      return INITIAL_USERS;
    }
    return data.map((d: any) => ({
      id: d.id, username: d.username, name: d.name, role: d.role, passwordHash: d.password_hash
    }));
  } else {
    const s = localStorage.getItem(LS_KEYS.USERS);
    if (!s) { localStorage.setItem(LS_KEYS.USERS, JSON.stringify(INITIAL_USERS)); return INITIAL_USERS; }
    return safeJsonParse(s, INITIAL_USERS);
  }
};

export const updateUserPassword = async (username: string, newPass: string): Promise<boolean> => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('users').update({ password_hash: newPass }).eq('username', username).select();
    if (error || !data || data.length === 0) return false;
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

// --- CLIENT LEDGER ---
export const getClientLedgerEntries = async (): Promise<ClientLedgerEntry[]> => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('client_ledger').select('*').order('date', { ascending: true });
    if (error) { logSupabaseError('getClientLedgerEntries', error); return []; }
    return data.map((d: any) => ({
      id: d.id,
      date: d.date,
      particulars: d.particulars,
      drCr: d.dr_cr,
      accountName: d.account_name,
      vchType: d.vch_type,
      vchNo: d.vch_no,
      debit: Number(d.debit),
      credit: Number(d.credit),
      description: d.description
    }));
  } else {
    return safeJsonParse(localStorage.getItem(LS_KEYS.LEDGER), []);
  }
};

export const bulkAddClientLedgerEntries = async (entries: ClientLedgerEntry[]): Promise<void> => {
  if (isSupabaseConfigured() && supabase) {
    // Delete existing to replace
    await supabase.from('client_ledger').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    const dbEntries = entries.map(e => ({
      date: e.date,
      particulars: e.particulars,
      dr_cr: e.drCr,
      account_name: e.accountName,
      vch_type: e.vchType,
      vch_no: e.vchNo,
      debit: e.debit,
      credit: e.credit,
      description: e.description
    }));

    // Batch insert 100 at a time
    const BATCH_SIZE = 100;
    for (let i = 0; i < dbEntries.length; i += BATCH_SIZE) {
      const chunk = dbEntries.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('client_ledger').insert(chunk);
      if (error) {
        logSupabaseError('bulkAddClientLedgerEntries', error);
        throw new Error(`Failed to upload batch ${i/BATCH_SIZE + 1}`);
      }
    }
  } else {
    localStorage.setItem(LS_KEYS.LEDGER, JSON.stringify(entries));
  }
};

// --- GENERATED INVOICES ---
export const saveGeneratedInvoice = async (month: string, category: string, totalAmount: number, pdfBlob: Blob): Promise<GeneratedInvoice | null> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const fileName = `invoice_${category}_${month}_${Date.now()}.pdf`.replace(/\s+/g, '_');
      const { error: uploadError } = await supabase.storage.from('invoices').upload(fileName, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true
      });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('invoices').getPublicUrl(fileName);
      const fileUrl = publicUrlData.publicUrl;

      const { data, error } = await supabase.from('generated_invoices').insert([{
        month,
        category,
        total_amount: totalAmount,
        file_url: fileUrl
      }]).select().single();

      if (error) throw error;

      return {
        id: data.id,
        month: data.month,
        category: data.category,
        totalAmount: Number(data.total_amount),
        fileUrl: data.file_url,
        createdAt: data.created_at
      };
    } catch (e) {
      console.error("Failed to save generated invoice:", e);
      throw e;
    }
  } else {
    console.warn("Supabase not configured, cannot save invoice to database.");
    // Fallback to local storage (mock saving)
    const newInv: GeneratedInvoice = {
      id: Math.random().toString(),
      month,
      category,
      totalAmount,
      fileUrl: '#', 
      createdAt: new Date().toISOString()
    };
    const current = safeJsonParse<GeneratedInvoice[]>(localStorage.getItem(LS_KEYS.INVOICES), []);
    localStorage.setItem(LS_KEYS.INVOICES, JSON.stringify([newInv, ...current]));
    return newInv;
  }
};

export const getSavedInvoices = async (): Promise<GeneratedInvoice[]> => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('generated_invoices').select('*').order('created_at', { ascending: false });
    if (error) { logSupabaseError('getSavedInvoices', error); return []; }
    return data.map((d: any) => ({
      id: d.id,
      month: d.month,
      category: d.category,
      totalAmount: Number(d.total_amount),
      fileUrl: d.file_url,
      createdAt: d.created_at
    }));
  } else {
    return safeJsonParse(localStorage.getItem(LS_KEYS.INVOICES), []);
  }
};
