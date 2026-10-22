import { useMemo } from 'react';
import { AnimatePresence, motion, type Transition } from 'framer-motion';
import { showSymbol, type Frame, type HuffmanRun, type NodeId } from '../huffman';
import { layoutForest } from '../layout';

interface Props {
  run: HuffmanRun;
  frame: Frame;
  hovered: string | null;
  onHover: (symbol: string | null) => void;
  duration: number;
}

export function TreeView({ run, frame, hovered, onHover, duration }: Props) {
  const { nodes } = run;
  const { pos, box } = useMemo(() => layoutForest(nodes, frame.roots), [nodes, frame.roots]);

  const treeDone = frame.phase === 'codes' || frame.phase === 'encode' || frame.phase === 'done';
  const hoveredLeaf = hovered !== null ? (run.leafOf.get(hovered) ?? null) : null;

  // Root-to-leaf path that should glow: hover wins over the scripted step.
  const path = useMemo(() => {
    const target = treeDone ? (hoveredLeaf ?? frame.path) : null;
    const set = new Set<NodeId>();
    for (let at: NodeId | null = target; at !== null; at = run.parent[at]) set.add(at);
    return set;
  }, [treeDone, hoveredLeaf, frame.path, run.parent]);

  const focus = useMemo(() => new Set(frame.focus), [frame.focus]);
  const known = useMemo(() => new Set(run.codeOrder.slice(0, frame.codesKnown)), [run.codeOrder, frame.codesKnown]);

  const visible: NodeId[] = [];
  const edges: { parent: NodeId; child: NodeId; bit: '0' | '1' }[] = [];
  const collect = (id: NodeId) => {
    visible.push(id);
    const n = nodes[id];
    if (n.left !== null && n.right !== null) {
      edges.push({ parent: id, child: n.left, bit: '0' }, { parent: id, child: n.right, bit: '1' });
      collect(n.left);
      collect(n.right);
    }
  };
  frame.roots.forEach(collect);

  const t: Transition = { duration, ease: [0.4, 0, 0.2, 1] };

  return (
    <motion.svg
      className="tree"
      initial={false}
      animate={{ viewBox: `${box.x} ${box.y} ${box.w} ${box.h}` }}
      transition={t}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Huffman tree"
    >
      <g>
        <AnimatePresence>
          {edges.map(({ parent, child }) => {
            const p = pos.get(parent)!;
            const c = pos.get(child)!;
            return (
              <motion.line
                key={`e${child}`}
                className={`edge${path.has(child) && path.has(parent) ? ' is-path' : ''}`}
                initial={{ x1: c.x, y1: c.y, x2: c.x, y2: c.y, opacity: 0 }}
                animate={{ x1: p.x, y1: p.y, x2: c.x, y2: c.y, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={t}
              />
            );
          })}
        </AnimatePresence>
      </g>

      <g>
        <AnimatePresence>
          {frame.edgeBits &&
            edges.map(({ parent, child, bit }) => {
              const p = pos.get(parent)!;
              const c = pos.get(child)!;
              // Slightly closer to the parent than the midpoint, clear of the leaf badges.
              const x = p.x + (c.x - p.x) * 0.45;
              const y = p.y + (c.y - p.y) * 0.45;
              return (
                <motion.g
                  key={`b${child}`}
                  className={`bit${path.has(child) && path.has(parent) ? ' is-path' : ''}`}
                  initial={{ x, y, opacity: 0, scale: 0.5 }}
                  animate={{ x, y, opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={t}
                >
                  <circle r={9} />
                  <text dy="0.35em">{bit}</text>
                </motion.g>
              );
            })}
        </AnimatePresence>
      </g>

      <g>
        <AnimatePresence>
          {visible.map((id) => {
            const n = nodes[id];
            const p = pos.get(id)!;
            const leaf = n.symbol !== null;
            const state = [
              'node',
              leaf ? 'is-leaf' : 'is-inner',
              focus.has(id) && !path.has(id) ? 'is-focus' : '',
              path.has(id) ? 'is-path' : '',
              leaf && hoveredLeaf === id ? 'is-hover' : '',
            ]
              .filter(Boolean)
              .join(' ');
            const code = leaf ? run.codes.get(n.symbol!)! : '';
            const digits = String(n.weight).length;

            return (
              <motion.g
                key={`n${id}`}
                className={state}
                initial={{ x: p.x, y: p.y, opacity: 0, scale: 0.4 }}
                animate={{ x: p.x, y: p.y, opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.4 }}
                transition={t}
                onMouseEnter={leaf ? () => onHover(n.symbol) : undefined}
                onMouseLeave={leaf ? () => onHover(null) : undefined}
              >
                {leaf ? (
                  <>
                    <rect className="shape" x={-19} y={-19} width={38} height={38} rx={10} />
                    <text className="sym" dy="0.36em">
                      {showSymbol(n.symbol!)}
                    </text>
                    <g className="badge" transform="translate(17 -17)">
                      <rect x={-(5 + digits * 3.2)} y={-8} width={10 + digits * 6.4} height={16} rx={8} />
                      <text dy="0.35em">{n.weight}</text>
                    </g>
                    <AnimatePresence>
                      {known.has(n.symbol!) && (
                        <motion.text
                          className="code"
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 38 }}
                          exit={{ opacity: 0, y: 30 }}
                          transition={t}
                        >
                          {code}
                        </motion.text>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <>
                    <circle className="shape" r={17} />
                    <text className="weight" dy="0.35em">
                      {n.weight}
                    </text>
                  </>
                )}
              </motion.g>
            );
          })}
        </AnimatePresence>
      </g>
    </motion.svg>
  );
}
