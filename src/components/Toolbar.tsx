import React from 'react';
import { useStudio } from '../contexts/StudioContext';
import type { Tool } from '../contexts/StudioContext';

// ─── Icon SVGs ────────────────────────────────────────────────────────────────

const PenIcon = () => (
  <svg viewBox="0 0 512 512" fill="currentColor" className="w-[18px] h-[18px]">
    <path d="M290.74 93.24l128.02 128.02-277.99 277.99-114.14 12.6C11.35 513.54-1.56 500.62.14 485.34l12.7-114.22 277.9-277.88zm207.2-19.06l-60.11-60.11c-18.75-18.75-49.16-18.75-67.91 0l-56.55 56.55 128.02 128.02 56.55-56.55c18.75-18.76 18.75-49.16 0-67.91z" />
  </svg>
);

const EraserIcon = () => (
  <svg viewBox="0 0 512 512" fill="currentColor" className="w-5 h-5">
    <path d="M497.941 273.941c18.745-18.745 18.745-49.137 0-67.882l-160-160c-18.745-18.745-49.136-18.746-67.883 0l-256 256c-18.745 18.745-18.745 49.137 0 67.882l96 96A48.004 48.004 0 0 0 144 480h356c6.627 0 12-5.373 12-12v-40c0-6.627-5.373-12-12-12H355.883l142.058-142.059zm-302.627-62.627l137.373 137.373L265.373 416H150.628l-80-80 124.686-124.686z" />
  </svg>
);

const BucketIcon = () => (
  <svg viewBox="0 0 576 512" fill="currentColor" className="w-5 h-5">
    <path d="M512 320s-64 92.65-64 128c0 35.35 28.66 64 64 64s64-28.65 64-64-64-128-64-128zm-9.37-102.94L294.94 9.37C288.69 3.12 280.5 0 272.31 0s-16.38 3.12-22.62 9.37l-221.57 221.57c-37.49 37.48-37.49 98.26 0 135.75l117.19 117.19c18.74 18.74 43.31 28.12 67.87 28.12 24.57 0 49.13-9.37 67.87-28.12l221.57-221.57c12.5-12.5 12.5-32.75.01-45.25zm-116.22 70.97H65.93c1.36-3.84 3.57-7.98 7.43-11.83l13.15-13.15 185.8-185.8 162.44 162.44-48.34 48.34z" />
  </svg>
);

const EyedropperIcon = () => (
  <svg viewBox="0 0 512 512" fill="currentColor" className="w-[18px] h-[18px]">
    <path d="M50.75 333.25c-12 12-18.75 28.28-18.75 45.26V424L0 480l32 32 56-32h45.49c16.97 0 33.25-6.74 45.25-18.74l126.64-126.62-128-128L50.75 333.25zM483.88 28.12c-37.47-37.5-98.28-37.5-135.75 0l-77.09 77.09-13.1-13.1c-9.44-9.44-24.65-9.31-33.94 0l-40.97 40.97c-9.37 9.37-9.37 24.57 0 33.94l161.94 161.94c9.44 9.44 24.65 9.31 33.94 0L419.88 288c9.37-9.37 9.37-24.57 0-33.94l-13.1-13.1 77.09-77.09c37.51-37.48 37.51-98.26.01-135.75z" />
  </svg>
);

const UndoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path d="M9 14L4 9l5-5" />
    <path d="M4 9h11a4 4 0 010 8h-1" />
  </svg>
);

const RedoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path d="M15 14l5-5-5-5" />
    <path d="M20 9H9a4 4 0 000 8h1" />
  </svg>
);

const GridIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 448 512" fill="currentColor" className="w-[18px] h-[18px]">
    <path d="M432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.72 23.72 0 0 0-21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16zM53.2 467a48 48 0 0 0 47.9 45h245.8a48 48 0 0 0 47.9-45L416 128H32z" />
  </svg>
);

const HandIcon = () => (
  <svg viewBox="0 0 448 512" fill="currentColor" className="w-[18px] h-[18px]">
    <path d="M408.781 128.007C386.356 127.578 368 146.36 368 168.79V256h-8V79.79c0-22.43-18.356-41.212-40.781-40.783C297.488 39.423 280 57.169 280 79v177h-8V40.79C272 18.36 253.644-.422 231.219.007 209.488.423 192 18.169 192 40v216h-8V80.79c0-22.43-18.356-41.212-40.781-40.783C121.488 40.423 104 58.169 104 80v235.992l-31.648-43.519c-12.993-17.866-38.009-21.817-55.877-8.823-17.865 12.994-21.815 38.01-8.822 55.877l125.601 172.705A48 48 0 0 0 172.073 512h197.59c22.274 0 41.622-15.324 46.724-37.006l26.508-112.66a192.011 192.011 0 0 0 5.104-43.975V168c.001-21.831-17.487-39.577-39.218-39.993z" />
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

const TOOLS: { id: Tool; label: string; icon: React.ReactNode; shortcut: string }[] = [
  { id: 'pen', label: 'Pen', icon: <PenIcon />, shortcut: 'P' },
  { id: 'eraser', label: 'Eraser', icon: <EraserIcon />, shortcut: 'E' },
  { id: 'bucket', label: 'Fill', icon: <BucketIcon />, shortcut: 'G' },
  { id: 'eyedropper', label: 'Eyedropper', icon: <EyedropperIcon />, shortcut: 'I' },
  { id: 'hand', label: 'Hand', icon: <HandIcon />, shortcut: 'H / Space' },
];

export default function Toolbar() {
  const { state, dispatch } = useStudio();
  const { tool, zoom, showGrid, past, future, canvasSize } = state;

  const previousToolRef = React.useRef<Tool | null>(null);

  const handleKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (tool !== 'hand' && !previousToolRef.current) {
          previousToolRef.current = tool;
          dispatch({ type: 'SET_TOOL', tool: 'hand' });
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        dispatch({ type: 'REDO' });
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'p': dispatch({ type: 'SET_TOOL', tool: 'pen' }); break;
        case 'e': dispatch({ type: 'SET_TOOL', tool: 'eraser' }); break;
        case 'g': dispatch({ type: 'SET_TOOL', tool: 'bucket' }); break;
        case 'i': dispatch({ type: 'SET_TOOL', tool: 'eyedropper' }); break;
        case 'h': dispatch({ type: 'SET_TOOL', tool: 'hand' }); break;
        case '+':
        case '=': dispatch({ type: 'SET_ZOOM', zoom: zoom + 2 }); break;
        case '-': dispatch({ type: 'SET_ZOOM', zoom: zoom - 2 }); break;
      }
    },
    [dispatch, zoom, tool]
  );

  const handleKeyUp = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (previousToolRef.current) {
          dispatch({ type: 'SET_TOOL', tool: previousToolRef.current });
          previousToolRef.current = null;
        }
      }
    },
    [dispatch]
  );

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return (
    <div className="w-14 bg-white border-r border-gray-200 flex flex-col items-center py-3 gap-1 select-none">
      {/* Tools */}
      <div className="flex flex-col gap-1 w-full px-1.5">
        {TOOLS.map(({ id, label, icon, shortcut }) => (
          <button
            key={id}
            title={`${label} (${shortcut})`}
            onClick={() => dispatch({ type: 'SET_TOOL', tool: id })}
            className={`
              w-full aspect-square flex items-center justify-center rounded-md
              transition-colors text-sm font-medium
              ${tool === id
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'}
            `}
          >
            {icon}
          </button>
        ))}
      </div>

      <div className="w-8 border-t border-gray-200 my-1" />

      {/* Zoom */}
      <div className="flex flex-col gap-1 w-full px-1.5">
        <button
          title="Zoom In (+)"
          onClick={() => dispatch({ type: 'SET_ZOOM', zoom: zoom + 2 })}
          className="w-full aspect-square flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 text-lg font-bold leading-none"
        >
          +
        </button>
        <div className="text-center text-[9px] font-mono text-gray-500 leading-none py-0.5">
          {zoom}×
        </div>
        <button
          title="Zoom Out (-)"
          onClick={() => dispatch({ type: 'SET_ZOOM', zoom: zoom - 2 })}
          disabled={zoom <= 2}
          className="w-full aspect-square flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-40 text-lg font-bold leading-none"
        >
          −
        </button>
      </div>

      <div className="w-8 border-t border-gray-200 my-1" />

      {/* Grid toggle */}
      <div className="w-full px-1.5">
        <button
          title="Toggle Grid"
          onClick={() => dispatch({ type: 'TOGGLE_GRID' })}
          className={`
            w-full aspect-square flex items-center justify-center rounded-md
            transition-colors
            ${showGrid ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}
          `}
        >
          <GridIcon />
        </button>
      </div>

      <div className="w-8 border-t border-gray-200 my-1" />

      {/* Undo / Redo */}
      <div className="flex flex-col gap-1 w-full px-1.5">
        <button
          title="Undo (Ctrl+Z)"
          onClick={() => dispatch({ type: 'UNDO' })}
          disabled={past.length === 0}
          className="w-full aspect-square flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-30"
        >
          <UndoIcon />
        </button>
        <button
          title="Redo (Ctrl+Y)"
          onClick={() => dispatch({ type: 'REDO' })}
          disabled={future.length === 0}
          className="w-full aspect-square flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-30"
        >
          <RedoIcon />
        </button>
      </div>

      {/* Clear Canvas */}
      <div className="flex flex-col gap-1 w-full px-1.5">
        <button
          title="Clear Canvas"
          onClick={() => dispatch({ type: 'CLEAR_CANVAS' })}
          className="w-full aspect-square flex items-center justify-center rounded-md text-red-500 hover:bg-red-50 transition-colors"
        >
          <TrashIcon />
        </button>
      </div>

      <div className="flex-1" />

      {/* Canvas info */}
      <div className="text-[8px] font-mono text-gray-400 text-center leading-tight pb-1">
        {canvasSize.width}
        <br />×<br />
        {canvasSize.height}
      </div>
    </div>
  );
}
