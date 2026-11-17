/** Bouton d'aide flottant : rappel, WhatsApp, téléphone. Adapter les coordonnées du loueur. */
const WHATSAPP = "261340000000";
const TEL = "+261340000000";

export default function HelpButton() {
  return (
    <div className="fixed bottom-4 right-4 z-30 flex flex-col items-end gap-2">
      <a
        href={`https://wa.me/${WHATSAPP}`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-600"
      >
        WhatsApp
      </a>
      <a href={`tel:${TEL}`} className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow ring-1 ring-slate-200 hover:bg-slate-50">
        Être rappelé · {TEL}
      </a>
    </div>
  );
}
