import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { voiceCommit } from '../services/api.js';
import toast from 'react-hot-toast';
import './VoiceRecorder.css';

const STATES = {
  IDLE: 'idle',
  RECORDING: 'recording',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  ERROR: 'error',
};

export default function VoiceRecorder({ onResult }) {
  const [state, setState] = useState(STATES.IDLE);
  const [result, setResult] = useState(null);
  const [duration, setDuration] = useState(0);
  const [waveHeights, setWaveHeights] = useState(Array(24).fill(4));

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const waveTimerRef = useRef(null);
  const audioRef = useRef(null);

  // Animate waveform bars during recording
  const animateWave = useCallback(() => {
    if (waveTimerRef.current) clearInterval(waveTimerRef.current);
    waveTimerRef.current = setInterval(() => {
      setWaveHeights(prev =>
        prev.map((_, i) => {
          const base = i < 4 || i > 19 ? 4 : 6;
          return base + Math.random() * 32;
        })
      );
    }, 80);
  }, []);

  const stopWave = useCallback(() => {
    if (waveTimerRef.current) clearInterval(waveTimerRef.current);
    setWaveHeights(Array(24).fill(4));
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start(100);
      mediaRecorderRef.current = mr;
      setState(STATES.RECORDING);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
      animateWave();
    } catch (err) {
      toast.error('Microphone access denied. Please allow mic permissions.');
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    clearInterval(timerRef.current);
    stopWave();
    setState(STATES.PROCESSING);
    setResult(null);

    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());

      try {
        const data = await voiceCommit(blob);
        setResult(data);
        setState(STATES.SUCCESS);
        onResult?.(data);

       if (data.audio) {
  const audio = new Audio(`data:audio/wav;base64,${data.audio}`);
  audioRef.current = audio;
  audio.play().catch(() => {});
}

        toast.success('Transaction recorded!');
        setTimeout(() => setState(STATES.IDLE), 8000);
      } catch (err) {
        const msg = err?.response?.data?.error || 'Voice processing failed. Try again.';
        setState(STATES.ERROR);
        toast.error(msg);
        setTimeout(() => setState(STATES.IDLE), 3000);
      }
    };

    mediaRecorderRef.current.stop();
  };

  useEffect(() => () => {
    clearInterval(timerRef.current);
    if (waveTimerRef.current) clearInterval(waveTimerRef.current);
  }, []);

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const isRecording = state === STATES.RECORDING;
  const isProcessing = state === STATES.PROCESSING;
  const isSuccess = state === STATES.SUCCESS;
  const isError = state === STATES.ERROR;

  return (
    <div className="vr-root">
      {/* Header */}
      <div className="vr-header">
        <h2 className="vr-title">Voice Command</h2>
        <p className="vr-subtitle">
          {isIdle(state) && 'बोलो — बाकी AI करेगा'}
          {isRecording && <span className="rec-live">● REC {fmt(duration)}</span>}
          {isProcessing && 'Sarvam AI processing...'}
          {isSuccess && 'Transaction recorded ✓'}
          {isError && 'Something went wrong'}
        </p>
      </div>

      {/* The Mandala Recorder */}
      <div className="vr-stage">
        {/* Pulse rings — only when recording */}
        {isRecording && [1, 2, 3].map(i => (
          <motion.div
            key={i}
            className="pulse-ring"
            initial={{ scale: 1, opacity: 0.4 }}
            animate={{ scale: 1 + i * 0.35, opacity: 0 }}
            transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.4, ease: 'easeOut' }}
          />
        ))}

        {/* Idle decorative rings */}
        {isIdle(state) && [1, 2].map(i => (
          <motion.div
            key={i}
            className="idle-ring"
            style={{ width: 80 + i * 60, height: 80 + i * 60 }}
            animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
            transition={{ duration: 20 + i * 8, repeat: Infinity, ease: 'linear' }}
          />
        ))}

        {/* Main button */}
        <motion.button
          className={`vr-btn ${state}`}
          onClick={isRecording ? stopRecording : isIdle(state) ? startRecording : undefined}
          disabled={isProcessing || isError}
          whileHover={isIdle(state) || isRecording ? { scale: 1.06 } : {}}
          whileTap={isIdle(state) || isRecording ? { scale: 0.94 } : {}}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          <AnimatePresence mode="wait">
            {isIdle(state) && (
              <motion.div key="mic" className="vr-icon-wrap"
                initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Mic size={36} strokeWidth={1.8} />
              </motion.div>
            )}
            {isRecording && (
              <motion.div key="stop" className="vr-icon-wrap"
                initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Square size={28} fill="currentColor" />
              </motion.div>
            )}
            {isProcessing && (
              <motion.div key="loader" className="vr-icon-wrap"
                initial={{ opacity: 0 }} animate={{ opacity: 1, rotate: 360 }}
                transition={{ rotate: { duration: 1, repeat: Infinity, ease: 'linear' }, opacity: { duration: 0.2 } }}>
                <Loader2 size={32} />
              </motion.div>
            )}
            {isSuccess && (
              <motion.div key="ok" className="vr-icon-wrap"
                initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}>
                <CheckCircle2 size={36} />
              </motion.div>
            )}
            {isError && (
              <motion.div key="err" className="vr-icon-wrap"
                initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <AlertCircle size={36} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Waveform bars (recording only) */}
        {isRecording && (
          <div className="waveform">
            {waveHeights.map((h, i) => (
              <motion.div
                key={i}
                className="wave-bar"
                animate={{ height: h }}
                transition={{ duration: 0.08, ease: 'easeOut' }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Hint text */}
      {isIdle(state) && (
        <motion.div className="vr-hints"
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}>
          <span className="hint-chip">🛒 "Raju ko 2kg atta diya"</span>
          <span className="hint-chip">💰 "Priya ne ₹500 diye"</span>
          <span className="hint-chip">📦 "Sunita ko tel aur sabun"</span>
        </motion.div>
      )}

      {/* Result panel */}
      <AnimatePresence>
        {isSuccess && result && (
          <motion.div className="vr-result"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}>

            {result.transcript && (
              <div className="result-row">
                <span className="result-label">🎤 Transcript</span>
                <span className="result-value transcript-text">"{result.transcript}"</span>
              </div>
            )}
            {result.extracted && (
              <div className="result-row">
                <span className="result-label">🧠 Extracted</span>
                <div className="extracted-chips">
                  {result.extracted.customer_name && (
                    <span className="chip chip-blue">👤 {result.extracted.customer_name}</span>
                  )}
                  {result.extracted.items?.map((item, i) => (
                    <span key={i} className="chip chip-green">
                      {item.name} × {item.quantity}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {result.customer && (
              <div className="result-row">
                <span className="result-label">💳 Balance</span>
                <span className={`result-balance ${result.customer.total_due > 0 ? 'owe' : 'clear'}`}>
  {result.customer.name} — ₹{Math.abs(result.customer.total_due ?? 0).toFixed(2)}
  {result.customer.total_due > 0 ? ' उधार' : ' clear'}
</span>
              </div>
            )}
            {result.confirmation_text && (
  <div className="result-tts">
    <span className="tts-icon">🔊</span>
    <span>{result.confirmation_text}</span>
  </div>
)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function isIdle(s) { return s === STATES.IDLE; }
