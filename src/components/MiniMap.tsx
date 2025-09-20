import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BoardItemData } from './BoardItem';

interface MiniMapProps {
  items: BoardItemData[];
  viewport: {
    x: number;
    y: number;
    scale: number;
  };
  onViewportChange?: (viewport: { x: number; y: number; scale: number }) => void;
  canvasSize?: number;
  className?: string;
}

const MiniMap: React.FC<MiniMapProps> = ({
  items,
  viewport,
  onViewportChange,
  canvasSize = 10000,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // MiniMap dimensions - rectangular like window screen
  const MINIMAP_WIDTH = 240;
  const MINIMAP_HEIGHT = 135;
  const SCALE_FACTOR = Math.min(MINIMAP_WIDTH / canvasSize, MINIMAP_HEIGHT / canvasSize);

  const drawMiniMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

    // Draw simple white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

    // Draw items
    items.forEach((item) => {
      const x = item.x * SCALE_FACTOR;
      const y = item.y * SCALE_FACTOR;
      const width = item.width * SCALE_FACTOR;
      const height = item.height * SCALE_FACTOR;

      ctx.save();

      if (item.type === 'note') {
        // Draw note
        const colors = {
          yellow: '#fef3c7',
          pink: '#fce7f3',
          blue: '#dbeafe',
          green: '#d1fae5',
          orange: '#fed7aa'
        };
        ctx.fillStyle = colors[item.color as keyof typeof colors] || colors.yellow;
        ctx.fillRect(x, y, Math.max(2, width), Math.max(2, height));
        
        // Add border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, Math.max(2, width), Math.max(2, height));
      } else if (item.type === 'image') {
        // Draw image placeholder
        ctx.fillStyle = '#e5e7eb';
        ctx.fillRect(x, y, Math.max(2, width), Math.max(2, height));
        
        // Add border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, Math.max(2, width), Math.max(2, height));
        
        // Add image icon (simple cross)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const iconSize = Math.min(width, height) * 0.3;
        
        ctx.beginPath();
        ctx.moveTo(centerX - iconSize/2, centerY - iconSize/2);
        ctx.lineTo(centerX + iconSize/2, centerY + iconSize/2);
        ctx.moveTo(centerX + iconSize/2, centerY - iconSize/2);
        ctx.lineTo(centerX - iconSize/2, centerY + iconSize/2);
        ctx.stroke();
      }

      ctx.restore();
    });

    // Draw viewport indicator
    const viewportWidth = window.innerWidth / viewport.scale * SCALE_FACTOR;
    const viewportHeight = (window.innerHeight - 64) / viewport.scale * SCALE_FACTOR; // Subtract navbar height
    const viewportX = -viewport.x / viewport.scale * SCALE_FACTOR;
    const viewportY = -(viewport.y - 64) / viewport.scale * SCALE_FACTOR; // Adjust for navbar

    // Clamp viewport indicator to minimap bounds
    const clampedX = Math.max(0, Math.min(MINIMAP_WIDTH - viewportWidth, viewportX));
    const clampedY = Math.max(0, Math.min(MINIMAP_HEIGHT - viewportHeight, viewportY));
    const clampedWidth = Math.min(viewportWidth, MINIMAP_WIDTH - clampedX);
    const clampedHeight = Math.min(viewportHeight, MINIMAP_HEIGHT - clampedY);

    // Draw viewport rectangle
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.strokeRect(clampedX, clampedY, clampedWidth, clampedHeight);

    // Draw viewport fill with transparency
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.fillRect(clampedX, clampedY, clampedWidth, clampedHeight);

    // Add corners for better visibility
    const cornerSize = 4;
    ctx.fillStyle = '#3b82f6';
    
    // Top-left corner
    ctx.fillRect(clampedX - 1, clampedY - 1, cornerSize, cornerSize);
    // Top-right corner
    ctx.fillRect(clampedX + clampedWidth - cornerSize + 1, clampedY - 1, cornerSize, cornerSize);
    // Bottom-left corner
    ctx.fillRect(clampedX - 1, clampedY + clampedHeight - cornerSize + 1, cornerSize, cornerSize);
    // Bottom-right corner
    ctx.fillRect(clampedX + clampedWidth - cornerSize + 1, clampedY + clampedHeight - cornerSize + 1, cornerSize, cornerSize);

  }, [items, viewport, SCALE_FACTOR]);

  useEffect(() => {
    drawMiniMap();
  }, [drawMiniMap]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!onViewportChange || !containerRef.current) return;

    setIsDragging(true);
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert minimap coordinates to canvas coordinates
    const canvasX = (x / SCALE_FACTOR) * viewport.scale;
    const canvasY = (y / SCALE_FACTOR) * viewport.scale;

    // Calculate new viewport position (center the view on click)
    const newX = -(canvasX - window.innerWidth / 2);
    const newY = -(canvasY - (window.innerHeight - 64) / 2) + 64; // Adjust for navbar

    onViewportChange({
      x: newX,
      y: newY,
      scale: viewport.scale
    });
  }, [onViewportChange, viewport.scale, SCALE_FACTOR]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !onViewportChange || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert minimap coordinates to canvas coordinates
    const canvasX = (x / SCALE_FACTOR) * viewport.scale;
    const canvasY = (y / SCALE_FACTOR) * viewport.scale;

    // Calculate new viewport position (center the view on cursor)
    const newX = -(canvasX - window.innerWidth / 2);
    const newY = -(canvasY - (window.innerHeight - 64) / 2) + 64; // Adjust for navbar

    onViewportChange({
      x: newX,
      y: newY,
      scale: viewport.scale
    });
  }, [isDragging, onViewportChange, viewport.scale, SCALE_FACTOR]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isDragging, handleMouseUp]);

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div
          ref={containerRef}
          className="relative cursor-crosshair select-none"
          style={{
            width: MINIMAP_WIDTH,
            height: MINIMAP_HEIGHT,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
        >
          <canvas
            ref={canvasRef}
            width={MINIMAP_WIDTH}
            height={MINIMAP_HEIGHT}
            className="border border-gray-300"
          />
          
          {/* Overlay for better interaction feedback */}
          <div
            className="absolute inset-0"
            style={{
              background: isDragging ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MiniMap;