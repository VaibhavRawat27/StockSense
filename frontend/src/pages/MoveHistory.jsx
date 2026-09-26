import { useState } from 'react';
import FilterBar from '../components/FilterBar';

const mockMoves = [
  { id: 1, type: 'receipts', status: 'done', warehouse: 'Warehouse A', category: 'Electronics', product: 'Steel Rods', qty: 50, date: '2026-09-24 10:15' },
  { id: 2, type: 'delivery', status: 'done', warehouse: 'Warehouse B', category: 'Hardware', product: 'Copper Wire', qty: -20, date: '2026-09-24 11:30' },
  { id: 3, type: 'internal', status: 'done', warehouse: 'Warehouse A', category: 'Electronics', product: 'Circuit Boards', qty: 15, date: '2026-09-25 09:00' },
  { id: 4, type: 'adjustments', status: 'done', warehouse: 'Warehouse B', category: 'Hardware', product: 'Steel Rods', qty: -5, date: '2026-09-25 14:45' },
];

function MoveHistory() {
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const filteredMoves = mockMoves.filter((item) => {
    return (
      (typeFilter === '' || item.type === typeFilter) &&
      (statusFilter === '' || item.status === statusFilter) &&
      (warehouseFilter === '' || item.warehouse === warehouseFilter) &&
      (categoryFilter === '' || item.category === categoryFilter)
    );
  });

  return (
    <div>
      <h2>Move History</h2>
      <FilterBar
        onTypeChange={setTypeFilter}
        onStatusChange={setStatusFilter}
        onWarehouseChange={setWarehouseFilter}
        onCategoryChange={setCategoryFilter}
      />

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Product</th>
            <th>Qty</th>
            <th>Type</th>
            <th>Warehouse</th>
          </tr>
        </thead>
        <tbody>
          {filteredMoves.map((item) => (
            <tr key={item.id}>
              <td>{item.date}</td>
              <td>{item.product}</td>
              <td>{item.qty}</td>
              <td>{item.type}</td>
              <td>{item.warehouse}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MoveHistory;