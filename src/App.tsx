import React, { useState } from 'react';
import { StudioProvider, useStudio, exportToPNG } from './contexts/StudioContext';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import LayerPanel from './components/LayerPanel';
import ColorPicker from './components/ColorPicker';
import ExportModal from './components/ExportModal';
import './index.css';

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({ onExport }: { onExport: () => void }) {
  const { state, dispatch } = useStudio();
  const { canvasSize, layers } = state;

  const [sizeInput, setSizeInput] = useState({
    w: String(canvasSize.width),
    h: String(canvasSize.height),
  });
  const [showSizeEdit, setShowSizeEdit] = useState(false);

  const applySize = () => {
    const w = Math.max(1, Math.min(256, parseInt(sizeInput.w) || canvasSize.width));
    const h = Math.max(1, Math.min(256, parseInt(sizeInput.h) || canvasSize.height));
    if (w !== canvasSize.width || h !== canvasSize.height) {
      dispatch({ type: 'SET_CANVAS_SIZE', size: { width: w, height: h } });
    }
    setSizeInput({ w: String(w), h: String(h) });
    setShowSizeEdit(false);
  };

  return (
    <header className="h-11 bg-white border-b border-gray-200 flex items-center justify-between px-4 select-none z-10 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
          <svg viewBox="0 0 12 12" className="w-3.5 h-3.5">
            <rect x="0" y="0" width="5" height="5" fill="white" />
            <rect x="7" y="0" width="5" height="5" fill="white" opacity="0.6" />
            <rect x="0" y="7" width="5" height="5" fill="white" opacity="0.6" />
            <rect x="7" y="7" width="5" height="5" fill="white" />
          </svg>
        </div>
        <span className="font-semibold text-gray-800 text-sm tracking-tight">
          Layered Pixel Studio
        </span>
      </div>

      {/* Canvas size */}
      <div className="flex items-center gap-2">
        {showSizeEdit ? (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              type="number"
              value={sizeInput.w}
              onChange={(e) => setSizeInput((s) => ({ ...s, w: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && applySize()}
              className="w-14 text-xs border border-blue-300 rounded px-2 py-1 text-center font-mono focus:outline-none focus:ring-1 focus:ring-blue-300"
              min={1}
              max={256}
            />
            <span className="text-gray-400 text-xs">×</span>
            <input
              type="number"
              value={sizeInput.h}
              onChange={(e) => setSizeInput((s) => ({ ...s, h: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && applySize()}
              className="w-14 text-xs border border-blue-300 rounded px-2 py-1 text-center font-mono focus:outline-none focus:ring-1 focus:ring-blue-300"
              min={1}
              max={256}
            />
            <button
              onClick={applySize}
              className="text-xs bg-blue-500 text-white px-2.5 py-1 rounded hover:bg-blue-600 transition-colors font-medium"
            >
              Apply
            </button>
            <button
              onClick={() => {
                setSizeInput({ w: String(canvasSize.width), h: String(canvasSize.height) });
                setShowSizeEdit(false);
              }}
              className="text-xs text-gray-500 px-1 py-1 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowSizeEdit(true)}
            className="text-xs font-mono text-gray-500 hover:text-blue-500 hover:bg-blue-50 px-2.5 py-1 rounded transition-colors border border-transparent hover:border-blue-200"
            title="Click to change canvas size"
          >
            {canvasSize.width} × {canvasSize.height}
          </button>
        )}
      </div>

      {/* Export buttons */}
      <div className="flex items-center gap-2">
        {/* Quick PNG save — auto-scales to ≥512 px, white background */}
        <button
          onClick={() => exportToPNG(layers, canvasSize, false)}
          title="Save PNG (auto-scale to 512px+, white background)"
          className="flex items-center gap-1.5 border border-gray-200 hover:border-blue-300 text-gray-600 hover:text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M8 2v8M5 7l3 3 3-3" /><path d="M2 12h12" />
          </svg>
          Save PNG
        </button>

        {/* Full export modal (SVG + PNG, shared settings) */}
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M8 2v8M5 7l3 3 3-3" /><path d="M2 12h12" />
          </svg>
          Export…
        </button>
      </div>
    </header>
  );
}

// ─── Inner App (needs Studio context) ────────────────────────────────────────

function StudioApp() {
  const [showExport, setShowExport] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      <Header onExport={() => setShowExport(true)} />

      <div className="flex flex-1 min-h-0">
        {/* Left: Toolbar */}
        <Toolbar />

        {/* Center: Canvas */}
        <div className="flex-1 min-w-0">
          <Canvas />
        </div>

        {/* Right: Color + Layers */}
        <div className="w-64 flex flex-col border-l border-gray-200 bg-white overflow-hidden">
          <div className="overflow-y-auto shrink-0 max-h-[420px]">
            <ColorPicker />
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <LayerPanel />
          </div>
        </div>
      </div>

      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <StudioProvider>
      <StudioApp />
    </StudioProvider>
  );
}
