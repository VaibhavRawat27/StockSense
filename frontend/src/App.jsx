import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Receipts from './pages/Receipts';
import MoveHistory from './pages/MoveHistory';
import DeliveryOrders from './pages/DeliveryOrders';
import InventoryAdjustment from './pages/InventoryAdjustment';
import './App.css';

function App() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/operations/receipts" element={<Receipts />} />
          <Route path="/operations/move-history" element={<MoveHistory />} />
          <Route path="/operations/delivery" element={<DeliveryOrders />} />
          <Route path="/operations/adjustments" element={<InventoryAdjustment />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;