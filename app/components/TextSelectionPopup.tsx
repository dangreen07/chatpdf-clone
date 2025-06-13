import React, { useEffect } from 'react';

interface PopupProps {
  visible: boolean;
  x: number;
  y: number;
  onClose: () => void;
  selectedText: string;
  onAction: (type: "explain" | "summarize" | "rewrite", text: string) => void;
}

export default function TextSelectionPopup({ visible, x, y, onClose, selectedText, onAction }: PopupProps) {
  // Close on Esc or click outside handled in parent if needed
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!visible) return null;

  return (
    <div
      style={{ top: y, left: x, transform: 'translate(-50%, -100%)' }}
      className="fixed z-50 flex flex-col items-center bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg"
    >
      <div className="flex gap-6 text-sm font-medium mb-2">
        <button className="hover:text-yellow-400" onClick={() => onAction("explain", selectedText)}>Explain</button>
        <span className="opacity-50">|</span>
        <button className="hover:text-yellow-400" onClick={() => onAction("summarize", selectedText)}>Summarize</button>
        <span className="opacity-50">|</span>
        <button className="hover:text-yellow-400" onClick={() => onAction("rewrite", selectedText)}>Rewrite</button>
      </div>
      {/* Spacer for layout consistency */}
      <div className="h-2" />
      {/* Close icon */}
      <button className="absolute top-1 right-1 text-gray-400 hover:text-white" onClick={onClose}>×</button>
    </div>
  );
} 