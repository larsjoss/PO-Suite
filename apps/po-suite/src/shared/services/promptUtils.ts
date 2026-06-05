export function buildSystemPrompt(
  toolPrompt: string,
  teamContext: string,
  workspaceContext: string,
): string {
  const parts: string[] = [];
  if (teamContext.trim()) parts.push(`## Team-Kontext des Nutzers\n${teamContext}`);
  if (workspaceContext.trim()) parts.push(`## Workspace-Kontext\n${workspaceContext}`);
  parts.push(toolPrompt);
  return parts.join('\n\n');
}
