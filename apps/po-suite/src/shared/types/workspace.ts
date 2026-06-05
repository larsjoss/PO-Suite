export type WorkspaceToolId = 'story' | 'testcase' | 'doc' | 'goal' | 'polish';

export type WorkspaceArtifact = {
  id: string;
  toolId: WorkspaceToolId;
  generatedAt: number;
  title: string;
  content: string;
};

export type Workspace = {
  id: string;
  name: string;
  workspaceContext: string;
  artifacts: WorkspaceArtifact[];
  createdAt: number;
  updatedAt: number;
};
