import { useState, useEffect } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { asList, useFetch } from "../hooks/useFetch";
import { useToast } from "../../contexts/ToastContext";
import Modal from "./Modal";
import DataState from "./DataState";
import StatusBadge from "./StatusBadge";
import { ETAT_ITEM, STATUT_ITEM } from "../../utils/statutValue";
import { materielService } from "../../data/materielService";
import { ItemService } from "../../data/ItemService";

const EMPTY = {  etatItem: "bon", statutItem: "disponible", emplacementItem: "" };

export default function CreateItem({ materiel, onClose, onChanged , item = null}) {
  const toast = useToast();
  const [form, setForm] = useState({  etatItem: "bon", statutItem: "disponible", emplacementItem: "" });
  const [busy, setBusy] = useState(false);
  
  const { data, loading, error, reload } = useFetch(
    () => (materiel ? materielService.detail(materiel.CodeMateriel) : Promise.resolve([])),
    [materiel?.CodeMateriel]
  );

  useEffect(() => {
    if (item){
      setForm(item)
    }else{
      setForm({  etatItem: "bon", statutItem: "disponible", emplacementItem: "" })
    }
  },[])
  const items = asList(data?.items || []);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const run = async (fn, okMsg, after) => {
    setBusy(true);
    try {
      await fn();
      toast.success(okMsg);
      after?.();
      reload();
      onChanged?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = { 
      emplacementItem: form.emplacementItem,
      etatItem: form.etatItem,
      statutItem: form.statutItem,
      codeMateriel: materiel.CodeMateriel
     };
    console.log("New item: ", payload)
     
    try {
      if (form.numeroSerie) await ItemService.update(form.numeroSerie, payload);
      else await ItemService.create(payload);
      const message = form.numeroSerie ? `Item '${form.numeroSerie}' modifié avec succès ` : "Un Item créé avec succès";
      toast.success(message);
      setForm(null);
      onClose()
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
      onClose()
    }
  };

  return (
    <Modal open={!!materiel} wide title={`Exemplaires — ${materiel?.designation ?? ""}`} onClose={onClose}>
        <form onSubmit={save} className="mb-4 grid gap-3 rounded-box border border-base-300 p-4 sm:grid-cols-4">
          <label className="form-control">
            <span className="label-text mb-1">N° de série</span>
            <input disabled className="input input-bordered font-bold input-sm w-full" value={form.numeroSerie ?? "Générer par le système"} onChange={set("numeroSerie")} />
          </label>
          <label className="form-control">
            <span className="label-text mb-1">État</span>
            <select className="select select-bordered select-sm w-full" value={form.etatItem} onChange={set("etatItem")}>
              {Object.entries(ETAT_ITEM).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </label>
          <label className="form-control">
            <span className="label-text mb-1">Statut</span>
            <select className="select select-bordered select-sm w-full" value={form.statutItem} onChange={set("statutItem")}>
              {Object.entries(STATUT_ITEM).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </label>
          <label className="form-control">
            <span className="label-text mb-1">Emplacement</span>
            <input className="input input-bordered input-sm w-full" value={form.emplacementItem || ""} onChange={set("emplacementItem")} placeholder="Étagère A2…" />
          </label>
          <div className="flex justify-end gap-2 sm:col-span-4">
            <button type="button" className="btn btn-sm" onClick={() => onClose()}>
              <X size={14} /> Annuler
            </button>
            <button className="btn btn-primary btn-sm" disabled={busy}>
              {busy ? <span className="loading loading-spinner loading-xs" /> : <Check size={14} />}
              Enregistrer
            </button>
          </div>
        </form>
    </Modal>
  );
}
