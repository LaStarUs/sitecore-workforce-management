/** ISO date string, YYYY-MM-DD. Kept as a string so records serialise cleanly. */
export type IsoDate = string;

export type OperativeType = 'operative' | 'supervisor' | 'office';

export interface Project {
  id: string;
  name: string;
  location: string;
}

export interface QualificationType {
  id: string;
  name: string;
  /** Mandatory qualifications count as a compliance gap when missing. */
  mandatory: boolean;
  /** Typical validity in months, used to suggest an expiry date. */
  validityMonths: number;
}

export interface QualificationRecord {
  typeId: string;
  certificateNo: string;
  issued: IsoDate;
  expires: IsoDate;
}

export type MedicalOutcome = 'fit' | 'fit-with-restrictions' | 'unfit' | 'booked';

export interface MedicalCheck {
  date: IsoDate;
  outcome: MedicalOutcome;
  nextDue: IsoDate;
}

export type HolidayStatus = 'requested' | 'approved' | 'declined';

export interface Holiday {
  id: string;
  start: IsoDate;
  end: IsoDate;
  status: HolidayStatus;
}

export interface Operative {
  id: string;
  firstName: string;
  lastName: string;
  type: OperativeType;
  trade: string;
  agency: string;
  projectId: string;
  phone: string;
  email: string;
  active: boolean;
  qualifications: QualificationRecord[];
  medical: MedicalCheck | null;
  holidays: Holiday[];
}

export interface AuditEntry {
  id: string;
  at: string; // ISO timestamp
  user: string;
  action: string;
  detail: string;
}

export interface WorkforceData {
  operatives: Operative[];
  projects: Project[];
  qualificationTypes: QualificationType[];
  audit: AuditEntry[];
}
