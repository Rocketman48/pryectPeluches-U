import type { Character, Team } from '@/types';
import StatusBadge from './StatusBadge';
import { User } from 'lucide-react';

interface CharacterCardProps {
  character: Character;
  onClick: () => void;
  showTeam?: boolean;
  teamName?: string;
}

export function CharacterCard({ character, onClick, showTeam, teamName }: CharacterCardProps) {
  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-card rounded-2xl border border-border/50 p-3.5 hover:shadow-card hover:border-gold/30 transition-all active:scale-[0.98] flex items-center gap-3.5"
    >
      <div className="shrink-0">
        {character.image_url ? (
          <img
            src={character.image_url}
            alt={character.name}
            className="w-14 h-14 rounded-xl object-cover bg-cream-200"
            loading="lazy"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-cream-200 flex items-center justify-center">
            <User className="w-6 h-6 text-ink-light" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-ink truncate">{character.name}</h3>
        {character.title && <p className="text-sm text-ink-light truncate">{character.title}</p>}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {character.element && (
            <span className="text-xs text-ink-light bg-cream-200 px-2 py-0.5 rounded-md">
              {character.element}
            </span>
          )}
          {character.role && (
            <span className="text-xs text-ink-light bg-cream-200 px-2 py-0.5 rounded-md">
              {character.role}
            </span>
          )}
          {character.status !== 'approved' && <StatusBadge status={character.status} size="sm" />}
        </div>
        {showTeam && teamName && (
          <p className="text-xs text-gold-dark mt-1 font-medium">{teamName}</p>
        )}
      </div>
    </button>
  );
}

interface TeamCardProps {
  team: Team;
  characterCount: number;
  onClick: () => void;
}

export function TeamCard({ team, characterCount, onClick }: TeamCardProps) {
  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-card rounded-2xl border border-border/50 overflow-hidden hover:shadow-card hover:border-gold/40 transition-all active:scale-[0.98]"
    >
      <div className="relative h-28 bg-gradient-to-br from-gold-50 to-cream-200 overflow-hidden">
        {team.image_url ? (
          <img src={team.image_url} alt={team.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl font-serif font-semibold text-gold/30">
              {team.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-ink text-lg">{team.name}</h3>
        {team.concept && <p className="text-sm text-ink-light line-clamp-2 mt-0.5">{team.concept}</p>}
        <p className="text-xs text-gold-dark mt-2 font-medium">
          {characterCount} {characterCount === 1 ? 'personaje' : 'personajes'}
        </p>
      </div>
    </button>
  );
}
