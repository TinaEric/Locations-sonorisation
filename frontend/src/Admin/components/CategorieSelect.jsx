import { useEffect, useState } from "react";
import { categorieService } from "../../data/CategorieService";

export default function CategorieSelect({ value, onChange, required = false, disabled = false }) {
  const [parents, setParents] = useState([]);
  const [enfants, setEnfants] = useState([]);
  const [idParent, setIdParent] = useState("");
  const [idCategorie, setIdCategorie] = useState(value || "");

  useEffect(() => {
    categorieService.parents().then(setParents).catch(() => setParents([]));
  }, []);

  useEffect(() => {
    if (!idParent) {
      setEnfants([]);
      return;
    }
    categorieService.enfants(idParent).then(setEnfants).catch(() => setEnfants([]));
  }, [idParent]);

  // Pré-remplir si la valeur correspond à une catégorie connue
  useEffect(() => {
    setIdCategorie(value || "");
    if (value && !idParent) {
      // Retrouver le parent à partir de la valeur
      categorieService.detail(value).then((cat) => {
        if (cat?.idParent) setIdParent(cat.idParent);
      }).catch(() => {});
    }
  }, [value]);

  const handleParentChange = (e) => {
    setIdParent(e.target.value);
    setIdCategorie("");
    onChange?.("");
  };

  const handleCategorieChange = (e) => {
    setIdCategorie(e.target.value);
    onChange?.(e.target.value);
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="form-control">
        <span className="label-text mb-1">Catégorie parente (niveau 1)</span>
        <select
          className="select select-bordered w-full"
          value={idParent}
          onChange={handleParentChange}
          disabled={disabled}
        >
          <option value="">— Choisir —</option>
          {parents.map((p) => (
            <option key={p.idCategorie} value={p.idCategorie}>
              {p.libelle} ({p.idCategorie})
            </option>
          ))}
        </select>
      </label>

      <label className="form-control">
        <span className="label-text mb-1">Sous-catégorie (niveau 2) {required && "*"}</span>
        <select
          className="select select-bordered w-full"
          value={idCategorie}
          onChange={handleCategorieChange}
          disabled={disabled || !idParent}
          required={required}
        >
          <option value="">— Choisir —</option>
          {enfants.map((c) => (
            <option key={c.idCategorie} value={c.idCategorie}>
              {c.libelle} ({c.idCategorie})
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}