import React, { useState } from 'react';
import { StudioProvider, useStudio, exportToPNG } from './contexts/StudioContext';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import LayerPanel from './components/LayerPanel';
import ColorPicker from './components/ColorPicker';
import ExportModal from './components/ExportModal';
import './index.css';

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({ onExport, onToggleRightPanel }: { onExport: () => void; onToggleRightPanel: () => void }) {
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
        <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center shrink-0">
          <svg viewBox="0 0 12 12" className="w-3.5 h-3.5">
            <rect x="0" y="0" width="5" height="5" fill="white" />
            <rect x="7" y="0" width="5" height="5" fill="white" opacity="0.6" />
            <rect x="0" y="7" width="5" height="5" fill="white" opacity="0.6" />
            <rect x="7" y="7" width="5" height="5" fill="white" />
          </svg>
        </div>
        <span className="font-semibold text-gray-800 text-sm tracking-tight hidden md:inline">
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
      <div className="flex items-center gap-1 md:gap-2">
        {/* Quick PNG save */}
        <button
          onClick={() => exportToPNG(layers, canvasSize, false)}
          title="Save PNG"
          className="flex items-center gap-1.5 border border-gray-200 hover:border-blue-300 text-gray-600 hover:text-blue-600 text-xs font-semibold px-2 md:px-3 py-1.5 rounded-lg transition-colors shrink-0"
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M8 2v8M5 7l3 3 3-3" /><path d="M2 12h12" />
          </svg>
          <span className="hidden md:inline">Save PNG</span>
        </button>

        {/* Full export modal */}
        <button
          onClick={onExport}
          title="Export Options"
          className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-2 md:px-3 py-1.5 rounded-lg transition-colors shadow-sm shrink-0"
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M8 2v8M5 7l3 3 3-3" /><path d="M2 12h12" />
          </svg>
          <span className="hidden md:inline">Export…</span>
        </button>

        {/* Right Panel Toggle (Mobile) */}
        <button
          onClick={onToggleRightPanel}
          className="md:hidden flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg ml-1 shrink-0 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </header>
  );
}

// ─── Inner App (needs Studio context) ────────────────────────────────────────

function StudioApp() {
  const [showExport, setShowExport] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-100 overflow-hidden relative">
      <Header 
        onExport={() => setShowExport(true)} 
        onToggleRightPanel={() => setIsRightPanelOpen(true)} 
      />

      <div className="flex flex-1 min-h-0 relative">
        {/* Left: Toolbar */}
        <Toolbar />

        {/* Center: Canvas */}
        <div className="flex-1 min-w-0">
          <Canvas />
        </div>

        {/* Right Panel Backdrop (Mobile Only) */}
        {isRightPanelOpen && (
          <div 
            className="md:hidden absolute inset-0 bg-black/30 z-40 transition-opacity" 
            onClick={() => setIsRightPanelOpen(false)}
          />
        )}

        {/* Right: Color + Layers */}
        <div 
          className={`
            absolute md:static right-0 top-0 bottom-0 w-64 bg-white border-l border-gray-200 
            flex flex-col z-50 transform transition-transform duration-300 ease-in-out
            ${isRightPanelOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
          `}
        >
          {/* Mobile close button */}
          <div className="md:hidden flex items-center justify-between p-3 border-b border-gray-200 shrink-0">
            <span className="font-semibold text-sm text-gray-700">Palette & Layers</span>
            <button 
              onClick={() => setIsRightPanelOpen(false)} 
              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="overflow-y-auto shrink-0 max-h-[420px] md:max-h-[50%]">
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
