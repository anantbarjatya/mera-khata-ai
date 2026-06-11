/**
 * routes/sarvam.js
 * The 4 AI-powered endpoints the React frontend calls directly.
 */

const express = require("express");
const multer  = require("multer");
const router  = express.Router();
const {
  visionParseInvoice,
  sttTranscribe,
  llmExtractTransaction,
  ttsSpeak,
} = require("../services/sarvamService");

// Store uploads in memory (we don't need to persist them)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/sarvam/vision-invoice
// Act 1: Upload wholesale invoice image → get structured item list back
// Body: multipart/form-data with field "invoice" (image file)
// ─────────────────────────────────────────────────────────────────────────────
router.post("/vision-invoice", upload.single("invoice"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No invoice image uploaded" });

    console.log(`📷 Vision: parsing invoice (${req.file.size} bytes)`);
    const items = await visionParseInvoice(req.file.buffer, req.file.mimetype);

    res.json({ success: true, items });
  } catch (err) {
    console.error("Vision error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/sarvam/stt
// Act 2 Step 1: Upload voice recording → get Hindi transcript back
// Body: multipart/form-data with field "audio" (wav/webm file)
// ─────────────────────────────────────────────────────────────────────────────
router.post("/stt", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No audio file uploaded" });

    console.log(`🎤 STT: transcribing audio (${req.file.size} bytes)`);
    const transcript = await sttTranscribe(req.file.buffer, req.file.mimetype);

    res.json({ success: true, transcript });
  } catch (err) {
    console.error("STT error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/sarvam/extract-transaction
// Act 2 Step 2: Hindi text → structured transaction JSON
// Body: { text: "Ramesh ne do kilo chini liya..." }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/extract-transaction", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "text is required" });

    console.log(`🧠 LLM: extracting transaction from: "${text}"`);
    const transaction = await llmExtractTransaction(text);

    res.json({ success: true, transaction });
  } catch (err) {
    console.error("LLM extract error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/sarvam/tts
// Act 2 Step 4: Hindi confirmation string → audio (base64 WAV)
// Body: { text: "Ramesh ke khaate mein..." }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/tts", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "text is required" });

    console.log(`🔊 TTS: generating audio for: "${text}"`);
    const audioBase64 = await ttsSpeak(text);

    res.json({ success: true, audio: audioBase64 });
  } catch (err) {
    console.error("TTS error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
