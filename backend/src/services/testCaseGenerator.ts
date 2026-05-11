import type Anthropic from '@anthropic-ai/sdk';
import { getApiClient } from '../shared/apiClient';
import { withTimeout } from '../shared/withTimeout';
import { buildImageBlock, type ImageMedia } from '../shared/imageBlocks';
import { TEST_CASE_GENERATOR_SYSTEM_PROMPT as SYSTEM_PROMPT } from './prompts';

export interface GenerateTestCasesParams {
  storyText: string;
  testContext?: string;
  screenshots: { base64: string; mediaType: ImageMedia }[];
}

export interface TestPlan {
  story_id: string | null;
  story_title: string;
  generated_at: string;
  input_sources: {
    has_screenshot: boolean;
    has_test_context: boolean;
    screenshot_count: number;
  };
  test_cases: unknown[];
  summary: unknown;
}

export async function generateTestCases(params: GenerateTestCasesParams): Promise<TestPlan> {
  const client = getApiClient();

  const contentBlocks: Anthropic.Messages.ContentBlockParam[] = [];

  let text = `STORY:\n${params.storyText}`;
  if (params.testContext?.trim()) {
    text += `\n\n---\nTESTKONTEXT:\n${params.testContext.trim()}\n---`;
  }
  if (params.screenshots.length > 0) {
    text += '\n\nDie angehängten Screenshots zeigen das entwickelte UI. Nutze sie als zusätzlichen Kontext.';
  }
  text += '\n\nGeneriere den Testplan als valides JSON-Objekt gemäss dem definierten Schema. Setze story_id auf null wenn keine Jira-ID vorhanden.';

  contentBlocks.push({ type: 'text', text });
  contentBlocks.push(...params.screenshots.map((s) => buildImageBlock(s.base64, s.mediaType)));

  const response = await withTimeout(
    client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: contentBlocks }],
    }),
  );

  const rawText = response.content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');

  const jsonStr = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();

  let plan: TestPlan;
  try {
    plan = JSON.parse(jsonStr) as TestPlan;
  } catch {
    throw new Error(
      'Der Testplan konnte nicht verarbeitet werden. Das Modell hat kein gültiges JSON zurückgegeben. Bitte erneut versuchen.',
    );
  }

  if (!Array.isArray(plan.test_cases) || !plan.summary) {
    throw new Error('Testplan-Struktur unvollständig. Bitte erneut versuchen.');
  }

  plan.generated_at = new Date().toISOString();
  return plan;
}
