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
import Repartidor from '@pages/Repartidor';
import Bodeguero from '@pages/Bodeguero';
import Inventory from '@pages/Inventory';
import PaymentResult from '@pages/PaymentResult';
import Warehouses from '@pages/Warehouses';
import Invoices from '@pages/Invoices';
import StockMovements from '@pages/StockMovements';

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
        path: '/repartidor',
        element: (
        <ProtectedRoute allowedRoles={['repartidor']}>
          <Repartidor />
        </ProtectedRoute>
        ),
      },
      {
        path: '/bodega',
        element: (
        <ProtectedRoute allowedRoles={['bodeguero']}>
          <Bodeguero />
        </ProtectedRoute>
        ),
      },
      {
        path: '/inventory',
        element: (
        <ProtectedRoute allowedRoles={['administrador', 'bodeguero']}>
          <Inventory />
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
          <ProtectedRoute allowedRoles={['administrador', 'cliente', 'usuario']}>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: '/checkout',
        element: (
          <ProtectedRoute allowedRoles={['administrador', 'cliente', 'usuario']}>
            <Checkout />
          </ProtectedRoute>
        ),
      },
      {
        path: '/orders',
        element: (
          <ProtectedRoute allowedRoles={['administrador', 'cliente', 'usuario']}>
            <Orders />
          </ProtectedRoute>
        ),
      },
      {
        path: '/orders/:id',
        element: (
          <ProtectedRoute allowedRoles={['administrador', 'cliente', 'usuario']}>
            <OrderDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: '/payment/success',
        element: (
          <ProtectedRoute allowedRoles={['administrador', 'cliente', 'usuario']}>
            <PaymentResult />
          </ProtectedRoute>
        ),
      },
      {
        path: '/payment/failure',
        element: (
          <ProtectedRoute allowedRoles={['administrador', 'cliente', 'usuario']}>
            <PaymentResult />
          </ProtectedRoute>
        ),
      },
      {
        path: '/payment/pending',
        element: (
          <ProtectedRoute allowedRoles={['administrador', 'cliente', 'usuario']}>
            <PaymentResult />
          </ProtectedRoute>
        ),
      },
      {
        path: '/register',
        element: <Register/>
      },
      {
        path: '/warehouses',
        element: (
        <ProtectedRoute allowedRoles={['administrador']}>
          <Warehouses />
        </ProtectedRoute>
        ),
      },
      {
        path: '/invoices',
        element: (
        <ProtectedRoute allowedRoles={['administrador']}>
          <Invoices />
        </ProtectedRoute>
        ),
      },
      {
        path: '/stock-movements',
        element: (
        <ProtectedRoute allowedRoles={['administrador', 'bodeguero']}>
          <StockMovements />
        </ProtectedRoute>
        ),
      }
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider router={router}/>
)