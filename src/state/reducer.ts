import type { AuditEntry, Holiday, HolidayStatus, Operative, QualificationRecord, WorkforceData } from '../domain/types';
import { fullName } from '../domain/compliance';

/** Who made the change and when — every change is written to the audit log. */
export interface Meta {
  user: string;
  at: string;
}

export type Action =
  | { type: 'loaded'; data: WorkforceData }
  | { type: 'operative/added'; operative: Operative; meta: Meta }
  | { type: 'operative/updated'; operative: Operative; meta: Meta }
  | { type: 'operative/activeToggled'; id: string; meta: Meta }
  | { type: 'qualification/saved'; operativeId: string; record: QualificationRecord; meta: Meta }
  | { type: 'holiday/requested'; operativeId: string; holiday: Holiday; meta: Meta }
  | { type: 'holiday/statusChanged'; operativeId: string; holidayId: string; status: HolidayStatus; meta: Meta };

export type State = { status: 'loading' } | { status: 'ready'; data: WorkforceData };

function withAudit(data: WorkforceData, meta: Meta, action: string, detail: string): WorkforceData {
  const entry: AuditEntry = { id: `a-${meta.at}-${data.audit.length}`, at: meta.at, user: meta.user, action, detail };
  return { ...data, audit: [entry, ...data.audit] };
}

function updateOperative(data: WorkforceData, id: string, change: (op: Operative) => Operative): { data: WorkforceData; op?: Operative } {
  let changed: Operative | undefined;
  const operatives = data.operatives.map((op) => {
    if (op.id !== id) return op;
    changed = change(op);
    return changed;
  });
  return { data: { ...data, operatives }, op: changed };
}

export function reducer(state: State, action: Action): State {
  if (action.type === 'loaded') return { status: 'ready', data: action.data };
  if (state.status !== 'ready') return state;
  const { data } = state;

  switch (action.type) {
    case 'operative/added': {
      const next = { ...data, operatives: [...data.operatives, action.operative] };
      return { status: 'ready', data: withAudit(next, action.meta, 'Operative added', fullName(action.operative)) };
    }
    case 'operative/updated': {
      const { data: next, op } = updateOperative(data, action.operative.id, () => action.operative);
      if (!op) return state;
      return { status: 'ready', data: withAudit(next, action.meta, 'Operative updated', fullName(op)) };
    }
    case 'operative/activeToggled': {
      const { data: next, op } = updateOperative(data, action.id, (o) => ({ ...o, active: !o.active }));
      if (!op) return state;
      return { status: 'ready', data: withAudit(next, action.meta, op.active ? 'Operative reactivated' : 'Operative archived', fullName(op)) };
    }
    case 'qualification/saved': {
      const { data: next, op } = updateOperative(data, action.operativeId, (o) => ({
        ...o,
        qualifications: [...o.qualifications.filter((q) => q.typeId !== action.record.typeId), action.record],
      }));
      if (!op) return state;
      const typeName = data.qualificationTypes.find((t) => t.id === action.record.typeId)?.name ?? action.record.typeId;
      return { status: 'ready', data: withAudit(next, action.meta, 'Qualification recorded', `${typeName} for ${fullName(op)}, expires ${action.record.expires}`) };
    }
    case 'holiday/requested': {
      const { data: next, op } = updateOperative(data, action.operativeId, (o) => ({ ...o, holidays: [...o.holidays, action.holiday] }));
      if (!op) return state;
      return { status: 'ready', data: withAudit(next, action.meta, 'Holiday requested', `${fullName(op)}, ${action.holiday.start} to ${action.holiday.end}`) };
    }
    case 'holiday/statusChanged': {
      const { data: next, op } = updateOperative(data, action.operativeId, (o) => ({
        ...o,
        holidays: o.holidays.map((h) => (h.id === action.holidayId ? { ...h, status: action.status } : h)),
      }));
      if (!op) return state;
      return { status: 'ready', data: withAudit(next, action.meta, `Holiday ${action.status}`, fullName(op)) };
    }
  }
}
