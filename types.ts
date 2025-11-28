export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  passwordHash: string; // Storing plain for demo/mock, typically hashed
  name: string;
}

export enum MaterialType {
  WASHSAND = 'Washsand',
  CRUSHSAND = 'Crushsand',
  METAL1 = 'Metal 1',
  METAL2 = 'Metal 2',
  METAL4 = 'Metal 4',
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
  unit: string; // brass, trip, litre, hours
  vehicleNumber?: string;
  siteName: string; // e.g., Arihant Aaradhya
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

export type PageView = 'dashboard' | 'entries' | 'payments' | 'admin' | 'settings';