import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { sourceLabels, statusLabels } from '@/lib/ai-context';
import { getFieldLabel } from '@/lib/history';
import type { HistoryEntry, Source } from '@/types';
import { LoadingSpinner, EmptyState } from '@/components/UI';
import Modal from '@/components/Modal';
import { Clock, Sparkles, MessageSquare, User, Check, FileEdit, ChevronRight } from 'lucide-react';

const sourceIcons: Record<Source, typeof Sparkles> = {
  claude: Sparkles,
  chatgpt: MessageSquare,
  user: User,
};

const actionLabels: Record<string, string> = {
  team_created: 'Equipo creado',
  team_modified: 'Equipo modificado',
  team_deleted: 'Equipo eliminado',
  character_created: 'Personaje creado',
  character_imported: 'Personaje importado',
  character_modified: 'Personaje modificado',
  character_approved: 'Personaje aprobado',
  character_review_started: 'Revisión iniciada',
  character_set_proposal: 'Marcado como propuesta',
  character_deleted: 'Personaje eliminado',
  proposal_created: 'Propuesta creada',
  proposal_approved: 'Propuesta aprobada',
  proposal_rejected: 'Propuesta rechazada',
  proposal_review_started: 'Propuesta en revisión',
  ability_modified: 'Habilidad modificada',
  ability_approved: 'Habilidad aprobada',
  review_performed: 'Revisión realizada',
};

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<HistoryEntry | null>(null);
  const [filter, setFilter] = useState<'all' | 'character' | 'team' | 'proposal'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    setEntries((data as HistoryEntry[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = entries.filter((e) => {
    if (filter === 'all') return true;
    if (filter === 'character') return e.character_id !== null;
    if (filter === 'team') return e.team_id !== null && e.character_id === null;
    if (filter === 'proposal') return e.action_type.includes('proposal');
    return true;
  });

  // Group by date
  const grouped = new Map<string, HistoryEntry[]>();
  filtered.forEach((e) => {
    const date = new Date(e.created_at).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    if (!grouped.has(date)) grouped.set(date, []);
    grouped.get(date)!.push(e);
  });

  const filters: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'Todo' },
    { key: 'character', label: 'Personajes' },
    { key: 'team', label: 'Equipos' },
    { key: 'proposal', label: 'Propuestas' },
  ];

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const formatInfo = (info: Record<string, unknown> | null): string => {
    if (!info) return '';
    const lines: string[] = [];
    for (const [key, value] of Object.entries(info)) {
      if (Array.isArray(value)) {
        if (value.length > 0) lines.push(`${getFieldLabel(key)}: ${value.join(', ')}`);
      } else if (typeof value === 'string' && value) {
        if (value.length > 80) lines.push(`${getFieldLabel(key)}: ${value.slice(0, 80)}...`);
        else lines.push(`${getFieldLabel(key)}: ${value}`);
      } else if (typeof value === 'number') {
        lines.push(`${getFieldLabel(key)}: ${value}`);
      }
    }
    return lines.join('\n');
  };

  return (
    <div className="animate-fade-in">
      <div className="px-5 pt-6 pb-2">
        <h1 className="text-2xl font-serif font-semibold text-ink">Historial</h1>
        <p className="text-sm text-ink-light mt-0.5">Registro automático de cambios</p>
      </div>

      <div className="px-5 pt-3 sticky top-0 z-10 bg-cream/95 backdrop-blur-sm pb-3">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                filter === f.key
                  ? 'bg-forest text-white shadow-soft'
                  : 'bg-cream-200 text-ink-light hover:text-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-2">
        {loading ? (
          <LoadingSpinner label="Cargando historial..." />
        ) : entries.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="Sin actividad"
            description="Los cambios que hagas se registrarán automáticamente aquí."
          />
        ) : (
          <div className="pb-24">
            {Array.from(grouped.entries()).map(([date, items]) => (
              <div key={date} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1 bg-border/50" />
                  <span className="text-xs font-medium text-ink-light px-2">{date}</span>
                  <div className="h-px flex-1 bg-border/50" />
                </div>
                <div className="space-y-2 relative">
                  {items.map((entry) => {
                    const Icon = sourceIcons[entry.source] || User;
                    const actionLabel = actionLabels[entry.action_type] || entry.action_type;
                    return (
                      <button
                        key={entry.id}
                        onClick={() => setDetail(entry)}
                        className="w-full text-left bg-card rounded-xl border border-border/50 p-3 hover:shadow-soft transition-all active:scale-[0.98] flex items-start gap-3"
                      >
                        <div className="shrink-0 w-8 h-8 rounded-lg bg-cream-200 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-ink-light" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-ink">{actionLabel}</p>
                          <p className="text-xs text-ink-light mt-0.5">
                            {entry.affected_name}
                            {entry.affected_name && ' — '}
                            <span className="capitalize">{sourceLabels[entry.source]}</span>
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[11px] text-ink-light">{formatTime(entry.created_at)}</span>
                            {entry.status === 'approved' && (
                              <span className="inline-flex items-center gap-0.5 text-[11px] text-forest-dark">
                                <Check className="w-2.5 h-2.5" />
                                {statusLabels[entry.status]}
                              </span>
                            )}
                            {entry.status === 'proposal' && (
                              <span className="text-[11px] text-gold-dark">{statusLabels[entry.status]}</span>
                            )}
                            {entry.status === 'review' && (
                              <span className="text-[11px] text-blue-600">{statusLabels[entry.status]}</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-ink-light shrink-0 mt-1" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Detalle del evento"
        size="md"
      >
        {detail && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-ink-light mb-1">Acción</p>
              <p className="text-sm font-semibold text-ink">
                {actionLabels[detail.action_type] || detail.action_type}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-ink-light mb-1">Fecha</p>
                <p className="text-sm text-ink">
                  {new Date(detail.created_at).toLocaleDateString('es-ES', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
                <p className="text-xs text-ink-light">
                  {formatTime(detail.created_at)}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-light mb-1">Fuente</p>
                <p className="text-sm text-ink capitalize">{sourceLabels[detail.source]}</p>
                <p className="text-xs text-ink-light">Estado: {statusLabels[detail.status] || detail.status}</p>
              </div>
            </div>
            {detail.affected_name && (
              <div>
                <p className="text-xs text-ink-light mb-1">Afectado</p>
                <p className="text-sm text-ink">{detail.affected_name}</p>
              </div>
            )}
            {detail.previous_info && Object.keys(detail.previous_info).length > 0 && (
              <div>
                <p className="text-xs font-medium text-ink-light mb-1.5">Información anterior</p>
                <pre className="text-sm text-ink-light whitespace-pre-wrap font-sans leading-relaxed bg-cream-50 p-3 rounded-xl border border-border/50 max-h-40 overflow-y-auto modal-scroll">
                  {formatInfo(detail.previous_info)}
                </pre>
              </div>
            )}
            {detail.new_info && Object.keys(detail.new_info).length > 0 && (
              <div>
                <p className="text-xs font-medium text-ink-light mb-1.5">Nueva información</p>
                <pre className="text-sm text-ink whitespace-pre-wrap font-sans leading-relaxed bg-forest-50 p-3 rounded-xl border border-forest/20 max-h-40 overflow-y-auto modal-scroll">
                  {formatInfo(detail.new_info)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
