import React, { useEffect } from "react";
import { X } from "lucide-react";

export function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-xl" }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal dialog box */}
      <div 
        className={`relative w-full ${maxWidth} bg-card border border-border rounded-2xl shadow-2xl p-6 z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
      >
        {/* Top glowing accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />

        <div className="flex items-center justify-between pb-4 border-b border-border mb-5">
          <h3 className="text-lg font-bold text-foreground tracking-wide flex items-center gap-2">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto pr-1">
          {children}
        </div>
      </div>
    </div>
  );
}
