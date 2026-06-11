import { motion } from 'framer-motion';
import './InventoryHealth.css';

const getStatus = (item) => {
  const threshold = item.low_stock_threshold ?? 5;
  if (item.quantity === 0) return 'critical';
  if (item.quantity <= threshold) return 'low';
  return 'healthy';
};

const STATUS_META = {
  healthy:  { label: 'Healthy',  hi: 'अच्छा',  dot: '#2D6A4F' },
  low:      { label: 'Low',      hi: 'कम',      dot: '#E8C547' },
  critical: { label: 'Critical', hi: 'खत्म',    dot: '#C0392B' },
};

export default function InventoryHealth({ inventory }) {
  const counts = { healthy: 0, low: 0, critical: 0 };
  inventory.forEach(i => counts[getStatus(i)]++);

  const sorted = [...inventory].sort((a, b) => {
    const order = { critical: 0, low: 1, healthy: 2 };
    return order[getStatus(a)] - order[getStatus(b)];
  });

  return (
    <div className="ih-root">
      <div className="ih-header">
        <div>
          <h3 className="ih-title">Inventory Health</h3>
          <p className="ih-subtitle-hi">स्टॉक की स्थिति</p>
        </div>
        <div className="ih-legend">
          {Object.entries(STATUS_META).map(([k, v]) => (
            <div key={k} className="legend-item">
              <span className="legend-dot" style={{ background: v.dot }} />
              <span>{counts[k]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary bar */}
      <div className="ih-bar-wrap">
        {['healthy', 'low', 'critical'].map(s => {
          const pct = inventory.length > 0 ? (counts[s] / inventory.length) * 100 : 0;
          const colors = { healthy: '#2D6A4F', low: '#E8C547', critical: '#C0392B' };
          return pct > 0 ? (
            <motion.div
              key={s}
              className="ih-bar-seg"
              style={{ background: colors[s] }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              title={`${STATUS_META[s].label}: ${counts[s]}`}
            />
          ) : null;
        })}
      </div>

      {/* Item list */}
      <div className="ih-list">
        {sorted.slice(0, 8).map((item, i) => {
          const status = getStatus(item);
          const meta = STATUS_META[status];
          const threshold = item.low_stock_threshold ?? 5;
          const pct = Math.min(100, (item.quantity / Math.max(threshold * 3, 1)) * 100);

          return (
            <motion.div
              key={item.id}
              className={`ih-item ih-item-${status}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <div className="ih-item-info">
                <span className="ih-item-name">{item.name}</span>
                <span className="ih-item-qty mono">
                  {item.quantity} {item.unit ?? 'units'}
                </span>
              </div>
              <div className="ih-progress-wrap">
                <div className="ih-progress-track">
                  <motion.div
                    className={`ih-progress-fill ih-fill-${status}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5, delay: 0.1 + i * 0.04 }}
                  />
                </div>
                <span className={`ih-status-badge ih-badge-${status}`}>
                  <span className="badge-dot" style={{ background: meta.dot }} />
                  {meta.hi}
                </span>
              </div>
            </motion.div>
          );
        })}

        {sorted.length === 0 && (
          <div className="ih-empty">No inventory items yet</div>
        )}
      </div>
    </div>
  );
}
