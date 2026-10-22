import { Check } from 'lucide-react';
import type { Frame, Phase } from '../huffman';

const PHASES: { key: Phase; label: string }[] = [
  { key: 'count', label: 'Count' },
  { key: 'build', label: 'Build tree' },
  { key: 'codes', label: 'Assign codes' },
  { key: 'encode', label: 'Encode' },
];

const ORDER: Phase[] = ['count', 'build', 'codes', 'encode', 'done'];

interface Props {
  frames: Frame[];
  current: Phase;
  onJump: (index: number) => void;
}

export function PhaseSteps({ frames, current, onJump }: Props) {
  const at = ORDER.indexOf(current);
  return (
    <ol className="phases">
      {PHASES.map(({ key, label }, i) => {
        const start = frames.findIndex((f) => f.phase === key);
        const state = i < at ? 'is-complete' : i === at ? 'is-active' : '';
        return (
          <li key={key} className={state}>
            <button type="button" disabled={start < 0} onClick={() => onJump(start)}>
              <span className="phase-num">{i < at ? <Check size={12} strokeWidth={3} /> : i + 1}</span>
              <span className="phase-label">{label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
