import './KpiCard.css';

function KpiCard({ label, value, status }) {
  return (
    <div className={`kpi-card ${status ? `kpi-${status}` : ''}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {status === 'alert' && <span className="kpi-badge">⚠ Attention</span>}
    </div>
  );
}

export default KpiCard;