// Routes/ClientProviders.jsx
// Fournisseurs de contexte propres à l'espace client (AuthProvider et le provider de toast
// sont supposés déjà montés plus haut, comme pour l'admin).
import { PanierProvider } from "../Client/contexts/PanierContext";

export default function ClientProviders({ children }) {
  return <PanierProvider>{children}</PanierProvider>;
}
