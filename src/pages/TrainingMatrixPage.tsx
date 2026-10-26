import { Link, useSearchParams } from 'react-router-dom';
import { fullName, operativeStatus, qualificationCells } from '../domain/compliance';
import { formatDate } from '../domain/dates';
import { useWorkforce } from '../state/WorkforceContext';
import { statusLabel } from '../components/StatusBadge';

/** Grid of every operative against every qualification, coloured by status. */
export function TrainingMatrixPage() {
  const { visibleOperatives, data, today } = useWorkforce();
  const [params, setParams] = useSearchParams();
  const issuesOnly = params.get('filter') === 'issues';
  const types = data.qualificationTypes;

  const rows = visibleOperatives
    .filter((op) => op.active)
    .filter((op) => !issuesOnly || operativeStatus(op, types, today) !== 'valid')
    .sort((a, b) => a.lastName.localeCompare(b.lastName));

  return (
    <div className="page">
      <header className="page__header">
        <h1>Training matrix</h1>
        <label className="check">
          <input
            type="checkbox"
            checked={issuesOnly}
            onChange={(e) => setParams(e.target.checked ? { filter: 'issues' } : {})}
          />
          Only show operatives with an issue
        </label>
      </header>

      <ul className="matrix-key" aria-label="Key">
        <li><span className="cell cell--valid" aria-hidden="true" />Valid</li>
        <li><span className="cell cell--expiring" aria-hidden="true" />Expires within 30 days</li>
        <li><span className="cell cell--expired" aria-hidden="true" />Expired</li>
        <li><span className="cell cell--missing" aria-hidden="true" />Mandatory, not held</li>
        <li><span className="cell cell--none" aria-hidden="true" />Optional, not held</li>
      </ul>

      {rows.length === 0 ? (
        <p className="empty">Everyone is fully compliant. Untick the filter to see the full matrix.</p>
      ) : (
        <div className="table-wrap">
          <table className="matrix">
            <thead>
              <tr>
                <th scope="col">Operative</th>
                {types.map((t) => (
                  <th scope="col" key={t.id}>
                    <span>{t.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((op) => (
                <tr key={op.id}>
                  <th scope="row">
                    <Link to={`/operatives/${op.id}`}>{fullName(op)}</Link>
                    <small>{op.trade}</small>
                  </th>
                  {qualificationCells(op, types, today).map((cell) => {
                    const held = Boolean(cell.record);
                    const variant = !held && !cell.type.mandatory ? 'none' : cell.status;
                    const text = held
                      ? cell.daysLeft! < 0
                        ? `${-cell.daysLeft!}d over`
                        : formatDate(cell.record!.expires).replace(/ \d{4}$/, (y) => ` ’${y.slice(-2)}`)
                      : cell.type.mandatory
                        ? 'None'
                        : '';
                    const description = held
                      ? `${cell.type.name}: ${statusLabel(cell.status)}, expires ${formatDate(cell.record!.expires)}`
                      : `${cell.type.name}: ${cell.type.mandatory ? 'missing' : 'not held'}`;
                    return (
                      <td key={cell.type.id} className={`cell cell--${variant}`} title={description}>
                        <span className="visually-hidden">{description}</span>
                        <span aria-hidden="true">{text}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
