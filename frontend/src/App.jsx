import { Routes, Route } from 'react-router-dom';
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
import './App.css';

function App() {
  return (
    <div className="app-layout">
      <Sidebar />
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
          <Route path="/login" element={<AuthPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;