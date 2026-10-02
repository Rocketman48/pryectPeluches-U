import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { logHistory, teamToInfo } from '@/lib/history';
import type { Team, Character } from '@/types';
import { TeamCard } from '@/components/Cards';
import TeamFormModal from '@/components/TeamFormModal';
import { LoadingSpinner, EmptyState } from '@/components/UI';
import { Plus, Users, Pencil, Trash2, ArrowLeft, UserPlus, FileDown } from 'lucide-react';
import Modal from '@/components/Modal';
import { ConfirmButton } from '@/components/UI';
import { CharacterCard } from '@/components/Cards';
import CharacterFormModal from '@/components/CharacterFormModal';
import ImportModal from '@/components/ImportModal';

interface TeamsPageProps {
  openTeamId: string | null;
  onOpenTeam: (teamId: string | null) => void;
}

export default function TeamsPage({ openTeamId, onOpenTeam }: TeamsPageProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [deleteTeam, setDeleteTeam] = useState<Team | null>(null);
  const [menuTeam, setMenuTeam] = useState<Team | null>(null);

  // Team detail state
  const [characters, setCharacters] = useState<Character[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [charFormOpen, setCharFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [teamCharCounts, setTeamCharCounts] = useState<Map<string, number>>(new Map());

  const loadTeams = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('teams').select('*').order('created_at', { ascending: true });
    setTeams((data as Team[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const loadAllCharCounts = useCallback(async () => {
    const { data } = await supabase.from('characters').select('team_id');
    const counts = new Map<string, number>();
    (data as { team_id: string }[] || []).forEach((row) => {
      counts.set(row.team_id, (counts.get(row.team_id) || 0) + 1);
    });
    setTeamCharCounts(counts);
  }, []);

  useEffect(() => {
    loadAllCharCounts();
  }, [loadAllCharCounts]);

  const loadCharacters = useCallback(async (teamId: string) => {
    setDetailLoading(true);
    const { data } = await supabase
      .from('characters')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: true });
    setCharacters((data as Character[]) || []);
    setDetailLoading(false);
  }, []);

  useEffect(() => {
    if (openTeamId) {
      loadCharacters(openTeamId);
    }
  }, [openTeamId, loadCharacters]);

  const currentTeam = teams.find((t) => t.id === openTeamId) || null;

  const handleSaveTeam = async (data: { name: string; concept: string; image_url: string }) => {
    if (editTeam) {
      const prevInfo = teamToInfo(editTeam);
      const { error } = await supabase.from('teams').update({ ...data, updated_at: new Date().toISOString() }).eq('id', editTeam.id);
      if (error) return;
      await logHistory({
        teamId: editTeam.id,
        actionType: 'team_modified',
        affectedName: data.name,
        previousInfo: prevInfo,
        newInfo: data,
        status: 'approved',
      });
      setEditTeam(null);
    } else {
      const { data: inserted, error } = await supabase.from('teams').insert(data).select().single();
      if (error || !inserted) return;
      await logHistory({
        teamId: (inserted as Team).id,
        actionType: 'team_created',
        affectedName: (inserted as Team).name,
        newInfo: teamToInfo(inserted as Team),
        status: 'created',
      });
    }
    setFormOpen(false);
    loadTeams();
  };

  const handleDeleteTeam = async () => {
    if (!deleteTeam) return;
    const prevInfo = teamToInfo(deleteTeam);
    await supabase.from('teams').delete().eq('id', deleteTeam.id);
    await logHistory({
      teamId: null,
      actionType: 'team_deleted',
      affectedName: deleteTeam.name,
      previousInfo: prevInfo,
      status: 'approved',
    });
    setDeleteTeam(null);
    setMenuTeam(null);
    loadTeams();
    loadAllCharCounts();
  };

  // Character creation handlers
  const handleCreateCharacter = async (data: Omit<Character, 'id' | 'team_id' | 'created_at' | 'updated_at' | 'status'>) => {
    if (!openTeamId) return;
    const { data: inserted, error } = await supabase
      .from('characters')
      .insert({ ...data, team_id: openTeamId, status: 'proposal' })
      .select()
      .single();
    if (error || !inserted) return;

    await logHistory({
      characterId: (inserted as Character).id,
      teamId: openTeamId,
      actionType: 'character_created',
      affectedName: (inserted as Character).name,
      newInfo: { ...(data as Record<string, unknown>), status: 'proposal' },
      status: 'created',
    });

    setCharFormOpen(false);
    loadCharacters(openTeamId);
    loadAllCharCounts();
  };

  const handleImportCharacter = async (data: Record<string, unknown>) => {
    if (!openTeamId) return;
    const charData = {
      team_id: openTeamId,
      name: String(data.name || ''),
      title: String(data.title || ''),
      element: String(data.element || ''),
      role: String(data.role || ''),
      image_url: String(data.image_url || ''),
      description: String(data.description || ''),
      power_basic_name: String(data.power_basic_name || ''),
      power_basic_type: String(data.power_basic_type || ''),
      power_basic_description: String(data.power_basic_description || ''),
      power_upgrade_name: String(data.power_upgrade_name || ''),
      power_upgrade_type: String(data.power_upgrade_type || ''),
      power_upgrade_description: String(data.power_upgrade_description || ''),
      power_ultimate_name: String(data.power_ultimate_name || ''),
      power_ultimate_type: String(data.power_ultimate_type || ''),
      power_ultimate_description: String(data.power_ultimate_description || ''),
      power_ultimate_cost: String(data.power_ultimate_cost || ''),
      stat_attack: Number(data.stat_attack) || 0,
      stat_defense: Number(data.stat_defense) || 0,
      stat_speed: Number(data.stat_speed) || 0,
      stat_magic: Number(data.stat_magic) || 0,
      stat_resistance: Number(data.stat_resistance) || 0,
      strengths: Array.isArray(data.strengths) ? data.strengths.map(String) : [],
      weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses.map(String) : [],
      status: 'proposal' as const,
    };

    const { data: inserted, error } = await supabase
      .from('characters')
      .insert(charData)
      .select()
      .single();
    if (error || !inserted) return;

    await logHistory({
      characterId: (inserted as Character).id,
      teamId: openTeamId,
      actionType: 'character_imported',
      affectedName: (inserted as Character).name,
      newInfo: charData,
      status: 'created',
    });

    setImportOpen(false);
    loadCharacters(openTeamId);
    loadAllCharCounts();
  };

  // --- Team Detail View ---
  if (openTeamId && currentTeam) {
    return (
      <div className="animate-fade-in">
        {/* Back + team header */}
        <div className="sticky top-0 z-10 bg-cream/95 backdrop-blur-sm px-5 py-3 border-b border-border/40">
          <button
            onClick={() => onOpenTeam(null)}
            className="flex items-center gap-1.5 text-sm text-ink-light hover:text-ink transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a equipos
          </button>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-serif font-semibold text-ink truncate">{currentTeam.name}</h1>
              {currentTeam.concept && (
                <p className="text-sm text-ink-light mt-0.5 line-clamp-2">{currentTeam.concept}</p>
              )}
            </div>
            <button
              onClick={() => {
                setEditTeam(currentTeam);
                setFormOpen(true);
              }}
              className="shrink-0 p-2 rounded-lg text-ink-light hover:bg-cream-200 transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Characters list */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-ink">
              Personajes ({characters.length})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setImportOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cream-200 text-ink text-sm font-medium hover:bg-border transition-colors active:scale-95"
              >
                <FileDown className="w-4 h-4" />
                <span className="hidden xs:inline">Importar</span>
              </button>
              <button
                onClick={() => setCharFormOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest text-white text-sm font-medium hover:bg-forest-dark transition-colors active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden xs:inline">Añadir</span>
              </button>
            </div>
          </div>

          {detailLoading ? (
            <LoadingSpinner label="Cargando personajes..." />
          ) : characters.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Sin personajes"
              description="Añade o importa personajes a este equipo."
              action={
                <div className="flex gap-2">
                  <button
                    onClick={() => setImportOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cream-200 text-ink font-medium text-sm hover:bg-border transition-colors"
                  >
                    <FileDown className="w-4 h-4" />
                    Importar
                  </button>
                  <button
                    onClick={() => setCharFormOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-white font-medium text-sm hover:bg-forest-dark transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Añadir personaje
                  </button>
                </div>
              }
            />
          ) : (
            <div className="space-y-3 pb-24">
              {characters.map((c) => (
                <CharacterCard
                  key={c.id}
                  character={c}
                  onClick={() => {
 // Navigate to character - handled by parent via custom event
                    window.dispatchEvent(new CustomEvent('nucleo:openCharacter', { detail: c.id }));
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <CharacterFormModal
          open={charFormOpen}
          onClose={() => setCharFormOpen(false)}
          onSave={handleCreateCharacter}
          teams={teams}
          defaultTeamId={openTeamId}
        />
        <ImportModal open={importOpen} onClose={() => setImportOpen(false)} onImport={handleImportCharacter} />
        <TeamFormModal open={formOpen} onClose={() => setFormOpen(false)} onSave={handleSaveTeam} team={editTeam} />
      </div>
    );
  }

  // --- Teams List View ---
  return (
    <div className="animate-fade-in">
      <div className="px-5 pt-6 pb-2">
        <h1 className="text-2xl font-serif font-semibold text-ink">Equipos</h1>
        <p className="text-sm text-ink-light mt-0.5">Organiza tus personajes por equipo</p>
      </div>

      <div className="px-5 pt-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-ink-light">{teams.length} {teams.length === 1 ? 'equipo' : 'equipos'}</span>
          <button
            onClick={() => {
              setEditTeam(null);
              setFormOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest text-white text-sm font-medium hover:bg-forest-dark transition-colors active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">Nuevo</span>
          </button>
        </div>

        {loading ? (
          <LoadingSpinner label="Cargando equipos..." />
        ) : teams.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No hay equipos"
            description="Crea tu primer equipo para empezar."
            action={
              <button
                onClick={() => setFormOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-white font-medium text-sm hover:bg-forest-dark transition-colors"
              >
                <Plus className="w-4 h-4" />
                Crear equipo
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-24">
            {teams.map((team) => {
              const count = teamCharCounts.get(team.id) || 0;
              return (
                <div key={team.id} className="relative group">
                  <TeamCard
                    team={team}
                    characterCount={count}
                    onClick={() => onOpenTeam(team.id)}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuTeam(team);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-card/80 backdrop-blur-sm text-ink-light hover:text-ink opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit/delete menu */}
      <Modal
        open={!!menuTeam}
        onClose={() => setMenuTeam(null)}
        title={menuTeam?.name || ''}
        size="sm"
      >
        <div className="space-y-2">
          <button
            onClick={() => {
              setEditTeam(menuTeam);
              setFormOpen(true);
              setMenuTeam(null);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-cream-200 transition-colors text-left"
          >
            <Pencil className="w-4 h-4 text-ink-light" />
            <span className="text-sm font-medium text-ink">Editar equipo</span>
          </button>
          <button
            onClick={() => {
              setDeleteTeam(menuTeam);
              setMenuTeam(null);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition-colors text-left"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-red-600">Eliminar equipo</span>
          </button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!deleteTeam}
        onClose={() => setDeleteTeam(null)}
        title="¿Eliminar equipo?"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <ConfirmButton variant="secondary" onConfirm={() => setDeleteTeam(null)}>
              Cancelar
            </ConfirmButton>
            <ConfirmButton variant="danger" onConfirm={handleDeleteTeam}>
              Eliminar
            </ConfirmButton>
          </div>
        }
      >
        <p className="text-sm text-ink">
          Se eliminará <strong>{deleteTeam?.name}</strong> y todos sus personajes.
          Esta acción no se puede deshacer.
        </p>
      </Modal>

      <TeamFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveTeam}
        team={editTeam}
      />
    </div>
  );
}
