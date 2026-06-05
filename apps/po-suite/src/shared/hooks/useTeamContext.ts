import { useState, useCallback } from 'react';
import { TEAM_CONTEXT_KEY } from '../services/storageKeys';

const MAX_LENGTH = 800;

export function useTeamContext() {
  const [teamContext, setTeamContextState] = useState<string>(
    () => localStorage.getItem(TEAM_CONTEXT_KEY) ?? '',
  );

  const setTeamContext = useCallback((value: string) => {
    const trimmed = value.slice(0, MAX_LENGTH);
    localStorage.setItem(TEAM_CONTEXT_KEY, trimmed);
    setTeamContextState(trimmed);
  }, []);

  return { teamContext, setTeamContext };
}
