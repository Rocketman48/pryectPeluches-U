import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { logHistory, characterToInfo, getFieldLabel } from '@/lib/history';
import { sourceLabels, statusLabels } from '@/lib/ai-context';
import type { Proposal, Character, ProposalStatus, Source } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import { LoadingSpinner, EmptyState, ConfirmButton } from '@/components/UI';
import { Lightbulb, Sparkles, MessageSquare, User, Check, X, Pencil, ChevronRight } from 'lucide-react';

interface ProposalsPageProps {
  onOpenCharacter: (characterId: string) => void;
  refreshKey: number;
}

const sourceIcons: Record<Source, typeof Sparkles> = {
  claude: Sparkles,
  chatgpt: MessageSquare,
  user: User,
};

const sourceColors: Record<Source, string> = {
  claude: 'bg-lavender-50 text-lavender-dark',
  chatgpt: 'bg-lavender-100 text-lavender-dark',
  user: 'bg-cream-200 text-ink',
};

export default function ProposalsPage({ onOpenCharacter, refreshKey }: ProposalsPageProps) {
  const [proposals, setProposals] = useState<(Proposal & { character?: { name: string } })[]>([]);
  const [characters, setCharacters] = useState<Map<string, Character>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | ProposalStatus>('all');
  const [detailProposal, setDetailProposal] = useState<Proposal | null>(null);
  const [editText, setEditText] = useState('');
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: propData }, { data: charData }] = await Promise.all([
      supabase.from('proposals').select('*').order('created_at', { ascending: false }),
      supabase.from('characters').select('*'),
    ]);

    const charMap = new Map<string, Character>();
    (charData as Character[] || []).forEach((c) => charMap.set(c.id, c));

    // Get character names for proposals
    const enriched = (propData as Proposal[] || []).map((p) => ({
      ...p,
      character: charMap.get(p.character_id)
        ? { name: charMap.get(p.character_id)!.name }
        : undefined,
    }));

    setCharacters(charMap);
    setProposals(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const filtered = proposals.filter((p) => filter === 'all' || p.status === filter);

  const handleApprove = async (proposal: Proposal) => {
    const character = characters.get(proposal.character_id);
    if (!character) return;

    const prevInfo = characterToInfo(character);

    // Apply proposed info to character
    const proposedData = proposal.proposed_info;
    const updateData: Record<string, unknown> = {};

    // If it's a manual proposal with "content", just mark it approved
    if (proposal.element_modified === 'manual_proposal') {
      // Just approve the proposal, don't auto-apply text content
    } else {
      // Apply specific fields from proposed_info to character
      Object.keys(proposedData).forEach((key) => {
        if (key !== 'id' && key !== 'team_id' && key !== 'created_at' && key !== 'updated_at') {
          updateData[key] = proposedData[key];
        }
      });
      updateData.updated_at = new Date().toISOString();
    }

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase.from('characters').update(updateData).eq('id', character.id);
      if (error) return;
    }

    // Mark proposal as approved
    await supabase
      .from('proposals')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', proposal.id);

    await logHistory({
      characterId: character.id,
      teamId: character.team_id,
      actionType: 'proposal_approved',
      affectedName: character.name,
      previousInfo: prevInfo,
      newInfo: proposedData,
      source: proposal.source,
      status: 'approved',
    });

    setDetailProposal(null);
    load();
  };

  const handleReject = async (proposal: Proposal) => {
    const character = characters.get(proposal.character_id);
    await supabase
      .from('proposals')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', proposal.id);

    await logHistory({
      characterId: proposal.character_id,
      actionType: 'proposal_rejected',
      affectedName: character?.name || '',
      previousInfo: proposal.original_info,
      newInfo: proposal.proposed_info,
      source: proposal.source,
      status: 'rejected',
    });

    setDetailProposal(null);
    load();
  };

  const handleSetReview = async (proposal: Proposal) => {
    await supabase
      .from('proposals')
      .update({ status: 'review', updated_at: new Date().toISOString() })
      .eq('id', proposal.id);

    const character = characters.get(proposal.character_id);
    await logHistory({
      characterId: proposal.character_id,
      actionType: 'proposal_review_started',
      affectedName: character?.name || '',
      source: proposal.source,
      status: 'review',
    });

    setDetailProposal(null);
    load();
  };

  const handleEditSave = async () => {
    if (!detailProposal) return;
    const newProposed = { ...detailProposal.proposed_info, content: editText.trim() };
    const { data: updated } = await supabase
      .from('proposals')
      .update({ proposed_info: newProposed, updated_at: new Date().toISOString() })
      .eq('id', detailProposal.id)
      .select()
      .single();

    setEditOpen(false);
    if (updated) {
      setDetailProposal(updated as Proposal);
    }
    load();
  };

  const filters: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'proposal', label: 'Propuestas' },
    { key: 'review', label: 'En revisión' },
    { key: 'approved', label: 'Aprobadas' },
    { key: 'rejected', label: 'Rechazadas' },
  ];

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatInfo = (info: Record<string, unknown> | null): string => {
    if (!info) return '';
    if (info.content && typeof info.content === 'string') return info.content;
    const lines: string[] = [];
    for (const [key, value] of Object.entries(info)) {
      if (Array.isArray(value)) {
        lines.push(`${getFieldLabel(key)}: ${value.join(', ')}`);
      } else if (typeof value === 'string' && value) {
        lines.push(`${getFieldLabel(key)}: ${value}`);
      } else if (typeof value === 'number') {
        lines.push(`${getFieldLabel(key)}: ${value}`);
      }
    }
    return lines.join('\n');
  };

  return (
    <div className="animate-fade-in">
      <div className="px-5 pt-6 pb-2">
        <h1 className="text-2xl font-serif font-semibold text-ink">Propuestas</h1>
        <p className="text-sm text-ink-light mt-0.5">Revisa, aprueba o rechaza cambios</p>
      </div>

      <div className="px-5 pt-3 sticky top-0 z-10 bg-cream/95 backdrop-blur-sm pb-3">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {filters.map((f) => {
            const count = f.key === 'all' ? proposals.length : proposals.filter((p) => p.status === f.key).length;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  filter === f.key
                    ? 'bg-gold text-white shadow-soft'
                    : 'bg-cream-200 text-ink-light hover:text-ink'
                }`}
              >
                {f.label} {count > 0 && <span className="opacity-70">({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 pt-2">
        {loading ? (
          <LoadingSpinner label="Cargando propuestas..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Lightbulb}
            title="No hay propuestas"
            description="Las propuestas que crees desde el espacio creativo de un personaje aparecerán aquí."
          />
        ) : (
          <div className="space-y-3 pb-24">
            {filtered.map((p) => {
              const Icon = sourceIcons[p.source] || User;
              return (
                <button
                  key={p.id}
                  onClick={() => setDetailProposal(p)}
                  className="w-full text-left bg-card rounded-2xl border border-border/50 p-4 hover:shadow-card hover:border-gold/30 transition-all active:scale-[0.98]"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink truncate">
                        {p.character?.name || 'Personaje eliminado'}
                      </p>
                      <p className="text-xs text-ink-light mt-0.5">{formatDate(p.created_at)}</p>
                    </div>
                    <StatusBadge status={p.status} size="sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${sourceColors[p.source]}`}>
                      <Icon className="w-3 h-3" />
                      {sourceLabels[p.source]}
                    </span>
                    <span className="text-xs text-ink-light truncate">
                      {p.element_modified === 'manual_proposal'
                        ? 'Propuesta manual'
                        : getFieldLabel(p.element_modified)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail modal */}
      <Modal
        open={!!detailProposal}
        onClose={() => setDetailProposal(null)}
        title="Detalle de propuesta"
        size="lg"
        footer={
          detailProposal && detailProposal.status !== 'approved' && detailProposal.status !== 'rejected' ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => handleReject(detailProposal)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 font-medium text-sm hover:bg-red-100 transition-colors active:scale-95"
              >
                <X className="w-4 h-4" />
                Rechazar
              </button>
              {detailProposal.status !== 'review' && (
                <button
                  onClick={() => handleSetReview(detailProposal)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cream-200 text-ink font-medium text-sm hover:bg-border transition-colors active:scale-95"
                >
                  En revisión
                </button>
              )}
              <button
                onClick={() => handleApprove(detailProposal)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-white font-medium text-sm hover:bg-forest-dark transition-colors active:scale-95"
              >
                <Check className="w-4 h-4" />
                Aprobar
              </button>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-sm text-ink-light">
                {detailProposal && statusLabels[detailProposal.status]}
              </span>
              {detailProposal && (
                <button
                  onClick={() => {
                    setDetailProposal(null);
                    onOpenCharacter(detailProposal.character_id);
                  }}
                  className="flex items-center gap-1 text-sm font-medium text-forest hover:text-forest-dark"
                >
                  Ver personaje <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )
        }
      >
        {detailProposal && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon = sourceIcons[detailProposal.source] || User;
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${sourceColors[detailProposal.source]}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {sourceLabels[detailProposal.source]}
                    </span>
                  );
                })()}
                <StatusBadge status={detailProposal.status} size="sm" />
              </div>
              {typeof detailProposal.proposed_info.content === 'string' && (
                <button
                  onClick={() => {
                    setEditText(String(detailProposal.proposed_info.content));
                    setEditOpen(true);
                  }}
                  className="flex items-center gap-1.5 text-sm text-ink-light hover:text-ink transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Editar
                </button>
              )}
            </div>

            {detailProposal.proposed_info.content ? (
              <div>
                <p className="text-xs font-medium text-ink-light mb-1.5">Contenido propuesto</p>
                <pre className="text-sm text-ink whitespace-pre-wrap font-sans leading-relaxed bg-cream-50 p-3 rounded-xl border border-border/50">
                  {String(detailProposal.proposed_info.content)}
                </pre>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-xs font-medium text-ink-light mb-1.5">Información original</p>
                  <pre className="text-sm text-ink-light whitespace-pre-wrap font-sans leading-relaxed bg-cream-50 p-3 rounded-xl border border-border/50 max-h-40 overflow-y-auto modal-scroll">
                    {formatInfo(detailProposal.original_info) || '(sin información)'}
                  </pre>
                </div>
                <div>
                  <p className="text-xs font-medium text-ink-light mb-1.5">Información propuesta</p>
                  <pre className="text-sm text-ink whitespace-pre-wrap font-sans leading-relaxed bg-forest-50 p-3 rounded-xl border border-forest/20 max-h-40 overflow-y-auto modal-scroll">
                    {formatInfo(detailProposal.proposed_info) || '(sin información)'}
                  </pre>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Edit proposal modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Modificar propuesta"
        size="md"
        footer={
          <div className="flex gap-3 justify-end">
            <ConfirmButton variant="secondary" onConfirm={() => setEditOpen(false)}>
              Cancelar
            </ConfirmButton>
            <ConfirmButton variant="gold" onConfirm={handleEditSave}>
              Guardar cambios
            </ConfirmButton>
          </div>
        }
      >
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          rows={10}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-cream-50 text-ink focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-all resize-none"
          autoFocus
        />
      </Modal>
    </div>
  );
}
