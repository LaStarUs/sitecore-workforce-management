import { Link } from 'react-router-dom';
import { useUser } from '../auth/AuthContext';
import { canApproveHolidays } from '../auth/permissions';
import { fullName } from '../domain/compliance';
import { daysBetween, formatDate } from '../domain/dates';
import { useWorkforce } from '../state/WorkforceContext';

export function HolidaysPage() {
  const user = useUser();
  const { visibleOperatives, data, today, dispatch } = useWorkforce();
  const canApprove = canApproveHolidays(user);

  const rows = visibleOperatives
    .flatMap((op) => op.holidays.map((h) => ({ op, h })))
    .filter(({ h }) => h.end >= today && h.status !== 'declined')
    .sort((a, b) => a.h.start.localeCompare(b.h.start));

  const pending = rows.filter((r) => r.h.status === 'requested').length;

  return (
    <div className="page">
      <header className="page__header">
        <h1>Holidays</h1>
        <p>{pending === 0 ? 'No requests waiting.' : `${pending} ${pending === 1 ? 'request' : 'requests'} waiting for approval.`}</p>
      </header>
      {rows.length === 0 ? (
        <p className="empty">No upcoming holidays. Requests made on an operative’s page appear here.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Operative</th>
                <th scope="col">Project</th>
                <th scope="col">Dates</th>
                <th scope="col" className="num">Days</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ op, h }) => (
                <tr key={h.id}>
                  <th scope="row">
                    <Link to={`/operatives/${op.id}`}>{fullName(op)}</Link>
                  </th>
                  <td>{data.projects.find((p) => p.id === op.projectId)?.name}</td>
                  <td>
                    {formatDate(h.start)} to {formatDate(h.end)}
                    {h.start <= today && <small>On leave now</small>}
                  </td>
                  <td className="num">{daysBetween(h.start, h.end) + 1}</td>
                  <td>
                    {h.status === 'requested' && canApprove ? (
                      <span className="row-actions">
                        <button className="btn btn--small btn--primary" onClick={() => dispatch({ type: 'holiday/statusChanged', operativeId: op.id, holidayId: h.id, status: 'approved' })}>
                          Approve
                        </button>
                        <button className="btn btn--small btn--quiet" onClick={() => dispatch({ type: 'holiday/statusChanged', operativeId: op.id, holidayId: h.id, status: 'declined' })}>
                          Decline
                        </button>
                      </span>
                    ) : (
                      <span className={`pill pill--${h.status}`}>{h.status}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
