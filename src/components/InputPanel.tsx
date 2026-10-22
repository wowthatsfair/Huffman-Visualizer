import { ArrowRight } from 'lucide-react';

export const MAX_LENGTH = 300;

export const PRESETS = [
  'she sells sea shells by the sea shore',
  'abracadabra',
  'mississippi river',
  'to be or not to be, that is the question',
];

interface Props {
  text: string;
  onChange: (text: string) => void;
  onCompress: () => void;
  stale: boolean;
}

export function InputPanel({ text, onChange, onCompress, stale }: Props) {
  return (
    <section className="panel input">
      <header className="panel-head">
        <h2>Input</h2>
        <span className="counter">
          {Array.from(text).length}/{MAX_LENGTH}
        </span>
      </header>

      <textarea
        value={text}
        maxLength={MAX_LENGTH}
        spellCheck={false}
        placeholder="Type anything…"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            onCompress();
          }
        }}
      />

      <div className="presets">
        <span>Try</span>
        {PRESETS.map((p) => (
          <button key={p} type="button" className="preset" onClick={() => onChange(p)} title={p}>
            {p}
          </button>
        ))}
      </div>

      <button type="button" className="primary" onClick={onCompress} disabled={!text}>
        Compress
        <ArrowRight size={16} />
      </button>
      <p className="hint">
        {stale ? 'Input changed. Compress again to update.' : (
          <>
            <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to compress
          </>
        )}
      </p>
    </section>
  );
}
