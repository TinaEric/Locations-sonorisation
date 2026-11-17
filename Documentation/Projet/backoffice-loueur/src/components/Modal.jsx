import { X } from "lucide-react";

export default function Modal({ open, title, onClose, children, actions, wide = false }) {
  return (
    <dialog className={`modal ${open ? "modal-open" : ""}`}>
      <div className={`modal-box ${wide ? "max-w-4xl" : "max-w-xl"}`}>
        <button
          type="button"
          className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
          onClick={onClose}
          aria-label="Fermer"
        >
          <X size={16} />
        </button>
        <h3 className="text-lg font-bold mb-4 pr-8">{title}</h3>
        {children}
        {actions && <div className="modal-action">{actions}</div>}
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}
