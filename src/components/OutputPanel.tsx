import { useMemo, useState } from 'react';
import { Check, Copy, ShieldCheck } from 'lucide-react';
import { bitsToHex, decode, showSymbol, utf8Bytes, type Frame, type HuffmanRun } from '../huffman';

interface Props {
  run: HuffmanRun | null;
  frame: Frame | null;
  hovered: string | null;
  onHover: (symbol: string | null) => void;
}

export function OutputPanel({ run, frame, hovered, onHover }: Props) {
  return (
    <aside className="panel output">
      <header className="panel-head">
        <h2>Output</h2>
      </header>
      {run && frame ? (
        <>
          <Stats run={run} frame={frame} />
          <CodeTable run={run} frame={frame} hovered={hovered} onHover={onHover} />
          <Bitstream run={run} frame={frame} hovered={hovered} onHover={onHover} />
        </>
      ) : (
        <p className="placeholder">The compressed result will appear here.</p>
      )}
    </aside>
  );
}

function Stats({ run, frame }: { run: HuffmanRun; frame: Frame }) {
  const started = frame.phase === 'encode' || frame.phase === 'done';
  const n = started ? frame.encoded : 0;
  const original = useMemo(() => utf8Bytes(run.chars.slice(0, n).join('')) * 8, [run.chars, n]);
  const last = run.segments[n - 1];
  const compressed = last ? last.start + last.length : 0;
  const saved = original > 0 ? (1 - compressed / original) * 100 : 0;
  const avg = run.bits.length / run.chars.length;

  return (
    <section className="stats">
      <div className="stat-grid">
        <div className="stat">
          <span className="stat-label">Original</span>
          <span className="stat-value">{started ? original : '—'}</span>
          <span className="stat-unit">bits</span>
        </div>
        <div className="stat">
          <span className="stat-label">Compressed</span>
          <span className="stat-value accent">{started ? compressed : '—'}</span>
          <span className="stat-unit">bits</span>
        </div>
        <div className="stat">
          <span className="stat-label">Saved</span>
          <span className={`stat-value ${saved >= 0 ? 'good' : 'bad'}`}>{started ? `${saved.toFixed(1)}%` : '—'}</span>
          <span className="stat-unit">of size</span>
        </div>
      </div>

      <div className="bars">
        <div className="bar">
          <span style={{ width: `${(original / run.originalBits) * 100}%` }} />
        </div>
        <div className="bar is-accent">
          <span style={{ width: `${(compressed / run.originalBits) * 100}%` }} />
        </div>
      </div>

      <p className="stat-note">
        <span>
          <b>{avg.toFixed(2)}</b> bits/char vs 8
        </span>
        <span title="Shannon entropy: the theoretical minimum average for this symbol distribution.">
          entropy <b>{run.entropy.toFixed(2)}</b>
        </span>
      </p>
    </section>
  );
}

function CodeTable({ run, frame, hovered, onHover }: Props & { run: HuffmanRun; frame: Frame }) {
  const known = useMemo(() => new Set(run.codeOrder.slice(0, frame.codesKnown)), [run.codeOrder, frame.codesKnown]);
  const rows = useMemo(
    () =>
      [...run.leafOf.entries()]
        .map(([symbol, id]) => ({ symbol, count: run.nodes[id].weight, code: run.codes.get(symbol)! }))
        .sort((a, b) => b.count - a.count || a.code.length - b.code.length),
    [run],
  );
  const active = frame.path !== null ? run.nodes[frame.path].symbol : null;

  return (
    <section className="codes">
      <h3>Code table</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Char</th>
              <th className="num">Count</th>
              <th>Code</th>
              <th className="num">Bits</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ symbol, count, code }) => {
              const shown = known.has(symbol);
              const cls = [hovered === symbol ? 'is-hover' : '', active === symbol ? 'is-active' : '']
                .filter(Boolean)
                .join(' ');
              return (
                <tr key={symbol} className={cls} onMouseEnter={() => onHover(symbol)} onMouseLeave={() => onHover(null)}>
                  <td>
                    <span className="chip">{showSymbol(symbol)}</span>
                  </td>
                  <td className="num">{count}</td>
                  <td className="mono code-cell">{shown ? code : <span className="pending">{'·'.repeat(code.length)}</span>}</td>
                  <td className="num">{shown ? count * code.length : ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Bitstream({ run, frame, hovered, onHover }: Props & { run: HuffmanRun; frame: Frame }) {
  const [view, setView] = useState<'bits' | 'hex'>('bits');
  const [copied, setCopied] = useState(false);
  const fresh = useMemo(() => new Set(frame.phase === 'encode' ? frame.tape : []), [frame.phase, frame.tape]);
  const done = frame.phase === 'done';
  const lossless = useMemo(() => decode(run) === run.input, [run]);

  const segments = run.segments.slice(0, frame.phase === 'encode' || done ? frame.encoded : 0);
  const last = segments[segments.length - 1];
  const bits = run.bits.slice(0, last ? last.start + last.length : 0);
  const text = view === 'bits' ? bits : bitsToHex(bits);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard can be blocked (e.g. insecure context); nothing useful to do.
    }
  };

  return (
    <section className="bitstream">
      <div className="bitstream-head">
        <h3>Compressed</h3>
        <div className="seg-toggle" role="group" aria-label="Format">
          <button type="button" className={view === 'bits' ? 'is-active' : ''} onClick={() => setView('bits')}>
            Bits
          </button>
          <button type="button" className={view === 'hex' ? 'is-active' : ''} onClick={() => setView('hex')}>
            Hex
          </button>
        </div>
        <button type="button" className="icon-btn small" onClick={copy} disabled={!bits} title="Copy" aria-label="Copy">
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>

      <div className="bits mono">
        {!bits && <span className="placeholder">Bits appear here as each character is encoded.</span>}
        {view === 'bits'
          ? segments.map((s, i) => (
              <span
                key={i}
                className={`seg${fresh.has(i) ? ' is-fresh' : ''}${hovered === s.symbol ? ' is-hover' : ''}`}
                onMouseEnter={() => onHover(s.symbol)}
                onMouseLeave={() => onHover(null)}
              >
                {run.bits.slice(s.start, s.start + s.length)}
              </span>
            ))
          : text}
      </div>

      {done && (
        <p className={`verify ${lossless ? 'good' : 'bad'}`}>
          <ShieldCheck size={15} />
          {lossless ? 'Lossless: decoding gives back the exact input.' : 'Decoding mismatch.'}
        </p>
      )}
      <p className="footnote">A real file would also store the code table so it can be decoded.</p>
    </section>
  );
}
