import type { HNode, NodeId } from './huffman';

const SLOT = 56; // horizontal space per leaf
const LEVEL = 74; // vertical space per tree level
const GAP = 0.5; // extra slots between separate trees in the forest
const PAD_X = 36;
const PAD_TOP = 36;
const PAD_BOTTOM = 52; // room for the code labels under the leaves
const MIN_W = 560;
const MIN_H = 320;

export interface Point {
  x: number;
  y: number;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Lays out a forest: leaves take consecutive slots left to right, parents sit
 * above the midpoint of their children. Also returns a camera box that frames
 * the content, so the view can zoom smoothly as the forest grows and merges.
 */
export function layoutForest(nodes: HNode[], roots: NodeId[]): { pos: Map<NodeId, Point>; box: Box } {
  const pos = new Map<NodeId, Point>();
  let slot = 0;
  let deepest = 0;

  const place = (id: NodeId, depth: number): number => {
    const n = nodes[id];
    deepest = Math.max(deepest, depth);
    let x: number;
    if (n.left === null || n.right === null) {
      x = slot++;
    } else {
      x = (place(n.left, depth + 1) + place(n.right, depth + 1)) / 2;
    }
    pos.set(id, { x: x * SLOT, y: depth * LEVEL });
    return x;
  };

  roots.forEach((id) => {
    place(id, 0);
    slot += GAP;
  });

  const contentW = (slot - GAP - 1) * SLOT;
  const contentH = deepest * LEVEL;
  const w = Math.max(contentW + PAD_X * 2, MIN_W);
  const h = Math.max(contentH + PAD_TOP + PAD_BOTTOM, MIN_H);
  const box = {
    x: contentW / 2 - w / 2,
    y: contentH / 2 - h / 2 + (PAD_BOTTOM - PAD_TOP) / 2,
    w,
    h,
  };
  return { pos, box };
}
