import { Badge } from '@/components/ui/badge';
import type { FormStatus } from '@/types';

const config: Record<FormStatus, { label: string; className: string }> = {
  draft: { label: 'Entwurf', className: 'bg-status-draft/10 text-status-draft border-status-draft/20 backdrop-blur-sm hover:bg-status-draft/15' },
  approved: { label: 'Genehmigt', className: 'bg-status-approved/10 text-status-approved border-status-approved/20 backdrop-blur-sm hover:bg-status-approved/15' },
};

export function StatusBadge({ status }: { status: FormStatus }) {
  const c = config[status];
  return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
}
