function FilterBar({ onTypeChange, onStatusChange, onWarehouseChange, onCategoryChange }) {
  return (
    <div className="filter-bar">
      <select onChange={(e) => onTypeChange(e.target.value)}>
        <option value="">Document Type</option>
        <option value="receipts">Receipts</option>
        <option value="delivery">Delivery</option>
        <option value="internal">Internal</option>
        <option value="adjustments">Adjustments</option>
      </select>

      <select onChange={(e) => onStatusChange(e.target.value)}>
        <option value="">Status</option>
        <option value="draft">Draft</option>
        <option value="waiting">Waiting</option>
        <option value="ready">Ready</option>
        <option value="done">Done</option>
        <option value="cancelled">Cancelled</option>
      </select>

      <select onChange={(e) => onWarehouseChange(e.target.value)}>
        <option value="">Warehouse</option>
        <option value="Warehouse A">Warehouse A</option>
        <option value="Warehouse B">Warehouse B</option>
      </select>

      <select onChange={(e) => onCategoryChange(e.target.value)}>
        <option value="">Product Category</option>
        <option value="Electronics">Electronics</option>
        <option value="Hardware">Hardware</option>
      </select>
    </div>
  );
}

export default FilterBar;