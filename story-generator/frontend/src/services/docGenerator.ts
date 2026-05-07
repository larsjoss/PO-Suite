import Anthropic from '@anthropic-ai/sdk';
import { getApiClient, extractTextContent } from '../shared/services/apiClient';
import { withTimeout } from '../shared/services/withTimeout';
import type { GenerateDocParams, StoryDocInput, FeatureDocInput } from '../types';

// ─── System Prompts ───────────────────────────────────────────────────────────

const STORY_SYSTEM_PROMPT = `Du bist ein erfahrener Business Analyst und Technical Writer in einem Schweizer Versicherungsunternehmen. Du erstellst fachtechnische Dokumentationen für umgesetzte User Stories. Deine Zielgruppe sind Fachstakeholder und Business Analysten ohne tiefes technisches Vorwissen.

Erstelle eine strukturierte Dokumentation auf Deutsch basierend auf dem folgenden Input. Halte dich strikt an die vorgegebene Struktur. Generiere ausschliesslich Abschnitte, für die Input vorhanden ist. Lasse Abschnitte vollständig weg, wenn kein entsprechender Input vorhanden ist – erfinde oder ergänze keinen Inhalt.

Schreibe klar, präzise und fachlich korrekt. Vermeide Fülltext und generische Formulierungen. Der Output soll direkt in Confluence verwendbar sein.

Verwende folgende Struktur:

# [Story-Titel]

## Kontext & Ziel
Worum geht es, und warum wurde diese Änderung umgesetzt?

## Betroffene Nutzergruppe
Für wen ist diese Änderung relevant?

## Was wurde umgesetzt
Konkrete Beschreibung der umgesetzten Funktionalität aus Nutzerperspektive.

## Benutzeroberfläche
[Nur generieren wenn Screenshot vorhanden] Beschreibung der relevanten UI-Elemente und des Ablaufs.

## Wichtige technische Details
[Nur generieren wenn Code vorhanden] Relevante Implementierungsdetails, die fachlich oder architektonisch bedeutsam sind.

## Hinweise & Einschränkungen
Bekannte Limitierungen, Sonderfälle, Abhängigkeiten, offene Folgearbeiten.

## Abnahme & Deployment
[Nur generieren wenn Abnahme oder Datum vorhanden] Wer hat abgenommen, wann erfolgte das PROD-Deployment.`;

const FEATURE_SYSTEM_PROMPT = `Du bist ein erfahrener Business Analyst und Technical Writer in einem Schweizer Versicherungsunternehmen. Du erstellst fachtechnische Dokumentationen für umgesetzte Features und Capabilities. Deine Zielgruppe sind Fachstakeholder, Business Analysten und Product Manager.

Erstelle eine strukturierte Feature-Dokumentation auf Deutsch basierend auf dem folgenden Input. Halte dich strikt an die vorgegebene Struktur. Generiere ausschliesslich Abschnitte, für die Input vorhanden ist. Lasse Abschnitte vollständig weg, wenn kein entsprechender Input vorhanden ist – erfinde oder ergänze keinen Inhalt.

Schreibe klar, präzise und auf einer Überblicksebene. Synthetisiere mehrere Stories zu einem kohärenten Ganzen. Der Output soll direkt in Confluence verwendbar sein.

Verwende folgende Struktur:

# [Feature-Titel]

## Feature-Überblick
Was ist dieses Feature, welchen Mehrwert liefert es für Nutzer und Business?

## Betroffene Nutzergruppen
Welche Rollen oder Nutzertypen sind betroffen?

## Enthaltene Funktionalitäten
Übersicht der wesentlichen Funktionen mit kurzer Beschreibung je Funktion.

## Benutzeroberfläche & Ablauf
[Nur generieren wenn Screenshot vorhanden] Überblick über relevante UI-Bereiche und typischen Nutzerfluss.

## Architektur & technische Einordnung
[Nur generieren wenn Code oder Architekturnotizen vorhanden] Technische Einordnung, relevante Designentscheide, Schnittstellen.

## Abhängigkeiten & Voraussetzungen
Was muss gegeben sein, damit das Feature funktioniert?

## Bekannte Einschränkungen & offene Punkte
Was ist bewusst nicht Teil dieses Features, welche Folgearbeiten sind bekannt?

## Versionierung & Historie
[Nur generieren wenn Deployment-Datum oder Verantwortliche vorhanden] Deployment-Datum, enthaltene Stories, verantwortliche Person.`;

// ─── User-Message Builder ─────────────────────────────────────────────────────

function buildStoryText(input: StoryDocInput): string {
  const lines: string[] = [];
  lines.push(`**Titel:** ${input.title}`);
  lines.push('');
  lines.push(`**Story-Beschreibung / Akzeptanzkriterien:**\n${input.description}`);
  if (input.confluenceSpec.trim()) {
    lines.push('');
    lines.push(`**Confluence-Spezifikation:**\n${input.confluenceSpec.trim()}`);
  }
  if (input.code.trim()) {
    lines.push('');
    lines.push(`**Code / PR-Beschreibung:**\n${input.code.trim()}`);
  }
  if (input.acceptedBy.trim()) {
    lines.push('');
    lines.push(`**Abnahme durch:** ${input.acceptedBy.trim()}`);
  }
  if (input.deploymentDate.trim()) {
    lines.push('');
    lines.push(`**Deployment-Datum:** ${input.deploymentDate.trim()}`);
  }
  return lines.join('\n');
}

function buildFeatureText(input: FeatureDocInput): string {
  const lines: string[] = [];
  lines.push(`**Titel:** ${input.title}`);
  lines.push('');
  lines.push(`**Feature-Beschreibung:**\n${input.description}`);
  lines.push('');
  lines.push(`**Enthaltene Stories:**\n${input.stories}`);
  if (input.confluenceSpec.trim()) {
    lines.push('');
    lines.push(`**Confluence-Spezifikation:**\n${input.confluenceSpec.trim()}`);
  }
  if (input.code.trim()) {
    lines.push('');
    lines.push(`**Code / Architekturnotizen:**\n${input.code.trim()}`);
  }
  if (input.responsible.trim()) {
    lines.push('');
    lines.push(`**Verantwortlich:** ${input.responsible.trim()}`);
  }
  if (input.deploymentDate.trim()) {
    lines.push('');
    lines.push(`**Deployment-Datum:** ${input.deploymentDate.trim()}`);
  }
  return lines.join('\n');
}

// ─── API Call ─────────────────────────────────────────────────────────────────

export async function generateDoc(params: GenerateDocParams): Promise<string> {
  const client = getApiClient();

  const systemPrompt = params.mode === 'story' ? STORY_SYSTEM_PROMPT : FEATURE_SYSTEM_PROMPT;
  const maxTokens = params.mode === 'story' ? 4000 : 6000;

  const userText =
    params.mode === 'story'
      ? buildStoryText(params.input)
      : buildFeatureText(params.input);

  const hasScreenshots = params.screenshots.length > 0;
  const textWithScreenshotHint = hasScreenshots
    ? `${userText}\n\nDie angehängten Screenshots zeigen das entwickelte UI. Nutze sie als zusätzlichen Kontext für die Dokumentation.`
    : userText;

  const contentBlocks: Anthropic.Messages.ContentBlockParam[] = [
    { type: 'text', text: textWithScreenshotHint },
  ];

  for (const s of params.screenshots) {
    const mediaType = s.file.type as 'image/png' | 'image/jpeg' | 'image/webp';
    contentBlocks.push({
      type: 'image',
      source: { type: 'base64', media_type: mediaType, data: s.base64 },
    });
  }

  const response = await withTimeout(
    client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: contentBlocks }],
    }),
  );

  const markdown = extractTextContent(response.content);

  if (!markdown.trim()) {
    throw new Error('Die Dokumentation konnte nicht generiert werden. Bitte erneut versuchen.');
  }

  return markdown;
}
