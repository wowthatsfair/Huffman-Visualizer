import { useCallback, useEffect, useState } from 'react';
import type { Frame } from './huffman';

export const SPEEDS = [0.5, 1, 2, 4] as const;

export function usePlayer(frames: Frame[]) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const last = Math.max(frames.length - 1, 0);

  useEffect(() => {
    if (!playing) return;
    if (index >= last) {
      setPlaying(false);
      return;
    }
    const t = window.setTimeout(() => setIndex((i) => Math.min(i + 1, last)), frames[index].hold / speed);
    return () => window.clearTimeout(t);
  }, [playing, index, speed, frames, last]);

  const seek = useCallback(
    (i: number) => {
      setPlaying(false);
      setIndex(Math.max(0, Math.min(i, last)));
    },
    [last],
  );

  const play = useCallback(() => {
    setIndex((i) => (i >= last ? 0 : i));
    setPlaying(true);
  }, [last]);

  const toggle = useCallback(() => (playing ? setPlaying(false) : play()), [playing, play]);

  const restart = useCallback(() => {
    setIndex(0);
    setPlaying(true);
  }, []);

  return {
    index: Math.min(index, last),
    last,
    playing,
    speed,
    setSpeed,
    play,
    toggle,
    restart,
    seek,
    step: (d: number) => seek(index + d),
  };
}

export type Player = ReturnType<typeof usePlayer>;
