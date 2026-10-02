import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { logHistory, characterToInfo } from '@/lib/history';
import { copyToClipboard, buildContext } from '@/lib/ai-context';
import type { ContextScope, AITarget } from '@/lib/ai-context';
import type { Character, Team, Source } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import CharacterFormModal from '@/components/CharacterFormModal';
import AIContextModal from '@/components/AIContextModal';
import { LoadingSpinner, ConfirmButton } from '@/components/UI';
import {
  ArrowLeft, Pencil, Sparkles, MessageSquare, Copy, Check, FileEdit,
  ChevronDown, ChevronUp, Trash2, Plus, User,
} from 'lucide-react';

interface CharacterDetailPageProps {
  characterId: string;
  onBack: () => void;
}

export default function CharacterDetailPage({ characterId, onBack }: CharacterDetailPageProps) {
  const [character, setCharacter] = useState<Character | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiTarget, setAiTarget] = useState<AITarget>('claude');
  const [aiScope, setAiScope] = useState<ContextScope>('full');
  const [contextCopied, setContextCopied] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['identity']));
  const [proposalOpen, setProposalOpen] = useState(false);
  const [proposalText, setProposalText] = useState('');
  const [proposalSource, setProposalSource] = useState<Source>('claude');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: char } = await supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .maybeSingle();

    if (!char) {
      setLoading(false);
      return;
    }

    setCharacter(char as Character);

    const { data: teamData } = await supabase
      .from('teams')
      .select('*')
      .eq('id', (char as Character).team_id)
      .maybeSingle();

    setTeam((teamData as Team) || null);
    setLoading(false);
  }, [characterId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleEditSave = async (data: Omit<Character, 'id' | 'team_id' | 'created_at' | 'updated_at' | 'status'>) => {
    if (!character) return;
    const prevInfo = characterToInfo(character);
    const { error } = await supabase
      .from('characters')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', character.id);

    if (error) return;

    await logHistory({
      characterId: character.id,
      teamId: character.team_id,
      actionType: 'character_modified',
      affectedName: data.name,
      previousInfo: prevInfo,
      newInfo: data as Record<string, unknown>,
      source: 'user',
      status: 'approved',
    });

    setEditOpen(false);
    load();
  };

  const handleApproveCharacter = async () => {
    if (!character || character.status === 'approved') return;
    const prevStatus = character.status;
    const { error } = await supabase
      .from('characters')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', character.id);
    if (error) return;

    await logHistory({
      characterId: character.id,
      teamId: character.team_id,
      actionType: 'character_approved',
      affectedName: character.name,
      previousInfo: { status: prevStatus },
      newInfo: { status: 'approved' },
      source: 'user',
      status: 'approved',
    });
    load();
  };

  const handleSetStatus = async (status: 'proposal' | 'review') => {
    if (!character) return;
    const prevStatus = character.status;
    const { error } = await supabase
      .from('characters')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', character.id);
    if (error) return;

    await logHistory({
      characterId: character.id,
      teamId: character.team_id,
      actionType: status === 'review' ? 'character_review_started' : 'character_set_proposal',
      affectedName: character.name,
      previousInfo: { status: prevStatus },
      newInfo: { status },
      source: 'user',
      status,
    });
    load();
  };

  const handleDelete = async () => {
    if (!character) return;
    const prevInfo = characterToInfo(character);
    await supabase.from('characters').delete().eq('id', character.id);
    await logHistory({
      teamId: character.team_id,
      actionType: 'character_deleted',
      affectedName: character.name,
      previousInfo: prevInfo,
      source: 'user',
      status: 'approved',
    });
    setDeleteOpen(false);
    onBack();
  };

  const prepareAIContext = (target: AITarget, scope: ContextScope) => {
    if (!character) return;
    setAiScope(scope);
    setAiTarget(target);
    setAiOpen(true);
  };

  const handleCopyContext = async () => {
    if (!character) return;
    const ctx = buildContext(
      'claude',
      character,
      team ? { name: team.name, concept: team.concept } : null,
      'full',
    );
    const ok = await copyToClipboard(ctx);
    setContextCopied(ok ? 'ok' : 'fail');
    setTimeout(() => setContextCopied('idle'), 2500);
  };

  const handleCreateProposal = async () => {
    if (!character || !proposalText.trim()) return;
    const { data: inserted, error } = await supabase
      .from('proposals')
      .insert({
        character_id: character.id,
        element_modified: 'manual_proposal',
        original_info: characterToInfo(character),
        proposed_info: { content: proposalText.trim() },
        source: proposalSource,
        status: 'proposal',
      })
      .select()
      .single();

    if (error || !inserted) return;

    await logHistory({
      characterId: character.id,
      teamId: character.team_id,
      actionType: 'proposal_created',
      affectedName: character.name,
      newInfo: { source: proposalSource, content: proposalText.trim() },
      source: proposalSource,
      status: 'proposal',
    });

    setProposalOpen(false);
    setProposalText('');
  };

  if (loading) {
    return <LoadingSpinner label="Cargando personaje..." />;
  }

  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6">
        <p className="text-ink-light text-sm">No se encontró el personaje.</p>
        <button onClick={onBack} className="mt-4 text-forest font-medium text-sm">
          Volver
        </button>
      </div>
    );
  }

  const stats = [
    { label: 'Ataque', value: character.stat_attack },
    { label: 'Defensa', value: character.stat_defense },
    { label: 'Velocidad', value: character.stat_speed },
    { label: 'Magia', value: character.stat_magic },
    { label: 'Resistencia', value: character.stat_resistance },
  ];

  const sections = [
    {
      key: 'identity',
      label: 'Identidad',
      icon: User,
      content: (
        <div className="space-y-2">
          <DetailRow label="Título" value={character.title} />
          <DetailRow label="Equipo" value={team?.name} />
          <DetailRow label="Elemento" value={character.element} />
          <DetailRow label="Rol" value={character.role} />
          {character.description && (
            <div className="pt-2">
              <p className="text-xs text-ink-light mb-1">Descripción</p>
              <p className="text-sm text-ink leading-relaxed">{character.description}</p>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'abilities',
      label: 'Habilidades',
      icon: Sparkles,
      content: (
        <div className="space-y-4">
          <PowerBlock
            title="Poder Básico"
            name={character.power_basic_name}
            type={character.power_basic_type}
            description={character.power_basic_description}
          />
          <PowerBlock
            title="Poder de Mejora"
            name={character.power_upgrade_name}
            type={character.power_upgrade_type}
            description={character.power_upgrade_description}
          />
          <PowerBlock
            title="Poder Definitivo"
            name={character.power_ultimate_name}
            type={character.power_ultimate_type}
            description={character.power_ultimate_description}
            cost={character.power_ultimate_cost}
          />
        </div>
      ),
    },
    {
      key: 'stats',
      label: 'Estadísticas',
      icon: FileEdit,
      content: (
        <div className="space-y-3">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-ink">{s.label}</span>
                <span className="text-sm font-semibold text-forest tabular-nums">{s.value}</span>
              </div>
              <div className="h-2 rounded-full bg-cream-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-forest transition-all"
                  style={{ width: `${Math.min(s.value, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'characteristics',
      label: 'Características',
      icon: Check,
      content: (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-forest-dark mb-2">Fortalezas</p>
            {character.strengths?.length > 0 ? (
              <div className="space-y-1.5">
                {character.strengths.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-ink">
                    <span className="w-1.5 h-1.5 rounded-full bg-forest" />
                    {s}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-light">No definidas</p>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-red-600 mb-2">Debilidades</p>
            {character.weaknesses?.length > 0 ? (
              <div className="space-y-1.5">
                {character.weaknesses.map((w, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-ink">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    {w}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-light">No definidas</p>
            )}
          </div>
        </div>
      ),
    },
  ];

  const scopeOptions: { key: ContextScope; label: string }[] = [
    { key: 'full', label: 'Completo' },
    { key: 'identity', label: 'Identidad' },
    { key: 'abilities', label: 'Habilidades' },
    { key: 'stats', label: 'Estadísticas' },
    { key: 'characteristics', label: 'Características' },
  ];

  return (
    <div className="animate-fade-in pb-24">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-cream/95 backdrop-blur-sm px-5 py-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-ink-light hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDeleteOpen(true)}
              className="p-1.5 rounded-lg text-ink-light hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setEditOpen(true)}
              className="p-1.5 rounded-lg text-ink-light hover:bg-cream-200 transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="px-5 pt-4">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-3">
            {character.image_url ? (
              <img
                src={character.image_url}
                alt={character.name}
                className="w-28 h-28 rounded-2xl object-cover shadow-card"
              />
            ) : (
              <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-gold-50 to-cream-200 flex items-center justify-center shadow-card">
                <span className="text-4xl font-serif font-semibold text-gold/40">
                  {character.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <h1 className="text-2xl font-serif font-semibold text-ink">{character.name}</h1>
          {character.title && (
            <p className="text-sm text-ink-light mt-0.5">{character.title}</p>
          )}
          <div className="flex items-center gap-2 mt-3">
            {character.element && (
              <span className="text-xs font-medium text-gold-dark bg-gold-50 px-2.5 py-1 rounded-md">
                {character.element}
              </span>
            )}
            {character.role && (
              <span className="text-xs font-medium text-ink-light bg-cream-200 px-2.5 py-1 rounded-md">
                {character.role}
              </span>
            )}
            <StatusBadge status={character.status} size="sm" />
          </div>
        </div>
      </div>

      {/* Info sections */}
      <div className="px-5 mt-6 space-y-3">
        {sections.map((section) => {
          const Icon = section.icon;
          const expanded = expandedSections.has(section.key);
          return (
            <div key={section.key} className="bg-card rounded-2xl border border-border/50 overflow-hidden">
              <button
                onClick={() => toggleSection(section.key)}
                className="w-full flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-ink-light" />
                  <span className="font-semibold text-ink">{section.label}</span>
                </div>
                {expanded ? (
                  <ChevronUp className="w-4 h-4 text-ink-light" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-ink-light" />
                )}
              </button>
              {expanded && (
                <div className="px-4 pb-4 animate-slide-down">{section.content}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Creative Space */}
      <div className="px-5 mt-6">
        <div className="bg-lavender-50 rounded-2xl border border-lavender/20 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-lavender-dark" />
            <h2 className="text-lg font-serif font-semibold text-lavender-dark">Espacio creativo</h2>
          </div>
          <p className="text-sm text-ink-light mb-4">
            Trabaja con IA, modifica y aprueba cambios. Las propuestas no reemplazan la información
            aprobada hasta que pulses "Aprobar".
          </p>

          {/* AI scope selector */}
          <div className="mb-3">
            <p className="text-xs font-medium text-ink mb-1.5">Ámbito del contexto</p>
            <div className="flex gap-1.5 flex-wrap">
              {scopeOptions.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setAiScope(s.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    aiScope === s.key
                      ? 'bg-lavender text-white'
                      : 'bg-card text-ink-light hover:text-ink'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => prepareAIContext('claude', aiScope)}
              className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-lavender text-white font-medium text-sm hover:bg-lavender-dark transition-colors active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              Claude
            </button>
            <button
              onClick={() => prepareAIContext('chatgpt', aiScope)}
              className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-lavender-100 text-lavender-dark font-medium text-sm hover:bg-lavender/20 transition-colors active:scale-95 border border-lavender/30"
            >
              <MessageSquare className="w-4 h-4" />
              ChatGPT
            </button>
            <button
              onClick={() => setProposalOpen(true)}
              className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-card text-ink font-medium text-sm hover:bg-cream-200 transition-colors active:scale-95 border border-border"
            >
              <FileEdit className="w-4 h-4" />
              Crear propuesta
            </button>
            <button
              onClick={handleCopyContext}
              className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl font-medium text-sm transition-colors active:scale-95 border ${
                contextCopied === 'ok' ? 'bg-forest-50 text-forest-dark border-forest/20'
                : contextCopied === 'fail' ? 'bg-red-50 text-red-600 border-red-200'
                : 'bg-card text-ink hover:bg-cream-200 border-border'
              }`}
            >
              {contextCopied === 'ok' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {contextCopied === 'ok' ? 'Copiado' : contextCopied === 'fail' ? 'Error al copiar' : 'Copiar contexto'}
            </button>
          </div>

          {/* Approve / Status actions */}
          <div className="mt-3 pt-3 border-t border-lavender/15">
            {character.status !== 'approved' && (
              <button
                onClick={handleApproveCharacter}
                className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-forest text-white font-medium text-sm hover:bg-forest-dark transition-colors active:scale-95 mb-2"
              >
                <Check className="w-4 h-4" />
                Aprobar personaje
              </button>
            )}
            <div className="flex gap-2">
              {character.status !== 'review' && (
                <button
                  onClick={() => handleSetStatus('review')}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-cream-200 text-ink text-xs font-medium hover:bg-border transition-colors"
                >
                  Marcar en revisión
                </button>
              )}
              {character.status !== 'proposal' && (
                <button
                  onClick={() => handleSetStatus('proposal')}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-cream-200 text-ink text-xs font-medium hover:bg-border transition-colors"
                >
                  Marcar propuesta
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CharacterFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleEditSave}
        character={character}
        teams={team ? [{ id: team.id, name: team.name }] : []}
      />

      <AIContextModal
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        character={character}
        team={team ? { name: team.name, concept: team.concept } : null}
        target={aiTarget}
        scope={aiScope}
      />

      {/* Proposal creation modal */}
      <Modal
        open={proposalOpen}
        onClose={() => setProposalOpen(false)}
        title="Nueva propuesta"
        size="md"
        footer={
          <div className="flex gap-3 justify-end">
            <ConfirmButton variant="secondary" onConfirm={() => setProposalOpen(false)}>
              Cancelar
            </ConfirmButton>
            <ConfirmButton
              variant="gold"
              onConfirm={handleCreateProposal}
              className={proposalText.trim() ? '' : 'opacity-50 pointer-events-none'}
            >
              Crear propuesta
            </ConfirmButton>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Fuente</label>
            <div className="flex gap-2">
              {(['claude', 'chatgpt', 'user'] as const).map((src) => (
                <button
                  key={src}
                  onClick={() => setProposalSource(src)}
                  className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                    proposalSource === src
                      ? 'bg-lavender text-white'
                      : 'bg-cream-200 text-ink-light hover:text-ink'
                  }`}
                >
                  {src === 'user' ? 'Usuario' : src === 'claude' ? 'Claude' : 'ChatGPT'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Contenido de la propuesta</label>
            <textarea
              value={proposalText}
              onChange={(e) => setProposalText(e.target.value)}
              placeholder="Pega aquí la respuesta de Claude/ChatGPT o describe el cambio propuesto..."
              rows={8}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-cream-50 text-ink focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-all resize-none"
              autoFocus
            />
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="¿Eliminar personaje?"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <ConfirmButton variant="secondary" onConfirm={() => setDeleteOpen(false)}>
              Cancelar
            </ConfirmButton>
            <ConfirmButton variant="danger" onConfirm={handleDelete}>
              Eliminar
            </ConfirmButton>
          </div>
        }
      >
        <p className="text-sm text-ink">
          Se eliminará <strong>{character.name}</strong> y todas sus propuestas.
          Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-ink-light">{label}</span>
      <span className="text-sm text-ink font-medium">{value}</span>
    </div>
  );
}

function PowerBlock({
  title, name, type, description, cost,
}: {
  title: string; name?: string; type?: string; description?: string; cost?: string;
}) {
  const hasContent = name || type || description;
  if (!hasContent) {
    return (
      <div>
        <p className="text-sm font-medium text-gold-dark mb-1">{title}</p>
        <p className="text-sm text-ink-light">No definido</p>
      </div>
    );
  }
  return (
    <div className="border-l-2 border-gold/30 pl-3">
      <p className="text-sm font-medium text-gold-dark mb-0.5">{title}</p>
      {name && <p className="text-sm font-semibold text-ink">{name}</p>}
      {type && <p className="text-xs text-ink-light mt-0.5">{type}</p>}
      {description && <p className="text-sm text-ink mt-1 leading-relaxed">{description}</p>}
      {cost && (
        <p className="text-xs text-ink-light mt-1">
          <span className="font-medium">Costo:</span> {cost}
        </p>
      )}
    </div>
  );
}
