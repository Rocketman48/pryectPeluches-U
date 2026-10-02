import { useState } from 'react';
import Modal from './Modal';
import { ConfirmButton } from './UI';
import { FileDown, AlertCircle } from 'lucide-react';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (data: Record<string, unknown>) => void;
}

const fieldGuide = `// Pega aquí la información del personaje en formato estructurado.
// Ejemplo JSON:
{
  "name": "Ignis",
  "title": "El Ardiente",
  "element": "Fuego",
  "role": "DPS",
  "description": "Un guerrero...",
  "power_basic_name": "Llama Inicial",
  "power_basic_type": "Activo",
  "power_basic_description": "...",
  "power_upgrade_name": "Llama Intensificada",
  "power_upgrade_type": "Activo",
  "power_upgrade_description": "...",
  "power_ultimate_name": "Infierno Total",
  "power_ultimate_type": "Definitivo",
  "power_ultimate_description": "...",
  "power_ultimate_cost": "3 turnos",
  "stat_attack": 80,
  "stat_defense": 40,
  "stat_speed": 60,
  "stat_magic": 70,
  "stat_resistance": 50,
  "strengths": ["Alto daño", "Resistencia al fuego", "Velocidad"],
  "weaknesses": ["Débil al agua", "Poca defensa física", "Impulsivo"]
}`;

export default function ImportModal({ open, onClose, onImport }: ImportModalProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const handleImport = () => {
    setError('');
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed !== 'object' || parsed === null) {
        setError('El JSON debe ser un objeto.');
        return;
      }
      if (!parsed.name || typeof parsed.name !== 'string') {
        setError('El personaje debe tener al menos un "name" (nombre).');
        return;
      }
      onImport(parsed);
      setText('');
    } catch {
      setError('No se pudo interpretar como JSON. Revisa el formato.');
    }
  };

  const handleClose = () => {
    setText('');
    setError('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Importar personaje"
      size="lg"
      footer={
        <div className="flex gap-3 justify-end">
          <ConfirmButton variant="secondary" onConfirm={handleClose}>
            Cancelar
          </ConfirmButton>
          <ConfirmButton variant="gold" onConfirm={handleImport} className={text.trim() ? '' : 'opacity-50 pointer-events-none'}>
            Importar
          </ConfirmButton>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gold-50 border border-gold/20">
          <FileDown className="w-5 h-5 text-gold-dark shrink-0 mt-0.5" />
          <p className="text-sm text-ink">
            Pega la información del personaje en formato JSON. Se crearán todos los campos
            automáticamente sin tener que rellenarlos uno por uno.
          </p>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          placeholder={fieldGuide}
          className="w-full px-4 py-3 rounded-xl border border-border bg-cream-50 text-ink font-mono text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-all resize-none modal-scroll"
          autoFocus
        />
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
