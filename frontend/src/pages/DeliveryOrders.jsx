import { useState, useEffect } from 'react';
import FilterBar from '../components/FilterBar';

const mockDeliveries = [
  { id: 1, type: 'delivery', status: 'ready', warehouse: 'Warehouse A', category: 'Electronics', product: 'Circuit Boards', qty: 10 },
  { id: 2, type: 'delivery', status: 'done', warehouse: 'Warehouse B', category: 'Hardware', product: 'Copper Wire', qty: 30 },
  { id: 3, type: 'delivery', status: 'waiting', warehouse: 'Warehouse A', category: 'Hardware', product: 'Steel Rods', qty: 25 },
];

function DeliveryOrders() {
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  const filteredDeliveries = mockDeliveries.filter((item) => {
    return (
      (typeFilter === '' || item.type === typeFilter) &&
      (statusFilter === '' || item.status === statusFilter) &&
      (warehouseFilter === '' || item.warehouse === warehouseFilter) &&
      (categoryFilter === '' || item.category === categoryFilter)
    );
  });

  return (
    <div>
      <h2>Delivery Orders</h2>
      <FilterBar
        onTypeChange={setTypeFilter}
        onStatusChange={setStatusFilter}
        onWarehouseChange={setWarehouseFilter}
        onCategoryChange={setCategoryFilter}
      />

      {isLoading ? (
        <div className="loading-state">Loading delivery orders…</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Status</th>
              <th>Warehouse</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeliveries.length === 0 ? (
              <tr>
                <td colSpan="4" className="empty-state">
                  No delivery orders match your filters.
                </td>
              </tr>
            ) : (
              filteredDeliveries.map((item) => (
                <tr key={item.id}>
                  <td>{item.product}</td>
                  <td>{item.qty}</td>
                  <td>{item.status}</td>
                  <td>{item.warehouse}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default DeliveryOrders;