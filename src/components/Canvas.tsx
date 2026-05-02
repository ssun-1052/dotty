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
  const touchState = useRef({
    initialPinchDist: 0,
    initialZoom: 0,
    lastPanMidpoint: { x: 0, y: 0 }
  });

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
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const cx = (clientX - rect.left) * scaleX;
      const cy = (clientY - rect.top) * scaleY;
      return {
        x: Math.floor(cx / zoom),
        y: Math.floor(cy / zoom),
      };
    },
    [zoom]
  );

  const applyPixel = useCallback(
    (x: number, y: number, overrideTool?: Tool) => {
      const currentTool = overrideTool || tool;
      const { width, height } = canvasSize;
      if (x < 0 || x >= width || y < 0 || y >= height) return;
      dispatch({
        type: 'SET_PIXELS',
        layerId: activeLayerId,
        pixels: { [`${x},${y}`]: currentTool === 'eraser' ? null : color },
      });
    },
    [tool, color, activeLayerId, canvasSize, dispatch]
  );

  const handlePointerDown = useCallback(
    (clientX: number, clientY: number, isTouch: boolean) => {
      const currentTool = (isTouch && tool === 'hand') ? 'pen' : tool;
      if (!isTouch && currentTool === 'hand') return; // Mouse hand tool handled by container

      const pixel = getPixel(clientX, clientY);
      if (!pixel) return;
      const { x, y } = pixel;
      const { width, height } = canvasSize;
      if (x < 0 || x >= width || y < 0 || y >= height) return;

      preDrawLayers.current = layers;

      if (currentTool === 'bucket') {
        const activeLayer = layers.find((l) => l.id === activeLayerId);
        if (!activeLayer) return;
        dispatch({ type: 'PUSH_HISTORY', layers });
        const changes = floodFill(activeLayer.pixels, x, y, color, canvasSize);
        dispatch({ type: 'SET_PIXELS', layerId: activeLayerId, pixels: changes });
        return;
      }

      if (currentTool === 'eyedropper') {
        const picked = getCompositePixel(x, y);
        if (picked) {
          dispatch({ type: 'SET_COLOR', color: picked });
          dispatch({ type: 'SET_TOOL', tool: 'pen' });
        }
        return;
      }

      isDrawing.current = true;
      lastPixel.current = { x, y };
      applyPixel(x, y, currentTool);
    },
    [getPixel, layers, activeLayerId, tool, color, canvasSize, dispatch, applyPixel, getCompositePixel]
  );

  const handlePointerMove = useCallback(
    (clientX: number, clientY: number, isTouch: boolean) => {
      const currentTool = (isTouch && tool === 'hand') ? 'pen' : tool;
      const pixel = getPixel(clientX, clientY);
      if (pixel && !isTouch) setHoverPixel(pixel);

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
          applyPixel(ix, iy, currentTool);
        }
      }
      lastPixel.current = { x, y };
    },
    [getPixel, applyPixel, tool]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button !== 0) return;
      handlePointerDown(e.clientX, e.clientY, false);
    },
    [handlePointerDown]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      handlePointerMove(e.clientX, e.clientY, false);
    },
    [handlePointerMove]
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
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', touchAction: 'none' }}
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
      onTouchStart={(e) => {
        if (e.touches.length === 2) {
          if (isDrawing.current) finishDraw();
          const t1 = e.touches[0];
          const t2 = e.touches[1];
          touchState.current.initialPinchDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
          touchState.current.initialZoom = zoom;
          touchState.current.lastPanMidpoint = {
            x: (t1.clientX + t2.clientX) / 2,
            y: (t1.clientY + t2.clientY) / 2,
          };
        } else if (e.touches.length === 1) {
          if (e.target === canvasRef.current) {
            handlePointerDown(e.touches[0].clientX, e.touches[0].clientY, true);
          }
        }
      }}
      onTouchMove={(e) => {
        if (e.touches.length === 2) {
          const t1 = e.touches[0];
          const t2 = e.touches[1];
          const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
          const midX = (t1.clientX + t2.clientX) / 2;
          const midY = (t1.clientY + t2.clientY) / 2;

          // Panning
          const dx = midX - touchState.current.lastPanMidpoint.x;
          const dy = midY - touchState.current.lastPanMidpoint.y;
          if (containerRef.current) {
            containerRef.current.scrollLeft -= dx;
            containerRef.current.scrollTop -= dy;
          }
          touchState.current.lastPanMidpoint = { x: midX, y: midY };

          // Zooming
          if (touchState.current.initialPinchDist > 0) {
            const scale = dist / touchState.current.initialPinchDist;
            const newZoom = Math.max(2, Math.round(touchState.current.initialZoom * scale));
            if (newZoom !== zoom) {
              dispatch({ type: 'SET_ZOOM', zoom: newZoom });
            }
          }
        } else if (e.touches.length === 1) {
          if (isDrawing.current) {
            handlePointerMove(e.touches[0].clientX, e.touches[0].clientY, true);
          }
        }
      }}
      onTouchEnd={(e) => {
        if (e.touches.length === 0 && isDrawing.current) {
          finishDraw();
        }
      }}
      onTouchCancel={(e) => {
        if (e.touches.length === 0 && isDrawing.current) {
          finishDraw();
        }
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
