import { Home, Users, User, Lightbulb, Clock } from 'lucide-react';

export type NavPage = 'home' | 'teams' | 'characters' | 'proposals' | 'history';

interface BottomNavProps {
  current: NavPage;
  onNavigate: (page: NavPage) => void;
}

const items: { page: NavPage; label: string; icon: typeof Home }[] = [
  { page: 'home', label: 'Inicio', icon: Home },
  { page: 'teams', label: 'Equipos', icon: Users },
  { page: 'characters', label: 'Personajes', icon: User },
  { page: 'proposals', label: 'Propuestas', icon: Lightbulb },
  { page: 'history', label: 'Historial', icon: Clock },
];

export default function BottomNav({ current, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border/60 safe-bottom">
      <div className="max-w-2xl mx-auto flex items-stretch justify-around px-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = current === item.page;
          return (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 px-2 min-w-[60px] transition-colors ${
                active ? 'text-forest' : 'text-ink-light hover:text-ink'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110' : ''}`} />
              <span className={`text-[11px] font-medium ${active ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
