import { useState, useEffect } from 'react';
import FilterBar from '../components/FilterBar';
import { api } from '../services/api';

function InternalTransfers() {
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ productId: '', fromWarehouseId: '', toWarehouseId: '', qty: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [transferData, productData, warehouseData] = await Promise.all([
        api.getTransfers(),
        api.getProducts(),
        api.getWarehouses(),
      ]);

      const rawTransfers = transferData.data || transferData.transfers || transferData || [];

      const detailedTransfers = await Promise.all(
        rawTransfers.map((t) => api.getTransferById(t.id).then((res) => res.data || res))
      );

      setTransfers(detailedTransfers);
      setProducts(productData.data || productData.products || productData || []);
      setWarehouses(warehouseData.data || warehouseData.warehouses || warehouseData || []);
    } catch (err) {
      setError(err.message || 'Failed to load internal transfers.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getWarehouseName = (id) => {
    const wh = warehouses.find((w) => w.id === id);
    return wh ? wh.name : `Warehouse #${id}`;
  };

  const handleCreateTransfer = async (e) => {
    e.preventDefault();
    if (!form.productId || !form.fromWarehouseId || !form.toWarehouseId || !form.qty) return;
    if (form.fromWarehouseId === form.toWarehouseId) {
      setError('Source and destination warehouse must be different.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await api.createTransfer({
        from_warehouse_id: form.fromWarehouseId,
        to_warehouse_id: form.toWarehouseId,
        items: [
          { product_id: form.productId, quantity: Number(form.qty) }
        ],
      });
      setForm({ productId: '', fromWarehouseId: '', toWarehouseId: '', qty: '' });
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to create transfer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValidate = async (id) => {
    setError('');
    try {
      await api.validateTransfer(id);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to validate transfer.');
    }
  };

  const filteredTransfers = transfers.filter((t) => {
    const matchesStatus = statusFilter === '' || t.status === statusFilter;
    const matchesWarehouse =
      warehouseFilter === '' ||
      String(t.from_warehouse_id) === warehouseFilter ||
      String(t.to_warehouse_id) === warehouseFilter;
    return matchesStatus && matchesWarehouse;
  });

  return (
    <div>
      <h2>Internal Transfers</h2>

      <FilterBar
        onTypeChange={() => {}}
        onStatusChange={setStatusFilter}
        onWarehouseChange={setWarehouseFilter}
        onCategoryChange={() => {}}
      />

      <div style={{ margin: '16px 0' }}>
        <button
          onClick={() => setShowForm((s) => !s)}
          style={{
            background: showForm ? '#fff' : '#1B2A63',
            color: showForm ? '#1B2A63' : '#fff',
            border: '1px solid #1B2A63',
            padding: '10px 18px',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          {showForm ? 'Cancel' : '+ New Transfer'}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showForm && (
        <form
          className="inline-form"
          onSubmit={handleCreateTransfer}
          style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}
        >
          <select
            value={form.productId}
            onChange={(e) => setForm({ ...form, productId: e.target.value })}
            required
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
          >
            <option value="">Select product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            value={form.fromWarehouseId}
            onChange={(e) => setForm({ ...form, fromWarehouseId: e.target.value })}
            required
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
          >
            <option value="">From warehouse</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>

          <select
            value={form.toWarehouseId}
            onChange={(e) => setForm({ ...form, toWarehouseId: e.target.value })}
            required
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
          >
            <option value="">To warehouse</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            placeholder="Quantity"
            value={form.qty}
            onChange={(e) => setForm({ ...form, qty: e.target.value })}
            required
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', width: '120px' }}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              background: '#1B2A63',
              color: '#fff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            {isSubmitting ? 'Creating...' : 'Create Transfer'}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="loading-state">Loading internal transfers…</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>From</th>
              <th>To</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransfers.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  No internal transfers match your filters.
                </td>
              </tr>
            ) : (
              filteredTransfers.map((t) => (
                <tr key={t.id}>
                  <td>{t.items && t.items.length > 0 ? t.items.map((i) => i.product_name).join(', ') : '—'}</td>
                  <td>{t.items && t.items.length > 0 ? t.items.map((i) => i.quantity).join(', ') : '—'}</td>
                  <td>{getWarehouseName(t.from_warehouse_id)}</td>
                  <td>{getWarehouseName(t.to_warehouse_id)}</td>
                  <td>{t.status}</td>
                  <td>
                    {t.status !== 'done' && (
                      <button
                        onClick={() => handleValidate(t.id)}
                        style={{
                          background: 'transparent',
                          color: '#1B2A63',
                          border: 'none',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                      >
                        Validate
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default InternalTransfers;