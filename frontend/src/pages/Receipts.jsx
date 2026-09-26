import { useState } from 'react';
import FilterBar from '../components/FilterBar';

const mockReceipts = [
  { id: 1, type: 'receipts', status: 'draft', warehouse: 'Warehouse A', category: 'Electronics', product: 'Steel Rods', qty: 50 },
  { id: 2, type: 'receipts', status: 'done', warehouse: 'Warehouse B', category: 'Hardware', product: 'Copper Wire', qty: 20 },
  { id: 3, type: 'receipts', status: 'waiting', warehouse: 'Warehouse A', category: 'Electronics', product: 'Circuit Boards', qty: 15 },
];

function Receipts() {
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const filteredReceipts = mockReceipts.filter((item) => {
    return (
      (typeFilter === '' || item.type === typeFilter) &&
      (statusFilter === '' || item.status === statusFilter) &&
      (warehouseFilter === '' || item.warehouse === warehouseFilter) &&
      (categoryFilter === '' || item.category === categoryFilter)
    );
  });

  return (
    <div>
      <h2>Receipts</h2>
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
          {filteredReceipts.map((item) => (
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

export default Receipts;