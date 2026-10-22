# Huffman Visualizer

A small interactive page for learning how Huffman coding compresses text, one step at a time.

**[Try it here](https://wowthatsfair.github.io/Huffman-Visualizer/)**

![Huffman Visualizer demo](docs/demo.gif)

## Why I made this

I saw a short video explaining how compression works and realised I'd never actually watched it happen. Reading about Huffman coding is one thing, but seeing the tree come together made it click for me much faster. So I built a tool where you can type your own text and follow along at your own pace.

If you're learning about compression, data structures, or just curious how a file gets smaller, I hope it helps you too.

## How to use it

1. Type something in the box, or pick one of the examples.
2. Press **Compress** and watch the steps play out.
3. Pause, step back and forth, or drag the slider to any point. There's no rush.
4. Hover a letter, a node in the tree, or a group of bits to see how they connect.

Keyboard: `Space` to play/pause, `←` `→` to step, `Ctrl+Enter` to compress.

## What's happening in each step

**1. Count.** Normal text uses 8 bits for every character, whether it shows up once or fifty times. Huffman coding starts by counting how often each character appears.

**2. Build the tree.** Take the two rarest items, join them under a new node, and put that node back in line. Repeat until only one tree is left. Rare characters end up deep in the tree, and common ones stay near the top.

**3. Assign codes.** Going left in the tree adds a `0` and going right adds a `1`. The path from the top to each character becomes its code, so common characters get short codes.

**4. Encode.** Replace every character with its code. No code is the start of another one, so the bits can be read back without any separators, and nothing is lost.

A couple of things worth knowing:

- The sizes shown don't include the code table. A real compressed file has to store that too, so very short inputs wouldn't actually get smaller in practice.
- The "entropy" number is the theoretical best average you could get for that mix of characters. Huffman coding usually gets very close to it.

## Running it locally

```bash
npm install
npm run dev
```

Built with React, TypeScript, Vite and Framer Motion. The algorithm and every animation step live in [`src/huffman.ts`](src/huffman.ts) if you want to read how it works.

## Feedback

I'm still learning too, so if something is unclear, wrong, or could be explained better, please open an issue. Suggestions are very welcome.
