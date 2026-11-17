import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Filter, RotateCcw, Search } from 'lucide-react';

export default function FilterPanel({ initialValues = {}, onFilterChange }) {
  const [form, setForm] = useState({
    dateDebut: initialValues.dateDebut || '',
    dateFin: initialValues.dateFin || '',
    type: initialValues.type || '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilterChange(form);
  };

  const handleReset = () => {
    const empty = { dateDebut: '', dateFin: '', type: '' };
    setForm(empty);
    onFilterChange(empty);
  };

  return (
    <div className="card bg-base-100 shadow-md border border-base-200 p-5 sticky top-24">
      <div className="flex items-center gap-2 mb-4 border-b border-base-200 pb-3">
        <Filter size={18} className="text-primary" />
        <h2 className="font-bold text-lg">Filtres</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-control">
          <label className="label"><span className="label-text font-medium">Date de début</span></label>
          <input 
            type="date" 
            name="dateDebut" 
            className="input input-bordered w-full" 
            value={form.dateDebut} 
            onChange={handleChange} 
            required 
          />
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text font-medium">Date de fin</span></label>
          <input 
            type="date" 
            name="dateFin" 
            className="input input-bordered w-full" 
            value={form.dateFin} 
            min={form.dateDebut}
            onChange={handleChange} 
            required 
          />
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text font-medium">Type d'événement</span></label>
          <select name="type" className="select select-bordered w-full" value={form.type} onChange={handleChange}>
            <option value="">Tous les types</option>
            <option value="Mariage">Mariage</option>
            <option value="Séminaire">Séminaire</option>
            <option value="Concert">Concert</option>
          </select>
        </div>

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={handleReset} className="btn btn-ghost flex-1">
            <RotateCcw size={16} /> Réinitialiser
          </button>
          <button type="submit" className="btn btn-primary flex-1">
            <Search size={16} /> Filtrer
          </button>
        </div>
      </form>
    </div>
  );
}