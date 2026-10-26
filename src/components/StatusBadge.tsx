import type { ComplianceStatus } from '../domain/compliance';

const LABELS: Record<ComplianceStatus, string> = {
  valid: 'Valid',
  expiring: 'Expiring',
  expired: 'Expired',
  missing: 'Missing',
};

export function StatusBadge({ status, children }: { status: ComplianceStatus; children?: React.ReactNode }) {
  return <span className={`badge badge--${status}`}>{children ?? LABELS[status]}</span>;
}

export function statusLabel(status: ComplianceStatus): string {
  return LABELS[status];
}
