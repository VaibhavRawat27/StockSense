import './Sidebar.css';

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">StockSense</div>
      <nav className="sidebar-nav">
        <a href="#" className="nav-item active">Dashboard</a>
        <a href="#" className="nav-item">Products</a>
        <a href="#" className="nav-item">Operations</a>
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