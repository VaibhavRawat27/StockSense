import { NavLink } from 'react-router-dom';
import './Sidebar.css';

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">StockSense</div>
      <nav className="sidebar-nav">
        <NavLink to="/" end className="nav-item">Dashboard</NavLink>
        <NavLink to="/products" className="nav-item">Products & Catalog</NavLink>

        <div className="nav-group-label">Operations</div>
        <NavLink to="/operations/receipts" className="nav-item sub-item">Receipts</NavLink>
        <NavLink to="/operations/delivery" className="nav-item sub-item">Delivery Orders</NavLink>
        <NavLink to="/operations/adjustments" className="nav-item sub-item">Inventory Adjustment</NavLink>
        <NavLink to="/operations/move-history" className="nav-item sub-item">Move History</NavLink>

        <div className="nav-group-label">Master Data & Settings</div>
        <NavLink to="/settings/warehouse" className="nav-item sub-item">Warehouse Setup</NavLink>
        <NavLink to="/settings" className="nav-item sub-item">System Settings</NavLink>
      </nav>
      <div className="sidebar-footer">
        <NavLink to="/login" className="nav-item">Auth Portal / Login</NavLink>
      </div>
    </aside>
  );
}

export default Sidebar;