/**
 * sarvamService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Clean wrappers for all 4 Sarvam APIs used in BahiKhata:
 *   1. Vision      — invoice OCR
 *   2. STT (Saaras) — Hindi voice → text
 *   3. LLM (30B)   — Hindi text → structured JSON
 *   4. TTS (Bulbul) — confirmation text → audio
 *
 * Set USE_MOCK_APIS=true in .env to run fully offline without an API key.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fetch = require("node-fetch");
const FormData = require("form-data");


const BASE_URL = "https://api.sarvam.ai";
const API_KEY  = process.env.SARVAM_API_KEY;
const USE_MOCK = process.env.USE_MOCK_APIS === "true";

// ── Shared header helper ──────────────────────────────────────────────────────
function authHeaders(extra = {}) {
  return { "api-subscription-key": API_KEY, ...extra };
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. VISION — parse wholesale invoice image → structured item list
// ═════════════════════════════════════════════════════════════════════════════

const VISION_MOCK = [
  { item_name: "Aata",   quantity: 10, unit: "kg",    price: 320 },
  { item_name: "Chini",  quantity: 5,  unit: "kg",    price: 240 },
  { item_name: "Tel",    quantity: 2,  unit: "litre", price: 270 },
  { item_name: "Namak",  quantity: 4,  unit: "kg",    price: 88  },
];

/**
 * @param {Buffer} imageBuffer  - raw image bytes (jpg/png)
 * @param {string} mimeType     - e.g. "image/jpeg"
 * @returns {Promise<Array<{item_name, quantity, unit, price}>>}
 */
async function visionParseInvoice(imageBuffer, mimeType = "image/jpeg") {
  if (USE_MOCK) {
    await delay(1200);
    return VISION_MOCK;
  }

  // Step 1: get raw OCR text from Sarvam Vision
  const form = new FormData();
  form.append("file", imageBuffer, { filename: "invoice.jpg", contentType: mimeType });
  form.append("model", "sarvam-vision");

  const ocrRes = await fetch(`${BASE_URL}/v1/document-digitization`, {
    method: "POST",
    headers: authHeaders(form.getHeaders()),
    body: form,
  });
  if (!ocrRes.ok) throw new Error(`Vision OCR failed: ${ocrRes.status} ${await ocrRes.text()}`);
  const ocrData = await ocrRes.json();
  const rawText = ocrData?.pages?.map(p => p.text).join("\n") || ocrData?.text || "";

  // Step 2: use LLM to turn raw OCR text → clean JSON array
  const items = await llmExtractInvoiceItems(rawText);
  return items;
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. STT — Hindi audio → transcript
// ═════════════════════════════════════════════════════════════════════════════

const STT_MOCK = "Ramesh ne do kilo chini aur ek litre tel liya, udhaar pe likh lo";

/**
 * @param {Buffer} audioBuffer  - raw audio bytes (wav/webm)
 * @param {string} mimeType     - e.g. "audio/wav"
 * @returns {Promise<string>}   - Hindi transcript
 */
async function sttTranscribe(audioBuffer, mimeType = "audio/wav") {
  if (USE_MOCK) {
    await delay(800);
    return STT_MOCK;
  }

  const form = new FormData();
  form.append("file", audioBuffer, { filename: "audio.wav", contentType: mimeType });
  form.append("model", "saaras:v3");
  form.append("language_code", "hi-IN");
  form.append("with_timestamps", "false");

const res = await fetch(`${BASE_URL}/speech-to-text`, {
    method: "POST",
    headers: authHeaders(form.getHeaders()),
    body: form,
  });
  if (!res.ok) throw new Error(`STT failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.transcript || "";
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. LLM — Hindi transcript → structured transaction JSON
// ═════════════════════════════════════════════════════════════════════════════

const LLM_MOCK_TRANSACTION = {
  customer_name:    "Ramesh",
  items: [
    { name: "chini", quantity: 2, unit: "kg"    },
    { name: "tel",   quantity: 1, unit: "litre" },
  ],
  transaction_type: "udhaar",
};

const LLM_MOCK_INVOICE_ITEMS = [
  { item_name: "Aata",  quantity: 10, unit: "kg",    price: 320 },
  { item_name: "Chini", quantity: 5,  unit: "kg",    price: 240 },
];

/**
 * Extract transaction details from Hindi sentence (Act 2)
 * @param {string} hindiText
 * @returns {Promise<{customer_name, items, transaction_type}>}
 */
async function llmExtractTransaction(hindiText) {
  if (USE_MOCK) {
    await delay(600);
    return LLM_MOCK_TRANSACTION;
  }

  const prompt = `You are a billing assistant for an Indian kirana (grocery) store.

Extract the transaction details from the following Hindi sentence and return ONLY a valid JSON object (no markdown, no explanation).

Hindi sentence: "${hindiText}"

Return this exact JSON shape:
{
  "customer_name": "<name of the customer, or 'Unknown' if not mentioned>",
  "items": [
    { "name": "<item name in English>", "quantity": <number>, "unit": "<kg|litre|piece|packet|dozen>" }
  ],
  "transaction_type": "<udhaar|paid>"
}

Rules:
- transaction_type is "udhaar" if the sentence mentions "udhaar", "baaad mein", "khate mein", or credit.
- transaction_type is "paid" if the sentence mentions "nakit", "cash", "de diya", or payment.
- Default to "udhaar" if unclear.

IMPORTANT CUSTOMER NAME RULES:
- The customer's name is usually the FIRST person's name mentioned.
- Never return "Unknown" if a person's name appears in the sentence.
- Preserve Indian names exactly as spoken.

Examples:
"Anant ko do kilo aloo udhar diya"
→ customer_name = "Anant"

"Raju ne teen kilo aata liya"
→ customer_name = "Raju"

"Anju ko ek kilo chini di"
→ customer_name = "Anju"

Return "Unknown" ONLY if no person name exists.

IMPORTANT ITEM RULES:
- Keep common kirana item names in Hindi inventory format.
- Do NOT translate:
  aata → Aata
  chini → Chini
  tel → Tel
  daal → Daal
  chawal → Chawal
  aloo → Aloo
  kheera → Kheera
  pyaz → Pyaz
  tamatar → Tamatar
  doodh → Doodh

- Avoid returning generic English names like flour, sugar, potatoes, cucumber, onion, tomato when a common Hindi kirana name exists.
`;

  const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      model: "sarvam-30b",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 512,
      temperature: 0.1,
      reasoning_effort: null,
    }),
  });
  if (!res.ok) throw new Error(`LLM extract failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || "{}";
  return safeParseJSON(raw, LLM_MOCK_TRANSACTION);
}

/**
 * Extract item list from raw OCR text (Act 1, internal)
 * @param {string} rawText
 * @returns {Promise<Array<{item_name, quantity, unit, price}>>}
 */
async function llmExtractInvoiceItems(rawText) {
  if (USE_MOCK) {
    await delay(500);
    return LLM_MOCK_INVOICE_ITEMS;
  }

  const prompt = `You are a data extraction assistant. Extract all purchased items from this invoice text.

Invoice text:
"""
${rawText}
"""

Return ONLY a valid JSON array (no markdown):
[
  { "item_name": "<name in English>", "quantity": <number>, "unit": "<kg|litre|piece|packet>", "price": <total price as number> }
]

If a field is missing, use null. Return an empty array [] if no items found.`;

  const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      model: "sarvam-105b",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.1,
      reasoning_effort: null,
    }),
  });
  if (!res.ok) throw new Error(`LLM invoice extract failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || "[]";
  return safeParseJSON(raw, []);
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. TTS (Bulbul) — Hindi confirmation text → audio buffer
// ═════════════════════════════════════════════════════════════════════════════

/**
 * @param {string} hindiText
 * @returns {Promise<Buffer>}   - base64-encoded WAV audio
 */
async function ttsSpeak(hindiText) {
  if (USE_MOCK) {
    await delay(700);
    // Return a tiny silent WAV (so frontend audio player doesn't crash)
    return SILENT_WAV_BASE64;  // real API returns base64 string, not Buffer
  }

const res = await fetch(`${BASE_URL}/text-to-speech`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
  text: hindiText,
  target_language_code: "hi-IN",
  speaker: "priya",
  model: "bulbul:v3"
}),
  });
  if (!res.ok) throw new Error(`TTS failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  // Sarvam returns base64 audio in audios[0]
  return data.audios?.[0] || "";
}

// ═════════════════════════════════════════════════════════════════════════════
// Helpers
// ═════════════════════════════════════════════════════════════════════════════

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function safeParseJSON(str, fallback) {
  try {
    // Strip markdown code fences if LLM wraps output
    const clean = str.replace(/```json|```/gi, "").trim();
    return JSON.parse(clean);
  } catch {
    console.error("JSON parse failed, using fallback. Raw:", str);
    return fallback;
  }
}

// Minimal 1-second silent WAV for mock mode
const SILENT_WAV_BASE64 =
  "UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

module.exports = {
  visionParseInvoice,
  sttTranscribe,
  llmExtractTransaction,
  ttsSpeak,
};
