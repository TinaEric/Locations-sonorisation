import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../Client/components/navigation/Navbar.jsx';
import Footer from '../Client/components/navigation/Footer.jsx';
import { NavBarProvider } from '../Client/contexts/NavbarContext.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function Layout() {
  return (
  <NavBarProvider>
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  </NavBarProvider>
  );
}
