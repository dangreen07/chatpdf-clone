"use client";

import { useEffect, useState, ReactNode } from "react";

interface ResizablePanelProps {
  children: ReactNode;
  initialWidth?: number; // percentage
  minWidth?: number; // percentage
  maxWidth?: number; // percentage
  className?: string;
  position?: 'left' | 'right';
}

export default function ResizablePanel({ 
  children, 
  initialWidth = 33.33, 
  minWidth = 20, 
  maxWidth = 60, 
  className = "",
  position = 'right'
}: ResizablePanelProps) {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const windowWidth = window.innerWidth;
      const mouseX = e.clientX;
      
      let newWidth;
      if (position === 'right') {
        newWidth = ((windowWidth - mouseX) / windowWidth) * 100;
      } else {
        newWidth = (mouseX / windowWidth) * 100;
      }
      
      // Constrain between min and max width
      const constrainedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
      setWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, minWidth, maxWidth, position]);

  const resizeHandlePosition = position === 'right' ? 'left-0' : 'right-0';
  const dragIndicatorPosition = position === 'right' 
    ? { left: `${100 - width}%` } 
    : { left: `${width}%` };

  return (
    <div 
      className={`relative ${className}`}
      style={{ width: `${width}%` }}
    >
      <div 
        className={`bg-transparent absolute hover:bg-gray-300 cursor-col-resize ${resizeHandlePosition} top-0 w-0.5 h-full z-10`}
        onMouseDown={handleMouseDown} 
      />
      {isResizing && (
        <div 
          className="fixed left-0 top-0 w-0.5 h-full bg-gray-400 z-50 pointer-events-none" 
          style={dragIndicatorPosition} 
        />
      )}
      {children}
    </div>
  );
} 