import { useState } from 'react';
import './WarehouseSwitcher.css';

function WarehouseSwitcher() {
  const [selected, setSelected] = useState('All Warehouses');

  return (
    <select
      className="warehouse-switcher"
      value={selected}
      onChange={(e) => setSelected(e.target.value)}
    >
      <option value="All Warehouses">All Warehouses</option>
      <option value="Warehouse A">Warehouse A</option>
      <option value="Warehouse B">Warehouse B</option>
    </select>
  );
}

export default WarehouseSwitcher;