import type { Character, Team } from '@/types';

export type ContextScope = 'full' | 'identity' | 'abilities' | 'stats' | 'characteristics';

export type AITarget = 'claude' | 'chatgpt';

const scopeLabels: Record<ContextScope, string> = {
  full: 'Personaje completo',
  identity: 'Identidad',
  abilities: 'Habilidades',
  stats: 'Estadísticas',
  characteristics: 'Características',
};

const statusLabels: Record<string, string> = {
  proposal: 'Propuesta',
  review: 'En revisión',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

const sourceLabels: Record<string, string> = {
  claude: 'Claude',
  chatgpt: 'ChatGPT',
  user: 'Usuario',
};

function formatField(label: string, value: string | undefined): string {
  if (!value || value.trim() === '') return `  ${label}: (no definido)`;
  return `  ${label}: ${value}`;
}

function buildIdentitySection(c: Character): string {
  return [
    '## Identidad',
    formatField('Nombre', c.name),
    formatField('Título', c.title),
    formatField('Elemento', c.element),
    formatField('Rol', c.role),
    formatField('Descripción', c.description),
  ].join('\n');
}

function buildAbilitiesSection(c: Character): string {
  const lines = ['## Habilidades'];

  lines.push('### Poder Básico');
  lines.push(formatField('Nombre', c.power_basic_name));
  lines.push(formatField('Tipo', c.power_basic_type));
  lines.push(formatField('Descripción', c.power_basic_description));

  lines.push('### Poder de Mejora');
  lines.push(formatField('Nombre', c.power_upgrade_name));
  lines.push(formatField('Tipo', c.power_upgrade_type));
  lines.push(formatField('Descripción', c.power_upgrade_description));

  lines.push('### Poder Definitivo');
  lines.push(formatField('Nombre', c.power_ultimate_name));
  lines.push(formatField('Tipo', c.power_ultimate_type));
  lines.push(formatField('Descripción', c.power_ultimate_description));
  lines.push(formatField('Costo', c.power_ultimate_cost));

  return lines.join('\n');
}

function buildStatsSection(c: Character): string {
  return [
    '## Estadísticas',
    `  Ataque: ${c.stat_attack}`,
    `  Defensa: ${c.stat_defense}`,
    `  Velocidad: ${c.stat_speed}`,
    `  Magia: ${c.stat_magic}`,
    `  Resistencia: ${c.stat_resistance}`,
  ].join('\n');
}

function buildCharacteristicsSection(c: Character): string {
  const strengths = (c.strengths || []).filter((s) => s.trim() !== '');
  const weaknesses = (c.weaknesses || []).filter((w) => w.trim() !== '');
  return [
    '## Características',
    '### Fortalezas',
    strengths.length > 0 ? strengths.map((s) => `  - ${s}`).join('\n') : '  (no definidas)',
    '### Debilidades',
    weaknesses.length > 0 ? weaknesses.map((w) => `  - ${w}`).join('\n') : '  (no definidas)',
  ].join('\n');
}

function buildHeader(
  character: Character,
  team: Pick<Team, 'name' | 'concept'> | null,
  scope: ContextScope,
  target: AITarget,
): string[] {
  const sections: string[] = [];
  sections.push('# NÚCLEO — Contexto del proyecto creativo');
  sections.push(`Personaje: ${character.name}`);
  sections.push(`Estado actual: ${statusLabels[character.status] || character.status}`);

  if (team) {
    sections.push(`Equipo: ${team.name}`);
    if (team.concept) sections.push(`Concepto del equipo: ${team.concept}`);
  }

  sections.push(`Ámbito del contexto: ${scopeLabels[scope]}`);
  sections.push('');
  return sections;
}

function buildScopedSections(
  character: Character,
  scope: ContextScope,
): string[] {
  const sections: string[] = [];

  if (scope === 'full' || scope === 'identity') {
    sections.push(buildIdentitySection(character));
    sections.push('');
  }

  if (scope === 'full' || scope === 'abilities') {
    sections.push(buildAbilitiesSection(character));
    sections.push('');
  }

  if (scope === 'full' || scope === 'stats') {
    sections.push(buildStatsSection(character));
    sections.push('');
  }

  if (scope === 'full' || scope === 'characteristics') {
    sections.push(buildCharacteristicsSection(character));
    sections.push('');
  }

  return sections;
}

export function buildCharacterContext(
  character: Character,
  team: Pick<Team, 'name' | 'concept'> | null,
  scope: ContextScope = 'full',
  objective?: string,
): string {
  const sections = buildHeader(character, team, scope, 'claude');
  sections.push(...buildScopedSections(character, scope));

  if (objective && objective.trim()) {
    sections.push('## Objetivo de la consulta');
    sections.push(objective.trim());
    sections.push('');
  }

  sections.push('---');
  sections.push('Por favor, analiza y desarrolla la información solicitada manteniendo la coherencia con los datos existentes.');

  return sections.join('\n');
}

export function buildReviewContext(
  character: Character,
  team: Pick<Team, 'name' | 'concept'> | null,
  scope: ContextScope = 'full',
  objective?: string,
): string {
  const sections = buildHeader(character, team, scope, 'chatgpt');
  sections.push(...buildScopedSections(character, scope));

  sections.push('## Objetivo de la consulta');
  if (objective && objective.trim()) {
    sections.push(objective.trim());
  } else {
    sections.push('Revisa la coherencia general del personaje, detecta posibles contradicciones entre sus habilidades, estadísticas, fortalezas y debilidades, y sugiere mejoras.');
  }
  sections.push('');
  sections.push('---');
  sections.push('No modifiques automáticamente la información. Proporciona análisis y sugerencias que el usuario podrá aprobar o rechazar.');

  return sections.join('\n');
}

export function buildContext(
  target: AITarget,
  character: Character,
  team: Pick<Team, 'name' | 'concept'> | null,
  scope: ContextScope = 'full',
  objective?: string,
): string {
  return target === 'chatgpt'
    ? buildReviewContext(character, team, scope, objective)
    : buildCharacterContext(character, team, scope, objective);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  // Try the modern Clipboard API first
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to execCommand fallback (e.g. iframe permission denied)
    }
  }

  // Fallback: use a temporary textarea + execCommand
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);

    // iOS Safari needs contenteditable + readonly to select properly
    textarea.contentEditable = 'true';
    textarea.readOnly = false;

    const range = document.createRange();
    range.selectNodeContents(textarea);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    textarea.setSelectionRange(0, text.length);

    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}

export function openClaude(): void {
  window.open('https://claude.ai/new', '_blank', 'noopener,noreferrer');
}

export function openChatGPT(): void {
  window.open('https://chat.openai.com/', '_blank', 'noopener,noreferrer');
}

export { sourceLabels, statusLabels, scopeLabels };
