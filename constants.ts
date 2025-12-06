
import { User, UserRole, MaterialType, InvoiceCategory } from './types';

export const INITIAL_USERS: User[] = [
  { id: '1', username: 'Nilesh Kene', name: 'Nilesh Kene', role: UserRole.ADMIN, passwordHash: 'admin' },
  { id: '2', username: 'Pralhad Kene', name: 'Pralhad Kene', role: UserRole.USER, passwordHash: 'admin@123' },
  { id: '3', username: 'Dhiraj Kene', name: 'Dhiraj Kene', role: UserRole.USER, passwordHash: 'admin@123' },
  { id: '4', username: 'Ajay Kene', name: 'Ajay Kene', role: UserRole.USER, passwordHash: 'admin@123' },
  { id: '5', username: 'Bhavesh Kene', name: 'Bhavesh Kene', role: UserRole.USER, passwordHash: 'admin@123' },
  { id: '6', username: 'Umesh Kene', name: 'Umesh Kene', role: UserRole.USER, passwordHash: 'Umesh@123' }
];

export const SUPPLIERS_LIST = [
  'Pralhad Kene',
  'Ajay Kene',
  'Vijay Bhandari',
  'Kalpesh Patil',
  'Rajesh Yadav',
  'Shehnawaz (Washsand supplier)',
  'Om Sai Quarry'
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

export const PHASES_LIST = [
  "Phase - 1",
  "Phase - 2",
  "Phase - 3",
  "Phase - 4",
  "Phase - 5",
  "Phase - 6",
  "Phase - 7",
  "Any other"
];

// --- COMPANY DETAILS FOR PDF (MATCHING IMAGE) ---
export const COMPANY_DETAILS = {
  name: "JAY MALHAR ENTERPRISES",
  subtitle: "BUILDING MATERIAL SUPPLIER",
  address: "At. Bapgaon, Post. Loand, Tal. Bhiwandi, Dist. Thane, Maharashtra",
  gstin: "27AASFJ3172C1ZA",
  stateCode: "27",
  bankName: "Federal Bank, Kalyan (W)",
  acNo: "15420200005950",
  ifsc: "FDRL0001542"
};

export const CUSTOMER_DETAILS = {
  name: "Arihant Superstructures Ltd.",
  address: "Arihant Aura, B-Wing, 25th Floor, Plot 13/1, TTC Industrial Area, Vashi",
  gstin: "27AABCS1848L1Z2",
  stateCode: "421302" // As per image
};

export const DEFAULT_RATES: Record<string, number> = {
  [MaterialType.METAL1]: 2650,
  [MaterialType.METAL2]: 2650,
  [MaterialType.METAL4]: 2650,
  [MaterialType.GSB]: 2000,
  [MaterialType.WASHSAND]: 6600, 
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

// NEW: Mapping for sub-categories
export const CATEGORY_SUBCATEGORIES: Record<string, string[]> = {
  'Water Supply': [
    MaterialType.CONSTRUCTION_WATER, 
    MaterialType.DRINKING_WATER, 
    MaterialType.BORING_WATER, 
    MaterialType.DRINKING_JAR
  ],
  'Machinery': [
    MaterialType.JCB, 
    MaterialType.DUMPER
  ]
};

export const GST_RATES: Record<InvoiceCategory, { cgst: number, sgst: number }> = {
  'Building Material': { cgst: 2.5, sgst: 2.5 },
  'Machinery': { cgst: 9, sgst: 9 },
  'Water Supply': { cgst: 0, sgst: 0 }
};

const BUILDING_MATERIALS_GROUP = [
  MaterialType.WASHSAND,
  MaterialType.CRUSHSAND,
  MaterialType.METAL1,
  MaterialType.METAL2,
  MaterialType.METAL4,
  MaterialType.RUBBLE,
  MaterialType.GSB
];

export const PREDEFINED_VEHICLES = [
  // Building Materials
  { number: 'MH46BB8065', capacity: 6, materials: BUILDING_MATERIALS_GROUP },
  { number: 'MH46F3651', capacity: 6.56, materials: BUILDING_MATERIALS_GROUP },
  { number: 'MH04CX7400', capacity: 6.72, materials: BUILDING_MATERIALS_GROUP },
  { number: 'MH48BB8284', capacity: 6.2, materials: BUILDING_MATERIALS_GROUP },
  
  // Machinery
  { number: 'MH041509', capacity: 1, materials: [MaterialType.DUMPER] }, 
  
  // Water & Jars
  { number: 'MH12FC2877', capacity: 1, materials: [MaterialType.BORING_WATER] }, 
  { number: 'MH05K8980', capacity: 1, materials: [MaterialType.DRINKING_WATER] },  
  { number: 'MH04GQ7386', capacity: 1, materials: [MaterialType.DRINKING_JAR] }, 
  { number: 'MH05DD7725', capacity: 1, materials: [MaterialType.CONSTRUCTION_WATER] }, 
];
