export type Status = 'proposal' | 'review' | 'approved' | 'rejected';

export type Source = 'claude' | 'chatgpt' | 'user';

export type ProposalStatus = 'proposal' | 'review' | 'approved' | 'rejected';

export interface Team {
  id: string;
  name: string;
  concept: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export interface Character {
  id: string;
  team_id: string;
  name: string;
  title: string;
  element: string;
  role: string;
  image_url: string;
  description: string;
  // Abilities
  power_basic_name: string;
  power_basic_type: string;
  power_basic_description: string;
  power_upgrade_name: string;
  power_upgrade_type: string;
  power_upgrade_description: string;
  power_ultimate_name: string;
  power_ultimate_type: string;
  power_ultimate_description: string;
  power_ultimate_cost: string;
  // Stats
  stat_attack: number;
  stat_defense: number;
  stat_speed: number;
  stat_magic: number;
  stat_resistance: number;
  // Characteristics
  strengths: string[];
  weaknesses: string[];
  // State
  status: Status;
  created_at: string;
  updated_at: string;
}

export interface Proposal {
  id: string;
  character_id: string;
  element_modified: string;
  original_info: Record<string, unknown>;
  proposed_info: Record<string, unknown>;
  source: Source;
  status: ProposalStatus;
  created_at: string;
  updated_at: string;
}

export interface HistoryEntry {
  id: string;
  character_id: string | null;
  team_id: string | null;
  action_type: string;
  affected_name: string;
  previous_info: Record<string, unknown> | null;
  new_info: Record<string, unknown> | null;
  source: Source;
  status: string;
  created_at: string;
}

export interface TeamWithCount extends Team {
  character_count: number;
}

export interface CharacterWithTeam extends Character {
  team?: Pick<Team, 'id' | 'name'>;
}

export interface ProposalWithCharacter extends Proposal {
  character?: Pick<Character, 'id' | 'name' | 'image_url'>;
}
