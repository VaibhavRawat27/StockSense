import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import WarehouseSwitcher from './components/WarehouseSwitcher';
import Dashboard from './pages/Dashboard';
import Receipts from './pages/Receipts';
import MoveHistory from './pages/MoveHistory';
import DeliveryOrders from './pages/DeliveryOrders';
import InventoryAdjustment from './pages/InventoryAdjustment';
import ProductsPage from './pages/ProductsPage';
import SettingsPage from './pages/SettingsPage';
import AuthPage from './components/AuthPage';
import WarehouseSettings from './components/master-data/WarehouseSettings';
import { getStoredUser, clearAuthSession } from './services/api';
import './App.css';

function ProtectedLayout({ user, onLogout }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return (
    <div className="app-layout">
      <Sidebar user={user} onLogout={onLogout} />
      <main className="main-content">
        <div className="top-bar">
          <WarehouseSwitcher />
        </div>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/operations/receipts" element={<Receipts />} />
          <Route path="/operations/move-history" element={<MoveHistory />} />
          <Route path="/operations/delivery" element={<DeliveryOrders />} />
          <Route path="/operations/adjustments" element={<InventoryAdjustment />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/warehouse" element={<WarehouseSettings />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const [authUser, setAuthUser] = useState(getStoredUser());

  const handleLogout = () => {
    clearAuthSession();
    setAuthUser(null);
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          authUser
            ? <Navigate to="/" replace />
            : <AuthPage onAuthChange={setAuthUser} />
        }
      />
      <Route path="/*" element={<ProtectedLayout user={authUser} onLogout={handleLogout} />} />
    </Routes>
  );
}

export default App;