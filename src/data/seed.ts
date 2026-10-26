import { addDays, addMonths, todayIso } from '../domain/dates';
import type { Holiday, MedicalCheck, Operative, OperativeType, Project, QualificationRecord, QualificationType, WorkforceData } from '../domain/types';

/**
 * Fictional demo data. Dates are generated relative to "today" so the demo
 * always shows a realistic mix of valid, expiring and expired records.
 * A seeded random generator keeps the data identical on every load.
 */

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const PROJECTS: Project[] = [
  { id: 'p-riverside', name: 'Riverside Terminal Fit-out', location: 'Docklands' },
  { id: 'p-northgate', name: 'Northgate Car Park Refurb', location: 'Northgate' },
  { id: 'p-eastworks', name: 'East Works Depot', location: 'Eastfield' },
];

export const QUALIFICATION_TYPES: QualificationType[] = [
  { id: 'q-cscs', name: 'CSCS card', mandatory: true, validityMonths: 60 },
  { id: 'q-manual', name: 'Manual handling', mandatory: true, validityMonths: 36 },
  { id: 'q-height', name: 'Working at height', mandatory: true, validityMonths: 36 },
  { id: 'q-asbestos', name: 'Asbestos awareness', mandatory: true, validityMonths: 12 },
  { id: 'q-firstaid', name: 'First aid at work', mandatory: false, validityMonths: 36 },
  { id: 'q-pasma', name: 'PASMA towers', mandatory: false, validityMonths: 60 },
];

const FIRST = ['Amelia', 'Tomasz', 'Kwame', 'Sofia', 'Daniel', 'Priya', 'Ioan', 'Grace', 'Marek', 'Chidi', 'Hannah', 'Luca', 'Aisha', 'Owen', 'Elif', 'Rory', 'Nadia', 'Ben', 'Yusuf', 'Clara', 'Jakub', 'Maya', 'Femi', 'Lewis'];
const LAST = ['Hart', 'Nowak', 'Mensah', 'Rossi', 'Price', 'Shah', 'Popescu', 'Walsh', 'Kowalski', 'Okafor', 'Reid', 'Bianchi', 'Khan', 'Lloyd', 'Demir', 'Byrne', 'Haddad', 'Fox', 'Ali', 'Meyer', 'Novak', 'Patel', 'Adeyemi', 'Grant'];
const TRADES = ['Electrician', 'Plumber', 'Dryliner', 'Labourer', 'Carpenter', 'Painter', 'Scaffolder'];
const AGENCIES = ['Direct', 'Brightline Labour', 'Keystone Recruitment', 'Trident Staffing'];

export function createSeedData(now: Date = new Date()): WorkforceData {
  const rand = mulberry32(2026);
  const pick = <T,>(items: T[]): T => items[Math.floor(rand() * items.length)];
  const today = todayIso(now);

  const operatives: Operative[] = FIRST.map((firstName, i) => {
    const lastName = LAST[i];
    const type: OperativeType = i < 3 ? 'supervisor' : i === 23 ? 'office' : 'operative';

    const qualifications: QualificationRecord[] = [];
    for (const qt of QUALIFICATION_TYPES) {
      const roll = rand();
      // Optional courses are held by roughly half the workforce.
      if (!qt.mandatory && roll < 0.5) continue;
      // A small share of mandatory records are missing, to show gaps.
      if (qt.mandatory && roll < 0.04) continue;
      // Spread expiry dates: most valid, some expiring soon, a few expired.
      const r = rand();
      const daysLeft = r < 0.1 ? -Math.ceil(rand() * 60) : r < 0.25 ? Math.ceil(rand() * 30) : 31 + Math.floor(rand() * 900);
      const expires = addDays(today, daysLeft);
      qualifications.push({
        typeId: qt.id,
        certificateNo: `${qt.id.slice(2).toUpperCase()}-${100000 + Math.floor(rand() * 899999)}`,
        issued: addMonths(expires, -qt.validityMonths),
        expires,
      });
    }

    const medicalRoll = rand();
    const lastCheck = addDays(today, -Math.floor(rand() * 340));
    const medical: MedicalCheck | null =
      medicalRoll < 0.08
        ? null
        : {
            date: lastCheck,
            outcome: medicalRoll < 0.14 ? 'booked' : medicalRoll < 0.22 ? 'fit-with-restrictions' : medicalRoll < 0.25 ? 'unfit' : 'fit',
            nextDue: addMonths(lastCheck, 12),
          };

    const holidays: Holiday[] = [];
    if (rand() < 0.45) {
      const start = addDays(today, Math.floor(rand() * 75) - 10);
      holidays.push({
        id: `h-${i}`,
        start,
        end: addDays(start, 2 + Math.floor(rand() * 9)),
        status: rand() < 0.65 ? 'approved' : 'requested',
      });
    }

    return {
      id: `op-${String(i + 1).padStart(3, '0')}`,
      firstName,
      lastName,
      type,
      trade: type === 'office' ? 'Site administrator' : type === 'supervisor' ? 'Site supervisor' : pick(TRADES),
      agency: type === 'operative' ? pick(AGENCIES) : 'Direct',
      projectId: PROJECTS[i % PROJECTS.length].id,
      phone: `07700 900${String(100 + i).slice(-3)}`,
      email: `${firstName}.${lastName}@example.com`.toLowerCase(),
      active: i !== 21,
      qualifications,
      medical,
      holidays,
    };
  });

  return {
    operatives,
    projects: PROJECTS,
    qualificationTypes: QUALIFICATION_TYPES,
    audit: [
      {
        id: 'a-0',
        at: now.toISOString(),
        user: 'system',
        action: 'Demo data loaded',
        detail: `${operatives.length} fictional operatives across ${PROJECTS.length} projects`,
      },
    ],
  };
}
