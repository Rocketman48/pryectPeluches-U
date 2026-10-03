import { useState } from 'react';
import Modal from './Modal';
import { ConfirmButton } from './UI';
import { FileDown, AlertCircle, ClipboardPaste } from 'lucide-react';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (data: Record<string, unknown>) => void;
}

const fieldGuide = `{
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

function stripMarkdownFences(raw: string): string {
  let text = raw.trim();
  // Remove ```json ... ``` or ``` ... ``` wrapping
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/i);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }
  return text;
}

function removeTrailingCommas(text: string): string {
  // Remove trailing commas before } or ] (but not inside strings)
  let result = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (escaped) {
      result += ch;
      escaped = false;
      continue;
    }

    if (ch === '\\') {
      result += ch;
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }

    if (!inString && ch === ',') {
      // Look ahead for the next non-whitespace character
      let j = i + 1;
      while (j < text.length && /\s/.test(text[j])) j++;

      if (text[j] === '}' || text[j] === ']') {
        // Skip the comma
        continue;
      }
    }

    result += ch;
  }

  return result;
}

function tryParse(raw: string): { data?: Record<string, unknown>; error?: string } {
  let text = raw.trim();

  if (!text) {
    return { error: 'No hay texto para importar. Pega un JSON con los datos del personaje.' };
  }

  // Step 1: Strip markdown code fences
  text = stripMarkdownFences(text);

  // Step 2: Try parsing as-is
  try {
    const parsed = JSON.parse(text);
    return validateObject(parsed);
  } catch {
    // continue to cleanup
  }

  // Step 3: Remove trailing commas and try again
  const cleaned = removeTrailingCommas(text);
  try {
    const parsed = JSON.parse(cleaned);
    return validateObject(parsed);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: `No se pudo interpretar el JSON: ${msg}` };
  }
}

function validateObject(parsed: unknown): { data?: Record<string, unknown>; error?: string } {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { error: 'El texto debe ser un objeto JSON (entre llaves { }), no una lista ni un valor simple.' };
  }

  const obj = parsed as Record<string, unknown>;
  if (!obj.name || typeof obj.name !== 'string') {
    return { error: 'El personaje debe tener al menos un campo "name" (nombre) con texto.' };
  }

  return { data: obj };
}

export default function ImportModal({ open, onClose, onImport }: ImportModalProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const handleImport = () => {
    setError('');

    const { data, error: parseError } = tryParse(text);
    if (parseError) {
      setError(parseError);
      return;
    }

    if (data) {
      onImport(data);
      setText('');
      setError('');
    }
  };

  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        setText(clipText);
        setError('');
      }
    } catch {
      // Clipboard read may not be available — ignore silently
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

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-ink">Datos del personaje</label>
          <button
            onClick={handlePaste}
            className="flex items-center gap-1.5 text-xs font-medium text-gold-dark hover:text-gold transition-colors"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            Pegar del portapapeles
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError('');
          }}
          rows={14}
          placeholder={fieldGuide}
          className="w-full px-4 py-3 rounded-xl border border-border bg-cream-50 text-ink font-mono text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-all resize-none modal-scroll"
          autoFocus
        />

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 animate-slide-down">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
