/**
 * RaseedScanner.jsx
 * Sarvam Vision → invoice image → structured items → bulk inventory update
 * Full pipeline: Upload image → Vision OCR → LLM extract → Preview → Confirm → DB
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Camera, Loader2, CheckCircle2, AlertCircle,
  Package, RotateCcw, Plus, Trash2, ScanLine, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { scanInvoice, bulkAddInventory } from '../services/api.js';
import './RaseedScanner.css';

const STAGES = {
  IDLE:       'idle',
  UPLOADING:  'uploading',
  SCANNING:   'scanning',
  PREVIEW:    'preview',
  COMMITTING: 'committing',
  SUCCESS:    'success',
  ERROR:      'error',
};

const UNITS = ['kg', 'litre', 'piece', 'packet', 'dozen', 'box', 'g', 'ml'];

export default function RaseedScanner() {
  const [stage,     setStage]     = useState(STAGES.IDLE);
  const [imageURL,  setImageURL]  = useState(null);
  const [items,     setItems]     = useState([]);
  const [errorMsg,  setErrorMsg]  = useState('');
  const fileRef = useRef(null);

  /* ── helpers ─────────────────────────────────────────────────────────── */
  const reset = () => {
    setStage(STAGES.IDLE);
    setImageURL(null);
    setItems([]);
    setErrorMsg('');
  };

  /* ── file pick + scan ─────────────────────────────────────────────────── */
  const handleFile = useCallback(async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Sirf image files supported hain (JPG, PNG, WebP)');
      return;
    }

    // Show preview immediately
    setImageURL(URL.createObjectURL(file));
    setStage(STAGES.SCANNING);

    try {
      const data = await scanInvoice(file);
      if (!data.items || data.items.length === 0) {
        throw new Error('Koi items nahi mile invoice mein. Doosri image try karo.');
      }
      // Normalize: ensure every item has required fields
      const normalized = data.items.map((it, idx) => ({
        _id:       `item-${idx}`,
        item_name: it.item_name || it.name || '',
        quantity:  Number(it.quantity) || 0,
        unit:      it.unit || 'kg',
        price:     Number(it.price) || 0,
      }));
      setItems(normalized);
      setStage(STAGES.PREVIEW);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Scan fail ho gaya';
      setErrorMsg(msg);
      setStage(STAGES.ERROR);
    }
  }, []);

  const onFileChange = (e) => handleFile(e.target.files?.[0]);

  const onDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
  };

  /* ── inline editing ───────────────────────────────────────────────────── */
  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(it =>
      it._id === id ? { ...it, [field]: value } : it
    ));
  };

  const removeItem = (id) => {
    setItems(prev => prev.filter(it => it._id !== id));
  };

  const addRow = () => {
    setItems(prev => [...prev, {
      _id: `item-${Date.now()}`,
      item_name: '', quantity: 0, unit: 'kg', price: 0,
    }]);
  };

  /* ── commit to inventory ──────────────────────────────────────────────── */
  const handleCommit = async () => {
    const valid = items.filter(it => it.item_name.trim());
    if (valid.length === 0) {
      toast.error('Kam se kam ek item ka naam chahiye');
      return;
    }
    setStage(STAGES.COMMITTING);
    try {
      await bulkAddInventory(valid);
      setStage(STAGES.SUCCESS);
      toast.success(`${valid.length} items inventory mein add ho gaye! 📦`);
    } catch (err) {
      const msg = err?.response?.data?.error || 'Inventory update fail ho gaya';
      setErrorMsg(msg);
      setStage(STAGES.ERROR);
    }
  };

  /* ── render ───────────────────────────────────────────────────────────── */
  return (
    <div className="page raseed-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Raseed Scanner <span className="page-title-hi">रसीद स्कैनर</span>
          </h1>
          <p className="page-sub">
            Wholesale invoice ki photo lo — Sarvam Vision items automatically extract karega
          </p>
        </div>
        {stage !== STAGES.IDLE && (
          <button className="btn-ghost" onClick={reset}>
            <RotateCcw size={14} /> Naya Scan
          </button>
        )}
      </div>

      {/* Pipeline badge */}
      <div className="pipeline-strip">
        {['📷 Image Upload', '👁️ Sarvam Vision OCR', '🧠 Sarvam 105B Extract', '📦 Inventory Update'].map((step, i) => (
          <div key={i} className={`pipeline-step ${getPipelineState(stage, i)}`}>
            <span>{step}</span>
            {i < 3 && <span className="pipeline-arrow">→</span>}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── IDLE: drop zone ────────────────────────────────────────────── */}
        {stage === STAGES.IDLE && (
          <motion.div key="idle"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}>

            <div
              className="drop-zone"
              onDrop={onDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept="image/*" capture="environment"
                style={{ display: 'none' }} onChange={onFileChange} />

              <motion.div className="drop-icon"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
                <ScanLine size={48} strokeWidth={1.2} />
              </motion.div>

              <h3 className="drop-title">Invoice ki photo yahan drop karo</h3>
              <p className="drop-sub">Ya click karke gallery se choose karo</p>

              <div className="drop-btns">
                <button className="btn-primary" onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>
                  <Upload size={15} /> Gallery se Upload
                </button>
                <button className="btn-ghost" onClick={e => {
                  e.stopPropagation();
                  // On mobile, trigger camera
                  const inp = document.createElement('input');
                  inp.type = 'file'; inp.accept = 'image/*'; inp.capture = 'environment';
                  inp.onchange = ev => handleFile(ev.target.files?.[0]);
                  inp.click();
                }}>
                  <Camera size={15} /> Camera Se
                </button>
              </div>

              <div className="drop-formats">JPG · PNG · WebP · HEIC supported</div>
            </div>

            {/* Example cards */}
            <div className="example-strip">
              <p className="example-label">Kya scan kar sakte ho?</p>
              <div className="example-cards">
                {['🧾 Wholesale raseed', '📋 Supplier invoice', '🏪 Mandi receipt', '📄 Purchase order'].map(t => (
                  <span key={t} className="example-chip">{t}</span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── SCANNING: loading ──────────────────────────────────────────── */}
        {stage === STAGES.SCANNING && (
          <motion.div key="scanning" className="scan-loading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

            {imageURL && (
              <div className="preview-thumb-wrap">
                <img src={imageURL} alt="invoice" className="preview-thumb" />
                <div className="scan-overlay">
                  <motion.div className="scan-beam"
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
              </div>
            )}

            <div className="scan-status">
              <Loader2 size={22} className="spin-icon" />
              <div>
                <p className="scan-status-title">Sarvam Vision kaam kar raha hai...</p>
                <p className="scan-status-sub">Invoice read karke items extract ho rahe hain</p>
              </div>
            </div>

            <div className="scan-steps">
              {['📷 Image received', '👁️ OCR running', '🧠 LLM extracting items'].map((s, i) => (
                <motion.div key={i} className="scan-step"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.6 }}>
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4 }}>
                    {s}
                  </motion.span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── PREVIEW: editable table ────────────────────────────────────── */}
        {stage === STAGES.PREVIEW && (
          <motion.div key="preview"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}>

            <div className="preview-layout">
              {/* Left: image */}
              {imageURL && (
                <div className="preview-image-col">
                  <img src={imageURL} alt="Invoice" className="preview-image" />
                  <p className="preview-image-caption">Scanned Invoice</p>
                </div>
              )}

              {/* Right: extracted items */}
              <div className="preview-table-col">
                <div className="preview-header">
                  <div className="preview-header-left">
                    <CheckCircle2 size={18} color="var(--green)" />
                    <span><strong>{items.length} items</strong> extract hue</span>
                  </div>
                  <button className="btn-ghost btn-sm" onClick={addRow}>
                    <Plus size={13} /> Row Add Karo
                  </button>
                </div>

                <div className="items-table">
                  <div className="items-thead">
                    <span>Item Name</span>
                    <span>Qty</span>
                    <span>Unit</span>
                    <span>Price (₹)</span>
                    <span></span>
                  </div>

                  <AnimatePresence>
                    {items.map(item => (
                      <motion.div key={item._id} className="items-row"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8, height: 0 }}>

                        <input className="cell-input name-input"
                          value={item.item_name}
                          onChange={e => updateItem(item._id, 'item_name', e.target.value)}
                          placeholder="Item naam..." />

                        <input className="cell-input num-input"
                          type="number" min="0" step="0.1"
                          value={item.quantity}
                          onChange={e => updateItem(item._id, 'quantity', parseFloat(e.target.value) || 0)} />

                        <select className="cell-select"
                          value={item.unit}
                          onChange={e => updateItem(item._id, 'unit', e.target.value)}>
                          {UNITS.map(u => <option key={u}>{u}</option>)}
                        </select>

                        <input className="cell-input num-input"
                          type="number" min="0"
                          value={item.price}
                          onChange={e => updateItem(item._id, 'price', parseFloat(e.target.value) || 0)} />

                        <button className="icon-btn danger row-del"
                          onClick={() => removeItem(item._id)}>
                          <Trash2 size={13} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Summary */}
                <div className="preview-summary">
                  <span>Total items: <strong>{items.length}</strong></span>
                  <span>Total value: <strong>₹{items.reduce((s, i) => s + (i.price || 0), 0).toFixed(0)}</strong></span>
                </div>

                <div className="preview-actions">
                  <button className="btn-ghost" onClick={reset}>Cancel</button>
                  <button className="btn-primary commit-btn" onClick={handleCommit}>
                    <Package size={15} />
                    Inventory Mein Daalo ({items.filter(i => i.item_name.trim()).length} items)
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── COMMITTING ─────────────────────────────────────────────────── */}
        {stage === STAGES.COMMITTING && (
          <motion.div key="committing" className="center-state"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Loader2 size={40} className="spin-icon" color="var(--saffron)" />
            <p className="center-title">Inventory update ho rahi hai...</p>
            <p className="center-sub">Sarvam se extracted items stock mein ja rahe hain</p>
          </motion.div>
        )}

        {/* ── SUCCESS ────────────────────────────────────────────────────── */}
        {stage === STAGES.SUCCESS && (
          <motion.div key="success" className="center-state"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}>

            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, delay: 0.2 }}>
              <CheckCircle2 size={56} color="var(--green)" strokeWidth={1.5} />
            </motion.div>
            <p className="center-title">Inventory Updated! 📦</p>
            <p className="center-sub">
              {items.filter(i => i.item_name.trim()).length} items successfully stock mein add ho gaye
            </p>
            <div className="success-chips">
              {items.filter(i => i.item_name.trim()).slice(0, 6).map((it, i) => (
                <span key={i} className="chip chip-green">
                  {it.item_name} · {it.quantity} {it.unit}
                </span>
              ))}
            </div>
            <div className="success-actions">
              <button className="btn-primary" onClick={reset}>
                <ScanLine size={14} /> Aur Scan Karo
              </button>
              <a href="/inventory" className="btn-ghost">
                <Package size={14} /> Inventory Dekho
              </a>
            </div>
          </motion.div>
        )}

        {/* ── ERROR ──────────────────────────────────────────────────────── */}
        {stage === STAGES.ERROR && (
          <motion.div key="error" className="center-state"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <AlertCircle size={48} color="var(--red)" strokeWidth={1.5} />
            <p className="center-title">Scan fail ho gaya</p>
            <p className="center-sub error-msg">{errorMsg}</p>
            <button className="btn-primary" onClick={reset}>
              <RotateCcw size={14} /> Phir Se Try Karo
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

/** Map pipeline step index to active/done/pending state */
function getPipelineState(stage, stepIdx) {
  const order = [STAGES.IDLE, STAGES.SCANNING, STAGES.PREVIEW, STAGES.COMMITTING, STAGES.SUCCESS];
  const cur = order.indexOf(stage);
  if (stage === STAGES.ERROR) return stepIdx <= 1 ? 'done' : 'pending';
  if (cur > stepIdx + 1) return 'done';
  if (cur === stepIdx + 1 || (stepIdx === 3 && stage === STAGES.SUCCESS)) return 'done';
  if (cur === stepIdx || (stepIdx === 0 && stage === STAGES.SCANNING)) return 'active';
  return 'pending';
}