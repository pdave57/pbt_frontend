import { useEffect, useId } from 'react';

export default function ModalShell({ isOpen, title, description, onClose, children }) {
  const modalId = useId();

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${modalId}-title`}
        aria-describedby={description ? `${modalId}-description` : undefined}
      >
        <header className="modal-header">
          <div>
            <h3 id={`${modalId}-title`}>{title}</h3>
            {description && <p id={`${modalId}-description`} className="modal-description">{description}</p>}
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            ×
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
