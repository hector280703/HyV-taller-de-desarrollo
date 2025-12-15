import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from '@pages/Login';
import Home from '@pages/Home';
import Users from '@pages/Users';
import Register from '@pages/Register';
import Error404 from '@pages/Error404';
import Root from '@pages/Root';
import ProtectedRoute from '@components/ProtectedRoute';
import '@styles/styles.css';

import Products from '@pages/Products';
import ProductDetail from '@pages/ProductDetail';
import CarroCompras from '@pages/CarroCompras';
import Profile from '@pages/Profile';
import Checkout from '@pages/Checkout';
import Orders from '@pages/Orders';
import OrderDetail from '@pages/OrderDetail';
import AdminOrders from '@pages/AdminOrders';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root/>,
    errorElement: <Error404/>,
    children: [
      {
        path: '/',
        element: <Home/>
      },
      {
        path: '/home',
        element: <Home/>
      },
      {
        path: '/users',
        element: (
        <ProtectedRoute allowedRoles={['administrador']}>
          <Users />
        </ProtectedRoute>
        ),
      },
      {
        path: '/admin/orders',
        element: (
        <ProtectedRoute allowedRoles={['administrador']}>
          <AdminOrders />
        </ProtectedRoute>
        ),
      },
      {
        path: '/products',
        element: <Products />,
      },
      {
        path: '/products/:id',
        element: <ProductDetail />,
      },
      {
        path: '/carroCompras',
        element: <CarroCompras />,
      },
      {
        path: '/profile',
        element: (
          <ProtectedRoute allowedRoles={['administrador', 'usuario']}>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: '/checkout',
        element: (
          <ProtectedRoute allowedRoles={['administrador', 'usuario']}>
            <Checkout />
          </ProtectedRoute>
        ),
      },
      {
        path: '/orders',
        element: (
          <ProtectedRoute allowedRoles={['administrador', 'usuario']}>
            <Orders />
          </ProtectedRoute>
        ),
      },
      {
        path: '/orders/:id',
        element: (
          <ProtectedRoute allowedRoles={['administrador', 'usuario']}>
            <OrderDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: '/register',
        element: <Register/>
      }
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider router={router}/>
)