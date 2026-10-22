import { useMemo } from 'react';
import { showSymbol, type Frame, type HuffmanRun } from '../huffman';

interface Props {
  run: HuffmanRun;
  frame: Frame;
  hovered: string | null;
  onHover: (symbol: string | null) => void;
}

/** The input text as individual cells, lit up as it is counted and encoded. */
export function Tape({ run, frame, hovered, onHover }: Props) {
  const lit = useMemo(() => new Set(frame.tape), [frame.tape]);
  const encoding = frame.phase === 'encode' || frame.phase === 'done';

  return (
    <div className="tape" aria-label="Input characters">
      {run.chars.map((c, i) => {
        const cls = [
          'cell',
          c === ' ' || c === '\n' || c === '\t' ? 'is-ws' : '',
          encoding && i < frame.encoded ? 'is-done' : '',
          lit.has(i) ? 'is-lit' : '',
          hovered === c ? 'is-hover' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <span key={i} className={cls} onMouseEnter={() => onHover(c)} onMouseLeave={() => onHover(null)}>
            {showSymbol(c)}
          </span>
        );
      })}
    </div>
  );
}
