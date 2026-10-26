import { daysBetween } from './dates';
import type { IsoDate, Operative, QualificationRecord, QualificationType } from './types';

export type ComplianceStatus = 'valid' | 'expiring' | 'expired' | 'missing';

/** Qualifications expiring within this many days are flagged for renewal. */
export const EXPIRY_WARNING_DAYS = 30;

const SEVERITY: Record<ComplianceStatus, number> = { valid: 0, expiring: 1, missing: 2, expired: 3 };

export function qualificationStatus(record: QualificationRecord | undefined, today: IsoDate): ComplianceStatus {
  if (!record) return 'missing';
  const daysLeft = daysBetween(today, record.expires);
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= EXPIRY_WARNING_DAYS) return 'expiring';
  return 'valid';
}

export interface QualificationCell {
  type: QualificationType;
  record: QualificationRecord | undefined;
  status: ComplianceStatus;
  daysLeft: number | null;
}

/** One row of the training matrix: every qualification type for one operative. */
export function qualificationCells(op: Operative, types: QualificationType[], today: IsoDate): QualificationCell[] {
  return types.map((type) => {
    const record = op.qualifications.find((q) => q.typeId === type.id);
    return {
      type,
      record,
      status: qualificationStatus(record, today),
      daysLeft: record ? daysBetween(today, record.expires) : null,
    };
  });
}

/**
 * Overall status for an operative: the worst status among their qualifications.
 * Missing optional qualifications are ignored; missing mandatory ones count.
 */
export function operativeStatus(op: Operative, types: QualificationType[], today: IsoDate): ComplianceStatus {
  return qualificationCells(op, types, today)
    .filter((cell) => cell.type.mandatory || cell.record)
    .reduce<ComplianceStatus>((worst, cell) => (SEVERITY[cell.status] > SEVERITY[worst] ? cell.status : worst), 'valid');
}

export interface ComplianceSummary {
  total: number;
  valid: number;
  expiring: number;
  expired: number;
  missing: number;
  /** Share of active operatives with no issues, 0–100. */
  compliantPercent: number;
}

export function summarise(operatives: Operative[], types: QualificationType[], today: IsoDate): ComplianceSummary {
  const active = operatives.filter((o) => o.active);
  const counts = { valid: 0, expiring: 0, expired: 0, missing: 0 };
  for (const op of active) counts[operativeStatus(op, types, today)] += 1;
  return {
    total: active.length,
    ...counts,
    compliantPercent: active.length === 0 ? 100 : Math.round((counts.valid / active.length) * 100),
  };
}

export interface UpcomingExpiry {
  operative: Operative;
  type: QualificationType;
  expires: IsoDate;
  daysLeft: number;
}

/** Qualifications already expired or expiring within `withinDays`, soonest first. */
export function upcomingExpiries(
  operatives: Operative[],
  types: QualificationType[],
  today: IsoDate,
  withinDays = EXPIRY_WARNING_DAYS,
): UpcomingExpiry[] {
  const result: UpcomingExpiry[] = [];
  for (const operative of operatives.filter((o) => o.active)) {
    for (const q of operative.qualifications) {
      const type = types.find((t) => t.id === q.typeId);
      if (!type) continue;
      const daysLeft = daysBetween(today, q.expires);
      if (daysLeft <= withinDays) result.push({ operative, type, expires: q.expires, daysLeft });
    }
  }
  return result.sort((a, b) => a.daysLeft - b.daysLeft);
}

export function fullName(op: Pick<Operative, 'firstName' | 'lastName'>): string {
  return `${op.firstName} ${op.lastName}`;
}
