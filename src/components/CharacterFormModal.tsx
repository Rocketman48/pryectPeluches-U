import { useState, useEffect } from 'react';
import type { Character } from '@/types';
import Modal from './Modal';
import { ConfirmButton } from './UI';

interface CharacterFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Character, 'id' | 'team_id' | 'created_at' | 'updated_at' | 'status'>) => void;
  character?: Character | null;
  teams: { id: string; name: string }[];
  defaultTeamId?: string;
}

const emptyData = {
  name: '',
  title: '',
  element: '',
  role: '',
  image_url: '',
  description: '',
  power_basic_name: '',
  power_basic_type: '',
  power_basic_description: '',
  power_upgrade_name: '',
  power_upgrade_type: '',
  power_upgrade_description: '',
  power_ultimate_name: '',
  power_ultimate_type: '',
  power_ultimate_description: '',
  power_ultimate_cost: '',
  stat_attack: 0,
  stat_defense: 0,
  stat_speed: 0,
  stat_magic: 0,
  stat_resistance: 0,
  strengths: ['', '', ''],
  weaknesses: ['', '', ''],
};

type FormData = typeof emptyData;

export default function CharacterFormModal({
  open,
  onClose,
  onSave,
  character,
  teams,
  defaultTeamId,
}: CharacterFormModalProps) {
  const [data, setData] = useState<FormData>(emptyData);
  const [section, setSection] = useState<'identity' | 'abilities' | 'stats' | 'characteristics'>('identity');

  useEffect(() => {
    if (open) {
      if (character) {
        setData({
          ...emptyData,
          ...character,
          strengths: character.strengths?.length === 3 ? character.strengths : ['', '', ''],
          weaknesses: character.weaknesses?.length === 3 ? character.weaknesses : ['', '', ''],
        });
      } else {
        setData(emptyData);
      }
      setSection('identity');
    }
  }, [open, character]);

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!data.name.trim()) return;
    onSave({
      ...data,
      name: data.name.trim(),
      strengths: data.strengths.filter((s) => s.trim()),
      weaknesses: data.weaknesses.filter((w) => w.trim()),
    });
  };

  const sections = [
    { key: 'identity' as const, label: 'Identidad' },
    { key: 'abilities' as const, label: 'Habilidades' },
    { key: 'stats' as const, label: 'Estadísticas' },
    { key: 'characteristics' as const, label: 'Características' },
  ];

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl border border-border bg-cream-50 text-ink focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-all';
  const labelClass = 'block text-sm font-medium text-ink mb-1.5';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={character ? 'Editar personaje' : 'Nuevo personaje'}
      size="lg"
      footer={
        <div className="flex gap-3 justify-end">
          <ConfirmButton variant="secondary" onConfirm={onClose}>
            Cancelar
          </ConfirmButton>
          <ConfirmButton
            variant="gold"
            onConfirm={handleSave}
            className={data.name.trim() ? '' : 'opacity-50 pointer-events-none'}
          >
            Guardar
          </ConfirmButton>
        </div>
      }
    >
      {/* Section tabs */}
      <div className="flex gap-1.5 mb-5 p-1 bg-cream-200 rounded-xl overflow-x-auto scrollbar-hide">
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              section === s.key
                ? 'bg-card text-forest shadow-soft'
                : 'text-ink-light hover:text-ink'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === 'identity' && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <label className={labelClass}>Nombre</label>
            <input className={inputClass} value={data.name} onChange={(e) => update('name', e.target.value)} placeholder="Ej: Ignis" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Título</label>
              <input className={inputClass} value={data.title} onChange={(e) => update('title', e.target.value)} placeholder="Ej: El Ardiente" />
            </div>
            <div>
              <label className={labelClass}>Elemento</label>
              <input className={inputClass} value={data.element} onChange={(e) => update('element', e.target.value)} placeholder="Ej: Fuego" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Rol</label>
            <input className={inputClass} value={data.role} onChange={(e) => update('role', e.target.value)} placeholder="Ej: DPS, Tank, Support..." />
          </div>
          <div>
            <label className={labelClass}>URL de imagen <span className="text-ink-light font-normal">(opcional)</span></label>
            <input className={inputClass} value={data.image_url} onChange={(e) => update('image_url', e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label className={labelClass}>Descripción general</label>
            <textarea className={`${inputClass} resize-none`} rows={3} value={data.description} onChange={(e) => update('description', e.target.value)} placeholder="Describe al personaje..." />
          </div>
        </div>
      )}

      {section === 'abilities' && (
        <div className="space-y-6 animate-fade-in">
          {/* Basic Power */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gold-dark flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gold" /> Poder Básico
            </h4>
            <input className={inputClass} value={data.power_basic_name} onChange={(e) => update('power_basic_name', e.target.value)} placeholder="Nombre del poder" />
            <input className={inputClass} value={data.power_basic_type} onChange={(e) => update('power_basic_type', e.target.value)} placeholder="Tipo (Ej: Activo, Pasivo...)" />
            <textarea className={`${inputClass} resize-none`} rows={2} value={data.power_basic_description} onChange={(e) => update('power_basic_description', e.target.value)} placeholder="Descripción del poder" />
          </div>
          {/* Upgrade Power */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gold-dark flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gold-light" /> Poder de Mejora
            </h4>
            <input className={inputClass} value={data.power_upgrade_name} onChange={(e) => update('power_upgrade_name', e.target.value)} placeholder="Nombre del poder" />
            <input className={inputClass} value={data.power_upgrade_type} onChange={(e) => update('power_upgrade_type', e.target.value)} placeholder="Tipo" />
            <textarea className={`${inputClass} resize-none`} rows={2} value={data.power_upgrade_description} onChange={(e) => update('power_upgrade_description', e.target.value)} placeholder="Descripción del poder" />
          </div>
          {/* Ultimate Power */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gold-dark flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gold-dark" /> Poder Definitivo
            </h4>
            <input className={inputClass} value={data.power_ultimate_name} onChange={(e) => update('power_ultimate_name', e.target.value)} placeholder="Nombre del poder" />
            <input className={inputClass} value={data.power_ultimate_type} onChange={(e) => update('power_ultimate_type', e.target.value)} placeholder="Tipo" />
            <textarea className={`${inputClass} resize-none`} rows={2} value={data.power_ultimate_description} onChange={(e) => update('power_ultimate_description', e.target.value)} placeholder="Descripción del poder" />
            <input className={inputClass} value={data.power_ultimate_cost} onChange={(e) => update('power_ultimate_cost', e.target.value)} placeholder="Costo (Ej: 3 turnos, 50 energía...)" />
          </div>
        </div>
      )}

      {section === 'stats' && (
        <div className="space-y-4 animate-fade-in">
          {([
            ['stat_attack', 'Ataque'],
            ['stat_defense', 'Defensa'],
            ['stat_speed', 'Velocidad'],
            ['stat_magic', 'Magia'],
            ['stat_resistance', 'Resistencia'],
          ] as const).map(([key, label]) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-ink">{label}</label>
                <span className="text-sm font-semibold text-forest tabular-nums">{data[key]}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={data[key]}
                onChange={(e) => update(key, parseInt(e.target.value) || 0)}
                className="w-full accent-forest"
              />
            </div>
          ))}
        </div>
      )}

      {section === 'characteristics' && (
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-forest-dark">Fortalezas</h4>
            {data.strengths.map((s, i) => (
              <input
                key={i}
                className={inputClass}
                value={s}
                onChange={(e) => {
                  const next = [...data.strengths];
                  next[i] = e.target.value;
                  update('strengths', next);
                }}
                placeholder={`Fortaleza ${i + 1}`}
              />
            ))}
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-red-600">Debilidades</h4>
            {data.weaknesses.map((w, i) => (
              <input
                key={i}
                className={inputClass}
                value={w}
                onChange={(e) => {
                  const next = [...data.weaknesses];
                  next[i] = e.target.value;
                  update('weaknesses', next);
                }}
                placeholder={`Debilidad ${i + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
