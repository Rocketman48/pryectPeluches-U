import { useState, useEffect } from 'react';
import type { Team } from '@/types';
import Modal from './Modal';
import { ConfirmButton } from './UI';

interface TeamFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string; concept: string; image_url: string }) => void;
  team?: Team | null;
}

export default function TeamFormModal({ open, onClose, onSave, team }: TeamFormModalProps) {
  const [name, setName] = useState('');
  const [concept, setConcept] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (open) {
      setName(team?.name || '');
      setConcept(team?.concept || '');
      setImageUrl(team?.image_url || '');
    }
  }, [open, team]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), concept: concept.trim(), image_url: imageUrl.trim() });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={team ? 'Editar equipo' : 'Nuevo equipo'}
      footer={
        <div className="flex gap-3 justify-end">
          <ConfirmButton variant="secondary" onConfirm={onClose}>
            Cancelar
          </ConfirmButton>
          <ConfirmButton variant="gold" onConfirm={handleSave} className={name.trim() ? '' : 'opacity-50 pointer-events-none'}>
            Guardar
          </ConfirmButton>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Rynchoyang"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-cream-50 text-ink focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-all"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Concepto / Descripción</label>
          <textarea
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder="Describe el concepto del equipo..."
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-cream-50 text-ink focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-all resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            URL de imagen <span className="text-ink-light font-normal">(opcional)</span>
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-cream-50 text-ink focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-all"
          />
        </div>
      </div>
    </Modal>
  );
}
