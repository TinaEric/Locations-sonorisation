import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <p className="text-lg font-bold text-white">SonoLoc</p>
          <p className="mt-2 text-sm">Location de sonorisation pour tous vos événements.</p>
        </div>
        <div>
          <p className="font-semibold text-white">Informations</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
            <li><Link to="/contact#zone" className="hover:text-white">Zone de livraison</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white">Aide</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a href="/#faq" className="hover:text-white">FAQ</a></li>
            <li><a href="/#comment-ca-marche" className="hover:text-white">Comment ça marche</a></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white">Légal</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/cgl" className="hover:text-white">Conditions de location</Link></li>
            <li><Link to="/annulation" className="hover:text-white">Politique d'annulation</Link></li>
            <li><Link to="/caution" className="hover:text-white">Règles de caution</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800 px-4 py-4 text-center text-xs text-slate-400">
        Paiement : MVola · Orange Money · Airtel Money · Carte · Virement
      </div>
    </footer>
  );
}
