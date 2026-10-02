import { supabase } from './supabase';
import type { Character, Team, Source } from '@/types';

export async function logHistory(params: {
  characterId?: string | null;
  teamId?: string | null;
  actionType: string;
  affectedName: string;
  previousInfo?: Record<string, unknown> | null;
  newInfo?: Record<string, unknown> | null;
  source?: Source;
  status?: string;
}): Promise<void> {
  const {
    characterId = null,
    teamId = null,
    actionType,
    affectedName,
    previousInfo = null,
    newInfo = null,
    source = 'user',
    status = 'created',
  } = params;

  try {
    await supabase.from('history').insert({
      character_id: characterId,
      team_id: teamId,
      action_type: actionType,
      affected_name: affectedName,
      previous_info: previousInfo,
      new_info: newInfo,
      source,
      status,
    });
  } catch (err) {
    console.error('Failed to log history:', err);
  }
}

export function characterToInfo(c: Character): Record<string, unknown> {
  return {
    name: c.name,
    title: c.title,
    element: c.element,
    role: c.role,
    image_url: c.image_url,
    description: c.description,
    power_basic_name: c.power_basic_name,
    power_basic_type: c.power_basic_type,
    power_basic_description: c.power_basic_description,
    power_upgrade_name: c.power_upgrade_name,
    power_upgrade_type: c.power_upgrade_type,
    power_upgrade_description: c.power_upgrade_description,
    power_ultimate_name: c.power_ultimate_name,
    power_ultimate_type: c.power_ultimate_type,
    power_ultimate_description: c.power_ultimate_description,
    power_ultimate_cost: c.power_ultimate_cost,
    stat_attack: c.stat_attack,
    stat_defense: c.stat_defense,
    stat_speed: c.stat_speed,
    stat_magic: c.stat_magic,
    stat_resistance: c.stat_resistance,
    strengths: c.strengths,
    weaknesses: c.weaknesses,
    status: c.status,
  };
}

export function teamToInfo(t: Team): Record<string, unknown> {
  return {
    name: t.name,
    concept: t.concept,
    image_url: t.image_url,
  };
}

// Field labels for display
export const fieldLabels: Record<string, string> = {
  name: 'Nombre',
  title: 'Título',
  element: 'Elemento',
  role: 'Rol',
  image_url: 'Imagen',
  description: 'Descripción',
  power_basic_name: 'Nombre del poder básico',
  power_basic_type: 'Tipo del poder básico',
  power_basic_description: 'Descripción del poder básico',
  power_upgrade_name: 'Nombre del poder de mejora',
  power_upgrade_type: 'Tipo del poder de mejora',
  power_upgrade_description: 'Descripción del poder de mejora',
  power_ultimate_name: 'Nombre del poder definitivo',
  power_ultimate_type: 'Tipo del poder definitivo',
  power_ultimate_description: 'Descripción del poder definitivo',
  power_ultimate_cost: 'Costo del poder definitivo',
  stat_attack: 'Ataque',
  stat_defense: 'Defensa',
  stat_speed: 'Velocidad',
  stat_magic: 'Magia',
  stat_resistance: 'Resistencia',
  strengths: 'Fortalezas',
  weaknesses: 'Debilidades',
  status: 'Estado',
};

export function getFieldLabel(key: string): string {
  return fieldLabels[key] || key;
}
