import { RouterProvider } from 'react-router-dom';
import AppRoutes from './Routes/AppRouter.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <RouterProvider router={AppRoutes} />
      </AuthProvider>
    </ToastProvider>
  );
}