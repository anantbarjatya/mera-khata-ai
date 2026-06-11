/**
 * routes/sarvam.js
 */

const express = require("express");
const multer = require("multer");

const router = express.Router();

const {
  visionParseInvoice,
  sttTranscribe,
  llmExtractTransaction,
  ttsSpeak,
} = require("../services/sarvamService");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// ─────────────────────────────────────────────
// TEST ROUTE
// ─────────────────────────────────────────────
router.get("/test", (req, res) => {
  res.json({
    ok: true,
    message: "Sarvam routes working",
  });
});

// ─────────────────────────────────────────────
// VISION OCR
// POST /api/sarvam/vision-invoice
// ─────────────────────────────────────────────
router.post(
  "/vision-invoice",
  upload.single("invoice"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "No invoice image uploaded",
        });
      }

      console.log(
        `📷 Vision: parsing invoice (${req.file.size} bytes)`
      );

      const items = await visionParseInvoice(
        req.file.buffer,
        req.file.mimetype
      );

      res.json({
        success: true,
        items,
      });
    } catch (err) {
      console.error("Vision error:", err.message);

      res.status(500).json({
        error: err.message,
      });
    }
  }
);

// ─────────────────────────────────────────────
// STT
// POST /api/sarvam/stt
// ─────────────────────────────────────────────
router.post(
  "/stt",
  upload.single("audio"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "No audio file uploaded",
        });
      }

      console.log(
        `🎤 STT: transcribing audio (${req.file.size} bytes)`
      );

      const transcript = await sttTranscribe(
        req.file.buffer,
        req.file.mimetype
      );

      res.json({
        success: true,
        transcript,
      });
    } catch (err) {
      console.error("STT error:", err.message);

      res.status(500).json({
        error: err.message,
      });
    }
  }
);

// ─────────────────────────────────────────────
// LLM Transaction Extractor
// POST /api/sarvam/extract-transaction
// ─────────────────────────────────────────────
router.post("/extract-transaction", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        error: "text is required",
      });
    }

    console.log(
      `🧠 LLM: extracting transaction from "${text}"`
    );

    const transaction = await llmExtractTransaction(text);

    res.json({
      success: true,
      transaction,
    });
  } catch (err) {
    console.error(
      "LLM extract error:",
      err.message
    );

    res.status(500).json({
      error: err.message,
    });
  }
});

// ─────────────────────────────────────────────
// TTS
// POST /api/sarvam/tts
// ─────────────────────────────────────────────
router.post("/tts", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        error: "text is required",
      });
    }

    console.log(
      `🔊 TTS: generating audio for "${text}"`
    );

    const audioBase64 = await ttsSpeak(text);

    res.json({
      success: true,
      audio: audioBase64,
    });
  } catch (err) {
    console.error("TTS error:", err.message);

    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;