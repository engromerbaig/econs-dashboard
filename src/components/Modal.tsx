'use client';

import { ReactNode, useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    // Store the original overflow style
    const originalOverflow = document.body.style.overflow;

    if (isOpen) {
      // Disable scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }

    // Restore original overflow style when modal closes or component unmounts
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-lg shadow-lg p-6 w-full  max-w-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-black hover:text-black text-2xl cursor-pointer"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}