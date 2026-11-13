import { Banknote, Image as ImageIcon, ShieldCheck, Tag } from "lucide-react";
import { ChampText } from "../../../components/ChampInput";

export const STATUT_PACK = {
  actif: { label: "Actif", cls: "badge-success" },
  inactif: { label: "Inactif", cls: "badge-ghost" },
};

export const EMPTY_PACK = {
  libelle: "",
  description: "",
  tarifJournalier: "",
  prixCaution: "",
  typesEvenement: "",
  imageUrl: "",
  statutPack: "actif",
};

// pack (format API) -> valeurs du formulaire
export const fromPack = (p) => ({
  libelle: p.libelle ?? "",
  description: p.description ?? "",
  tarifJournalier: p.tarifJournalier ?? "",
  prixCaution: p.prixCaution ?? "",
  typesEvenement: p.typesEvenement ?? "",
  imageUrl: p.imageUrl ?? "",
  statutPack: p.statutPack ?? "actif",
});

// valeurs du formulaire -> corps de la requête create / update
export const toPayload = (f) => ({
  libelle: f.libelle.trim(),
  description: f.description.trim(),
  tarifJournalier: Number(f.tarifJournalier || 0),
  prixCaution: Number(f.prixCaution || 0),
  typesEvenement: f.typesEvenement,
  imageUrl: f.imageUrl.trim() || null,
  statutPack: f.statutPack,
});

// PackService.getTypeEvenement() : tableau de chaînes ou d'objets -> tableau de chaînes
export const typesFromApi = (resp) => {
  const list = Array.isArray(resp) ? resp : resp?.data ?? resp?.items ?? [];
  return list
    .map((t) => (typeof t === "string" ? t : t?.typeEvenement ?? t?.value ?? t?.libelle ?? t?.code))
    .filter(Boolean);
};

/**
 * Formulaire d'un pack (création, modification en modal, modification dans le détail).
 * `value` : valeurs du formulaire — `onChange(nouvellesValeurs)` à chaque saisie.
 */
export default function PackForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  cancelLabel = "Annuler",
  submitLabel = "Enregistrer",
  busy = false,
  typesOptions = [],
  idPrefix = "pack",
  typeForm = "modifie"
}) {
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value });

  // Types proposés par l'API + ceux déjà cochés (au cas où l'API ne les renvoie plus)
  const options = [...new Set([...typesOptions, ...value.typesEvenement])];

  const toggleType = (t) =>
    onChange({
      ...value,
      typesEvenement: value.typesEvenement.includes(t)
        ? value.typesEvenement.filter((x) => x !== t)
        : [...value.typesEvenement, t],
    });

  return (
    <form onSubmit={onSubmit} className="grid gap-3 px-2 sm:grid-cols-2">
      <div className="sm:col-span-2 space-y-4">
        <ChampText
          id={`${idPrefix}-libelle`}
          name="libelle"
          label="Libellé *"
          icon={Tag}
          required

          value={value.libelle}
          onChange={set("libelle")}
          placeholder="Ex: PACK Mariage VIP..."
        />
         <ChampText
        id={`${idPrefix}-typesEvenement`}
        name="typesEvenement"
        label="Type de l'évènement *"
        icon={Banknote}
        type="text"
        required
        value={value.typesEvenement}
        onChange={set("typesEvenement")}
          placeholder="Ex: mariage, anniversaire..."
      />
      </div>
    {typeForm === "modifie" && (  
      <>
      <ChampText
        id={`${idPrefix}-tarifJournalier`}
        name="tarifJournalier"
        label="Tarif journalier (Ar) *"
        icon={Banknote}
        type="number"
        min="0"
        step="any"
        required
        value={value.tarifJournalier}
        onChange={set("tarifJournalier")}
        placeholder="Ex: 9999 Ar..."
      />
      <ChampText
        id={`${idPrefix}-prixCaution`}
        name="prixCaution"
        label="Prix de la caution (Ar)"
        icon={ShieldCheck}
        type="number"
        min="0"
        step="any"
        value={value.prixCaution}
        onChange={set("prixCaution")}
          placeholder="Ex: 1000 Ar..."
      />
      <div>
        <label htmlFor={`${idPrefix}-statutPack`} className="mb-1 block text-sm font-medium">
          Statut
        </label>
        <select
          id={`${idPrefix}-statutPack`}
          className="select w-full"
          value={value.statutPack}
          onChange={set("statutPack")}
        >
          {Object.entries(STATUT_PACK).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </div>
    </>)}
    <div className="sm:col-span-2">
        <label htmlFor={`${idPrefix}-description`} className="mb-1 block text-sm font-medium">
          Description
        </label>
        <textarea
          id={`${idPrefix}-description`}
          rows={3}
          className="textarea textarea-bordered w-full"
          value={value.description}
          placeholder="Décrire en detail ce pack..."
          onChange={set("description")}
        />
      </div>
      
      <ChampText
        id={`${idPrefix}-imageUrl`}
        name="imageUrl"
        label="Photo de couverture"
        icon={ImageIcon}
        type="file"
        placeholder="choisi un image"
        value={value.imageUrl}
        onChange={set("imageUrl")}
      />
      

      {/* <fieldset className="sm:col-span-2">
        <legend className="mb-1 block text-sm font-medium">Types d'événement</legend>
        {options.length ? (
          <div className="flex flex-wrap gap-2">
            {options.map((t) => {
              const on = value.typesEvenement.includes(t);
              return (
                <label
                  key={t}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-sm capitalize transition ${
                    on ? "border-primary bg-primary/10 text-primary" : "border-base-300 hover:bg-base-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary checkbox-xs"
                    checked={on}
                    onChange={() => toggleType(t)}
                  />
                  {t}
                </label>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-base-content/50">Aucun type d'événement disponible.</p>
        )}
      </fieldset> */}

    

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
