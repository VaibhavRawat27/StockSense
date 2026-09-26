import { NavLink } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import './Sidebar.css';

function Sidebar({ user, onLogout }) {
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
        <NavLink to="/settings" end className="nav-item sub-item">System Settings</NavLink>
      </nav>

      <div className="sidebar-footer">
        {user ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
              <User size={16} />
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{user.name}</span>
                <span style={{ fontSize: '0.72rem', opacity: 0.7 }}>
                  {user.role === 'manager' ? 'Inventory Manager' : 'Warehouse Staff'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff',
                padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem',
              }}
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        ) : (
          <NavLink to="/login" className="nav-item">Auth Portal / Login</NavLink>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;