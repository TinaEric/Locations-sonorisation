import { useRef, useState } from "react";
import {
  Banknote,
  Image as ImageIcon,
  ShieldCheck,
  Tag,
  Users,
  MapPin,
  Zap,
  Music,
  X,
  Upload,
} from "lucide-react";
import { ChampText } from "../../../components/ChampInput";
import UploadImage from "../../components/UploadImage";

/* ============ Enums alignées sur le backend ============ */
export const STATUT_PACK = {
  actif: { label: "Actif", cls: "badge-success" },
  inactif: { label: "Inactif", cls: "badge-ghost" },
  archive: { label: "Archivé", cls: "badge-neutral" },
};

export const CATEGORIES_PACK = [
  { value: "conference", label: "Conférence" },
  { value: "soiree", label: "Soirée" },
  { value: "mariage", label: "Mariage" },
  { value: "concert", label: "Concert" },
];

export const TYPES_LIEU = [
  { value: "interieur", label: "Intérieur" },
  { value: "exterieur", label: "Extérieur" },
  { value: "mixte", label: "Mixte" },
];

export const USAGES_SUGGERES = ["Discours", "DJ", "Musique de fond", "Live"];

/* ============ Valeurs vides ============ */
export const EMPTY_PACK = {
  libelle: "",
  description: "",
  tarifJournalier: "",
  prixCaution: "",
  categoriePack: "",
  capaciteMin: "",
  capaciteMax: "",
  typeLieu: "",
  usages: [],
  puissanceTotal: "",
  photos: "",
  statutPack: "inactif",
};

/* ============ Pack API -> Formulaire ============ */
export const fromPack = (p) => ({
  libelle: p.libelle ?? "",
  description: p.description ?? "",
  tarifJournalier: p.tarifJournalier ?? "",
  prixCaution: p.prixCaution ?? "",
  categoriePack: p.categoriePack ?? "",
  capaciteMin: p.capaciteMin ?? "",
  capaciteMax: p.capaciteMax ?? "",
  typeLieu: p.typeLieu ?? "",
  usages: Array.isArray(p.usages) ? p.usages : [],
  puissanceTotal: p.puissanceTotal ?? "",
  photos: p.photos ?? "",
  statutPack: p.statutPack ?? "inactif",
});

export const toPayload = (f) => ({
  libelle: f.libelle.trim(),
  description: f.description?.trim() || null,
  tarifJournalier: Number(f.tarifJournalier || 0),
  prixCaution: Number(f.prixCaution || 0),
  categoriePack: f.categoriePack || null,
  capaciteMin:
    f.capaciteMin === "" || f.capaciteMin == null
      ? null
      : Number(f.capaciteMin),
  capaciteMax:
    f.capaciteMax === "" || f.capaciteMax == null
      ? null
      : Number(f.capaciteMax),
  typeLieu: f.typeLieu || null,
  usages: Array.isArray(f.usages) ? f.usages : [],
  puissanceTotal:
    f.puissanceTotal === "" || f.puissanceTotal == null
      ? null
      : Number(f.puissanceTotal),
  photos: f.photos?.trim() || null,
  statutPack: f.statutPack,
});

export const typesFromApi = () => CATEGORIES_PACK.map((c) => c.value);

export default function PackForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  cancelLabel = "Annuler",
  submitLabel = "Enregistrer",
  busy = false,
  idPrefix = "pack",
}) {
  const fileRef = useRef(null);
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value });
  const [imageFile, setImageFile] = useState(null);

  const setNum = (k) => (e) => {
    const v = e.target.value;
    onChange({ ...value, [k]: v === "" ? "" : Number(v) });
  };

  const toggleUsage = (u) =>
    onChange({
      ...value,
      usages: value.usages.includes(u)
        ? value.usages.filter((x) => x !== u)
        : [...value.usages, u],
    });

  const addUsageCustom = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const v = e.target.value.trim();
    if (!v || value.usages.includes(v)) return;
    onChange({ ...value, usages: [...value.usages, v] });
    e.target.value = "";
  };

  const onPickFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // ⚠️ Ici on stocke uniquement le nom. Pour un vrai upload, utilisez un endpoint
    // dédié qui renvoie l'URL finale (S3, Cloudinary, stockage local…).
    onChange({ ...value, photos: file.name });
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4 px-2 sm:grid-cols-2">
      {/* -------- Libellé + Catégorie -------- */}
      <div className="sm:col-span-2 grid gap-3 sm:grid-cols-[2fr_1fr]">
        <ChampText
          id={`${idPrefix}-libelle`}
          name="libelle"
          label="Libellé *"
          icon={Tag}
          required
          value={value.libelle}
          onChange={set("libelle")}
          placeholder="Ex: Pack Mariage VIP…"
        />

        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            Catégorie de pack *
          </span>
          <select
            id={`${idPrefix}-categoriePack`}
            className="select select-bordered w-full"
            value={value.categoriePack || ""}
            onChange={set("categoriePack")}
            required
          >
            <option value="">— Choisir —</option>
            {CATEGORIES_PACK.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* -------- Description -------- */}
      <div className="sm:col-span-2">
        <label
          htmlFor={`${idPrefix}-description`}
          className="mb-1 block text-sm font-medium"
        >
          Description
        </label>
        <textarea
          id={`${idPrefix}-description`}
          rows={3}
          className="textarea textarea-bordered w-full"
          value={value.description}
          placeholder="Décrire en détail ce pack…"
          onChange={set("description")}
        />
      </div>

      {/* -------- Capacités -------- */}
      <label className="block">
        <span className="mb-1 inline-flex items-center gap-1 text-sm font-medium">
          <Users size={14} /> Capacité minimale
        </span>
        <input
          type="number"
          min="0"
          className="input input-bordered w-full"
          value={value.capaciteMin}
          onChange={setNum("capaciteMin")}
          placeholder="Ex: 20 personnes"
        />
      </label>
      <label className="block">
        <span className="mb-1 inline-flex items-center gap-1 text-sm font-medium">
          <Users size={14} /> Capacité maximale
        </span>
        <input
          type="number"
          min="0"
          className="input input-bordered w-full"
          value={value.capaciteMax}
          onChange={setNum("capaciteMax")}
          placeholder="Ex: 300 personnes"
        />
      </label>

      {/* -------- Type de lieu -------- */}
      <label className="block">
        <span className="mb-1 inline-flex items-center gap-1 text-sm font-medium">
          <MapPin size={14} /> Type de lieu
        </span>
        <select
          className="select select-bordered w-full"
          value={value.typeLieu || ""}
          onChange={set("typeLieu")}
        >
          <option value="">— Indifférent —</option>
          {TYPES_LIEU.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      {/* -------- Puissance totale -------- */}
      <label className="block">
        <span className="mb-1 inline-flex items-center gap-1 text-sm font-medium">
          <Zap size={14} /> Puissance totale (W)
        </span>
        <input
          type="number"
          min="0"
          step="any"
          className="input input-bordered w-full"
          value={value.puissanceTotal}
          onChange={setNum("puissanceTotal")}
          placeholder="Ex: 2000"
        />
      </label>

      {/* -------- Usages -------- */}
      <fieldset className="sm:col-span-2">
        <legend className="mb-2 inline-flex items-center gap-1 text-sm font-medium">
          <Music size={14} /> Usages typiques
        </legend>
        <div className="flex flex-wrap gap-2">
          {[...new Set([...USAGES_SUGGERES, ...value.usages])].map((u) => {
            const on = value.usages.includes(u);
            return (
              <label
                key={u}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-sm transition ${
                  on
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-base-300 hover:bg-base-200"
                }`}
              >
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary checkbox-xs"
                  checked={on}
                  onChange={() => toggleUsage(u)}
                />
                {u}
              </label>
            );
          })}
        </div>
        <input
          type="text"
          className="input input-bordered mt-2 w-full"
          placeholder="Ajouter un usage personnalisé puis Entrée…"
          onKeyDown={addUsageCustom}
        />
        {value.usages.length > 0 && (
          <p className="mt-1 text-xs text-base-content/60">
            {value.usages.length} usage{value.usages.length > 1 ? "s" : ""}{" "}
            sélectionné{value.usages.length > 1 ? "s" : ""}
          </p>
        )}
      </fieldset>
      <UploadImage 
          imageFile={value.photos} 
          label={"Photo de couverture"}
          setImageFile={(val) => onChange({ ...value, photos: val })}
        />
      <div className="flex justify-end gap-2 pt-2 sm:col-span-2">
        <button type="button" className="btn" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button className="btn btn-primary" disabled={busy}>
          {busy && <span className="loading loading-spinner loading-sm" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}