import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../auth/AuthContext';
import { canAddOperatives, canSeeContactDetails } from '../auth/permissions';
import { fullName, operativeStatus, type ComplianceStatus } from '../domain/compliance';
import { useWorkforce } from '../state/WorkforceContext';
import { StatusBadge } from '../components/StatusBadge';
import { OperativeForm } from '../components/OperativeForm';

export function OperativesPage() {
  const user = useUser();
  const { visibleOperatives, data, today } = useWorkforce();
  const [query, setQuery] = useState('');
  const [project, setProject] = useState('all');
  const [status, setStatus] = useState<'all' | ComplianceStatus>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [adding, setAdding] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visibleOperatives
      .map((op) => ({ op, status: operativeStatus(op, data.qualificationTypes, today) }))
      .filter(({ op }) => showArchived || op.active)
      .filter(({ op }) => project === 'all' || op.projectId === project)
      .filter(({ status: s }) => status === 'all' || s === status)
      .filter(({ op }) => !q || `${fullName(op)} ${op.trade} ${op.agency}`.toLowerCase().includes(q))
      .sort((a, b) => a.op.lastName.localeCompare(b.op.lastName));
  }, [visibleOperatives, data.qualificationTypes, today, query, project, status, showArchived]);

  const projectName = (id: string) => data.projects.find((p) => p.id === id)?.name ?? '—';
  const showContact = canSeeContactDetails(user);

  return (
    <div className="page">
      <header className="page__header">
        <h1>Operatives</h1>
        {canAddOperatives(user) && !adding && (
          <button className="btn btn--primary" onClick={() => setAdding(true)}>
            Add operative
          </button>
        )}
      </header>

      {adding && <OperativeForm onDone={() => setAdding(false)} />}

      <div className="filters" role="search">
        <label>
          Search
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, trade or agency" />
        </label>
        <label>
          Project
          <select value={project} onChange={(e) => setProject(e.target.value)}>
            <option value="all">All projects</option>
            {data.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Compliance
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="all">Any status</option>
            <option value="expired">Expired</option>
            <option value="missing">Missing a record</option>
            <option value="expiring">Expiring soon</option>
            <option value="valid">Fully valid</option>
          </select>
        </label>
        <label className="check">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
          Include archived
        </label>
      </div>

      <p className="result-count" aria-live="polite">
        {rows.length} {rows.length === 1 ? 'operative' : 'operatives'}
      </p>

      {rows.length === 0 ? (
        <p className="empty">No operatives match these filters. Clear the search or choose another project.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Trade</th>
                <th scope="col">Agency</th>
                <th scope="col">Project</th>
                {showContact && <th scope="col">Phone</th>}
                <th scope="col">Compliance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ op, status: s }) => (
                <tr key={op.id} className={op.active ? undefined : 'is-archived'}>
                  <th scope="row">
                    <Link to={`/operatives/${op.id}`}>{fullName(op)}</Link>
                    {!op.active && <small>Archived</small>}
                  </th>
                  <td>{op.trade}</td>
                  <td>{op.agency}</td>
                  <td>{projectName(op.projectId)}</td>
                  {showContact && <td>{op.phone}</td>}
                  <td>
                    <StatusBadge status={s} />
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
