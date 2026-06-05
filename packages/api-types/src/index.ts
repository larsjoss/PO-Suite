// Shared types between frontend (apps/po-suite) and backend (apps/backend).
// Never add runtime code here — types only.

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface HintAnswer {
  hint: string;
  answer: string;
}

export type DocMode = 'story' | 'feature';

export interface StoryDocInput {
  title: string;
  description: string;
  confluenceSpec: string;
  code: string;
  acceptedBy: string;
  deploymentDate: string;
}

export interface FeatureDocInput {
  title: string;
  description: string;
  stories: string;
  confluenceSpec: string;
  code: string;
  responsible: string;
  deploymentDate: string;
  decisions: string;
}
