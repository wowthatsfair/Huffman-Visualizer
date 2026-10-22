import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { buildRun, type HuffmanRun } from './huffman';
import { usePlayer } from './usePlayer';
import { InputPanel, PRESETS } from './components/InputPanel';
import { OutputPanel } from './components/OutputPanel';
import { PhaseSteps } from './components/PhaseSteps';
import { Controls } from './components/Controls';
import { Tape } from './components/Tape';
import { TreeView } from './components/TreeView';

const NO_FRAMES: never[] = [];

export default function App() {
  const [text, setText] = useState(PRESETS[0]);
  const [run, setRun] = useState<HuffmanRun | null>(null);
  const [runId, setRunId] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const player = usePlayer(run?.frames ?? NO_FRAMES);
  const frame = run ? run.frames[player.index] : null;

  const compress = useCallback(() => {
    if (!text) return;
    setRun(buildRun(text));
    setRunId((id) => id + 1);
    setHovered(null);
    player.restart();
  }, [text, player]);

  // Keyboard: space to play/pause, arrows to step, Home/End to jump.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (!run || el.closest('textarea, input')) return;
      if (e.key === ' ' && el.closest('button')) return; // let the focused button handle it
      if (e.key === ' ') player.toggle();
      else if (e.key === 'ArrowRight') player.step(1);
      else if (e.key === 'ArrowLeft') player.step(-1);
      else if (e.key === 'Home') player.seek(0);
      else if (e.key === 'End') player.seek(player.last);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [run, player]);

  // Animations get shorter at higher speeds so they never lag behind the steps.
  const duration = useMemo(() => {
    const hold = frame?.hold || 600;
    return Math.min(0.6, Math.max(0.16, (hold / player.speed / 1000) * 0.75));
  }, [frame, player.speed]);

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="var(--surface-2)" />
            <g stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
              <path d="M16 9 L9 18 M16 9 L23 18 M23 18 L19 25 M23 18 L27 25" />
            </g>
            <circle cx="16" cy="9" r="3.2" fill="var(--accent)" />
            <circle cx="9" cy="18" r="2.6" fill="var(--text)" />
            <circle cx="23" cy="18" r="2.6" fill="var(--accent)" />
            <circle cx="19" cy="25" r="2.4" fill="var(--text)" />
            <circle cx="27" cy="25" r="2.4" fill="var(--focus)" />
          </svg>
          <div>
            <h1>Huffman Visualizer</h1>
            <p>See how text compression works, one step at a time.</p>
          </div>
        </div>
      </header>

      <main className="workspace">
        <InputPanel text={text} onChange={setText} onCompress={compress} stale={!!run && run.input !== text} />

        <section className="panel stage">
          {run && frame ? (
            <>
              <PhaseSteps frames={run.frames} current={frame.phase} onJump={player.seek} />
              <Tape run={run} frame={frame} hovered={hovered} onHover={setHovered} />
              <div className="canvas">
                <TreeView
                  key={runId}
                  run={run}
                  frame={frame}
                  hovered={hovered}
                  onHover={setHovered}
                  duration={duration}
                />
              </div>
              <div className="caption" aria-live="polite">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`${runId}-${player.index}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                  >
                    <span className="caption-title">{frame.title}</span>
                    <p>{frame.detail}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
              <Controls player={player} />
            </>
          ) : (
            <div className="empty">
              <div className="empty-art" aria-hidden="true">
                <span>0</span>
                <span>1</span>
                <span>0</span>
                <span>1</span>
                <span>1</span>
              </div>
              <h2>Type something, then hit Compress</h2>
              <p>
                You'll see every step of Huffman coding: counting symbols, building the tree, assigning codes, and
                packing the text into bits.
              </p>
            </div>
          )}
        </section>

        <OutputPanel run={run} frame={frame} hovered={hovered} onHover={setHovered} />
      </main>

      <section className="explainer">
        <h2>How Huffman coding works</h2>
        <div className="explainer-grid">
          <article>
            <span>01</span>
            <h3>Count</h3>
            <p>Plain text spends 8 bits on every character, no matter how common it is. Huffman starts by counting how often each one appears.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Build the tree</h3>
            <p>Repeatedly take the two rarest items and join them under a new node. Rare symbols end up deep in the tree, common ones stay near the top.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Assign codes</h3>
            <p>Going left adds a 0, going right adds a 1. No code is the start of another, so the bits can be read back without separators.</p>
          </article>
          <article>
            <span>04</span>
            <h3>Encode</h3>
            <p>Swap every character for its code. Frequent characters now cost just a few bits, so the total shrinks with nothing lost.</p>
          </article>
        </div>
      </section>

      <footer className="foot">
        Built with React, TypeScript and Framer Motion · <kbd>Space</kbd> play/pause · <kbd>←</kbd> <kbd>→</kbd> step
      </footer>
    </div>
  );
}
