import type { FC, ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClass = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export const Modal: FC<ModalProps> = ({ open, title, onClose, children, size = 'md' }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`w-full ${sizeClass[size]} rounded-xl bg-slate-800 border border-slate-700 shadow-2xl max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4 shrink-0">
          {title && <h2 className="text-sm font-medium text-white">{title}</h2>}
          <button
            onClick={onClose}
            className="ml-auto p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
