import { Link } from 'react-router-dom';
import { formatDate } from '../domain/dates';
import { fullName, operativeStatus, summarise, upcomingExpiries } from '../domain/compliance';
import { useWorkforce } from '../state/WorkforceContext';
import { StatusBadge } from '../components/StatusBadge';

export function DashboardPage() {
  const { visibleOperatives, data, today } = useWorkforce();
  const types = data.qualificationTypes;
  const summary = summarise(visibleOperatives, types, today);
  const expiries = upcomingExpiries(visibleOperatives, types, today).slice(0, 8);

  const byProject = data.projects
    .map((project) => {
      const ops = visibleOperatives.filter((o) => o.active && o.projectId === project.id);
      return { project, ...summarise(ops, types, today), blocked: ops.filter((o) => operativeStatus(o, types, today) === 'expired' || operativeStatus(o, types, today) === 'missing').length };
    })
    .filter((p) => p.total > 0);

  const onSiteToday = visibleOperatives.filter((o) => o.active && !o.holidays.some((h) => h.status === 'approved' && h.start <= today && h.end >= today)).length;

  return (
    <div className="page">
      <header className="page__header">
        <h1>Overview</h1>
        <p>{formatDate(today)}</p>
      </header>

      <section className="readiness" aria-label="Site readiness">
        <div className="readiness__figure">
          <span className="readiness__number">{summary.compliantPercent}%</span>
          <span>of {summary.total} active operatives are fully compliant</span>
        </div>
        <div className="readiness__bar" role="img" aria-label={`${summary.valid} valid, ${summary.expiring} expiring, ${summary.expired} expired, ${summary.missing} with missing records`}>
          {(['valid', 'expiring', 'missing', 'expired'] as const).map((s) =>
            summary[s] > 0 ? <span key={s} className={`readiness__seg readiness__seg--${s}`} style={{ flexGrow: summary[s] }} /> : null,
          )}
        </div>
        <dl className="readiness__legend">
          <div><dt><StatusBadge status="valid" /></dt><dd>{summary.valid}</dd></div>
          <div><dt><StatusBadge status="expiring">Expiring in 30 days</StatusBadge></dt><dd>{summary.expiring}</dd></div>
          <div><dt><StatusBadge status="missing">Missing a mandatory record</StatusBadge></dt><dd>{summary.missing}</dd></div>
          <div><dt><StatusBadge status="expired" /></dt><dd>{summary.expired}</dd></div>
          <div><dt>Available today</dt><dd>{onSiteToday}</dd></div>
        </dl>
      </section>

      <div className="split">
        <section className="panel" aria-labelledby="renewals">
          <h2 id="renewals">Renewals to chase</h2>
          {expiries.length === 0 ? (
            <p className="empty">Nothing expires in the next 30 days.</p>
          ) : (
            <ul className="renewals">
              {expiries.map((e) => (
                <li key={`${e.operative.id}-${e.type.id}`}>
                  <Link to={`/operatives/${e.operative.id}`}>{fullName(e.operative)}</Link>
                  <span>{e.type.name}</span>
                  <StatusBadge status={e.daysLeft < 0 ? 'expired' : 'expiring'}>
                    {e.daysLeft < 0 ? `Expired ${-e.daysLeft} days ago` : e.daysLeft === 0 ? 'Expires today' : `${e.daysLeft} days left`}
                  </StatusBadge>
                </li>
              ))}
            </ul>
          )}
          <Link className="panel__link" to="/matrix?filter=issues">
            See every issue in the training matrix
          </Link>
        </section>

        <section className="panel" aria-labelledby="projects">
          <h2 id="projects">By project</h2>
          <table className="table table--compact">
            <thead>
              <tr>
                <th scope="col">Project</th>
                <th scope="col" className="num">Operatives</th>
                <th scope="col" className="num">Compliant</th>
                <th scope="col" className="num">Can’t start</th>
              </tr>
            </thead>
            <tbody>
              {byProject.map((p) => (
                <tr key={p.project.id}>
                  <th scope="row">
                    {p.project.name}
                    <small>{p.project.location}</small>
                  </th>
                  <td className="num">{p.total}</td>
                  <td className="num">{p.compliantPercent}%</td>
                  <td className="num">{p.blocked}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
