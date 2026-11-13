import { useState } from 'react';
import {
  ArrowLeft, AudioLines, CheckCircle2, CircleAlert, Eye, EyeOff, Lock, Mail, Phone, UserRound,
} from 'lucide-react';
import fondLogin from '../images/fondLogin.jpg';
import { BRAND , TITRES} from '../utils/content.js';
import { inscription, motDePasseOublie } from '../data/UserService.js';
import { redirectionRouteParRole, useAuth } from "../contexts/AuthContext";
import { ChampPassWord, ChampText } from '../components/ChampInput.jsx';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Logo } from '../components/Logo.jsx';


const texteErreur = (e) =>
  Array.isArray(e?.message) ? e.message.join(' · ') : (e?.message ?? 'Une erreur est survenue');

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [params] = useSearchParams();
      const [errorMessage, setErrorMessage] = useState("");
    const [vue, setVue] = useState('connexion');
    const [envoi, setEnvoi] = useState(null);
  
    const from = location.state?.from?.pathname;
  
  const changerVue = (nouvelle, info = '') => {
    setVue(nouvelle);
    setEnvoi(info ? { statut: 'ok', message: info } : null);
  };

  const soumettre = async (event) => {
    event.preventDefault();
    const v = Object.fromEntries(new FormData(event.currentTarget));
    setEnvoi({ statut: 'envoi' });

    try {
        if (vue === 'connexion') {
            const result = await login(v.email, v.motDePasse);
            if (!result.success) throw new Error(result.message);   // affiché par le catch ci-dessous
            navigate(params.get('redirect') || from || redirectionRouteParRole(result.role), { replace: true });
        
        } else if (vue === 'inscription') {
        if (v.motDePasse !== v.confirmation) throw new Error('Les deux mots de passe sont différents');

        const data = {
          nomComplet:  v.nom,
          telephone:  v.telephone,
          email:  v.email,
          motDePasse:  v.motDePasse,
          role: "LOCATAIRE",
          statutCompte: "ACTIF"
        }

        await inscription(data);
        changerVue('connexion', 'Compte créé. Vous pouvez maintenant vous connecter.');
      } else {
        await motDePasseOublie({ email: v.email });
        setEnvoi({
          statut: 'ok',
          message: 'Si cette adresse existe, un lien de réinitialisation vient de vous être envoyé.',
        });
      }
    } catch (e) {
      setEnvoi({ statut: 'erreur', message: texteErreur(e) });
    }
  };

  const enCours = envoi?.statut === 'envoi';
  const { titre, sous } = TITRES[vue];

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:py-16">
      <div className="grid overflow-hidden rounded-sm border border-base-300 bg-base-100 shadow-sm lg:grid-cols-2">
        {/* Image et logo */}
        {vue === "inscription" ? (
          <div
            className={`relative hidden max-h-[500px] lg:block`}
            style={{ backgroundImage: `url(${fondLogin})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
        ):(
          <div
            className={`relative hidden min-h-[500px] lg:block`}
            style={{ backgroundImage: `url(${fondLogin})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
        )}
        {/* Formulaire */}
        <div className="flex flex-col justify-center p-6 sm:p-10">
          <div className="mb-8 lg:hidden">
            <Logo name={BRAND.name}/>
          </div>

          {vue === 'oubli' && (
            <button
              type="button"
              className="btn btn-ghost btn-sm -ml-3 mb-4 w-fit"
              onClick={() => changerVue('connexion')}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Retour à la connexion
            </button>
          )}

          <h1 className="display text-3xl">{titre}</h1>
          <p className="mt-2 text-base-content/75">{sous}</p>

          {envoi?.statut === 'ok' && (
            <div role="status" className="alert alert-success alert-soft mt-6">
              <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />
              <span className="text-sm">{envoi.message}</span>
            </div>
          )}
          {envoi?.statut === 'erreur' && (
            <div role="alert" className="alert alert-error alert-soft mt-6">
              <CircleAlert className="size-5 shrink-0" aria-hidden="true" />
              <span className="text-sm">{envoi.message}</span>
            </div>
          )}

          <form key={vue} onSubmit={soumettre} className="mt-6 space-y-4" noValidate={false}>
            {vue === 'inscription' && (
                <ChampText id="nom" name="nom" label="Nom" icon={UserRound} autoComplete="family-name" placeholder="Ex: Koto Kely" required />
            )}

            <ChampText
              id="email"
              name="email"
              type="email"
              label="Adresse e-mail"
              icon={Mail}
              autoComplete="email"
              placeholder="EX: exemple@exemple.com"
              required
            />

            {vue === 'inscription' && (
              <ChampText
                id="telephone"
                name="telephone"
                type="tel"
                label="Téléphone"
                icon={Phone}
                autoComplete="tel"
                placeholder="Ex: 034 00 000 00"
                required
              />
            )}

            {vue !== 'oubli' && (
              <ChampPassWord autoComplete={vue === 'connexion' ? 'current-password' : 'new-password'}   placeholder="Ex: 6f*****RQ" />
            )}

            {vue === 'inscription' && (
              <ChampPassWord
                id="confirmation"
                name="confirmation"
                label="Confirmer le mot de passe"
                autoComplete="new-password"
                placeholder="Ex: 6f*****RQ"
              />
            )}

            {vue === 'connexion' && (
              <div className="flex items-center justify-between gap-4 text-sm">
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" name="rester" className="checkbox checkbox-sm" />
                  Rester connecté
                </label>
                <button type="button" className="link link-accent" onClick={() => changerVue('oubli')}>
                  Mot de passe oublié ?
                </button>
              </div>
            )}

            <button type="submit" className="btn btn-accent w-full" disabled={enCours}>
              {enCours && <span className="loading loading-spinner loading-sm" />}
              {vue === 'connexion' && (enCours ? 'Connexion...' : 'Se connecter')}
              {vue === 'inscription' && (enCours ? 'Creation compte...' : 'Créer mon compte')}
              {vue === 'oubli' && (enCours ? 'Envoi lien...' : 'Envoyer le lien')}
            </button>
            {errorMessage && <div className='text-red-600'>{errorMessage}</div>}
          </form>

          {vue === 'connexion' && (
            <p className="mt-6 text-center text-sm">
              Pas encore de compte ?{' '}
              <button type="button" className="link link-accent font-semibold" onClick={() => changerVue('inscription')}>
                S’inscrire
              </button>
            </p>
          )}
          {vue === 'inscription' && (
            <p className="mt-6 text-center text-sm">
              Déjà inscrit ?{' '}
              <button type="button" className="link link-accent font-semibold" onClick={() => changerVue('connexion')}>
                Se connecter
              </button>
            </p>
          )}

          <p className="mt-8 text-center text-xs text-base-content/60">
            <Link to="/aide" className="link">Besoin d’aide ?</Link>
          </p>
        </div>
      </div>
    </div>
  );
}