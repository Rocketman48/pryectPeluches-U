/*
# NÚCLEO - Database Schema for Creative Project Organization

## Overview
Creates the core data model for NÚCLEO: a creative workspace for organizing characters and teams,
working with AI tools (Claude/ChatGPT) through context preparation, managing proposals, and
tracking an automatic history of all changes.

## Tables Created

### 1. teams
- id (uuid, PK)
- name (text, not null)
- concept (text, team description)
- image_url (text, visual identity)
- created_at (timestamptz)
- updated_at (timestamptz)

### 2. characters
- id (uuid, PK)
- team_id (uuid, FK -> teams, ON DELETE CASCADE)
- name (text, not null)
- title (text)
- element (text)
- role (text)
- image_url (text)
- description (text, general description)
- --- Abilities ---
- power_basic_name (text)
- power_basic_type (text)
- power_basic_description (text)
- power_upgrade_name (text)
- power_upgrade_type (text)
- power_upgrade_description (text)
- power_ultimate_name (text)
- power_ultimate_type (text)
- power_ultimate_description (text)
- power_ultimate_cost (text)
- --- Stats ---
- stat_attack (int, default 0)
- stat_defense (int, default 0)
- stat_speed (int, default 0)
- stat_magic (int, default 0)
- stat_resistance (int, default 0)
- --- Characteristics ---
- strengths (jsonb, array of 3 strings)
- weaknesses (jsonb, array of 3 strings)
- --- State ---
- status (text, default 'approved': 'proposal' | 'review' | 'approved')
- created_at (timestamptz)
- updated_at (timestamptz)

### 3. proposals
- id (uuid, PK)
- character_id (uuid, FK -> characters, ON DELETE CASCADE)
- element_modified (text, what field/section is being changed)
- original_info (jsonb, the previous value)
- proposed_info (jsonb, the new proposed value)
- source (text: 'claude' | 'chatgpt' | 'user')
- status (text: 'proposal' | 'review' | 'approved' | 'rejected')
- created_at (timestamptz)
- updated_at (timestamptz)

### 4. history
- id (uuid, PK)
- character_id (uuid, FK -> characters, nullable, ON DELETE SET NULL)
- team_id (uuid, FK -> teams, nullable, ON DELETE SET NULL)
- action_type (text, type of event)
- affected_name (text, name of character/team affected)
- previous_info (jsonb, nullable)
- new_info (jsonb, nullable)
- source (text: 'claude' | 'chatgpt' | 'user')
- status (text: 'proposal' | 'review' | 'approved' | 'rejected' | 'created')
- created_at (timestamptz)

## Security
- Single-tenant app (no auth) — all policies use TO anon, authenticated.
- RLS enabled on all tables.
- Full CRUD access for anon + authenticated (data is intentionally shared).

## Notes
1. All tables use gen_random_uuid() for primary keys.
2. Cascade deletes: deleting a team deletes its characters; deleting a character deletes its proposals.
3. History entries preserve character_id/team_id as nullable with SET NULL to keep history even after deletion.
4. JSONB columns used for flexible structured data (strengths, weaknesses, proposal diffs).
*/

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  concept text DEFAULT '',
  image_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_teams" ON teams;
CREATE POLICY "anon_select_teams" ON teams FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_teams" ON teams;
CREATE POLICY "anon_insert_teams" ON teams FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_teams" ON teams;
CREATE POLICY "anon_update_teams" ON teams FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_teams" ON teams;
CREATE POLICY "anon_delete_teams" ON teams FOR DELETE
  TO anon, authenticated USING (true);

-- Characters table
CREATE TABLE IF NOT EXISTS characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  title text DEFAULT '',
  element text DEFAULT '',
  role text DEFAULT '',
  image_url text DEFAULT '',
  description text DEFAULT '',
  -- Abilities
  power_basic_name text DEFAULT '',
  power_basic_type text DEFAULT '',
  power_basic_description text DEFAULT '',
  power_upgrade_name text DEFAULT '',
  power_upgrade_type text DEFAULT '',
  power_upgrade_description text DEFAULT '',
  power_ultimate_name text DEFAULT '',
  power_ultimate_type text DEFAULT '',
  power_ultimate_description text DEFAULT '',
  power_ultimate_cost text DEFAULT '',
  -- Stats
  stat_attack int NOT NULL DEFAULT 0,
  stat_defense int NOT NULL DEFAULT 0,
  stat_speed int NOT NULL DEFAULT 0,
  stat_magic int NOT NULL DEFAULT 0,
  stat_resistance int NOT NULL DEFAULT 0,
  -- Characteristics
  strengths jsonb NOT NULL DEFAULT '[]'::jsonb,
  weaknesses jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- State
  status text NOT NULL DEFAULT 'approved',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_characters" ON characters;
CREATE POLICY "anon_select_characters" ON characters FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_characters" ON characters;
CREATE POLICY "anon_insert_characters" ON characters FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_characters" ON characters;
CREATE POLICY "anon_update_characters" ON characters FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_characters" ON characters;
CREATE POLICY "anon_delete_characters" ON characters FOR DELETE
  TO anon, authenticated USING (true);

-- Proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  element_modified text NOT NULL,
  original_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  proposed_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text NOT NULL DEFAULT 'user',
  status text NOT NULL DEFAULT 'proposal',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_proposals" ON proposals;
CREATE POLICY "anon_select_proposals" ON proposals FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_proposals" ON proposals;
CREATE POLICY "anon_insert_proposals" ON proposals FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_proposals" ON proposals;
CREATE POLICY "anon_update_proposals" ON proposals FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_proposals" ON proposals;
CREATE POLICY "anon_delete_proposals" ON proposals FOR DELETE
  TO anon, authenticated USING (true);

-- History table
CREATE TABLE IF NOT EXISTS history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES characters(id) ON DELETE SET NULL,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  affected_name text NOT NULL DEFAULT '',
  previous_info jsonb,
  new_info jsonb,
  source text NOT NULL DEFAULT 'user',
  status text NOT NULL DEFAULT 'created',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_history" ON history;
CREATE POLICY "anon_select_history" ON history FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_history" ON history;
CREATE POLICY "anon_insert_history" ON history FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_history" ON history;
CREATE POLICY "anon_update_history" ON history FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_history" ON history;
CREATE POLICY "anon_delete_history" ON history FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_characters_team_id ON characters(team_id);
CREATE INDEX IF NOT EXISTS idx_proposals_character_id ON proposals(character_id);
CREATE INDEX IF NOT EXISTS idx_history_character_id ON history(character_id);
CREATE INDEX IF NOT EXISTS idx_history_team_id ON history(team_id);
CREATE INDEX IF NOT EXISTS idx_characters_status ON characters(status);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
