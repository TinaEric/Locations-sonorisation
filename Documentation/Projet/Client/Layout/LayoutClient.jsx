import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../navigation/Navbar.jsx';
import Footer from '../navigation/Footer.jsx';
import { NavBarProvider } from '../../contexts/NavbarContext.jsx';
import { CartProvider } from '../../context/CartContext.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function LayoutClient() {
  return (
    <NavBarProvider>
      <CartProvider>
        <div className="flex min-h-screen flex-col">
          <ScrollToTop />
          <Navbar />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
      </CartProvider>
    </NavBarProvider>
  );
}