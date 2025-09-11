import React, { useEffect, useRef } from 'react';

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Save the previously focused element
    previouslyFocusedElement.current = document.activeElement as HTMLElement;
    
    const modalNode = modalRef.current;
    if (!modalNode) return;

    // Find all focusable children
    const focusableElements = modalNode.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus the first focusable element (the close button)
    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Close on Escape
      if (e.key === 'Escape') {
        onClose();
      }
      
      // Trap focus
      if (e.key === 'Tab') {
        if (e.shiftKey) { // Shift+Tab
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else { // Tab
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus to the element that opened the modal
      previouslyFocusedElement.current?.focus();
    };
  }, [onClose]);


  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      ref={modalRef}
    >
      <div 
        className="relative bg-white dark:bg-slate-800 p-2 rounded-lg shadow-2xl max-w-4xl max-h-[90vh]"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image container
      >
        <img src={imageUrl} alt="Enlarged view" className="max-w-full max-h-[85vh] object-contain rounded" />
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 h-10 w-10 bg-white dark:bg-slate-700 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center transition-transform duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          aria-label="Close image view"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ImageModal;