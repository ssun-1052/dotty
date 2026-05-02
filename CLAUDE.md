# Layered Pixel Studio — AI Coding Guide

## Project Overview
**Layered Pixel Studio** is a web-based pixel art editor built with React + TypeScript + Tailwind CSS.
Users draw dot art on a multi-layer canvas and export it as a clean, optimized SVG file.

Run with: `npm start` → opens at `http://localhost:3000`

---

## Tech Stack
| Layer | Choice |
|---|---|
| Framework | React 19 (Create React App / react-scripts 5) |
| Language | TypeScript 4.9 |
| Styling | Tailwind CSS v3 (postcss.config.js → tailwindcss plugin) |
| Color Picker | react-colorful (HsvColorPicker) |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable + @dnd-kit/utilities |
| State | React useReducer via Context (no external state lib) |

---

## File Structure
```
src/
├── contexts/
│   └── StudioContext.tsx     # Single source of truth — all state + reducer + utilities
├── components/
│   ├── Canvas.tsx            # HTML5 Canvas drawing engine + mouse handlers
│   ├── Toolbar.tsx           # Left panel: tools, zoom, grid, undo/redo + keyboard shortcuts
│   ├── ColorPicker.tsx       # Right panel top: Figma-style HSV picker + palette
│   ├── LayerPanel.tsx        # Right panel bottom: DnD-sortable layer list
│   └── ExportModal.tsx       # SVG export dialog (scale, transparent bg)
├── App.tsx                   # Layout shell + Header (canvas size editor)
└── index.css                 # Tailwind directives + react-colorful CSS overrides
```

---

## State Shape (`StudioState`)
```typescript
{
  layers: Layer[];          // Ordered bottom-to-top. layers[0] = bottommost layer.
  activeLayerId: string;    // Currently selected layer for drawing
  tool: 'pen' | 'eraser' | 'bucket' | 'eyedropper';
  color: string;            // Current hex color e.g. "#ff0000"
  canvasSize: { width: number; height: number };  // Default 32×32
  zoom: number;             // Pixel size in screen px. Default 16. Range 2–64.
  showGrid: boolean;
  past: { layers: Layer[] }[];   // Undo stack (max 50)
  future: { layers: Layer[] }[]; // Redo stack (max 50)
}

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;    // 0–100
  pixels: Record<string, string>; // key = "x,y", value = hex color. Sparse (empty = transparent)
}
```

---

## Key Architecture Decisions

### 1. Pixel Storage
Pixels are stored **sparsely** as `Record<"x,y", hexColor>`.
- Empty pixels = transparent (not stored)
- This keeps memory lean for typical pixel art (mostly empty canvases)

### 2. Canvas Rendering (`Canvas.tsx`)
- Uses `<canvas>` HTML element via `useRef` + `useEffect`
- Re-renders whenever `layers`, `zoom`, `showGrid`, or `hoverPixel` changes
- Layer compositing order: bottom → top, each with `ctx.globalAlpha = layer.opacity / 100`
- Interpolates between pixels during drag for smooth lines (Bresenham-style)
- History is pushed on `mouseup` (per stroke), not per pixel

### 3. Undo/Redo Pattern
- `PUSH_HISTORY` stores a snapshot of `layers` *before* an action
- For pen/eraser: snapshot saved at `mousedown`, pushed on `mouseup`
- For bucket/reorder: snapshot saved atomically in the same dispatch batch
- Undo restores `past[-1]`, saves current to `future`

### 4. Layer Display vs Storage Order
- **Storage**: `layers[0]` = bottom, `layers[n-1]` = top (z-order)
- **Display**: reversed — top layer shown at top of the list
- DnD operates in display order; on drag end, array is reversed back before `REORDER_LAYERS` dispatch

### 5. Color System
- Internal color format: **hex string** (`#rrggbb`)
- `ColorPicker.tsx` converts hex ↔ HSV locally for the react-colorful picker
- SVG export does proper RGBA compositing across layers (see `exportToSVG` in StudioContext)

---

## Exported Utilities from `StudioContext.tsx`
| Function | Purpose |
|---|---|
| `floodFill(pixels, x, y, fillColor, canvasSize)` | BFS flood fill, returns `Record<string, string\|null>` patch |
| `swapLayers(arr, fromIndex, toIndex)` | Safe array element swap (boundary-checked) |
| `exportToSVG(layers, canvasSize, transparentBg, pixelSize)` | Composites layers → SVG string with RLE optimization |
| `hexToRgba(hex, alpha)` | Hex → RGBA object |
| `compositeOver(dst, src)` | Alpha-compositing (Porter-Duff "over") |
| `rgbaToHex(rgba)` | RGBA → hex string |

---

## Keyboard Shortcuts
| Key | Action |
|---|---|
| `P` | Pen tool |
| `E` | Eraser tool |
| `G` | Paint Bucket (fill) |
| `I` | Eyedropper |
| `+` / `=` | Zoom in |
| `-` | Zoom out |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |

---

## Layout
```
┌──────────────────────────────────────────────────────┐
│  Header: logo · canvas size editor · Export SVG btn  │
├────────┬────────────────────────────┬────────────────┤
│Toolbar │                            │  ColorPicker   │
│(w-14)  │       Canvas               │  (react-color) │
│        │    (flex-1 center)         ├────────────────┤
│        │                            │  LayerPanel    │
│        │                            │  (DnD sortable)│
└────────┴────────────────────────────┴────────────────┘
```
Right panel width: `w-64` (256px). ColorPicker capped at `max-h-[420px]` with scroll.

---

## Adding New Features — Quick Reference

**New tool**: Add to `Tool` type in StudioContext → handle in `Canvas.tsx:handleMouseDown` → add button in `Toolbar.tsx`

**New layer action**: Add action type to `StudioAction` union → handle in `studioReducer` → dispatch from component

**Changing canvas pixel storage**: All reads/writes go through `SET_PIXELS` action. The `pixels` object on each layer is always treated as immutable (spread before mutation).

**SVG export changes**: Edit `exportToSVG()` in StudioContext.tsx. The function receives all layers and composites them.

---

## Known Constraints
- Canvas max recommended size: 128×128 (larger works but zoom becomes small)
- react-colorful styles overridden in `src/index.css` (`.react-colorful` selector)
- CRA (react-scripts) does not support Tailwind v4 — project uses **Tailwind v3**
- `layerCounter` is a module-level `let` — resets on hot reload; layer names may skip numbers during development (not a bug)
