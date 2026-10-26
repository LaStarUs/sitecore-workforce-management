import type { IsoDate } from './types';

export interface OperativeDraft {
  firstName: string;
  lastName: string;
  trade: string;
  agency: string;
  projectId: string;
  phone: string;
  email: string;
}

export type Errors<T> = Partial<Record<keyof T, string>>;

const UK_PHONE = /^(\+44\s?7\d{3}|07\d{3})\s?\d{3}\s?\d{3}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateOperative(draft: OperativeDraft): Errors<OperativeDraft> {
  const errors: Errors<OperativeDraft> = {};
  if (!draft.firstName.trim()) errors.firstName = 'Enter a first name.';
  if (!draft.lastName.trim()) errors.lastName = 'Enter a last name.';
  if (!draft.trade.trim()) errors.trade = 'Enter a trade, for example Electrician.';
  if (!draft.projectId) errors.projectId = 'Choose a project.';
  if (draft.phone.trim() && !UK_PHONE.test(draft.phone.trim())) errors.phone = 'Enter a UK mobile number, for example 07700 900123.';
  if (draft.email.trim() && !EMAIL.test(draft.email.trim())) errors.email = 'Enter an email address like name@example.com.';
  return errors;
}

export interface QualificationDraft {
  typeId: string;
  certificateNo: string;
  issued: IsoDate;
  expires: IsoDate;
}

export function validateQualification(draft: QualificationDraft): Errors<QualificationDraft> {
  const errors: Errors<QualificationDraft> = {};
  if (!draft.typeId) errors.typeId = 'Choose a qualification.';
  if (!draft.certificateNo.trim()) errors.certificateNo = 'Enter the certificate or card number.';
  if (!draft.issued) errors.issued = 'Enter the issue date.';
  if (!draft.expires) errors.expires = 'Enter the expiry date.';
  if (draft.issued && draft.expires && draft.expires <= draft.issued) errors.expires = 'The expiry date must be after the issue date.';
  return errors;
}

export function validateHoliday(start: IsoDate, end: IsoDate): string | null {
  if (!start || !end) return 'Enter a start and end date.';
  if (end < start) return 'The last day can’t be before the first day.';
  return null;
}
