'use client';

interface ZoomControlsProps {
  zoomX: number;
  zoomY: number;
  onZoomXChange: (zoom: number) => void;
  onZoomYChange: (zoom: number) => void;
}

export function ZoomControls({ zoomX, zoomY, onZoomXChange, onZoomYChange }: ZoomControlsProps) {
  const ZOOM_STEP = 1.25;
  const MIN_ZOOM_X = 0.25;
  const MAX_ZOOM_X = 4.0;
  const MIN_ZOOM_Y = 0.5;
  const MAX_ZOOM_Y = 3.0;

  const handleZoomXIn = () => {
    const newZoom = Math.min(zoomX * ZOOM_STEP, MAX_ZOOM_X);
    onZoomXChange(newZoom);
  };

  const handleZoomXOut = () => {
    const newZoom = Math.max(zoomX / ZOOM_STEP, MIN_ZOOM_X);
    onZoomXChange(newZoom);
  };

  const handleZoomYIn = () => {
    const newZoom = Math.min(zoomY * ZOOM_STEP, MAX_ZOOM_Y);
    onZoomYChange(newZoom);
  };

  const handleZoomYOut = () => {
    const newZoom = Math.max(zoomY / ZOOM_STEP, MIN_ZOOM_Y);
    onZoomYChange(newZoom);
  };

  const handleReset = () => {
    onZoomXChange(1.0);
    onZoomYChange(1.0);
  };

  return (
    <div className="flex items-center gap-3 text-sm">
      {/* Horizontal zoom */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleZoomXOut}
          disabled={zoomX <= MIN_ZOOM_X}
          className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-200"
          title="Zoom out horizontally"
        >
          −
        </button>
        <span className="text-gray-300 w-12 text-center">H: {zoomX.toFixed(1)}x</span>
        <button
          onClick={handleZoomXIn}
          disabled={zoomX >= MAX_ZOOM_X}
          className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-200"
          title="Zoom in horizontally"
        >
          +
        </button>
      </div>

      {/* Vertical zoom */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleZoomYOut}
          disabled={zoomY <= MIN_ZOOM_Y}
          className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-200"
          title="Zoom out vertically"
        >
          −
        </button>
        <span className="text-gray-300 w-12 text-center">V: {zoomY.toFixed(1)}x</span>
        <button
          onClick={handleZoomYIn}
          disabled={zoomY >= MAX_ZOOM_Y}
          className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-200"
          title="Zoom in vertically"
        >
          +
        </button>
      </div>

      {/* Reset button */}
      <button
        onClick={handleReset}
        className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs"
        title="Reset zoom to 1.0x"
      >
        Reset
      </button>
    </div>
  );
}
