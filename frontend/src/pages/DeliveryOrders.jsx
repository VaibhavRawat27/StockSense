import { useState, useEffect } from 'react';
import FilterBar from '../components/FilterBar';
import { api } from '../services/api';

function DeliveryOrders() {
  const [deliveries, setDeliveries] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ warehouseId: '', productId: '', qty: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [deliveryData, productData, warehouseData] = await Promise.all([
        api.getDeliveries(),
        api.getProducts(),
        api.getWarehouses(),
      ]);

      const rawDeliveries = deliveryData.data || deliveryData.deliveries || deliveryData || [];

      const detailedDeliveries = await Promise.all(
        rawDeliveries.map((d) => api.getDeliveryById(d.id).then((res) => res.data || res))
      );

      setDeliveries(detailedDeliveries);
      setProducts(productData.data || productData.products || productData || []);
      setWarehouses(warehouseData.data || warehouseData.warehouses || warehouseData || []);
    } catch (err) {
      setError(err.message || 'Failed to load delivery orders.');
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

  const handleCreateDelivery = async (e) => {
    e.preventDefault();
    if (!form.warehouseId || !form.productId || !form.qty) return;
    setIsSubmitting(true);
    setError('');
    try {
      await api.createDelivery({
        warehouse_id: form.warehouseId,
        items: [
          { product_id: form.productId, quantity: Number(form.qty) }
        ],
      });
      setForm({ warehouseId: '', productId: '', qty: '' });
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to create delivery order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValidate = async (id) => {
    setError('');
    try {
      await api.validateDelivery(id);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to validate delivery.');
    }
  };

  const filteredDeliveries = deliveries.filter((d) => {
    const matchesStatus = statusFilter === '' || d.status === statusFilter;
    const matchesWarehouse =
      warehouseFilter === '' || String(d.warehouse_id) === warehouseFilter;
    return matchesStatus && matchesWarehouse;
  });

  return (
    <div>
      <h2>Delivery Orders</h2>

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
          {showForm ? 'Cancel' : '+ New Delivery Order'}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showForm && (
        <form
          className="inline-form"
          onSubmit={handleCreateDelivery}
          style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}
        >
          <select
            value={form.warehouseId}
            onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
            required
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
          >
            <option value="">Select warehouse</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>

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
            {isSubmitting ? 'Creating...' : 'Create Delivery Order'}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="loading-state">Loading delivery orders…</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Warehouse</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeliveries.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-state">
                  No delivery orders match your filters.
                </td>
              </tr>
            ) : (
              filteredDeliveries.map((d) => (
                <tr key={d.id}>
                  <td>{d.items && d.items.length > 0 ? d.items.map((i) => i.product_name).join(', ') : '—'}</td>
                  <td>{d.items && d.items.length > 0 ? d.items.map((i) => i.quantity).join(', ') : '—'}</td>
                  <td>{getWarehouseName(d.warehouse_id)}</td>
                  <td>{d.status}</td>
                  <td>
                    {d.status !== 'done' && d.status !== 'canceled' && (
                      <button
                        onClick={() => handleValidate(d.id)}
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

export default DeliveryOrders;