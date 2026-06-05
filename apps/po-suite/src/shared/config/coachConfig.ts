import type { CoachConfig } from '../types/coach';

export const STORY_COACH_CONFIG: CoachConfig = {
  toolId: 'story-generator',
  completedSteps: [
    { id: 'story-written', label: 'User Story geschrieben', done: true, doneBy: 'suite' },
    {
      id: 'testcases-created',
      label: 'Testfälle erstellt',
      done: false,
      doneBy: 'suite',
    },
    {
      id: 'doc-created',
      label: 'Dokumentation generiert',
      done: false,
      doneBy: 'suite',
    },
    {
      id: 'story-refined',
      label: 'Story mit Team besprochen',
      done: false,
      doneBy: 'manual',
    },
  ],
  suggestions: [
    {
      id: 'go-testcase',
      label: 'Testfälle erstellen',
      rationale: 'Testfälle vor dem Sprint-Start schreiben verhindert Missverständnisse in der Umsetzung.',
      actionType: 'navigate',
      actionTarget: '/tools/test-case-generator',
      priority: 1,
    },
    {
      id: 'go-doc',
      label: 'Confluence-Doku generieren',
      rationale: 'Eine fertige Story ist ideal als Basis für die technische Dokumentation.',
      actionType: 'navigate',
      actionTarget: '/tools/doc-generator',
      priority: 2,
    },
    {
      id: 'go-goal',
      label: 'Sprint Goal formulieren',
      rationale: 'Ein klares Sprint Goal schafft Fokus für das Team.',
      actionType: 'navigate',
      actionTarget: '/tools/goal-generator',
      priority: 3,
    },
  ],
  sprintContextText:
    'Stories werden im Sprint Planning committed. Je früher Testfälle existieren, desto besser die Definition of Ready.',
};

export const TESTCASE_COACH_CONFIG: CoachConfig = {
  toolId: 'test-case-generator',
  completedSteps: [
    {
      id: 'testcases-created',
      label: 'Testfälle erstellt',
      done: true,
      doneBy: 'suite',
    },
    {
      id: 'story-exists',
      label: 'User Story vorhanden',
      done: false,
      doneBy: 'suite',
    },
    {
      id: 'testcases-reviewed',
      label: 'Testfälle mit QA besprochen',
      done: false,
      doneBy: 'manual',
    },
    {
      id: 'testcases-in-jira',
      label: 'Testfälle in Jira exportiert',
      done: false,
      doneBy: 'manual',
    },
  ],
  suggestions: [
    {
      id: 'go-story',
      label: 'User Story schreiben',
      rationale: 'Testfälle ohne Story sind schwer priorisierbar — hol die Story nach.',
      actionType: 'navigate',
      actionTarget: '/tools/story-generator',
      priority: 1,
    },
    {
      id: 'go-doc',
      label: 'Dokumentation generieren',
      rationale: 'Die Testfälle sind eine gute Grundlage für die technische Doku.',
      actionType: 'navigate',
      actionTarget: '/tools/doc-generator',
      priority: 2,
    },
    {
      id: 'info-dor',
      label: 'Definition of Ready prüfen',
      rationale: 'Eine Story ist Ready, wenn Testfälle, Akzeptanzkriterien und Aufwand bekannt sind.',
      actionType: 'info',
      priority: 3,
    },
  ],
  sprintContextText:
    'Testfälle gehören zur Definition of Ready. Plane Zeit für die Abstimmung mit QA vor dem Sprint Planning ein.',
};

export const DOC_COACH_CONFIG: CoachConfig = {
  toolId: 'doc-generator',
  completedSteps: [
    {
      id: 'doc-created',
      label: 'Dokumentation generiert',
      done: true,
      doneBy: 'suite',
    },
    {
      id: 'doc-reviewed',
      label: 'Doku durch Stakeholder geprüft',
      done: false,
      doneBy: 'manual',
    },
    {
      id: 'doc-published',
      label: 'In Confluence veröffentlicht',
      done: false,
      doneBy: 'manual',
    },
  ],
  suggestions: [
    {
      id: 'go-story',
      label: 'Zugehörige Story erstellen',
      rationale: 'Dokumentation ohne Story verliert den Anforderungs-Kontext.',
      actionType: 'navigate',
      actionTarget: '/tools/story-generator',
      priority: 1,
    },
    {
      id: 'go-testcase',
      label: 'Testfälle ergänzen',
      rationale: 'Vollständige Dokumentation enthält auch die Testabdeckung.',
      actionType: 'navigate',
      actionTarget: '/tools/test-case-generator',
      priority: 2,
    },
    {
      id: 'info-confluence',
      label: 'Confluence-Struktur beachten',
      rationale: 'Halte dich an die Team-Konvention für Seitenstruktur und Namensgebung.',
      actionType: 'info',
      priority: 3,
    },
  ],
  sprintContextText:
    'Technische Dokumentation sollte spätestens bei Sprint Review vorliegen — plane das in deiner Definition of Done ein.',
};

export const GOAL_COACH_CONFIG: CoachConfig = {
  toolId: 'goal-generator',
  completedSteps: [
    {
      id: 'goal-created',
      label: 'Sprint Goal / PI Objective formuliert',
      done: true,
      doneBy: 'suite',
    },
    {
      id: 'goal-aligned',
      label: 'Goal mit Product Manager abgestimmt',
      done: false,
      doneBy: 'manual',
    },
    {
      id: 'goal-communicated',
      label: 'Goal im Sprint Planning präsentiert',
      done: false,
      doneBy: 'manual',
    },
  ],
  suggestions: [
    {
      id: 'go-story',
      label: 'Stories zum Goal erstellen',
      rationale: 'Ein klares Goal erleichtert das Story Mapping im Sprint Planning.',
      actionType: 'navigate',
      actionTarget: '/tools/story-generator',
      priority: 1,
    },
    {
      id: 'info-outcome',
      label: 'Outcome vs. Output prüfen',
      rationale: 'Gute Sprint Goals beschreiben ein Ergebnis für den Nutzer, keine Aufgabenliste.',
      actionType: 'info',
      priority: 2,
    },
    {
      id: 'go-doc',
      label: 'PI Objective dokumentieren',
      rationale: 'Dokumentierte PI Objectives helfen beim PI Review und retrospektiven Vergleich.',
      actionType: 'navigate',
      actionTarget: '/tools/doc-generator',
      priority: 3,
    },
  ],
  sprintContextText:
    'Sprint Goals werden im Planning committed und beim Review gemessen. Halte das Goal kurz und messbar.',
};

export const POLISH_COACH_CONFIG: CoachConfig = {
  toolId: 'text-polisher',
  completedSteps: [
    {
      id: 'text-polished',
      label: 'Text überarbeitet',
      done: true,
      doneBy: 'suite',
    },
    {
      id: 'text-reviewed',
      label: 'Inhalt geprüft',
      done: false,
      doneBy: 'manual',
    },
    {
      id: 'text-sent',
      label: 'Gesendet / veröffentlicht',
      done: false,
      doneBy: 'manual',
    },
  ],
  suggestions: [
    {
      id: 'info-tone',
      label: 'Ton an Empfänger anpassen',
      rationale: 'Überprüfe, ob der Ton (formell/informell) zum Empfänger passt.',
      actionType: 'info',
      priority: 1,
    },
    {
      id: 'go-doc',
      label: 'Längere Inhalte dokumentieren',
      rationale: 'Für ausführliche Inhalte eignet sich der Doc Generator besser.',
      actionType: 'navigate',
      actionTarget: '/tools/doc-generator',
      priority: 2,
    },
    {
      id: 'go-story',
      label: 'Anforderungen als Story formulieren',
      rationale: 'Anforderungen in E-Mails gehören in eine strukturierte User Story.',
      actionType: 'navigate',
      actionTarget: '/tools/story-generator',
      priority: 3,
    },
  ],
  sprintContextText: '',
};
