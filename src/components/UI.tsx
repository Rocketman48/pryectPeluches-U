import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-ink-light">
      <Loader2 className="w-7 h-7 animate-spin text-forest" />
      {label && <p className="mt-3 text-sm">{label}</p>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: typeof import('lucide-react').Users;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-cream-200 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-ink-light" />
      </div>
      <h3 className="text-lg font-semibold text-ink mb-1">{title}</h3>
      {description && <p className="text-sm text-ink-light max-w-xs mb-4">{description}</p>}
      {action}
    </div>
  );
}

export function ConfirmButton({
  onConfirm,
  children,
  variant = 'primary',
  className = '',
}: {
  onConfirm: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'gold' | 'lavender';
  className?: string;
}) {
  const variants: Record<string, string> = {
    primary: 'bg-forest text-white hover:bg-forest-dark shadow-soft',
    secondary: 'bg-cream-200 text-ink hover:bg-border',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-soft',
    gold: 'bg-gold text-white hover:bg-gold-dark shadow-soft',
    lavender: 'bg-lavender text-white hover:bg-lavender-dark shadow-soft',
  };
  return (
    <button
      onClick={onConfirm}
      className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
