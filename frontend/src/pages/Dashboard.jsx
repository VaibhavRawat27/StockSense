import KpiCard from '../components/KpiCard';

function Dashboard() {
  return (
    <>
      <h1>Dashboard</h1>
      <p>Welcome to StockSense.</p>

      <div className="kpi-row">
        <KpiCard label="Total Products in Stock" value="248" />
        <KpiCard label="Low / Out of Stock" value="12" />
        <KpiCard label="Pending Receipts" value="5" />
        <KpiCard label="Pending Deliveries" value="8" />
        <KpiCard label="Internal Transfers Scheduled" value="3" />
      </div>
    </>
  );
}

export default Dashboard;