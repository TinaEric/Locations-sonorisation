import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, CheckCircle2, ChevronDown, ChevronRight,
  Layers, Package, PackageCheck, Search, Wrench,
} from "lucide-react";
import Modal from "./Modal";
import { ImageUrl } from "../../components/ImageURL";
import { formatMoney } from "../../utils/format";
import { materielService } from "../../data/materielService";
import { useToast } from "../../contexts/ToastContext";
import { IMAGES_URL } from "../../data/Api";

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const ETAT_CLS = {
  NEUF: "badge-success",
  BON: "badge-success",
  USE: "badge-warning",
  ENDOMMAGE: "badge-error",
  PERDU: "badge-error",
};

const STATUT_CLS = {
  DISPONIBLE: "badge-success",
  LOUE: "badge-primary",
  EN_MAINTENANCE: "badge-error",
};

const LABEL_STATUT = {
  DISPONIBLE: "Disponible",
  LOUE: "Loué",
  EN_MAINTENANCE: "Maintenance",
};

function ItemRow({ item }) {
  return (
    <div className="flex flex-col gap-2 rounded bg-base-100 p-2 text-xs sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span className="font-mono font-semibold">{item.numeroSerie}</span>
        <span className={`badge badge-sm ${ETAT_CLS[item.etatItem] ?? "badge-ghost"}`}>
          {item.etatItem}
        </span>
        <span className={`badge badge-sm ${STATUT_CLS[item.statutItem] ?? "badge-ghost"}`}>
          {LABEL_STATUT[item.statutItem] ?? item.statutItem}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-base-content/60">
        {item.emplacementItem && (
          <span className="badge badge-ghost badge-sm">📍 {item.emplacementItem}</span>
        )}
        <span>Ajouté : {formatDate(item.dateCreation)}</span>
      </div>
    </div>
  );
}

function MaterielCard({ materiel, besoin, selected, onSelect }) {
  const [openItems, setOpenItems] = useState(false);
  const insuffisant = materiel.stockDisponible < besoin;

  return (
    <div
      className={`rounded-box border p-3 transition ${
        selected
          ? "border-primary bg-primary/5"
          : insuffisant
          ? "border-warning bg-warning/5"
          : "border-base-300 hover:bg-base-200/40"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <ImageUrl
            src={`${IMAGES_URL}/${materiel.imageURL}`}
            alt={materiel.designation}
            className="h-14 w-14 shrink-0"
          />
          <div className="min-w-0">
            <p className="font-semibold">{materiel.designation}</p>
            <p className="text-xs text-base-content/60">
              {materiel.marque} ·{" "}
              <span className="font-mono">{materiel.CodeMateriel}</span>
            </p>
            <p className="mt-0.5 line-clamp-2 text-xs text-base-content/50">
              {materiel.detailTechnique || "—"}
            </p>
            <div className="mt-1 flex flex-wrap gap-1 text-xs">
              <span className="badge badge-outline badge-sm">
                {formatMoney(materiel.prixLocation)} / j
              </span>
              <span className="badge badge-outline badge-sm">
                Caution {formatMoney(materiel.prixCaution)}
              </span>
              <span
                className={`badge badge-sm ${
                  insuffisant ? "badge-warning" : "badge-success"
                } gap-1`}
              >
                <PackageCheck size={12} /> {materiel.stockDisponible} dispo /{" "}
                {materiel.stockTotal}
              </span>
              {materiel.stockLoue > 0 && (
                <span className="badge badge-ghost badge-sm">
                  {materiel.stockLoue} loué(s)
                </span>
              )}
              {materiel.stockMaintenance > 0 && (
                <span className="badge badge-error badge-outline badge-sm gap-1">
                  <Wrench size={10} /> {materiel.stockMaintenance}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            className={`btn btn-xs ${selected ? "btn-success" : "btn-primary"}`}
            onClick={() => onSelect(materiel.CodeMateriel)}
          >
            {selected ? (
              <>
                <CheckCircle2 size={12} /> Sélectionné
              </>
            ) : (
              "Choisir"
            )}
          </button>
          {insuffisant && (
            <span className="flex items-center gap-1 text-[10px] text-warning">
              <AlertTriangle size={10} /> Insuffisant
            </span>
          )}
        </div>
      </div>

      <button
        className="btn btn-ghost btn-xs mt-2"
        onClick={() => setOpenItems(!openItems)}
      >
        {openItems ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {openItems ? "Masquer" : "Voir"} les {materiel.items.length} item(s)
      </button>
      {openItems && (
        <div className="mt-2 space-y-1">
          {materiel.items.length === 0 ? (
            <p className="text-xs italic text-base-content/50">
              Aucun item enregistré.
            </p>
          ) : (
            materiel.items.map((i) => <ItemRow key={i.numeroSerie} item={i} />)
          )}
        </div>
      )}
    </div>
  );
}

export default function RemplacementModal({ open, onClose, sousLigne, onConfirm }) {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState("");
  const [search, setSearch] = useState("");
  const [openCats, setOpenCats] = useState({});

  const besoin = sousLigne?.quantite ?? 0;
  const sourceCode = sousLigne?.materiel?.CodeMateriel;

  useEffect(() => {
    if (!open || !sourceCode) return;
    setLoading(true);
    setSelected("");
    setSearch("");
    materielService
      .arborescenceSimilaires(sourceCode)
      .then((resp) => {
        setData(resp);
        if (resp?.categories?.length) {
          setOpenCats({ [resp.categories[0].idCategorie]: true });
        }
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [open, sourceCode]);

  const filtered = useMemo(() => {
    if (!data?.categories) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.categories;
    return data.categories
      .map((c) => ({
        ...c,
        materiels: c.materiels.filter(
          (m) =>
            (m.designation || "").toLowerCase().includes(q) ||
            (m.marque || "").toLowerCase().includes(q) ||
            (m.CodeMateriel || "").toLowerCase().includes(q)
        ),
      }))
      .filter((c) => c.materiels.length > 0);
  }, [data, search]);

  const toggleCat = (id) =>
    setOpenCats((prev) => ({ ...prev, [id]: !prev[id] }));

  const confirmer = () => {
    if (!selected) {
      toast.warning("Sélectionnez un matériel de remplacement.");
      return;
    }
    onConfirm(selected);
  };

  return (
    <Modal open={open} onClose={onClose} title="Remplacer par un matériel similaire" wide>
      <div className="space-y-4">
        {sousLigne && (
          <div className="rounded-box border border-base-300 bg-base-200/40 p-3 text-sm">
            <p className="font-semibold">Remplacement de :</p>
            <p className="opacity-70">
              <span className="font-mono">{sourceCode}</span> —{" "}
              {sousLigne.materiel?.designation} (besoin : {besoin} unité(s))
            </p>
          </div>
        )}

        <label className="input input-bordered flex items-center gap-2">
          <Search size={16} className="opacity-60" />
          <input
            type="text"
            className="grow"
            placeholder="Rechercher un matériel (désignation, marque, code)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        {loading ? (
          <div className="flex justify-center py-10">
            <span className="loading loading-spinner text-primary" />
          </div>
        ) : !filtered.length ? (
          <p className="py-6 text-center text-base-content/50">
            Aucun matériel similaire disponible.
          </p>
        ) : (
          <div className="max-h-[28rem] space-y-4 overflow-y-auto pr-1">
            {filtered.map((cat) => {
              const open2 = openCats[cat.idCategorie];
              const nbMat = cat.materiels.length;
              return (
                <div key={cat.idCategorie} className="rounded-box border border-base-300">
                  <button
                    className="flex w-full items-center justify-between gap-2 bg-base-200/50 p-3 text-left"
                    onClick={() => toggleCat(cat.idCategorie)}
                  >
                    <div>
                      <div className="flex items-center gap-2 font-semibold">
                        {open2 ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <Layers size={16} className="text-primary" />
                        {cat.libelle}
                        <span className="badge badge-ghost badge-sm">
                          {cat.idCategorie}
                        </span>
                        <span className="badge badge-outline badge-sm">
                          {nbMat} matériel(s)
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-base-content/60">
                        {cat.descriptionCategorie || "—"}
                        {cat.parentLibelle && (
                          <>
                            {" · "}
                            <span className="opacity-70">
                              Parent : {cat.parentLibelle}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </button>

                  {open2 && (
                    <div className="space-y-2 p-3">
                      {cat.materiels.map((m) => (
                        <MaterielCard
                          key={m.CodeMateriel}
                          materiel={m}
                          besoin={besoin}
                          selected={selected === m.CodeMateriel}
                          onSelect={(code) =>
                            setSelected(code === selected ? "" : code)
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            Annuler
          </button>
          <button
            className="btn btn-primary"
            disabled={!selected || loading}
            onClick={confirmer}
          >
            <Package size={16} /> Confirmer le remplacement
          </button>
        </div>
      </div>
    </Modal>
  );
}