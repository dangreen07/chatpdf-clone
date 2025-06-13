import React, { useEffect } from 'react';

interface PopupProps {
  visible: boolean;
  x: number;
  y: number;
  onClose: () => void;
  selectedText: string;
}

export default function TextSelectionPopup({ visible, x, y, onClose, selectedText }: PopupProps) {
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
      style={{ top: y, left: x, transform: 'translate(-50%,-110%)' }}
      className="fixed z-50 flex flex-col items-center bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg"
    >
      <div className="flex gap-6 text-sm font-medium mb-2">
        <button className="hover:text-yellow-400" onClick={() => alert(`Explain: ${selectedText}`)}>Explain</button>
        <span className="opacity-50">|</span>
        <button className="hover:text-yellow-400" onClick={() => alert(`Summarize: ${selectedText}`)}>Summarize</button>
        <span className="opacity-50">|</span>
        <button className="hover:text-yellow-400" onClick={() => alert(`Rewrite: ${selectedText}`)}>Rewrite</button>
      </div>
      {/* Color dots */}
      <div className="flex gap-2 mb-2">
        {['#e53935', '#ffb300', '#c0ca33', '#43a047', '#1e88e5', '#8e24aa', '#ad1457'].map((color) => (
          <span
            key={color}
            className="w-4 h-4 rounded-full cursor-pointer"
            style={{ backgroundColor: color }}
            title="Highlight"
            onClick={() => alert(`Highlight in ${color}: ${selectedText}`)}
          />
        ))}
      </div>
      {/* Close icon */}
      <button className="absolute top-1 right-1 text-gray-400 hover:text-white" onClick={onClose}>×</button>
    </div>
  );
} 