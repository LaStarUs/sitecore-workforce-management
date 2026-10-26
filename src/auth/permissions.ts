import type { Operative } from '../domain/types';

export type Role = 'admin' | 'manager' | 'guest';

export interface User {
  username: string;
  displayName: string;
  role: Role;
  /** Managers only see and edit operatives on these projects. */
  projectIds?: string[];
}

/** Demo accounts for the public portfolio build. Not real credentials. */
export const DEMO_USERS: (User & { password: string; description: string })[] = [
  { username: 'admin', password: 'demo1234', displayName: 'Demo administrator', role: 'admin', description: 'Full access: edit records, approve holidays, reset data' },
  { username: 'manager', password: 'demo1234', displayName: 'Demo site manager', role: 'manager', projectIds: ['p-riverside', 'p-northgate'], description: 'Edits operatives on two projects only' },
  { username: 'guest', password: 'demo1234', displayName: 'Guest', role: 'guest', description: 'Read-only, contact details hidden' },
];

export function authenticate(username: string, password: string): User | null {
  const match = DEMO_USERS.find((u) => u.username === username.trim().toLowerCase() && u.password === password);
  if (!match) return null;
  const { password: _password, description: _description, ...user } = match;
  return user;
}

export function canSeeOperative(user: User, op: Operative): boolean {
  if (user.role === 'manager') return user.projectIds?.includes(op.projectId) ?? false;
  return true;
}

export function canEditOperative(user: User, op: Operative): boolean {
  if (user.role === 'admin') return true;
  if (user.role === 'manager') return canSeeOperative(user, op);
  return false;
}

export function canAddOperatives(user: User): boolean {
  return user.role !== 'guest';
}

export function canApproveHolidays(user: User): boolean {
  return user.role === 'admin';
}

export function canSeeContactDetails(user: User): boolean {
  return user.role !== 'guest';
}

export function canResetData(user: User): boolean {
  return user.role === 'admin';
}
