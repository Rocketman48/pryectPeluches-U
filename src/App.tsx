import { useState, useEffect } from 'react';
import BottomNav, { type NavPage } from '@/components/BottomNav';
import HomePage from '@/pages/HomePage';
import TeamsPage from '@/pages/TeamsPage';
import CharactersPage from '@/pages/CharactersPage';
import CharacterDetailPage from '@/pages/CharacterDetailPage';
import ProposalsPage from '@/pages/ProposalsPage';
import HistoryPage from '@/pages/HistoryPage';

export default function App() {
  const [page, setPage] = useState<NavPage>('home');
  const [openTeamId, setOpenTeamId] = useState<string | null>(null);
  const [openCharacterId, setOpenCharacterId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Listen for cross-page character open events (e.g., from team detail)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setOpenCharacterId(detail);
    };
    window.addEventListener('nucleo:openCharacter', handler);
    return () => window.removeEventListener('nucleo:openCharacter', handler);
  }, []);

  const handleNavigate = (next: NavPage) => {
    setPage(next);
    setOpenTeamId(null);
    setOpenCharacterId(null);
  };

  const handleOpenTeam = (teamId: string | null) => {
    setOpenTeamId(teamId);
    if (teamId) setPage('teams');
  };

  const handleOpenCharacter = (characterId: string) => {
    setOpenCharacterId(characterId);
    setRefreshKey((k) => k + 1);
  };

  const handleBackFromCharacter = () => {
    setOpenCharacterId(null);
    setRefreshKey((k) => k + 1);
  };

  // Character detail overlays any page
  if (openCharacterId) {
    return (
      <div className="min-h-screen bg-cream max-w-2xl mx-auto">
        <CharacterDetailPage
          characterId={openCharacterId}
          onBack={handleBackFromCharacter}
        />
        <BottomNav current={page} onNavigate={(next) => {
          handleBackFromCharacter();
          handleNavigate(next);
        }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream max-w-2xl mx-auto">
      {page === 'home' && <HomePage onOpenTeam={(id) => handleOpenTeam(id)} />}
      {page === 'teams' && (
        <TeamsPage openTeamId={openTeamId} onOpenTeam={setOpenTeamId} />
      )}
      {page === 'characters' && (
        <CharactersPage onOpenCharacter={handleOpenCharacter} refreshKey={refreshKey} />
      )}
      {page === 'proposals' && (
        <ProposalsPage onOpenCharacter={handleOpenCharacter} refreshKey={refreshKey} />
      )}
      {page === 'history' && <HistoryPage />}
      <BottomNav current={page} onNavigate={handleNavigate} />
    </div>
  );
}
