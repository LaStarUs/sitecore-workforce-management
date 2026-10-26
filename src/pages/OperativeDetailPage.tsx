import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useUser } from '../auth/AuthContext';
import { canEditOperative, canSeeContactDetails } from '../auth/permissions';
import { fullName, operativeStatus, qualificationCells } from '../domain/compliance';
import { addMonths, formatDate } from '../domain/dates';
import { validateHoliday, validateQualification, type Errors, type QualificationDraft } from '../domain/validation';
import type { Operative } from '../domain/types';
import { useWorkforce } from '../state/WorkforceContext';
import { Field } from '../components/Field';
import { OperativeForm } from '../components/OperativeForm';
import { StatusBadge } from '../components/StatusBadge';

const MEDICAL_LABEL = { fit: 'Fit', 'fit-with-restrictions': 'Fit with restrictions', unfit: 'Unfit', booked: 'Appointment booked' } as const;

export function OperativeDetailPage() {
  const { id } = useParams();
  const user = useUser();
  const { visibleOperatives, data, today, dispatch } = useWorkforce();
  const [editing, setEditing] = useState(false);
  const op = visibleOperatives.find((o) => o.id === id);

  if (!op) {
    return (
      <div className="page">
        <h1>Operative not found</h1>
        <p className="empty">
          This record doesn’t exist or isn’t on one of your projects. <Link to="/operatives">Back to all operatives</Link>
        </p>
      </div>
    );
  }

  const canEdit = canEditOperative(user, op);
  const status = operativeStatus(op, data.qualificationTypes, today);
  const project = data.projects.find((p) => p.id === op.projectId);

  return (
    <div className="page">
      <p className="crumb">
        <Link to="/operatives">Operatives</Link>
      </p>
      <header className="page__header">
        <div>
          <h1>{fullName(op)}</h1>
          <p>
            {op.trade}, {op.agency} · {project?.name}
          </p>
        </div>
        <div className="page__actions">
          <StatusBadge status={status} />
          {canEdit && !editing && (
            <button className="btn" onClick={() => setEditing(true)}>
              Edit details
            </button>
          )}
          {canEdit && (
            <button className="btn btn--quiet" onClick={() => dispatch({ type: 'operative/activeToggled', id: op.id })}>
              {op.active ? 'Archive' : 'Reactivate'}
            </button>
          )}
        </div>
      </header>

      {!op.active && <p className="notice">This operative is archived and left out of compliance totals.</p>}
      {editing && <OperativeForm operative={op} onDone={() => setEditing(false)} />}

      {canSeeContactDetails(user) && (
        <dl className="facts">
          <div><dt>Mobile</dt><dd>{op.phone || 'Not recorded'}</dd></div>
          <div><dt>Email</dt><dd>{op.email || 'Not recorded'}</dd></div>
          <div><dt>Reference</dt><dd>{op.id}</dd></div>
        </dl>
      )}

      <section className="panel" aria-labelledby="quals-heading">
        <h2 id="quals-heading">Qualifications</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Qualification</th>
                <th scope="col">Certificate</th>
                <th scope="col">Expires</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {qualificationCells(op, data.qualificationTypes, today).map((cell) => (
                <tr key={cell.type.id}>
                  <th scope="row">
                    {cell.type.name}
                    {!cell.type.mandatory && <small>Optional</small>}
                  </th>
                  <td>{cell.record?.certificateNo ?? '—'}</td>
                  <td>{cell.record ? formatDate(cell.record.expires) : '—'}</td>
                  <td>
                    {cell.record || cell.type.mandatory ? <StatusBadge status={cell.status} /> : <span className="muted">Not held</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {canEdit && <QualificationForm operative={op} />}
      </section>

      <div className="split">
        <section className="panel" aria-labelledby="medical-heading">
          <h2 id="medical-heading">Medical</h2>
          {op.medical ? (
            <dl className="facts facts--stacked">
              <div><dt>Last check</dt><dd>{formatDate(op.medical.date)}</dd></div>
              <div><dt>Outcome</dt><dd>{MEDICAL_LABEL[op.medical.outcome]}</dd></div>
              <div><dt>Next due</dt><dd>{formatDate(op.medical.nextDue)}{op.medical.nextDue < today && <StatusBadge status="expired">Overdue</StatusBadge>}</dd></div>
            </dl>
          ) : (
            <p className="empty">No medical on record. Book one before this operative starts on site.</p>
          )}
        </section>

        <section className="panel" aria-labelledby="holiday-heading">
          <h2 id="holiday-heading">Holidays</h2>
          {op.holidays.length === 0 ? (
            <p className="empty">No holidays booked.</p>
          ) : (
            <ul className="plain-list">
              {op.holidays.map((h) => (
                <li key={h.id}>
                  {formatDate(h.start)} to {formatDate(h.end)} <span className={`pill pill--${h.status}`}>{h.status}</span>
                </li>
              ))}
            </ul>
          )}
          {canEdit && <HolidayForm operativeId={op.id} />}
        </section>
      </div>
    </div>
  );
}

function QualificationForm({ operative }: { operative: Operative }) {
  const { data, today, dispatch } = useWorkforce();
  const [open, setOpen] = useState(false);
  const empty: QualificationDraft = { typeId: '', certificateNo: '', issued: today, expires: '' };
  const [draft, setDraft] = useState(empty);
  const [errors, setErrors] = useState<Errors<QualificationDraft>>({});

  if (!open) {
    return (
      <button className="btn" onClick={() => setOpen(true)}>
        Record or renew a qualification
      </button>
    );
  }

  function chooseType(typeId: string) {
    const type = data.qualificationTypes.find((t) => t.id === typeId);
    // Suggest an expiry from the course's usual validity; the user can change it.
    setDraft((d) => ({ ...d, typeId, expires: type && d.issued ? addMonths(d.issued, type.validityMonths) : d.expires }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const found = validateQualification(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    dispatch({ type: 'qualification/saved', operativeId: operative.id, record: { ...draft, certificateNo: draft.certificateNo.trim() } });
    setDraft(empty);
    setOpen(false);
  }

  return (
    <form className="form form--inline" onSubmit={submit} noValidate aria-label="Record a qualification">
      <div className="form__grid">
        <Field label="Qualification" as="select" value={draft.typeId} onChange={chooseType} error={errors.typeId}>
          <option value="">Choose a qualification</option>
          {data.qualificationTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Field>
        <Field label="Certificate number" value={draft.certificateNo} onChange={(v) => setDraft((d) => ({ ...d, certificateNo: v }))} error={errors.certificateNo} />
        <Field label="Issued" type="date" value={draft.issued} onChange={(v) => setDraft((d) => ({ ...d, issued: v }))} error={errors.issued} />
        <Field label="Expires" type="date" value={draft.expires} onChange={(v) => setDraft((d) => ({ ...d, expires: v }))} error={errors.expires} />
      </div>
      <div className="form__actions">
        <button className="btn btn--primary" type="submit">
          Save qualification
        </button>
        <button className="btn btn--quiet" type="button" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function HolidayForm({ operativeId }: { operativeId: string }) {
  const { dispatch } = useWorkforce();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const problem = validateHoliday(start, end);
    setError(problem);
    if (problem) return;
    dispatch({ type: 'holiday/requested', operativeId, holiday: { id: `h-${Date.now().toString(36)}`, start, end, status: 'requested' } });
    setStart('');
    setEnd('');
  }

  return (
    <form className="form form--inline" onSubmit={submit} noValidate aria-label="Request a holiday">
      <div className="form__grid form__grid--two">
        <Field label="First day" type="date" value={start} onChange={setStart} />
        <Field label="Last day" type="date" value={end} onChange={setEnd} error={error ?? undefined} />
      </div>
      <button className="btn" type="submit">
        Request holiday
      </button>
    </form>
  );
}
