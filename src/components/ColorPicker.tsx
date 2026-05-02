import React, { useState, useCallback, useRef, useEffect } from 'react';
import { HsvColorPicker, HsvColor } from 'react-colorful';
import { useStudio } from '../contexts/StudioContext';

// ─── Color Conversion Utilities ───────────────────────────────────────────────

function hexToHsv(hex: string): HsvColor {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(max === 0 ? 0 : (d / max) * 100),
    v: Math.round(max * 100),
  };
}

function hsvToHex({ h, s, v }: HsvColor): string {
  const hh = h / 360;
  const ss = s / 100;
  const vv = v / 100;
  const i = Math.floor(hh * 6);
  const f = hh * 6 - i;
  const p = vv * (1 - ss);
  const q = vv * (1 - f * ss);
  const t = vv * (1 - (1 - f) * ss);
  let r = 0, g = 0, b = 0;
  switch (i % 6) {
    case 0: r = vv; g = t;  b = p;  break;
    case 1: r = q;  g = vv; b = p;  break;
    case 2: r = p;  g = vv; b = t;  break;
    case 3: r = p;  g = q;  b = vv; break;
    case 4: r = t;  g = p;  b = vv; break;
    case 5: r = vv; g = p;  b = q;  break;
  }
  const hex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

function isValidHex(s: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(s);
}

// ─── Palette ─────────────────────────────────────────────────────────────────

const PALETTE: string[] = [
  '#000000', '#1a1a1a', '#404040', '#737373', '#a3a3a3', '#d4d4d4', '#f5f5f5', '#ffffff',
  '#7f1d1d', '#b91c1c', '#dc2626', '#ef4444', '#f97316', '#fb923c', '#fbbf24', '#fde68a',
  '#14532d', '#15803d', '#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7',
  '#1e3a5f', '#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe',
  '#3b0764', '#6b21a8', '#9333ea', '#a855f7', '#c084fc', '#ec4899', '#f9a8d4', '#fce7f3',
  '#431407', '#7c2d12', '#92400e', '#a16207', '#4d7c0f', '#065f46', '#164e63', '#1e1b4b',
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ColorPicker() {
  const { state, dispatch } = useStudio();

  const [hsv, setHsv] = useState<HsvColor>(() => hexToHsv(state.color));
  const [hexInput, setHexInput] = useState<string>(state.color.toUpperCase());
  const [recentColors, setRecentColors] = useState<string[]>([]);

  // Track whether the last color change came from within this component
  // to avoid a re-sync loop (picker → dispatch → effect → picker).
  const internalRef = useRef(false);

  // Sync when color is changed externally (eyedropper, palette click from canvas)
  useEffect(() => {
    if (internalRef.current) {
      internalRef.current = false;
      return;
    }
    const newHsv = hexToHsv(state.color);
    setHsv(newHsv);
    setHexInput(state.color.toUpperCase());
  }, [state.color]);

  const commitColor = useCallback(
    (hex: string) => {
      internalRef.current = true;
      dispatch({ type: 'SET_COLOR', color: hex });
      setHexInput(hex.toUpperCase());
      setRecentColors((prev) => [hex, ...prev.filter((c) => c !== hex)].slice(0, 8));
    },
    [dispatch]
  );

  const handleHsvChange = useCallback(
    (newHsv: HsvColor) => {
      setHsv(newHsv);
      commitColor(hsvToHex(newHsv));
    },
    [commitColor]
  );

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('#')) val = '#' + val;
    setHexInput(val.toUpperCase());
    if (isValidHex(val)) {
      setHsv(hexToHsv(val));
      commitColor(val);
    }
  };

  const handleHexBlur = () => {
    if (!isValidHex(hexInput)) setHexInput(state.color.toUpperCase());
  };

  const pickPaletteColor = (hex: string) => {
    setHsv(hexToHsv(hex));
    commitColor(hex);
  };

  return (
    <div className="p-3 border-b border-gray-200 select-none bg-white">
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5">
        Color
      </div>

      {/* ── HSV Picker (react-colorful) ─────────────────────────────────────── */}
      <HsvColorPicker color={hsv} onChange={handleHsvChange} />

      {/* ── Preview + Hex Input ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mt-3">
        <div
          className="w-8 h-8 rounded-md border border-gray-200 shadow-inner shrink-0"
          style={{ backgroundColor: state.color }}
        />
        <input
          type="text"
          value={hexInput}
          onChange={handleHexInputChange}
          onBlur={handleHexBlur}
          maxLength={7}
          spellCheck={false}
          className="flex-1 min-w-0 font-mono text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 uppercase bg-gray-50"
        />
      </div>

      {/* ── Palette ─────────────────────────────────────────────────────────── */}
      <div className="mt-3 grid grid-cols-8 gap-[3px]">
        {PALETTE.map((c) => (
          <button
            key={c}
            title={c}
            onClick={() => pickPaletteColor(c)}
            className={`
              aspect-square rounded-sm border transition-transform hover:scale-125 hover:z-10 relative
              ${state.color.toLowerCase() === c.toLowerCase()
                ? 'border-blue-500 ring-1 ring-blue-400 scale-110 z-10'
                : 'border-gray-200'}
            `}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      {/* ── Recent Colors ───────────────────────────────────────────────────── */}
      {recentColors.length > 0 && (
        <div className="mt-2.5">
          <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
            Recent
          </div>
          <div className="flex gap-1 flex-wrap">
            {recentColors.map((c, i) => (
              <button
                key={`${c}-${i}`}
                title={c}
                onClick={() => pickPaletteColor(c)}
                className={`
                  w-5 h-5 rounded-sm border transition-transform hover:scale-110
                  ${state.color.toLowerCase() === c.toLowerCase() ? 'border-blue-500' : 'border-gray-200'}
                `}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
