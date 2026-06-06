/**
 * Assembles the full system prompt by prepending optional user context to the tool prompt.
 *
 * Order: team context → workspace context → tool prompt.
 * This order ensures the model sees user-specific context before the tool instructions,
 * which improves adherence to team conventions and workspace terminology.
 * Empty context strings are omitted entirely so the prompt stays compact.
 */
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
