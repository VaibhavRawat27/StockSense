import { useState } from 'react';
import FilterBar from '../components/FilterBar';

const mockAdjustments = [
  { id: 1, type: 'adjustments', status: 'done', warehouse: 'Warehouse A', category: 'Electronics', product: 'Circuit Boards', qty: -3 },
  { id: 2, type: 'adjustments', status: 'draft', warehouse: 'Warehouse B', category: 'Hardware', product: 'Steel Rods', qty: 8 },
  { id: 3, type: 'adjustments', status: 'done', warehouse: 'Warehouse A', category: 'Hardware', product: 'Copper Wire', qty: -2 },
];

function InventoryAdjustment() {
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const filteredAdjustments = mockAdjustments.filter((item) => {
    return (
      (typeFilter === '' || item.type === typeFilter) &&
      (statusFilter === '' || item.status === statusFilter) &&
      (warehouseFilter === '' || item.warehouse === warehouseFilter) &&
      (categoryFilter === '' || item.category === categoryFilter)
    );
  });

  return (
    <div>
      <h2>Inventory Adjustment</h2>
      <FilterBar
        onTypeChange={setTypeFilter}
        onStatusChange={setStatusFilter}
        onWarehouseChange={setWarehouseFilter}
        onCategoryChange={setCategoryFilter}
      />

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
          {filteredAdjustments.map((item) => (
            <tr key={item.id}>
              <td>{item.product}</td>
              <td>{item.qty}</td>
              <td>{item.status}</td>
              <td>{item.warehouse}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default InventoryAdjustment;