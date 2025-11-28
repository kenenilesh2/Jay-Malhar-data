import { User, UserRole, MaterialType } from './types';

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
  [MaterialType.GSB]: 'Brass',
  [MaterialType.CONSTRUCTION_WATER]: 'Tanker',
  [MaterialType.DRINKING_WATER]: 'Tanker',
  [MaterialType.BORING_WATER]: 'Tanker',
  [MaterialType.DRINKING_JAR]: 'Jars (20L)',
  [MaterialType.JCB]: 'Hours',
  [MaterialType.DUMPER]: 'Trip'
};

export const SITE_NAME = "Arihant Aaradhya";
