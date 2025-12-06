
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  passwordHash: string;
  name: string;
}

export enum MaterialType {
  WASHSAND = 'Washsand',
  CRUSHSAND = 'Crushsand',
  METAL1 = 'Metal 1',
  METAL2 = 'Metal 2',
  METAL4 = 'Metal 4',
  RUBBLE = 'Rubble',
  GSB = 'GSB',
  CONSTRUCTION_WATER = 'Construction Water',
  DRINKING_WATER = 'Drinking Water',
  BORING_WATER = 'Boring Water',
  DRINKING_JAR = 'Drinking Jar (20L)',
  JCB = 'JCB',
  DUMPER = 'Dumper'
}

export interface MaterialEntry {
  id: string;
  date: string;
  challanNumber: string;
  material: MaterialType;
  quantity: number;
  unit: string;
  vehicleNumber?: string;
  siteName: string;
  createdBy: string;
  timestamp: number;
}

export interface SupplierPayment {
  id: string;
  date: string;
  supplierName: string;
  amount: number;
  paymentMode: string;
  notes?: string;
  createdBy: string;
  timestamp: number;
}

export interface ChequeEntry {
  id: string;
  date: string;
  partyName: string;
  chequeNumber: string;
  bankName: string;
  amount: number;
  status: 'Pending' | 'Cleared' | 'Bounced';
  fileUrl?: string;
  createdBy: string;
  timestamp: number;
}

export type PageView = 'dashboard' | 'entries' | 'payments' | 'invoices' | 'cheques' | 'client-ledger' | 'admin';

export type InvoiceCategory = 'Building Material' | 'Water Supply' | 'Machinery';

export interface InvoiceItem {
  id: string;
  date: string;
  challanNumber: string;
  vehicleNumber: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface ClientLedgerEntry {
  id?: string;
  date: string;
  particulars: string;
  drCr?: string;
  accountName?: string;
  vchType: string;
  vchNo: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface GeneratedInvoice {
  id: string;
  month: string;
  category: string;
  totalAmount: number;
  fileUrl: string;
  createdAt: string;
}
