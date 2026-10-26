import { describe, expect, it } from 'vitest';
import { operativeStatus, qualificationStatus, summarise, upcomingExpiries } from './compliance';
import type { Operative, QualificationType } from './types';

const TODAY = '2026-10-26';

const types: QualificationType[] = [
  { id: 'cscs', name: 'CSCS card', mandatory: true, validityMonths: 60 },
  { id: 'aid', name: 'First aid', mandatory: false, validityMonths: 36 },
];

function operative(overrides: Partial<Operative> = {}): Operative {
  return {
    id: 'op-1',
    firstName: 'Test',
    lastName: 'Person',
    type: 'operative',
    trade: 'Electrician',
    agency: 'Direct',
    projectId: 'p-1',
    phone: '',
    email: '',
    active: true,
    qualifications: [{ typeId: 'cscs', certificateNo: 'A1', issued: '2024-01-01', expires: '2029-01-01' }],
    medical: null,
    holidays: [],
    ...overrides,
  };
}

describe('qualificationStatus', () => {
  it('is missing when there is no record', () => {
    expect(qualificationStatus(undefined, TODAY)).toBe('missing');
  });

  it('is expired the day after the expiry date', () => {
    expect(qualificationStatus({ typeId: 'x', certificateNo: '1', issued: '2020-01-01', expires: '2026-10-25' }, TODAY)).toBe('expired');
  });

  it('is still expiring (not expired) on the expiry date itself', () => {
    expect(qualificationStatus({ typeId: 'x', certificateNo: '1', issued: '2020-01-01', expires: TODAY }, TODAY)).toBe('expiring');
  });

  it('flags records expiring within 30 days and treats day 31 as valid', () => {
    expect(qualificationStatus({ typeId: 'x', certificateNo: '1', issued: '2020-01-01', expires: '2026-11-25' }, TODAY)).toBe('expiring');
    expect(qualificationStatus({ typeId: 'x', certificateNo: '1', issued: '2020-01-01', expires: '2026-11-26' }, TODAY)).toBe('valid');
  });
});

describe('operativeStatus', () => {
  it('ignores optional qualifications the operative does not hold', () => {
    expect(operativeStatus(operative(), types, TODAY)).toBe('valid');
  });

  it('reports a missing mandatory qualification', () => {
    expect(operativeStatus(operative({ qualifications: [] }), types, TODAY)).toBe('missing');
  });

  it('uses the worst status across all held qualifications', () => {
    const op = operative({
      qualifications: [
        { typeId: 'cscs', certificateNo: 'A1', issued: '2024-01-01', expires: '2029-01-01' },
        { typeId: 'aid', certificateNo: 'B2', issued: '2023-01-01', expires: '2026-01-01' },
      ],
    });
    expect(operativeStatus(op, types, TODAY)).toBe('expired');
  });
});

describe('summarise', () => {
  it('counts active operatives only and works out the compliant share', () => {
    const ops = [
      operative({ id: 'a' }),
      operative({ id: 'b', qualifications: [] }),
      operative({ id: 'c', active: false, qualifications: [] }),
    ];
    expect(summarise(ops, types, TODAY)).toEqual({ total: 2, valid: 1, expiring: 0, expired: 0, missing: 1, compliantPercent: 50 });
  });

  it('reports 100% when there is nobody to check', () => {
    expect(summarise([], types, TODAY).compliantPercent).toBe(100);
  });
});

describe('upcomingExpiries', () => {
  it('lists expired and soon-expiring records, soonest first', () => {
    const ops = [
      operative({ id: 'a', qualifications: [{ typeId: 'cscs', certificateNo: '1', issued: '2021-01-01', expires: '2026-11-10' }] }),
      operative({ id: 'b', qualifications: [{ typeId: 'cscs', certificateNo: '2', issued: '2021-01-01', expires: '2026-10-01' }] }),
      operative({ id: 'c' }),
    ];
    expect(upcomingExpiries(ops, types, TODAY).map((e) => [e.operative.id, e.daysLeft])).toEqual([
      ['b', -25],
      ['a', 15],
    ]);
  });
});
