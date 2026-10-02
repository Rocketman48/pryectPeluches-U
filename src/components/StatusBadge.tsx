import type { Status } from '@/types';
import { Clock, Check, FileEdit, X } from 'lucide-react';

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md';
}

const config: Record<Status, { label: string; bg: string; text: string; icon: typeof Clock }> = {
  proposal: { label: 'Propuesta', bg: 'bg-gold-50', text: 'text-gold-dark', icon: FileEdit },
  review: { label: 'En revisión', bg: 'bg-blue-50', text: 'text-blue-700', icon: Clock },
  approved: { label: 'Aprobado', bg: 'bg-forest-50', text: 'text-forest-dark', icon: Check },
  rejected: { label: 'Rechazado', bg: 'bg-red-50', text: 'text-red-700', icon: X },
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const c = config[status] || config.proposal;
  const Icon = c.icon;
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5 gap-1' : 'text-sm px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${c.bg} ${c.text} ${sizeClass}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {c.label}
    </span>
  );
}
