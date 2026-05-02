import React from 'react';
import { useStudio } from '../contexts/StudioContext';
import type { Tool } from '../contexts/StudioContext';

// ─── Icon SVGs ────────────────────────────────────────────────────────────────

const PenIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const EraserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path d="M20 20H7L3 16l10.5-10.5a2 2 0 012.828 0L20 9a2 2 0 010 2.828L11.5 20" />
    <path d="M6.5 17.5l4-4" />
  </svg>
);

const BucketIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path d="M19 11V9a2 2 0 00-2-2H4a2 2 0 00-2 2v6a2 2 0 002 2h5" />
    <path d="M19 11h2v8a2 2 0 11-4 0v-8h2z" />
    <line x1="8" y1="11" x2="8" y2="11" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const EyedropperIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path d="M20 11L8 23l-5-5L15 6l5 5z" />
    <path d="M15 6l3-3a2.121 2.121 0 013 3l-3 3" />
    <line x1="2" y1="22" x2="3" y2="21" />
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

// ─── Component ────────────────────────────────────────────────────────────────

const TOOLS: { id: Tool; label: string; icon: React.ReactNode; shortcut: string }[] = [
  { id: 'pen', label: 'Pen', icon: <PenIcon />, shortcut: 'P' },
  { id: 'eraser', label: 'Eraser', icon: <EraserIcon />, shortcut: 'E' },
  { id: 'bucket', label: 'Fill', icon: <BucketIcon />, shortcut: 'G' },
  { id: 'eyedropper', label: 'Eyedropper', icon: <EyedropperIcon />, shortcut: 'I' },
];

export default function Toolbar() {
  const { state, dispatch } = useStudio();
  const { tool, zoom, showGrid, past, future, canvasSize } = state;

  const handleKeyShortcuts = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

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
        case '+':
        case '=': dispatch({ type: 'SET_ZOOM', zoom: zoom + 2 }); break;
        case '-': dispatch({ type: 'SET_ZOOM', zoom: zoom - 2 }); break;
      }
    },
    [dispatch, zoom]
  );

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyShortcuts);
    return () => window.removeEventListener('keydown', handleKeyShortcuts);
  }, [handleKeyShortcuts]);

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
