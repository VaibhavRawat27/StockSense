import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <h1>Dashboard</h1>
        <p>Welcome to StockSense.</p>
      </main>
    </div>
  );
}

export default App;