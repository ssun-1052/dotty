# Changelog

## 2026-05-02 Updates
### 🎨 UI & Design Improvements
- **Toolbar Icons Update**: 
  - Updated Pen, Eraser, Fill Bucket, and Eyedropper icons to a modern Solid style.
  - Adjusted the inner line artifact on the Fill Bucket icon for a cleaner look.
  - Fine-tuned the sizes of the Pen and Eyedropper icons (18px) to visually match the weight of the Eraser icon.
- **Layer Panel Update**:
  - Replaced the Trash icon for deleting layers with an intuitive 'X' (`XIcon`).

### ✨ New Features
- **Mouse Wheel Zoom**: 
  - Added support for zooming in and out of the canvas using the mouse wheel.
- **Clear Canvas Function**:
  - Added a new Trash icon button at the bottom of the toolbar to instantly clear all contents on the canvas.
  - Integrated a `CLEAR_CANVAS` action in `StudioContext` with undo/redo support.
- **Hand Tool & Infinite Panning (Figma Style)**:
  - Added a new Hand tool to the toolbar for panning around the canvas.
  - Implemented an expansive 10,000px × 10,000px scrollable grey area, automatically centered upon load.
  - Hid native browser scrollbars for an immersive, Figma-like infinite canvas feel.
  - **Spacebar Shortcut**: Pressing and holding the Spacebar temporarily switches to the Hand tool for quick panning. Releasing the Spacebar seamlessly reverts to the previously selected tool.

### 🎨 2026-05-02 Additional Updates
- **Canvas Shadow Refinement**: Changed the canvas shadow from a directional drop-shadow to a soft, centered, multi-directional glow (`boxShadow: '0 0 40px rgba(0, 0, 0, 0.15)'`) to make it look naturally elevated.
