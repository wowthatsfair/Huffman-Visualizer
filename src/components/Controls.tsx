import type { CSSProperties } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import { SPEEDS, type Player } from '../usePlayer';

export function Controls({ player }: { player: Player }) {
  const { index, last, playing } = player;
  const progress = last === 0 ? 100 : (index / last) * 100;

  return (
    <div className="controls">
      <div className="transport">
        <button type="button" className="icon-btn" onClick={() => player.seek(0)} title="Restart" aria-label="Restart">
          <RotateCcw size={16} />
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={() => player.step(-1)}
          disabled={index === 0}
          title="Previous step (←)"
          aria-label="Previous step"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          className="icon-btn play"
          onClick={player.toggle}
          title={playing ? 'Pause (Space)' : 'Play (Space)'}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={() => player.step(1)}
          disabled={index === last}
          title="Next step (→)"
          aria-label="Next step"
        >
          <ChevronRight size={18} />
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={() => player.seek(last)}
          disabled={index === last}
          title="Skip to result"
          aria-label="Skip to result"
        >
          <SkipForward size={16} />
        </button>
      </div>

      <div className="scrubber">
        <input
          type="range"
          min={0}
          max={last}
          value={index}
          onChange={(e) => player.seek(Number(e.target.value))}
          style={{ '--progress': `${progress}%` } as CSSProperties}
          aria-label="Step"
        />
        <span className="step-count">
          {index + 1}
          <span>/{last + 1}</span>
        </span>
      </div>

      <div className="speeds" role="group" aria-label="Speed">
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            className={player.speed === s ? 'is-active' : ''}
            onClick={() => player.setSpeed(s)}
          >
            {s}×
          </button>
        ))}
      </div>
    </div>
  );
}
