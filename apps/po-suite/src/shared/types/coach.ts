export type CoachSuggestion = {
  id: string;
  label: string;
  rationale: string;
  actionType: 'navigate' | 'info';
  actionTarget?: string;
  priority: 1 | 2 | 3;
};

export type CoachStep = {
  id: string;
  label: string;
  done: boolean;
  doneBy: 'suite' | 'manual';
};

export type CoachConfig = {
  toolId: string;
  completedSteps: CoachStep[];
  suggestions: CoachSuggestion[];
  sprintContextText: string;
};
