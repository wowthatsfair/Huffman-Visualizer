export type NodeId = number;

export interface HNode {
  id: NodeId;
  weight: number;
  /** Set on leaves only. */
  symbol: string | null;
  left: NodeId | null;
  right: NodeId | null;
}

export type Phase = 'count' | 'build' | 'codes' | 'encode' | 'done';

/** One snapshot of the animation. The player simply moves between frames. */
export interface Frame {
  phase: Phase;
  /** Trees currently in the priority queue, in display order. */
  roots: NodeId[];
  /** Nodes to emphasise in this step. */
  focus: NodeId[];
  /** Leaf whose root-to-leaf path is lit up. */
  path: NodeId | null;
  /** How many symbols (in `codeOrder`) have their code revealed. */
  codesKnown: number;
  /** Whether edges are labelled 0 / 1. */
  edgeBits: boolean;
  /** How many input characters have been encoded so far. */
  encoded: number;
  /** Input positions to emphasise. */
  tape: number[];
  title: string;
  detail: string;
  /** Milliseconds to stay on this frame at 1x speed. */
  hold: number;
}

export interface Segment {
  symbol: string;
  start: number;
  length: number;
}

export interface HuffmanRun {
  input: string;
  chars: string[];
  nodes: HNode[];
  parent: (NodeId | null)[];
  root: NodeId;
  leafOf: Map<string, NodeId>;
  codes: Map<string, string>;
  /** Symbols in left-to-right order of the final tree. */
  codeOrder: string[];
  bits: string;
  /** One segment of `bits` per input character. */
  segments: Segment[];
  originalBits: number;
  entropy: number;
  maxDepth: number;
  frames: Frame[];
}

export function showSymbol(s: string): string {
  if (s === ' ') return '␣';
  if (s === '\n') return '↵';
  if (s === '\t') return '⇥';
  return s;
}

const quote = (s: string) => `‘${showSymbol(s)}’`;

export const utf8Bytes = (s: string) => new TextEncoder().encode(s).length;

export function buildRun(input: string): HuffmanRun {
  const chars = Array.from(input);
  const nodes: HNode[] = [];
  const leafOf = new Map<string, NodeId>();
  const positions = new Map<string, number[]>();

  chars.forEach((c, i) => {
    let id = leafOf.get(c);
    if (id === undefined) {
      id = nodes.length;
      nodes.push({ id, weight: 0, symbol: c, left: null, right: null });
      leafOf.set(c, id);
      positions.set(c, []);
    }
    nodes[id].weight++;
    positions.get(c)!.push(i);
  });

  const leaves = nodes.map((n) => n.id);
  const frames: Frame[] = [];
  // Keep long inputs from turning into a five-minute animation.
  const pace = Math.max(0.35, Math.min(1, 10 / leaves.length));
  const base = { focus: [], path: null, codesKnown: 0, edgeBits: false, encoded: 0, tape: [] };
  const label = (id: NodeId) => {
    const n = nodes[id];
    return n.symbol !== null ? `${quote(n.symbol)} (${n.weight})` : `a subtree (${n.weight})`;
  };

  // 1. Count how often each symbol appears.
  leaves.forEach((id, i) => {
    const n = nodes[id];
    const times = n.weight === 1 ? 'once' : n.weight === 2 ? 'twice' : `${n.weight} times`;
    frames.push({
      ...base,
      phase: 'count',
      roots: leaves.slice(0, i + 1),
      focus: [id],
      tape: positions.get(n.symbol!)!,
      title: 'Count symbols',
      detail: `${quote(n.symbol!)} appears ${times}.`,
      hold: 520 * pace,
    });
  });

  // Lighter first; on ties, older nodes first so the order is deterministic.
  const byWeight = (a: NodeId, b: NodeId) => nodes[a].weight - nodes[b].weight || a - b;
  let queue = [...leaves].sort(byWeight);
  frames.push({
    ...base,
    phase: 'count',
    roots: queue,
    title: 'Sort by frequency',
    detail: 'Line the symbols up from rarest to most common. This is the priority queue.',
    hold: 1300,
  });

  // 2. Repeatedly merge the two lightest trees.
  while (queue.length > 1) {
    const [a, b] = queue;
    frames.push({
      ...base,
      phase: 'build',
      roots: queue,
      focus: [a, b],
      title: 'Build the tree',
      detail: `Take the two lightest: ${label(a)} and ${label(b)}.`,
      hold: 850 * pace,
    });
    const id = nodes.length;
    nodes.push({ id, weight: nodes[a].weight + nodes[b].weight, symbol: null, left: a, right: b });
    queue = [...queue.slice(2), id].sort(byWeight);
    frames.push({
      ...base,
      phase: 'build',
      roots: queue,
      focus: [id],
      title: 'Build the tree',
      detail:
        queue.length > 1
          ? `Join them under a new node weighing ${nodes[id].weight}, then put it back in line.`
          : `One tree left, weighing ${nodes[id].weight}. That's the Huffman tree.`,
      hold: (queue.length > 1 ? 950 : 1500) * pace,
    });
  }
  const root = queue[0];

  // 3. Walk the tree: left = 0, right = 1.
  const parent: (NodeId | null)[] = nodes.map(() => null);
  const codes = new Map<string, string>();
  const codeOrder: string[] = [];
  let maxDepth = 0;
  const walk = (id: NodeId, code: string) => {
    const n = nodes[id];
    maxDepth = Math.max(maxDepth, code.length);
    if (n.symbol !== null) {
      // A lone symbol still needs at least one bit.
      codes.set(n.symbol, code || '0');
      codeOrder.push(n.symbol);
      return;
    }
    parent[n.left!] = id;
    parent[n.right!] = id;
    walk(n.left!, code + '0');
    walk(n.right!, code + '1');
  };
  walk(root, '');

  const single = leaves.length === 1;
  const tree = { ...base, roots: [root], edgeBits: !single };
  if (single) {
    frames.push({
      ...tree,
      phase: 'codes',
      focus: [root],
      codesKnown: 1,
      title: 'Assign codes',
      detail: 'Only one distinct symbol, so it simply gets the code 0.',
      hold: 1500,
    });
  } else {
    frames.push({
      ...tree,
      phase: 'codes',
      title: 'Assign codes',
      detail: 'Label every left branch 0 and every right branch 1.',
      hold: 1400,
    });
    codeOrder.forEach((s, i) => {
      const leaf = leafOf.get(s)!;
      frames.push({
        ...tree,
        phase: 'codes',
        focus: [leaf],
        path: leaf,
        codesKnown: i + 1,
        title: 'Assign codes',
        detail: `Walk from the root down to ${quote(s)}. Its code is ${codes.get(s)}.`,
        hold: 900 * pace,
      });
    });
    frames.push({
      ...tree,
      phase: 'codes',
      codesKnown: codeOrder.length,
      title: 'Assign codes',
      detail: 'Common symbols sit near the root and get short codes. Rare ones get longer codes.',
      hold: 1800,
    });
  }

  // 4. Replace every character with its code.
  const segments: Segment[] = [];
  let bits = '';
  for (const c of chars) {
    const code = codes.get(c)!;
    segments.push({ symbol: c, start: bits.length, length: code.length });
    bits += code;
  }

  const encoded = { ...tree, codesKnown: codeOrder.length };
  const steps = Math.min(chars.length, 48);
  let prev = 0;
  for (let k = 1; k <= steps; k++) {
    const end = Math.round((k * chars.length) / steps);
    if (end === prev) continue;
    const last = chars[end - 1];
    const leaf = leafOf.get(last)!;
    frames.push({
      ...encoded,
      phase: 'encode',
      focus: [leaf],
      path: single ? null : leaf,
      encoded: end,
      tape: Array.from({ length: end - prev }, (_, j) => prev + j),
      title: 'Encode',
      detail:
        end - prev === 1
          ? `${quote(last)} becomes ${codes.get(last)}.`
          : `Characters ${prev + 1}–${end}: swap each one for its code.`,
      hold: 360,
    });
    prev = end;
  }

  const originalBits = utf8Bytes(input) * 8;
  const change = 1 - bits.length / originalBits;
  frames.push({
    ...encoded,
    phase: 'done',
    encoded: chars.length,
    title: 'Done',
    detail: `${originalBits} bits became ${bits.length} bits, ${Math.abs(change * 100).toFixed(1)}% ${
      change >= 0 ? 'smaller' : 'larger'
    }.`,
    hold: 0,
  });

  let entropy = 0;
  for (const id of leaves) {
    const p = nodes[id].weight / chars.length;
    entropy -= p * Math.log2(p);
  }

  return {
    input,
    chars,
    nodes,
    parent,
    root,
    leafOf,
    codes,
    codeOrder,
    bits,
    segments,
    originalBits,
    entropy,
    maxDepth,
    frames,
  };
}

/** Decode by walking the tree bit by bit, which proves the round trip is lossless. */
export function decode(run: HuffmanRun): string {
  const { nodes, root, bits } = run;
  if (nodes[root].symbol !== null) return nodes[root].symbol!.repeat(bits.length);
  let out = '';
  let at = root;
  for (const b of bits) {
    at = (b === '0' ? nodes[at].left : nodes[at].right)!;
    if (nodes[at].symbol !== null) {
      out += nodes[at].symbol;
      at = root;
    }
  }
  return out;
}

export function bitsToHex(bits: string): string {
  const out: string[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    const byte = bits.slice(i, i + 8).padEnd(8, '0');
    out.push(parseInt(byte, 2).toString(16).padStart(2, '0').toUpperCase());
  }
  return out.join(' ');
}
