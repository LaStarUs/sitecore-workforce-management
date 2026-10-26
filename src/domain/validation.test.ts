import { describe, expect, it } from 'vitest';
import { validateHoliday, validateOperative, validateQualification } from './validation';

const valid = { firstName: 'Ana', lastName: 'Pop', trade: 'Painter', agency: 'Direct', projectId: 'p-1', phone: '', email: '' };

describe('validateOperative', () => {
  it('accepts a complete record with optional contact details left blank', () => {
    expect(validateOperative(valid)).toEqual({});
  });

  it('requires name, trade and project', () => {
    const errors = validateOperative({ ...valid, firstName: ' ', lastName: '', trade: '', projectId: '' });
    expect(Object.keys(errors).sort()).toEqual(['firstName', 'lastName', 'projectId', 'trade']);
  });

  it('checks UK mobile numbers and email format when given', () => {
    expect(validateOperative({ ...valid, phone: '07700 900123', email: 'ana@example.com' })).toEqual({});
    expect(validateOperative({ ...valid, phone: '12345', email: 'ana@' })).toMatchObject({ phone: expect.any(String), email: expect.any(String) });
  });
});

describe('validateQualification', () => {
  it('rejects an expiry date on or before the issue date', () => {
    const errors = validateQualification({ typeId: 'q', certificateNo: 'X', issued: '2026-01-01', expires: '2026-01-01' });
    expect(errors.expires).toMatch(/after the issue date/);
  });
});

describe('validateHoliday', () => {
  it('rejects an end date before the start date', () => {
    expect(validateHoliday('2026-11-10', '2026-11-01')).not.toBeNull();
    expect(validateHoliday('2026-11-01', '2026-11-01')).toBeNull();
  });
});
