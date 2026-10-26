import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import { canSeeOperative } from '../auth/permissions';
import { todayIso } from '../domain/dates';
import type { WorkforceData } from '../domain/types';
import { type WorkforceRepository } from '../data/repository';
import { reducer, type Action, type Meta } from './reducer';

type ActionWithoutMeta = Action extends infer A ? (A extends { meta: Meta } ? Omit<A, 'meta'> : never) : never;

interface WorkforceValue {
  data: WorkforceData;
  /** Operatives the signed-in user is allowed to see. */
  visibleOperatives: WorkforceData['operatives'];
  today: string;
  dispatch: (action: ActionWithoutMeta) => void;
  resetDemo: () => Promise<void>;
}

const WorkforceContext = createContext<WorkforceValue | null>(null);

export function WorkforceProvider({ repository, children }: { repository: WorkforceRepository; children: ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, { status: 'loading' });
  const { user } = useAuth();
  const loadedFromStore = useRef(false);

  useEffect(() => {
    let cancelled = false;
    repository.load().then((data) => {
      if (cancelled) return;
      loadedFromStore.current = true;
      rawDispatch({ type: 'loaded', data });
    });
    return () => {
      cancelled = true;
    };
  }, [repository]);

  // Persist every change after the initial load.
  useEffect(() => {
    if (state.status === 'ready' && loadedFromStore.current) void repository.save(state.data);
  }, [state, repository]);

  const dispatch = useCallback(
    (action: ActionWithoutMeta) => {
      const meta: Meta = { user: user?.displayName ?? 'unknown', at: new Date().toISOString() };
      rawDispatch({ ...action, meta } as Action);
    },
    [user],
  );

  const resetDemo = useCallback(async () => {
    const data = await repository.reset();
    rawDispatch({ type: 'loaded', data });
  }, [repository]);

  const value = useMemo<WorkforceValue | null>(() => {
    if (state.status !== 'ready') return null;
    const visibleOperatives = user ? state.data.operatives.filter((op) => canSeeOperative(user, op)) : [];
    return { data: state.data, visibleOperatives, today: todayIso(), dispatch, resetDemo };
  }, [state, user, dispatch, resetDemo]);

  if (!value) {
    return (
      <div className="loading" role="status">
        Loading workforce records…
      </div>
    );
  }
  return <WorkforceContext.Provider value={value}>{children}</WorkforceContext.Provider>;
}

export function useWorkforce(): WorkforceValue {
  const ctx = useContext(WorkforceContext);
  if (!ctx) throw new Error('useWorkforce must be used inside <WorkforceProvider>');
  return ctx;
}
