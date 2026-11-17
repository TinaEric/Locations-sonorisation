import { ImageOff } from "lucide-react";
import { useState } from "react";
import { IMAGES_URL } from "../data/Api";

export function ImageUrl({ src, alt, tailleIcone = 18, className = "h-12 w-12 rounded-lg" }) {
    if (src=== null  || src === "")
      return (
        <div className={`${className} flex items-center justify-center bg-base-200 text-base-content/40`}>
          <ImageOff size={tailleIcone} />
        </div>
      );
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={`${className}  object-cover`}
      />
    );
  }
  