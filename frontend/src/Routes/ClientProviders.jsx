import { FilterProvider } from "../Client/contexts/FilterContext";
import { PanierProvider } from "../Client/contexts/PanierContext";

export default function ClientProviders({ children }) {
  return (
    <FilterProvider>
      <PanierProvider>
        {children}
      </PanierProvider>
    </FilterProvider>
  );
}