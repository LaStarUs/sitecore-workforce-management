import { Link } from 'react-router-dom';
import { fullName } from '../domain/compliance';
import { daysBetween, formatDate } from '../domain/dates';
import { useWorkforce } from '../state/WorkforceContext';
import { StatusBadge } from '../components/StatusBadge';

const OUTCOME = { fit: 'Fit', 'fit-with-restrictions': 'Fit with restrictions', unfit: 'Unfit', booked: 'Appointment booked' } as const;

export function MedicalPage() {
  const { visibleOperatives, today } = useWorkforce();
  const rows = visibleOperatives
    .filter((o) => o.active)
    .map((op) => ({ op, daysToDue: op.medical ? daysBetween(today, op.medical.nextDue) : -Infinity }))
    .sort((a, b) => a.daysToDue - b.daysToDue);

  return (
    <div className="page">
      <header className="page__header">
        <h1>Medicals</h1>
        <p>Sorted by most urgent first.</p>
      </header>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Operative</th>
              <th scope="col">Last outcome</th>
              <th scope="col">Last check</th>
              <th scope="col">Next due</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ op, daysToDue }) => (
              <tr key={op.id}>
                <th scope="row">
                  <Link to={`/operatives/${op.id}`}>{fullName(op)}</Link>
                </th>
                <td>{op.medical ? OUTCOME[op.medical.outcome] : <StatusBadge status="missing">No medical</StatusBadge>}</td>
                <td>{op.medical ? formatDate(op.medical.date) : '—'}</td>
                <td>
                  {op.medical ? (
                    <>
                      {formatDate(op.medical.nextDue)}{' '}
                      {daysToDue < 0 ? <StatusBadge status="expired">Overdue</StatusBadge> : daysToDue <= 30 ? <StatusBadge status="expiring">Due soon</StatusBadge> : null}
                    </>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
