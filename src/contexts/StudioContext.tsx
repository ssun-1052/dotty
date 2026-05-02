import React, { createContext, useContext, useReducer, useCallback } from 'react';

export type Tool = 'pen' | 'eraser' | 'bucket' | 'eyedropper';

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number; // 0–100
  pixels: Record<string, string>; // "x,y" → hex color
}

export interface CanvasSize {
  width: number;
  height: number;
}

interface HistoryEntry {
  layers: Layer[];
}

export interface StudioState {
  layers: Layer[];
  activeLayerId: string;
  tool: Tool;
  color: string;
  canvasSize: CanvasSize;
  zoom: number;
  showGrid: boolean;
  past: HistoryEntry[];
  future: HistoryEntry[];
}

export type StudioAction =
  | { type: 'SET_TOOL'; tool: Tool }
  | { type: 'SET_COLOR'; color: string }
  | { type: 'SET_CANVAS_SIZE'; size: CanvasSize }
  | { type: 'SET_ZOOM'; zoom: number }
  | { type: 'TOGGLE_GRID' }
  | { type: 'SET_ACTIVE_LAYER'; id: string }
  | { type: 'ADD_LAYER' }
  | { type: 'DELETE_LAYER'; id: string }
  | { type: 'RENAME_LAYER'; id: string; name: string }
  | { type: 'TOGGLE_LAYER_VISIBILITY'; id: string }
  | { type: 'SET_LAYER_OPACITY'; id: string; opacity: number }
  | { type: 'MOVE_LAYER'; fromIndex: number; toIndex: number }
  | { type: 'REORDER_LAYERS'; layers: Layer[] }
  | { type: 'SET_PIXELS'; layerId: string; pixels: Record<string, string | null> }
  | { type: 'PUSH_HISTORY'; layers: Layer[] }
  | { type: 'UNDO' }
  | { type: 'REDO' };

let layerCounter = 2;

export function createLayer(name?: string): Layer {
  return {
    id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: name || `Layer ${layerCounter++}`,
    visible: true,
    opacity: 100,
    pixels: {},
  };
}

const initialLayer: Layer = {
  id: 'layer-initial',
  name: 'Layer 1',
  visible: true,
  opacity: 100,
  pixels: {},
};

const initialState: StudioState = {
  layers: [initialLayer],
  activeLayerId: initialLayer.id,
  tool: 'pen',
  color: '#000000',
  canvasSize: { width: 32, height: 32 },
  zoom: 16,
  showGrid: true,
  past: [],
  future: [],
};

function studioReducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    case 'SET_TOOL':
      return { ...state, tool: action.tool };

    case 'SET_COLOR':
      return { ...state, color: action.color };

    case 'SET_CANVAS_SIZE':
      return {
        ...state,
        canvasSize: action.size,
        layers: state.layers.map((l) => {
          const newPixels: Record<string, string> = {};
          for (const [key, color] of Object.entries(l.pixels)) {
            const [x, y] = key.split(',').map(Number);
            if (x >= 0 && x < action.size.width && y >= 0 && y < action.size.height) {
              newPixels[key] = color;
            }
          }
          return { ...l, pixels: newPixels };
        }),
      };

    case 'SET_ZOOM':
      return { ...state, zoom: Math.max(2, Math.min(64, action.zoom)) };

    case 'TOGGLE_GRID':
      return { ...state, showGrid: !state.showGrid };

    case 'SET_ACTIVE_LAYER':
      return { ...state, activeLayerId: action.id };

    case 'ADD_LAYER': {
      const newLayer = createLayer();
      return {
        ...state,
        layers: [...state.layers, newLayer],
        activeLayerId: newLayer.id,
      };
    }

    case 'DELETE_LAYER': {
      if (state.layers.length <= 1) return state;
      const idx = state.layers.findIndex((l) => l.id === action.id);
      const newLayers = state.layers.filter((l) => l.id !== action.id);
      const newActiveId =
        state.activeLayerId === action.id
          ? newLayers[Math.max(0, idx - 1)].id
          : state.activeLayerId;
      return { ...state, layers: newLayers, activeLayerId: newActiveId };
    }

    case 'RENAME_LAYER':
      return {
        ...state,
        layers: state.layers.map((l) =>
          l.id === action.id ? { ...l, name: action.name } : l
        ),
      };

    case 'TOGGLE_LAYER_VISIBILITY':
      return {
        ...state,
        layers: state.layers.map((l) =>
          l.id === action.id ? { ...l, visible: !l.visible } : l
        ),
      };

    case 'SET_LAYER_OPACITY':
      return {
        ...state,
        layers: state.layers.map((l) =>
          l.id === action.id ? { ...l, opacity: action.opacity } : l
        ),
      };

    case 'MOVE_LAYER': {
      const layers = [...state.layers];
      const [moved] = layers.splice(action.fromIndex, 1);
      layers.splice(action.toIndex, 0, moved);
      return { ...state, layers };
    }

    case 'REORDER_LAYERS':
      return {
        ...state,
        layers: action.layers,
        past: [...state.past.slice(-49), { layers: state.layers }],
        future: [],
      };

    case 'SET_PIXELS': {
      return {
        ...state,
        layers: state.layers.map((l) => {
          if (l.id !== action.layerId) return l;
          const pixels = { ...l.pixels };
          for (const [key, color] of Object.entries(action.pixels)) {
            if (color === null) {
              delete pixels[key];
            } else {
              pixels[key] = color;
            }
          }
          return { ...l, pixels };
        }),
      };
    }

    case 'PUSH_HISTORY':
      return {
        ...state,
        past: [...state.past.slice(-49), { layers: action.layers }],
        future: [],
      };

    case 'UNDO': {
      if (state.past.length === 0) return state;
      const prev = state.past[state.past.length - 1];
      return {
        ...state,
        layers: prev.layers,
        past: state.past.slice(0, -1),
        future: [{ layers: state.layers }, ...state.future.slice(0, 49)],
      };
    }

    case 'REDO': {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        ...state,
        layers: next.layers,
        past: [...state.past.slice(-49), { layers: state.layers }],
        future: state.future.slice(1),
      };
    }

    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface StudioContextValue {
  state: StudioState;
  dispatch: React.Dispatch<StudioAction>;
  getCompositePixel: (x: number, y: number) => string | null;
}

const StudioContext = createContext<StudioContextValue | null>(null);

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(studioReducer, initialState);

  const getCompositePixel = useCallback(
    (x: number, y: number): string | null => {
      const key = `${x},${y}`;
      for (let i = state.layers.length - 1; i >= 0; i--) {
        const layer = state.layers[i];
        if (layer.visible && layer.pixels[key]) return layer.pixels[key];
      }
      return null;
    },
    [state.layers]
  );

  return (
    <StudioContext.Provider value={{ state, dispatch, getCompositePixel }}>
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio(): StudioContextValue {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error('useStudio must be within StudioProvider');
  return ctx;
}

// ─── Utility Functions ────────────────────────────────────────────────────────

export function floodFill(
  pixels: Record<string, string>,
  startX: number,
  startY: number,
  fillColor: string,
  canvasSize: CanvasSize
): Record<string, string | null> {
  const targetColor = pixels[`${startX},${startY}`] || null;
  if (targetColor === fillColor) return {};

  const changes: Record<string, string | null> = {};
  const queue: [number, number][] = [[startX, startY]];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const [cx, cy] = queue.shift()!;
    const ck = `${cx},${cy}`;

    if (visited.has(ck)) continue;
    if (cx < 0 || cx >= canvasSize.width || cy < 0 || cy >= canvasSize.height) continue;

    const pixelColor = pixels[ck] || null;
    if (pixelColor !== targetColor) continue;

    visited.add(ck);
    changes[ck] = fillColor;

    queue.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }

  return changes;
}

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export function hexToRgba(hex: string, alpha = 1): RGBA | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
    a: alpha,
  };
}

export function compositeOver(dst: RGBA | null, src: RGBA): RGBA {
  if (!dst) return src;
  const sa = src.a;
  const da = dst.a;
  const outA = sa + da * (1 - sa);
  if (outA === 0) return { r: 0, g: 0, b: 0, a: 0 };
  return {
    r: Math.round((src.r * sa + dst.r * da * (1 - sa)) / outA),
    g: Math.round((src.g * sa + dst.g * da * (1 - sa)) / outA),
    b: Math.round((src.b * sa + dst.b * da * (1 - sa)) / outA),
    a: outA,
  };
}

export function rgbaToHex(rgba: RGBA): string {
  const h = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${h(rgba.r)}${h(rgba.g)}${h(rgba.b)}`;
}

/** Safely swap two elements in an array by index. Returns a new array. */
export function swapLayers<T>(arr: T[], fromIndex: number, toIndex: number): T[] {
  if (
    fromIndex < 0 || toIndex < 0 ||
    fromIndex >= arr.length || toIndex >= arr.length ||
    fromIndex === toIndex
  ) {
    return arr;
  }
  const result = [...arr];
  [result[fromIndex], result[toIndex]] = [result[toIndex], result[fromIndex]];
  return result;
}

export function exportToSVG(
  layers: Layer[],
  canvasSize: CanvasSize,
  transparentBg: boolean,
  pixelSize = 1
): string {
  const { width, height } = canvasSize;
  const composite: Record<string, RGBA> = {};

  for (const layer of layers) {
    if (!layer.visible) continue;
    const alpha = layer.opacity / 100;
    for (const [key, color] of Object.entries(layer.pixels)) {
      const [x, y] = key.split(',').map(Number);
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      const src = hexToRgba(color, alpha);
      if (!src) continue;
      composite[key] = compositeOver(composite[key] ?? null, src);
    }
  }

  const w = width * pixelSize;
  const h = height * pixelSize;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">\n`;

  if (!transparentBg) {
    svg += `  <rect width="${w}" height="${h}" fill="#ffffff"/>\n`;
  }

  for (let y = 0; y < height; y++) {
    let runStart = 0;
    let runColor: string | null = null;

    for (let x = 0; x <= width; x++) {
      let currentColor: string | null = null;
      if (x < width) {
        const rgba = composite[`${x},${y}`];
        if (rgba && rgba.a > 0.004) {
          if (transparentBg && rgba.a < 0.996) {
            currentColor = `rgba(${rgba.r},${rgba.g},${rgba.b},${rgba.a.toFixed(3)})`;
          } else {
            currentColor = rgbaToHex(rgba);
          }
        }
      }

      if (currentColor !== runColor) {
        if (runColor !== null) {
          svg += `  <rect x="${runStart * pixelSize}" y="${y * pixelSize}" width="${(x - runStart) * pixelSize}" height="${pixelSize}" fill="${runColor}"/>\n`;
        }
        runStart = x;
        runColor = currentColor;
      }
    }
  }

  svg += `</svg>`;
  return svg;
}
