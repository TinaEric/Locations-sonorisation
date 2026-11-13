import { useState } from "react";
import { Eye, EyeOff, Lock, Phone } from 'lucide-react';

export function ChampText ({ label, icon: Icon, action, id, ...props }) {
    return (
      <div>
        <label htmlFor={id} className="mb-1 block text-sm font-medium">
          {label}
        </label>
        <label className="input w-full">
          <Icon className="size-4 opacity-60" aria-hidden="true" />
          <input id={id} className="grow" {...props} />
          {action}
        </label>
      </div>
    );
  }
  
export function ChampPassWord({ label = 'Mot de passe', id = 'motDePasse', name = 'motDePasse', ...props }) {
    const [visible, setVisible] = useState(false);
    return (
      <ChampText
        id={id}
        name={name}
        label={label}
        icon={Lock}
        type={visible ? 'text' : 'password'}
        minLength={4}
        required
        {...props}
        action={
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-square"
            aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        }
      />
    );
  }