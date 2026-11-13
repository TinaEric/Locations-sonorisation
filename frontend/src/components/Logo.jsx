import { AudioLines } from "lucide-react";

export function Logo({ clair = false , name}) {
    return (
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-sm bg-neutral text-accent">
          <AudioLines className="size-6" aria-hidden="true" />
        </span>
        <span className={`display text-xl ${clair ? 'text-white' : ''}`}>{name}</span>
      </div>
    );
  }