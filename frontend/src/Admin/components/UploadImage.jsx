import { useRef, useState } from "react";
import { useToast } from "../../contexts/ToastContext";
import { Upload, X } from "lucide-react";
import { categorieService } from "../../data/CategorieService";
import { IMAGES_URL } from "../../data/Api";

const UploadImage = ({ imageFile,label = "Image", setImageFile}) => {
  const [messageError, setMessageError] = useState(null);
  const [chargement, setChargement] = useState(false);
  const fileInputRef = useRef(null);
  const toast = useToast();

  const telecharge = async (file) => {
    setMessageError(null);
    setChargement(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await categorieService.copierImage(formData);
      if (response) {
        setChargement(false);
        return response;
      }
      toast.error(
        "Echec de la téléchargement de l'Image, Veuillez réssayer plutard!"
      );
      setMessageError(response.error);
      setChargement(false);
      return null;
    } catch (error) {
      console.log("Erreur de connexion:", error);
      toast.error("Probleme de connexion, Verifier la connexion au Server!");
      setMessageError(
        "Probleme de connexion, Verifier la connexion au Server!"
      );
      setChargement(false);
      return null;
    }
  };
  const changeImage = async (e) => {
    setMessageError(null)
    const file = e.target.files[0];
    if (file) {
      const nomfichier = await telecharge(file);
      if (nomfichier) {
        setImageFile(nomfichier);
      }
    }
  };

  return (
    <div className="sm:col-span-2">
      <label className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={changeImage}
        />
        <button
          type="button"
          className="btn btn-outline gap-2"
          onClick={() => {
            fileInputRef.current?.click()
          }}
        >
            
            {chargement ? (
                <>
                    <span className="loading loading-spinner"></span>
                    Chargement...
                </>
            ) : (
                <>
                    <Upload size={16} />
                    {imageFile ? "Modifier l'image" : "Choisir une image"}
                </>
            )}
          
        </button>
        {imageFile && (
          <button
            type="button"
              className="btn btn-outline gap-2 btn-error"
            onClick={() => setImageFile("")}
            aria-label="Retirer la photo"
          >
            <X size={16} />
            Supprimer l'image
          </button>
        )}
      </div>
      {
        imageFile && (
          <div    
          className=" flex flex-col  mt-2 h-24 w-40 overflow-hidden rounded-lg border border-base-300 bg-base-200">
            <img
              src={`${IMAGES_URL}/${imageFile}`}
              alt="aperçu"
              className="h-full w-full object-cover"
              onError={(e) => (e.currentTarget.style.opacity = 0)}
            />
          </div>
        )
      }
      {messageError && (
        <p className="text-error">
            {messageError}
        </p>
      )}
    </div>
  );
};

export default UploadImage;
