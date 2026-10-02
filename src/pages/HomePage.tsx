import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { logHistory, teamToInfo } from '@/lib/history';
import type { Team, Character, TeamWithCount } from '@/types';
import { TeamCard } from '@/components/Cards';
import TeamFormModal from '@/components/TeamFormModal';
import { LoadingSpinner, EmptyState } from '@/components/UI';
import { Plus, Users } from 'lucide-react';

interface HomePageProps {
  onOpenTeam: (teamId: string) => void;
}

export default function HomePage({ onOpenTeam }: HomePageProps) {
  const [teams, setTeams] = useState<TeamWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const loadTeams = useCallback(async () => {
    setLoading(true);
    const { data: teamsData } = await supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: true });

    if (!teamsData) {
      setLoading(false);
      return;
    }

    const { data: charsData } = await supabase.from('characters').select('team_id');

    const counts = new Map<string, number>();
    (charsData || []).forEach((c: { team_id: string }) => {
      counts.set(c.team_id, (counts.get(c.team_id) || 0) + 1);
    });

    const enriched: TeamWithCount[] = (teamsData as Team[]).map((t) => ({
      ...t,
      character_count: counts.get(t.id) || 0,
    }));

    setTeams(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const handleSave = async (data: { name: string; concept: string; image_url: string }) => {
    const { data: inserted, error } = await supabase
      .from('teams')
      .insert(data)
      .select()
      .single();

    if (error || !inserted) return;

    await logHistory({
      teamId: (inserted as Team).id,
      actionType: 'team_created',
      affectedName: (inserted as Team).name,
      newInfo: teamToInfo(inserted as Team),
      status: 'created',
    });

    setFormOpen(false);
    loadTeams();
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-6 pb-2">
        <h1 className="text-2xl font-serif font-semibold text-ink">NÚCLEO</h1>
        <p className="text-sm text-ink-light mt-0.5">El centro de tu proyecto creativo</p>
      </div>

      {/* Teams section */}
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-ink">Equipos</h2>
          <button
            onClick={() => setFormOpen(true)}
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
            title="No hay equipos todavía"
            description="Crea tu primer equipo para empezar a organizar tus personajes."
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
            {teams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                characterCount={team.character_count}
                onClick={() => onOpenTeam(team.id)}
              />
            ))}
          </div>
        )}
      </div>

      <TeamFormModal open={formOpen} onClose={() => setFormOpen(false)} onSave={handleSave} />
    </div>
  );
}
