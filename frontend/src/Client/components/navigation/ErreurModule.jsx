
import { CircleAlert, RotateCw } from 'lucide-react';

export function ErreurModule({ titre, message, onRetry }) {
    return (
    <div className='flex justify-center w-full items-center p-2 mt-5'>
      <div role="alert" className="alert alert-error alert-soft">
        <CircleAlert className="size-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-semibold">{titre}</p>
          <p className="text-sm">{message}</p>
        </div>
        <button type="button" className="btn btn-sm" onClick={onRetry}>
          <RotateCw className="size-4" aria-hidden="true" />
          Réessayer
        </button>
      </div>
    </div>
    );
  }

export function ChargementModule({  message }) {
    return (
    <div className='flex justify-center w-full gap-2 items-center p-2 mt-5'>
      <span className="loading loading-spinner  loading-lg"></span>
      <span>{message}</span>
    </div>
    );
  }
