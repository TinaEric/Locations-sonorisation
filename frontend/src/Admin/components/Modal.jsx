import { icons, X } from "lucide-react";

export default function Modal({ open, title, cle = null, onClose, pack = false, children, actions, Icone, wide = false , supp = false}) {
  return (
    <dialog className={`modal ${open ? "modal-open" : ""}`}>
      <div className={`modal-box ${wide ? "max-w-6xl" : "max-w-xl"}`}>
        <button
          type="button"
          className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
          onClick={onClose}
          aria-label="Fermer"
        >
          <X size={16} />
        </button>
        <div className="flex items-center  gap-2 mb-4 ">
          <span>{Icone && (<Icone size={20} /> )} </span>
         <h3 className={`text-lg ${supp && "text-error"} font-bold`}>{title}</h3>
         {cle && (
           <span className="badge badge-outline font-mono">
            {cle}
          </span>
         )}
        </div>
        <div className={`overflow-y-auto ${pack ? "h-[530px]" : ""}`}>
          {children}
          {actions && <div className="modal-action">{actions}</div>}
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}
