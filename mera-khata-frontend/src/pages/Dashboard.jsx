import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Wifi, WifiOff, ScanLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import toast from 'react-hot-toast';

import VoiceRecorder from '../components/VoiceRecorder.jsx';
import InsightsPanel from '../components/InsightsPanel.jsx';
import InventoryHealth from '../components/InventoryHealth.jsx';
import VoiceTimeline from '../components/VoiceTimeline.jsx';
import TransactionFeed from '../components/TransactionFeed.jsx';
import {
  getInventory,
  getCustomers,
  getTransactions,
  checkHealth,
  resetAllData
} from '../services/api.js';
import './Dashboard.css';

const STAGGER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const CARD = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export default function Dashboard() {
  const [inventory,    setInventory]    = useState([]);
  const [customers,    setCustomers]    = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [voiceHistory, setVoiceHistory] = useState([]);
  const [online,       setOnline]       = useState(null);
  const [loading,      setLoading]      = useState(true);
  const navigate = useNavigate();

  const loadAll = useCallback(async () => {
    try {
      const [inv, cust, txns] = await Promise.all([
        getInventory(),
        getCustomers(),
        getTransactions(),
      ]);
      setInventory(Array.isArray(inv) ? inv : inv.inventory ?? []);
      setCustomers(Array.isArray(cust) ? cust : cust.customers ?? []);
      setTransactions(Array.isArray(txns) ? txns : txns.transactions ?? []);
      setOnline(true);
    } catch (err) {
      setOnline(false);
      toast.error('Cannot reach backend. Is the server running on :3001?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
  loadAll();

  const interval = setInterval(async () => {
    try {
      await checkHealth();
      setOnline(true);
    } catch {
      setOnline(false);
    }
  }, 30000);

  return () => clearInterval(interval);
}, [loadAll]);

const handleReset = async () => {
  if (
    !window.confirm(
      "Delete all customers, transactions and dues?"
    )
  ) return;

  try {
    await resetAllData();

    toast.success("Demo data cleared");

    window.location.reload();
  } catch (err) {
    console.error(err);
    toast.error("Reset failed");
  }
};

const handleVoiceResult = useCallback((result) => {
  // Prepend to voice history timeline

    const entry = {
      id: Date.now(),
      transcript:    result.transcript,
      customer_name: result.customer?.name,
      amount:        result.transaction?.amount,
      type:          result.transaction?.type,
      created_at:    new Date().toISOString(),
    };
    setVoiceHistory(prev => [entry, ...prev].slice(0, 20));

    // Optimistically refresh data after a short delay
    setTimeout(loadAll, 1000);
  }, [loadAll]);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Suprabhat' : now.getHours() < 17 ? 'Namaskar' : 'Shubh Sandhya';
  const greetingHi = now.getHours() < 12 ? 'सुप्रभात 🌅' : now.getHours() < 17 ? 'नमस्कार 🙏' : 'शुभ संध्या 🌇';

  return (
    <div className="dashboard">
      {/* Page header */}
      <motion.div
        className="dash-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="dash-greeting">{greetingHi}</h1>
          <p className="dash-sub">
            {new Date().toLocaleDateString('hi-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="dash-header-right">
          <button
  onClick={handleReset}
  style={{
    background: "#ef4444",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    marginRight: "10px"
  }}
>
  🔄 Reset Demo
</button>
          <div className={`online-badge ${online === true ? 'ok' : online === false ? 'err' : 'pending'}`}>
            {online === true
              ? <><Wifi size={12} /> Live</>
              : online === false
              ? <><WifiOff size={12} /> Offline</>
              : <><RefreshCw size={12} className="spin" /> Connecting</>}
          </div>
          <button className="refresh-btn" onClick={loadAll} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </motion.div>

      {/* AI Insights strip */}
      <motion.section
        className="dash-section"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <InsightsPanel
          customers={customers}
          inventory={inventory}
          transactions={transactions}
        />
      </motion.section>

      {/* Main content grid */}
      <motion.div
        className="dash-grid"
        variants={STAGGER}
        initial="hidden"
        animate="show"
      >
        {/* Hero: Voice Recorder — left col, spans 2 rows */}
        <motion.div className="dash-cell voice-cell" variants={CARD}>
          <VoiceRecorder onResult={handleVoiceResult} />
        </motion.div>

        {/* Transaction feed */}
        <motion.div className="dash-cell feed-cell" variants={CARD}>
          <TransactionFeed transactions={transactions} />
        </motion.div>

        {/* Voice timeline */}
        <motion.div className="dash-cell timeline-cell" variants={CARD}>
          <VoiceTimeline entries={voiceHistory} />
        </motion.div>

        {/* Inventory health */}
        <motion.div className="dash-cell inventory-cell" variants={CARD}>
          <InventoryHealth inventory={inventory} />
        </motion.div>

        {/* Raseed Scanner shortcut */}
        <motion.div className="dash-cell raseed-shortcut-cell" variants={CARD}
          onClick={() => navigate('/raseed')}
          style={{ cursor: 'pointer' }}
          whileHover={{ y: -3 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '24px 16px', textAlign: 'center', height: '100%' }}>
            <div style={{ background: 'var(--saffron-light)', borderRadius: '50%', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ScanLine size={26} color="var(--saffron)" strokeWidth={1.8} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>Raseed Scanner</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>रसीद स्कैनर</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Invoice photo se inventory auto-update</div>
            </div>
            <span style={{ fontSize: 11, background: 'var(--saffron)', color: 'white', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
              Sarvam Vision ✨
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* Offline overlay */}
      {online === false && (
        <motion.div
          className="offline-banner"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <WifiOff size={16} />
          Backend server not reachable on <code>localhost:3001</code>
          <button onClick={loadAll}>Retry</button>
        </motion.div>
      )}
    </div>
  );
}