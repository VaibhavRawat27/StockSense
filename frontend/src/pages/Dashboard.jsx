import { useState, useEffect } from 'react';
import KpiCard from '../components/KpiCard';
import { api } from '../services/api';

function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 6,
    lowStock: 3,
    totalWarehouses: 3,
    pendingReceipts: 2,
    pendingDeliveries: 1,
  });

  useEffect(() => {
    const fetchLiveKpis = async () => {
      try {
        const [prodsRes, alertsRes, whsRes] = await Promise.all([
          api.getProducts().catch(() => null),
          api.getReorderAlerts().catch(() => null),
          api.getWarehouses().catch(() => null),
        ]);

        setStats(prev => ({
          ...prev,
          totalProducts: prodsRes?.count !== undefined ? prodsRes.count : prev.totalProducts,
          lowStock: alertsRes?.count !== undefined ? alertsRes.count : prev.lowStock,
          totalWarehouses: whsRes?.count !== undefined ? whsRes.count : prev.totalWarehouses,
        }));
      } catch (e) {
        console.error('Error fetching dashboard KPIs:', e);
      }
    };

    fetchLiveKpis();
  }, []);

  return (
    <>
      <h1>Dashboard</h1>
      <p>Welcome to StockSense — Warehouse & Inventory Management</p>

      <div className="kpi-row">
        <KpiCard label="Total Catalog Products" value={stats.totalProducts} />
        <KpiCard
          label="Low Stock / Reorder Alerts"
          value={stats.lowStock}
          status={stats.lowStock > 0 ? 'alert' : undefined}
        />
        <KpiCard label="Active Warehouse Sites" value={stats.totalWarehouses} />
        <KpiCard label="Pending Receipts" value={stats.pendingReceipts} />
        <KpiCard label="Pending Deliveries" value={stats.pendingDeliveries} />
      </div>
    </>
  );
}

export default Dashboard;