import { useWorkforce } from '../state/WorkforceContext';

const timeFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

export function AuditPage() {
  const { data } = useWorkforce();
  return (
    <div className="page">
      <header className="page__header">
        <h1>Audit log</h1>
        <p>Every change, newest first.</p>
      </header>
      <ol className="audit">
        {data.audit.map((entry) => (
          <li key={entry.id}>
            <time dateTime={entry.at}>{timeFormat.format(new Date(entry.at))}</time>
            <div>
              <strong>{entry.action}</strong>
              <span>{entry.detail}</span>
            </div>
            <span className="audit__user">{entry.user}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
