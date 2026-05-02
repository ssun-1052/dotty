import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useStudio, floodFill } from '../contexts/StudioContext';

export default function Canvas() {
  const { state, dispatch, getCompositePixel } = useStudio();
  const { layers, activeLayerId, tool, color, canvasSize, zoom, showGrid } = state;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const lastPixel = useRef<{ x: number; y: number } | null>(null);
  const preDrawLayers = useRef(layers);
  const [hoverPixel, setHoverPixel] = useState<{ x: number; y: number } | null>(null);

  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);

  // Initialize scroll position to center the 10000x10000 canvas area
  useEffect(() => {
    if (containerRef.current) {
      const el = containerRef.current;
      el.scrollLeft = (10000 - el.clientWidth) / 2;
      el.scrollTop = (10000 - el.clientHeight) / 2;
    }
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvasSize;
    const ps = zoom; // pixel size in screen pixels

    canvas.width = width * ps;
    canvas.height = height * ps;

    // Checkerboard background
    const tile = Math.max(2, Math.round(ps / 2));
    for (let cy = 0; cy < canvas.height; cy += tile) {
      for (let cx = 0; cx < canvas.width; cx += tile) {
        const tx = Math.floor(cx / tile);
        const ty = Math.floor(cy / tile);
        ctx.fillStyle = (tx + ty) % 2 === 0 ? '#ffffff' : '#d4d4d4';
        ctx.fillRect(cx, cy, tile, tile);
      }
    }

    // Draw layers bottom to top
    for (const layer of layers) {
      if (!layer.visible) continue;
      ctx.globalAlpha = layer.opacity / 100;
      for (const [key, pixColor] of Object.entries(layer.pixels)) {
        const [px, py] = key.split(',').map(Number);
        if (px < 0 || px >= width || py < 0 || py >= height) continue;
        ctx.fillStyle = pixColor;
        ctx.fillRect(px * ps, py * ps, ps, ps);
      }
    }
    ctx.globalAlpha = 1;

    // Hover highlight
    if (hoverPixel && tool !== 'eyedropper') {
      const { x: hx, y: hy } = hoverPixel;
      if (hx >= 0 && hx < width && hy >= 0 && hy < height) {
        if (tool === 'eraser') {
          ctx.fillStyle = 'rgba(239,68,68,0.25)';
          ctx.fillRect(hx * ps, hy * ps, ps, ps);
          ctx.strokeStyle = 'rgba(239,68,68,0.8)';
        } else {
          ctx.fillStyle = `${color}55`;
          ctx.fillRect(hx * ps, hy * ps, ps, ps);
          ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        }
        ctx.lineWidth = 1;
        ctx.strokeRect(hx * ps + 0.5, hy * ps + 0.5, ps - 1, ps - 1);
      }
    }

    // Grid lines
    if (showGrid && zoom >= 4) {
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let gx = 0; gx <= width; gx++) {
        ctx.moveTo(gx * ps + 0.5, 0);
        ctx.lineTo(gx * ps + 0.5, height * ps);
      }
      for (let gy = 0; gy <= height; gy++) {
        ctx.moveTo(0, gy * ps + 0.5);
        ctx.lineTo(width * ps, gy * ps + 0.5);
      }
      ctx.stroke();
    }
  }, [layers, canvasSize, zoom, showGrid, hoverPixel, tool, color]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Prevent default scrolling behavior
      e.preventDefault();
      if (e.deltaY < 0) {
        dispatch({ type: 'SET_ZOOM', zoom: zoom + 2 });
      } else if (e.deltaY > 0) {
        dispatch({ type: 'SET_ZOOM', zoom: Math.max(2, zoom - 2) });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [dispatch, zoom]);

  // ─── Interaction ─────────────────────────────────────────────────────────────
  const getPixel = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const cx = (e.clientX - rect.left) * scaleX;
      const cy = (e.clientY - rect.top) * scaleY;
      return {
        x: Math.floor(cx / zoom),
        y: Math.floor(cy / zoom),
      };
    },
    [zoom]
  );

  const applyPixel = useCallback(
    (x: number, y: number) => {
      const { width, height } = canvasSize;
      if (x < 0 || x >= width || y < 0 || y >= height) return;
      dispatch({
        type: 'SET_PIXELS',
        layerId: activeLayerId,
        pixels: { [`${x},${y}`]: tool === 'eraser' ? null : color },
      });
    },
    [tool, color, activeLayerId, canvasSize, dispatch]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button !== 0) return;
      if (tool === 'hand') return; // Handled by container
      const pixel = getPixel(e);
      if (!pixel) return;
      const { x, y } = pixel;
      const { width, height } = canvasSize;
      if (x < 0 || x >= width || y < 0 || y >= height) return;

      preDrawLayers.current = layers;

      if (tool === 'bucket') {
        const activeLayer = layers.find((l) => l.id === activeLayerId);
        if (!activeLayer) return;
        dispatch({ type: 'PUSH_HISTORY', layers });
        const changes = floodFill(activeLayer.pixels, x, y, color, canvasSize);
        dispatch({ type: 'SET_PIXELS', layerId: activeLayerId, pixels: changes });
        return;
      }

      if (tool === 'eyedropper') {
        const picked = getCompositePixel(x, y);
        if (picked) {
          dispatch({ type: 'SET_COLOR', color: picked });
          dispatch({ type: 'SET_TOOL', tool: 'pen' });
        }
        return;
      }

      isDrawing.current = true;
      lastPixel.current = { x, y };
      applyPixel(x, y);
    },
    [getPixel, layers, activeLayerId, tool, color, canvasSize, dispatch, applyPixel, getCompositePixel]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pixel = getPixel(e);
      if (pixel) setHoverPixel(pixel);

      if (!isDrawing.current || !pixel) return;
      const { x, y } = pixel;

      if (lastPixel.current) {
        const { x: lx, y: ly } = lastPixel.current;
        if (lx === x && ly === y) return;
        const dx = x - lx;
        const dy = y - ly;
        const steps = Math.max(Math.abs(dx), Math.abs(dy));
        for (let i = 1; i <= steps; i++) {
          const ix = Math.round(lx + (dx * i) / steps);
          const iy = Math.round(ly + (dy * i) / steps);
          applyPixel(ix, iy);
        }
      }
      lastPixel.current = { x, y };
    },
    [getPixel, applyPixel]
  );

  const finishDraw = useCallback(() => {
    if (isDrawing.current) {
      dispatch({ type: 'PUSH_HISTORY', layers: preDrawLayers.current });
      isDrawing.current = false;
      lastPixel.current = null;
    }
  }, [dispatch]);

  const handleMouseLeave = useCallback(() => {
    setHoverPixel(null);
    finishDraw();
  }, [finishDraw]);

  const getCursor = () => {
    if (tool === 'hand') return isPanning ? 'grabbing' : 'grab';
    switch (tool) {
      case 'pen': return 'crosshair';
      case 'eraser': return 'cell';
      case 'bucket': return 'crosshair';
      case 'eyedropper': return 'copy';
      default: return 'default';
    }
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-auto bg-[#e8e8e8]"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      onMouseDown={(e) => {
        if (tool === 'hand' && e.button === 0) {
          setIsPanning(true);
          panStart.current = {
            x: e.clientX,
            y: e.clientY,
            scrollLeft: e.currentTarget.scrollLeft,
            scrollTop: e.currentTarget.scrollTop,
          };
        }
      }}
      onMouseMove={(e) => {
        if (isPanning && panStart.current) {
          const dx = e.clientX - panStart.current.x;
          const dy = e.clientY - panStart.current.y;
          e.currentTarget.scrollLeft = panStart.current.scrollLeft - dx;
          e.currentTarget.scrollTop = panStart.current.scrollTop - dy;
        }
      }}
      onMouseUp={() => {
        setIsPanning(false);
        panStart.current = null;
      }}
      onMouseLeave={() => {
        setIsPanning(false);
        panStart.current = null;
      }}
    >
      <div style={{ width: '10000px', height: '10000px', position: 'relative' }}>
        <div
          style={{ 
            position: 'absolute', 
            left: '50%', 
            top: '50%', 
            transform: 'translate(-50%, -50%)',
            lineHeight: 0,
            boxShadow: '0 0 40px rgba(0, 0, 0, 0.15)'
          }}
          className="rounded-sm border border-gray-300"
        >
          <canvas
            ref={canvasRef}
            style={{ cursor: getCursor(), display: 'block' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={finishDraw}
            onMouseLeave={handleMouseLeave}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      </div>
    </div>
  );
}
