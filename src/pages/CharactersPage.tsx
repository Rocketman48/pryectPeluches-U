import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Character, Team } from '@/types';
import { CharacterCard } from '@/components/Cards';
import { LoadingSpinner, EmptyState } from '@/components/UI';
import { User, Search } from 'lucide-react';

interface CharactersPageProps {
  onOpenCharacter: (characterId: string) => void;
  refreshKey: number;
}

export default function CharactersPage({ onOpenCharacter, refreshKey }: CharactersPageProps) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [teams, setTeams] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'proposal' | 'review' | 'approved'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: chars }, { data: teamsData }] = await Promise.all([
      supabase.from('characters').select('*').order('name', { ascending: true }),
      supabase.from('teams').select('id, name'),
    ]);

    const teamMap = new Map<string, string>();
    (teamsData as Pick<Team, 'id' | 'name'>[] || []).forEach((t) => teamMap.set(t.id, t.name));

    setTeams(teamMap);
    setCharacters((chars as Character[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const filtered = characters.filter((c) => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.element.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filters: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'approved', label: 'Aprobados' },
    { key: 'proposal', label: 'Propuestas' },
    { key: 'review', label: 'En revisión' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="px-5 pt-6 pb-2">
        <h1 className="text-2xl font-serif font-semibold text-ink">Personajes</h1>
        <p className="text-sm text-ink-light mt-0.5">{characters.length} en total</p>
      </div>

      <div className="px-5 pt-3 sticky top-0 z-10 bg-cream/95 backdrop-blur-sm pb-3">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar personaje..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-ink focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all"
          />
        </div>
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

      <div className="px-5 pt-3">
        {loading ? (
          <LoadingSpinner label="Cargando personajes..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={User}
            title={search ? 'Sin resultados' : 'No hay personajes'}
            description={search ? 'Prueba con otra búsqueda' : 'Añade personajes desde un equipo.'}
          />
        ) : (
          <div className="space-y-3 pb-24">
            {filtered.map((c) => (
              <CharacterCard
                key={c.id}
                character={c}
                onClick={() => onOpenCharacter(c.id)}
                showTeam
                teamName={teams.get(c.team_id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
