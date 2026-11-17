import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { LogIn, Speaker } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.status === 401 ? "Identifiants incorrects" : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200 p-4">
      <form onSubmit={submit} className="card w-full max-w-sm bg-base-100 shadow-xl">
        <div className="card-body gap-4">
          <div className="flex flex-col items-center gap-2 text-primary">
            <Speaker size={40} />
            <h1 className="text-xl font-bold">Back Office Loueur</h1>
            <p className="text-sm text-base-content/60">Connectez-vous pour continuer</p>
          </div>

          {error && (
            <div role="alert" className="alert alert-error alert-soft text-sm">
              {error}
            </div>
          )}

          <label className="form-control">
            <span className="label-text mb-1">Email</span>
            <input
              type="email"
              required
              autoComplete="username"
              className="input input-bordered w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="form-control">
            <span className="label-text mb-1">Mot de passe</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              className="input input-bordered w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <button className="btn btn-primary" disabled={busy}>
            {busy ? <span className="loading loading-spinner loading-sm" /> : <LogIn size={18} />}
            Se connecter
          </button>
        </div>
      </form>
    </div>
  );
}
