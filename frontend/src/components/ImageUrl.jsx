import { ImageOff } from "lucide-react";
import { useState } from "react";

export function ImageUrl({ src, alt, className = "h-12 w-12" }) {
    const [failed, setFailed] = useState(false);
    if (!src || failed || src=== null)
      return (
        <div className={`${className} flex items-center justify-center rounded-lg bg-base-200 text-base-content/40`}>
          <ImageOff size={18} />
        </div>
      );
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`${className} rounded-lg object-cover`}
      />
    );
  }
  