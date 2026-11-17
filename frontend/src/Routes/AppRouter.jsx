import { createBrowserRouter } from 'react-router-dom';
import AdminRoute from './AdminRoute';
import ProtectedRoute from './ProtectedRoute';
import ClientRoute from './ClientRoute';
import Login from '../layouts/Login';
import ProtectLogin from './ProtectLogin';
import NotFound from '../layouts/NotFound';
import ClientProviders from './ClientProviders';


const AppRoutes = createBrowserRouter([
    { 
        path: '/auth/login', 
        element:(
            <ProtectLogin>
                 <Login /> 
            </ProtectLogin>
        )
    },
    {
        path: '/*',
        element: (
            <ClientProviders>
              <ClientRoute />
            </ClientProviders>
        ),
    },
    { 
        path: '/admin/*', 
        element: (
            <ProtectedRoute allowedRoles={["ADMIN","GESTIONNAIRE"]}>
                <AdminRoute/>
            </ProtectedRoute>
        ) 
    },
    { 
        path: '*', 
        element: <NotFound/> 
    },
]);

export default AppRoutes;