import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, Users, ShoppingCart } from 'lucide-react';
import './InsightsPanel.css';

export default function InsightsPanel({ customers, inventory, transactions }) {
 const totalUdhaar = customers.reduce(
  (s, c) => s + (Number(c.total_due) || 0),
  0
);

const topDebtors = [...customers]
  .filter(c => (Number(c.total_due) || 0) > 0)
  .sort((a, b) => (b.total_due || 0) - (a.total_due || 0))
  .slice(0, 3);

const lowStock = inventory.filter(
  i => i.quantity <= (i.low_stock_threshold ?? 5)
);

const criticalStock = lowStock.filter(
  i => i.quantity === 0
);

const today = new Date().toDateString();

const todayTxns = transactions.filter(
  t => new Date(t.created_at).toDateString() === today
);

const todayValue = todayTxns.reduce(
  (s, t) => s + (Number(t.total_amount) || 0),
  0
);

  const cards = [
    {
      id: 'udhaar',
      icon: TrendingUp,
      label: 'Total Udhaar',
      hi: 'कुल उधार',
      value: `₹${totalUdhaar.toFixed(0)}`,
      sub: `${customers.filter(c => (c.total_due || 0) > 0).length} customers pending`,
      color: 'saffron',
    },
    {
      id: 'debtors',
      icon: Users,
      label: 'Top Debtors',
      hi: 'सबसे ज़्यादा बकाया',
      value: topDebtors.length > 0 ? topDebtors[0]?.name : 'All clear',
      sub: topDebtors.length > 0
        ? topDebtors.map(d => `${d.name} ₹${d.total_due}`).join(' · ')
        : 'No pending dues',
      color: topDebtors.length > 0 ? 'red' : 'green',
    },
    {
      id: 'stock',
      icon: AlertTriangle,
      label: 'Low Stock',
      hi: 'कम स्टॉक',
      value: `${lowStock.length} items`,
      sub: criticalStock.length > 0
        ? `${criticalStock.length} out of stock: ${criticalStock.slice(0,2).map(i=>i.name).join(', ')}`
        : lowStock.length > 0
          ? lowStock.slice(0,2).map(i=>i.name).join(', ')
          : 'All stocked up',
      color: criticalStock.length > 0 ? 'red' : lowStock.length > 0 ? 'ochre' : 'green',
    },
    {
      id: 'today',
      icon: ShoppingCart,
      label: "Today's Sales",
      hi: 'आज की बिक्री',
      value: `₹${todayValue.toFixed(0)}`,
      sub: `${todayTxns.length} transactions today`,
      color: 'green',
    },
  ];

  return (
    <div className="insights-grid">
      {cards.map((card, i) => (
        <motion.div
          key={card.id}
          className={`insight-card insight-${card.color}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
        >
          <div className="insight-top">
            <div className="insight-icon-wrap">
              <card.icon size={16} strokeWidth={2} />
            </div>
            <div className="insight-labels">
              <span className="insight-label-en">{card.label}</span>
              <span className="insight-label-hi">{card.hi}</span>
            </div>
          </div>
          <div className="insight-value mono">{card.value}</div>
          <div className="insight-sub">{card.sub}</div>
        </motion.div>
      ))}
    </div>
  );
}
