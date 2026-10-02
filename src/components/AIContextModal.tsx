import { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import { ConfirmButton } from './UI';
import { Clipboard, ClipboardCheck, ExternalLink, Sparkles, MessageSquare } from 'lucide-react';
import { copyToClipboard, openClaude, openChatGPT, buildContext } from '@/lib/ai-context';
import type { ContextScope, AITarget } from '@/lib/ai-context';
import type { Character, Team } from '@/types';

interface AIContextModalProps {
  open: boolean;
  onClose: () => void;
  character: Character | null;
  team: Pick<Team, 'name' | 'concept'> | null;
  target: AITarget;
  scope: ContextScope;
}

export default function AIContextModal({
  open,
  onClose,
  character,
  team,
  target,
  scope,
}: AIContextModalProps) {
  const [copyState, setCopyState] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      setCopyState('idle');
      setNote('');
    }
  }, [open]);

  const context = useMemo(() => {
    if (!character) return '';
    return buildContext(target, character, team, scope, note.trim() || undefined);
  }, [target, character, team, scope, note]);

  const handleCopy = async () => {
    if (!context) return;
    const ok = await copyToClipboard(context);
    setCopyState(ok ? 'ok' : 'fail');
    setTimeout(() => setCopyState('idle'), 2500);
  };

  const handleOpen = () => {
    handleCopy();
    if (target === 'claude') openClaude();
    else openChatGPT();
  };

  const targetConfig = target === 'claude'
    ? { name: 'Claude', icon: Sparkles, bg: 'bg-lavender', text: 'text-lavender-dark', bgLight: 'bg-lavender-50' }
    : { name: 'ChatGPT', icon: MessageSquare, bg: 'bg-lavender', text: 'text-lavender-dark', bgLight: 'bg-lavender-50' };

  const Icon = targetConfig.icon;

  const defaultObjective = target === 'chatgpt'
    ? 'Revisa la coherencia del personaje y sugiere mejoras...'
    : 'Describe qué quieres desarrollar o modificar...';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={target === 'claude' ? 'Trabajar con Claude' : 'Consultar con ChatGPT'}
      size="lg"
      footer={
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={handleCopy}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95 ${
              copyState === 'ok' ? 'bg-forest-50 text-forest-dark'
              : copyState === 'fail' ? 'bg-red-50 text-red-600'
              : 'bg-cream-200 text-ink hover:bg-border'
            }`}
          >
            {copyState === 'ok' ? <ClipboardCheck className="w-4 h-4" />
            : copyState === 'fail' ? <Clipboard className="w-4 h-4" />
            : <Clipboard className="w-4 h-4" />}
            {copyState === 'ok' ? 'Copiado al portapapeles'
            : copyState === 'fail' ? 'No se pudo copiar — selecciona el texto manualmente'
            : 'Copiar contexto'}
          </button>
          <button
            onClick={handleOpen}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white transition-all active:scale-95 ${targetConfig.bg} hover:opacity-90`}
          >
            <ExternalLink className="w-4 h-4" />
            Copiar y abrir {targetConfig.name}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className={`flex items-start gap-3 p-3.5 rounded-xl ${targetConfig.bgLight} border border-lavender/20`}>
          <Icon className={`w-5 h-5 ${targetConfig.text} shrink-0 mt-0.5`} />
          <div className="text-sm text-ink">
            <p className="font-medium mb-1">Contexto preparado con datos reales</p>
            <p className="text-ink-light text-xs leading-relaxed">
              Núcleo ha preparado el contexto del personaje usando su información guardada.
              Copia el texto y pégalo en {targetConfig.name}. Núcleo no envía datos directamente —
              tú controlas qué se comparte.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Objetivo de la consulta <span className="text-ink-light font-normal">(opcional)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={defaultObjective}
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-cream-50 text-ink focus:outline-none focus:ring-2 focus:ring-lavender/30 focus:border-lavender transition-all resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            Vista previa del contexto {target === 'chatgpt' && '(modo revisión)'}
          </label>
          <pre className="w-full max-h-60 overflow-y-auto modal-scroll px-4 py-3 rounded-xl border border-border bg-cream-50 text-xs text-ink-light font-mono whitespace-pre-wrap leading-relaxed">
            {context}
          </pre>
        </div>
      </div>
    </Modal>
  );
}
