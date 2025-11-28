import { User, UserRole, MaterialType, InvoiceCategory } from './types';

export const INITIAL_USERS: User[] = [
  { id: '1', username: 'Nilesh Kene', name: 'Nilesh Kene', role: UserRole.ADMIN, passwordHash: 'admin' },
  { id: '2', username: 'Pralhad Kene', name: 'Pralhad Kene', role: UserRole.USER, passwordHash: 'admin@123' },
  { id: '3', username: 'Dhiraj Kene', name: 'Dhiraj Kene', role: UserRole.USER, passwordHash: 'admin@123' },
  { id: '4', username: 'Ajay Kene', name: 'Ajay Kene', role: UserRole.USER, passwordHash: 'admin@123' },
  { id: '5', username: 'Bhavesh Kene', name: 'Bhavesh Kene', role: UserRole.USER, passwordHash: 'admin@123' },
];

export const MATERIALS_LIST = [
  MaterialType.WASHSAND,
  MaterialType.CRUSHSAND,
  MaterialType.METAL1,
  MaterialType.METAL2,
  MaterialType.METAL4,
  MaterialType.RUBBLE,
  MaterialType.GSB,
  MaterialType.CONSTRUCTION_WATER,
  MaterialType.DRINKING_WATER,
  MaterialType.BORING_WATER,
  MaterialType.DRINKING_JAR,
  MaterialType.JCB,
  MaterialType.DUMPER
];

export const UNITS: Record<string, string> = {
  [MaterialType.WASHSAND]: 'Brass',
  [MaterialType.CRUSHSAND]: 'Brass',
  [MaterialType.METAL1]: 'Brass',
  [MaterialType.METAL2]: 'Brass',
  [MaterialType.METAL4]: 'Brass',
  [MaterialType.RUBBLE]: 'Brass',
  [MaterialType.GSB]: 'Brass',
  [MaterialType.CONSTRUCTION_WATER]: 'Tanker',
  [MaterialType.DRINKING_WATER]: 'Tanker',
  [MaterialType.BORING_WATER]: 'Tanker',
  [MaterialType.DRINKING_JAR]: 'Jars',
  [MaterialType.JCB]: 'Hours',
  [MaterialType.DUMPER]: 'Hours' 
};

export const SITE_NAME = "Arihant Aaradhya";

export const DEFAULT_RATES: Record<string, number> = {
  [MaterialType.METAL1]: 2650,
  [MaterialType.METAL2]: 2650,
  [MaterialType.WASHSAND]: 6350,
  [MaterialType.CRUSHSAND]: 3550,
  [MaterialType.RUBBLE]: 2200,
  [MaterialType.DUMPER]: 7000,
  [MaterialType.JCB]: 1000,
  [MaterialType.CONSTRUCTION_WATER]: 1400,
  [MaterialType.DRINKING_WATER]: 1900,
  [MaterialType.BORING_WATER]: 1400,
  [MaterialType.DRINKING_JAR]: 40
};

export const MATERIAL_CATEGORIES: Record<string, InvoiceCategory> = {
  [MaterialType.WASHSAND]: 'Building Material',
  [MaterialType.CRUSHSAND]: 'Building Material',
  [MaterialType.METAL1]: 'Building Material',
  [MaterialType.METAL2]: 'Building Material',
  [MaterialType.METAL4]: 'Building Material',
  [MaterialType.RUBBLE]: 'Building Material',
  [MaterialType.GSB]: 'Building Material',
  [MaterialType.CONSTRUCTION_WATER]: 'Water Supply',
  [MaterialType.DRINKING_WATER]: 'Water Supply',
  [MaterialType.BORING_WATER]: 'Water Supply',
  [MaterialType.DRINKING_JAR]: 'Water Supply',
  [MaterialType.JCB]: 'Machinery',
  [MaterialType.DUMPER]: 'Machinery'
};

export const GST_RATES: Record<InvoiceCategory, { cgst: number, sgst: number }> = {
  'Building Material': { cgst: 2.5, sgst: 2.5 },
  'Machinery': { cgst: 9, sgst: 9 },
  'Water Supply': { cgst: 0, sgst: 0 }
};

export const PREDEFINED_VEHICLES = [
  { number: 'MH46BB8065', capacity: 6 },
  { number: 'MH46F3651', capacity: 6.56 },
  { number: 'MH04CX7400', capacity: 6.72 },
  { number: 'MH48BB8284', capacity: 6.2 }
];