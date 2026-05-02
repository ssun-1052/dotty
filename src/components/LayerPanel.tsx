import React, { useRef, useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStudio } from '../contexts/StudioContext';
import type { Layer, CanvasSize, StudioAction } from '../contexts/StudioContext';

// ─── Icons ────────────────────────────────────────────────────────────────────

const EyeOpen = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeClosed = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const ChevronUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const ChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/** Six-dot grip handle for drag-and-drop */
const GripIcon = () => (
  <svg viewBox="0 0 10 16" fill="currentColor" className="w-2.5 h-4">
    <circle cx="3" cy="3"  r="1.2" /><circle cx="7" cy="3"  r="1.2" />
    <circle cx="3" cy="8"  r="1.2" /><circle cx="7" cy="8"  r="1.2" />
    <circle cx="3" cy="13" r="1.2" /><circle cx="7" cy="13" r="1.2" />
  </svg>
);

// ─── Layer Thumbnail ──────────────────────────────────────────────────────────

function LayerThumbnail({
  pixels,
  canvasSize,
}: {
  pixels: Record<string, string>;
  canvasSize: CanvasSize;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height } = canvasSize;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    for (const [key, color] of Object.entries(pixels)) {
      const [x, y] = key.split(',').map(Number);
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }, [pixels, canvasSize]);

  return (
    <canvas
      ref={ref}
      style={{
        width: 28,
        height: 28,
        imageRendering: 'pixelated',
        background: 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 6px 6px',
        borderRadius: 3,
        border: '1px solid #e5e7eb',
        flexShrink: 0,
      }}
    />
  );
}

// ─── Sortable Layer Item ──────────────────────────────────────────────────────

interface LayerItemProps {
  layer: Layer;
  realIdx: number;
  totalLayers: number;
  isActive: boolean;
  canvasSize: CanvasSize;
  dispatch: React.Dispatch<StudioAction>;
  /** When true, renders a lightweight ghost during an active drag */
  isOverlay?: boolean;
}

function SortableLayerItem({
  layer,
  realIdx,
  totalLayers,
  isActive,
  canvasSize,
  dispatch,
  isOverlay = false,
}: LayerItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: layer.id });

  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState(layer.name);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
  };

  const commitEdit = () => {
    if (editName.trim()) dispatch({ type: 'RENAME_LAYER', id: layer.id, name: editName.trim() });
    setEditingName(false);
  };

  const isFirst = realIdx === 0;
  const isLast = realIdx === totalLayers - 1;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => dispatch({ type: 'SET_ACTIVE_LAYER', id: layer.id })}
      className={`
        group border-b border-gray-100 cursor-pointer transition-colors
        ${isDragging || isOverlay ? 'opacity-50 bg-blue-50 shadow-lg z-50' : ''}
        ${isActive && !isDragging
          ? 'bg-blue-50 border-l-2 border-l-blue-400'
          : 'hover:bg-gray-50 border-l-2 border-l-transparent'}
      `}
    >
      {/* Top row */}
      <div className="flex items-center gap-1.5 px-1.5 py-2">
        {/* ── Drag handle ── */}
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          title="Drag to reorder"
          className="shrink-0 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing transition-colors touch-none"
        >
          <GripIcon />
        </button>

        {/* ── Visibility ── */}
        <button
          title={layer.visible ? 'Hide layer' : 'Show layer'}
          onClick={(e) => {
            e.stopPropagation();
            dispatch({ type: 'TOGGLE_LAYER_VISIBILITY', id: layer.id });
          }}
          className={`shrink-0 transition-colors ${layer.visible ? 'text-gray-500 hover:text-gray-700' : 'text-gray-300 hover:text-gray-500'}`}
        >
          {layer.visible ? <EyeOpen /> : <EyeClosed />}
        </button>

        {/* ── Thumbnail ── */}
        <LayerThumbnail pixels={layer.pixels} canvasSize={canvasSize} />

        {/* ── Name ── */}
        <div className="flex-1 min-w-0">
          {editingName ? (
            <input
              autoFocus
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitEdit();
                if (e.key === 'Escape') setEditingName(false);
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full text-xs border border-blue-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-300"
            />
          ) : (
            <div
              title="Double-click to rename"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditName(layer.name);
                setEditingName(true);
              }}
              className={`text-xs truncate font-medium select-none ${isActive ? 'text-blue-700' : 'text-gray-700'}`}
            >
              {layer.name}
            </div>
          )}
        </div>

        {/* ── Move up/down ── */}
        <div className="flex flex-col shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            title="Move Up (increase z-order)"
            disabled={isLast}
            onClick={(e) => {
              e.stopPropagation();
              dispatch({ type: 'MOVE_LAYER', fromIndex: realIdx, toIndex: realIdx + 1 });
            }}
            className="disabled:opacity-20 hover:text-blue-500 text-gray-400 transition-colors"
          >
            <ChevronUp />
          </button>
          <button
            title="Move Down (decrease z-order)"
            disabled={isFirst}
            onClick={(e) => {
              e.stopPropagation();
              dispatch({ type: 'MOVE_LAYER', fromIndex: realIdx, toIndex: realIdx - 1 });
            }}
            className="disabled:opacity-20 hover:text-blue-500 text-gray-400 transition-colors"
          >
            <ChevronDown />
          </button>
        </div>

        {/* ── Delete ── */}
        <button
          title="Delete layer"
          disabled={totalLayers <= 1}
          onClick={(e) => {
            e.stopPropagation();
            dispatch({ type: 'DELETE_LAYER', id: layer.id });
          }}
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 disabled:opacity-10"
        >
          <XIcon />
        </button>
      </div>

      {/* ── Opacity row ── */}
      <div className="flex items-center gap-2 px-2 pb-2">
        <span className="text-[9px] text-gray-400 w-5 shrink-0">Op</span>
        <input
          type="range"
          min={0}
          max={100}
          value={layer.opacity}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation();
            dispatch({ type: 'SET_LAYER_OPACITY', id: layer.id, opacity: Number(e.target.value) });
          }}
          className="flex-1 h-1.5 accent-blue-500"
        />
        <span className="text-[9px] font-mono text-gray-400 w-7 text-right shrink-0">
          {layer.opacity}%
        </span>
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function LayerPanel() {
  const { state, dispatch } = useStudio();
  const { layers, activeLayerId, canvasSize } = state;

  const [activeId, setActiveId] = useState<string | null>(null);

  // Layers are stored bottom-to-top; display them top-to-bottom (reversed)
  const displayLayers = [...layers].reverse();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require 5 px of movement before activating drag
      // so normal clicks (rename, opacity, etc.) aren't intercepted
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const displayIds = displayLayers.map((l) => l.id);
    const oldIdx = displayIds.indexOf(active.id as string);
    const newIdx = displayIds.indexOf(over.id as string);

    if (oldIdx === -1 || newIdx === -1) return;

    // Reorder in display space, then reverse back to storage order
    const newDisplayLayers = arrayMove(displayLayers, oldIdx, newIdx);
    const newLayers = [...newDisplayLayers].reverse();
    dispatch({ type: 'REORDER_LAYERS', layers: newLayers });
  };

  const overlayLayer = activeId ? layers.find((l) => l.id === activeId) : null;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 shrink-0">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
          Layers
        </span>
        <button
          title="Add Layer"
          onClick={() => dispatch({ type: 'ADD_LAYER' })}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-blue-50 text-blue-500 hover:text-blue-600 transition-colors"
        >
          <PlusIcon />
        </button>
      </div>

      {/* Sortable list */}
      <div className="flex-1 overflow-y-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={displayLayers.map((l) => l.id)}
            strategy={verticalListSortingStrategy}
          >
            {displayLayers.map((layer) => {
              const realIdx = layers.indexOf(layer);
              return (
                <SortableLayerItem
                  key={layer.id}
                  layer={layer}
                  realIdx={realIdx}
                  totalLayers={layers.length}
                  isActive={layer.id === activeLayerId}
                  canvasSize={canvasSize}
                  dispatch={dispatch}
                />
              );
            })}
          </SortableContext>

          {/* Drag overlay: renders the item as a floating ghost */}
          <DragOverlay dropAnimation={null}>
            {overlayLayer ? (
              <SortableLayerItem
                layer={overlayLayer}
                realIdx={layers.indexOf(overlayLayer)}
                totalLayers={layers.length}
                isActive={overlayLayer.id === activeLayerId}
                canvasSize={canvasSize}
                dispatch={dispatch}
                isOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-3 py-1.5 text-[9px] text-gray-400 shrink-0">
        {layers.length} layer{layers.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
