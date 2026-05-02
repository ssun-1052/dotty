import React, { useState } from 'react';
import { useStudio, exportToSVG, exportToPNG } from '../contexts/StudioContext';

interface Props {
  onClose: () => void;
}

const SCALE_OPTIONS = [1, 2, 4, 8, 16, 32];

export default function ExportModal({ onClose }: Props) {
  const { state } = useStudio();
  const { layers, canvasSize } = state;

  const [transparentBg, setTransparentBg] = useState(false);
  const [scale, setScale] = useState(8);

  const handleExportSVG = () => {
    const svg = exportToSVG(layers, canvasSize, transparentBg, scale);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pixel-art.svg';
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  const handleExportPNG = () => {
    exportToPNG(layers, canvasSize, transparentBg, scale);
    onClose();
  };

  const previewSvg = exportToSVG(layers, canvasSize, transparentBg, 1);
  const { width, height } = canvasSize;
  const exportW = width * scale;
  const exportH = height * scale;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-2xl w-[460px] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Export</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Preview */}
          <div>
            <div className="text-xs font-semibold text-gray-500 mb-2">Preview</div>
            <div
              className="w-full flex items-center justify-center rounded-lg overflow-hidden border border-gray-200"
              style={{
                minHeight: 120,
                background: transparentBg
                  ? 'repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 0 0 / 12px 12px'
                  : '#fff',
              }}
            >
              <div
                dangerouslySetInnerHTML={{ __html: previewSvg }}
                style={{
                  maxWidth: '100%',
                  maxHeight: 200,
                  imageRendering: 'pixelated',
                }}
              />
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {/* Scale */}
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">
                Scale (pixel size)
              </label>
              <div className="flex gap-2">
                {SCALE_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setScale(s)}
                    className={`
                      flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors
                      ${scale === s
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-500'}
                    `}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            </div>

            {/* Transparent background */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={transparentBg}
                  onChange={(e) => setTransparentBg(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`
                    w-10 h-5 rounded-full transition-colors
                    ${transparentBg ? 'bg-blue-500' : 'bg-gray-200'}
                  `}
                />
                <div
                  className={`
                    absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform
                    ${transparentBg ? 'translate-x-5' : 'translate-x-0.5'}
                  `}
                />
              </div>
              <span className="text-sm text-gray-700 select-none">Transparent background</span>
            </label>
          </div>

          {/* Output info */}
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-xs text-gray-500 font-mono space-y-0.5">
            <div>SVG: vector (infinite resolution)</div>
            <div>PNG: {exportW} × {exportH} px · {scale}px per dot</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
          >
            Cancel
          </button>
          <button
            onClick={handleExportSVG}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 text-sm font-semibold transition-colors"
          >
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M8 2v8M5 7l3 3 3-3" /><path d="M2 12h12" />
            </svg>
            SVG
          </button>
          <button
            onClick={handleExportPNG}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors shadow-sm"
          >
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M8 2v8M5 7l3 3 3-3" /><path d="M2 12h12" />
            </svg>
            PNG
          </button>
        </div>
      </div>
    </div>
  );
}
