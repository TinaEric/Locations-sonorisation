import { BrowserRouter, Route, Routes, Outlet } from "react-router-dom";
import { SearchProvider } from "./context/SearchContext";
import { CartProvider } from "./context/CartContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HelpButton from "./components/HelpButton";
import CartBar from "./components/CartBar";
import HomePage from "./pages/HomePage";
import CatalogLayout from "./pages/CatalogLayout";
import PacksPage from "./pages/PacksPage";
import MaterielPage from "./pages/MaterielPage";
import PackDetailPage from "./pages/PackDetailPage";

function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartBar />
      <HelpButton />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SearchProvider>
        <CartProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route element={<CatalogLayout />}>
                <Route path="packs" element={<PacksPage />} />
                <Route path="materiel" element={<MaterielPage />} />
              </Route>
              <Route path="packs/:id" element={<PackDetailPage />} />
            </Route>
          </Routes>
        </CartProvider>
      </SearchProvider>
    </BrowserRouter>
  );
}
