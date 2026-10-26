import { describe, expect, it } from 'vitest';
import { createSeedData } from '../data/seed';
import { reducer, type State } from './reducer';

const meta = { user: 'Tester', at: '2026-10-26T09:00:00.000Z' };

function ready(): Extract<State, { status: 'ready' }> {
  return { status: 'ready', data: createSeedData(new Date('2026-10-26T09:00:00Z')) };
}

describe('reducer', () => {
  it('replaces an existing qualification of the same type instead of duplicating it', () => {
    const state = ready();
    const op = state.data.operatives[0];
    const record = { typeId: 'q-cscs', certificateNo: 'NEW-1', issued: '2026-10-26', expires: '2031-10-26' };
    const next = reducer(state, { type: 'qualification/saved', operativeId: op.id, record, meta });
    if (next.status !== 'ready') throw new Error('expected ready state');
    const updated = next.data.operatives[0];
    expect(updated.qualifications.filter((q) => q.typeId === 'q-cscs')).toEqual([record]);
  });

  it('writes an audit entry for every change, newest first', () => {
    const state = ready();
    const op = state.data.operatives[0];
    const next = reducer(state, { type: 'operative/activeToggled', id: op.id, meta });
    if (next.status !== 'ready') throw new Error('expected ready state');
    expect(next.data.audit[0]).toMatchObject({ user: 'Tester', action: 'Operative archived' });
    expect(next.data.audit).toHaveLength(state.data.audit.length + 1);
  });

  it('does not mutate the previous state', () => {
    const state = ready();
    const before = JSON.stringify(state);
    reducer(state, { type: 'operative/activeToggled', id: state.data.operatives[0].id, meta });
    expect(JSON.stringify(state)).toBe(before);
  });

  it('ignores changes for an unknown operative', () => {
    const state = ready();
    expect(reducer(state, { type: 'operative/activeToggled', id: 'nope', meta })).toBe(state);
  });
});
