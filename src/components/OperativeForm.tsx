import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../auth/AuthContext';
import { validateOperative, type Errors, type OperativeDraft } from '../domain/validation';
import type { Operative } from '../domain/types';
import { useWorkforce } from '../state/WorkforceContext';
import { Field } from './Field';

const EMPTY: OperativeDraft = { firstName: '', lastName: '', trade: '', agency: 'Direct', projectId: '', phone: '', email: '' };

/** Adds a new operative, or edits one when `operative` is passed. */
export function OperativeForm({ operative, onDone }: { operative?: Operative; onDone: () => void }) {
  const user = useUser();
  const { data, dispatch } = useWorkforce();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<OperativeDraft>(operative ?? EMPTY);
  const [errors, setErrors] = useState<Errors<OperativeDraft>>({});

  const projects = user.role === 'manager' ? data.projects.filter((p) => user.projectIds?.includes(p.id)) : data.projects;
  const set = (key: keyof OperativeDraft) => (value: string) => setDraft((d) => ({ ...d, [key]: value }));

  function submit(event: FormEvent) {
    event.preventDefault();
    const found = validateOperative(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    if (operative) {
      dispatch({ type: 'operative/updated', operative: { ...operative, ...draft } });
      onDone();
      return;
    }
    const id = `op-${Date.now().toString(36)}`;
    dispatch({
      type: 'operative/added',
      operative: { ...draft, id, type: 'operative', active: true, qualifications: [], medical: null, holidays: [] },
    });
    onDone();
    navigate(`/operatives/${id}`);
  }

  return (
    <form className="form form--panel" onSubmit={submit} noValidate aria-labelledby="operative-form-heading">
      <h2 id="operative-form-heading">{operative ? 'Edit details' : 'Add an operative'}</h2>
      <div className="form__grid">
        <Field label="First name" value={draft.firstName} onChange={set('firstName')} error={errors.firstName} />
        <Field label="Last name" value={draft.lastName} onChange={set('lastName')} error={errors.lastName} />
        <Field label="Trade" value={draft.trade} onChange={set('trade')} error={errors.trade} />
        <Field label="Agency" value={draft.agency} onChange={set('agency')} />
        <Field label="Project" value={draft.projectId} onChange={set('projectId')} error={errors.projectId} as="select">
          <option value="">Choose a project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Field>
        <Field label="Mobile (optional)" value={draft.phone} onChange={set('phone')} error={errors.phone} type="tel" />
        <Field label="Email (optional)" value={draft.email} onChange={set('email')} error={errors.email} type="email" />
      </div>
      <div className="form__actions">
        <button className="btn btn--primary" type="submit">
          {operative ? 'Save changes' : 'Add operative'}
        </button>
        <button className="btn btn--quiet" type="button" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}
