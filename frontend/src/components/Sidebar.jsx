import './Sidebar.css';

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">StockSense</div>
      <nav className="sidebar-nav">
        <a href="#" className="nav-item active">Dashboard</a>
        <a href="#" className="nav-item">Products</a>

        <div className="nav-group-label">Operations</div>
        <a href="#" className="nav-item sub-item">Receipts</a>
        <a href="#" className="nav-item sub-item">Delivery Orders</a>
        <a href="#" className="nav-item sub-item">Inventory Adjustment</a>
        <a href="#" className="nav-item sub-item">Move History</a>

        <a href="#" className="nav-item">Settings</a>
      </nav>
      <div className="sidebar-footer">
        <a href="#" className="nav-item">My Profile</a>
        <a href="#" className="nav-item">Logout</a>
      </div>
    </aside>
  );
}

export default Sidebar;