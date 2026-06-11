/**
 * sarvamService.js
 */
const { PDFDocument } = require("pdf-lib");
const fetch = require("node-fetch");
const FormData = require("form-data");
const AdmZip = require("adm-zip");

const BASE_URL = "https://api.sarvam.ai";
const DOC_BASE = "https://api.sarvam.ai/doc-digitization/job/v1";
const API_KEY  = process.env.SARVAM_API_KEY;
const USE_MOCK = process.env.USE_MOCK_APIS === "true";

function authHeaders(extra = {}) {
  return { "api-subscription-key": API_KEY, ...extra };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. VISION — async job-based pipeline
// ═══════════════════════════════════════════════════════════════════════════

const VISION_MOCK = [
  { item_name: "Aata",  quantity: 10, unit: "kg",    price: 320 },
  { item_name: "Chini", quantity: 5,  unit: "kg",    price: 240 },
  { item_name: "Tel",   quantity: 2,  unit: "litre", price: 270 },
  { item_name: "Namak", quantity: 4,  unit: "kg",    price: 88  },
];

async function visionParseInvoice(imageBuffer, mimeType = "image/jpeg") {
  if (USE_MOCK) {
    await delay(1200);
    return VISION_MOCK;
  }

  // JPG/PNG → PDF
  const pdfBuffer = await imageToPdfBuffer(imageBuffer);

  // 1. Create Job
  const createRes = await fetch(DOC_BASE, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      job_parameters: {
        language: "hi-IN",
        output_format: "md",
      },
    }),
  });

  const createData = await createRes.json();
  if (!createRes.ok) {
    throw new Error(`Create Job failed: ${JSON.stringify(createData)}`);
  }

  const jobId = createData.job_id;
  console.log("✅ Job created:", jobId);

  // 2. Get Upload URL
  const uploadUrlRes = await fetch(`${DOC_BASE}/upload-files`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      job_id: jobId,
      files: ["invoice.pdf"],
    }),
  });

  const uploadUrlData = await uploadUrlRes.json();
  if (!uploadUrlRes.ok) {
    throw new Error(`Upload URL failed: ${JSON.stringify(uploadUrlData)}`);
  }

  const presignedUrl = uploadUrlData.upload_urls["invoice.pdf"].file_url;
  console.log("📤 Upload URL received");

  // 3. Upload PDF via presigned URL
  // Azure Blob Storage requires x-ms-blob-type: BlockBlob header
  const uploadRes = await fetch(presignedUrl, {
    method: "PUT",
    body: pdfBuffer,
    headers: {
      "x-ms-blob-type": "BlockBlob",
      "Content-Type": "application/pdf",
    },
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`File upload failed: ${uploadRes.status} — ${errText}`);
  }
  console.log("✅ PDF uploaded");

  // 4. Start Job
  const startRes = await fetch(`${DOC_BASE}/${jobId}/start`, {
    method: "POST",
    headers: authHeaders(),
  });

  if (!startRes.ok) {
    throw new Error(`Start Job failed: ${await startRes.text()}`);
  }
  console.log("🚀 Job started");

  // 5. Poll Status
  let state = "Running";
  while (["Accepted", "Pending", "Running"].includes(state)) {
    await delay(3000);

    const statusRes = await fetch(`${DOC_BASE}/${jobId}/status`, {
      headers: authHeaders(),
    });

    const statusData = await statusRes.json();
    state = statusData.job_state;
    console.log("⏳ Status:", state);
    if (state === "Completed" || state === "PartiallyCompleted") {
      console.log("📋 Full status response:", JSON.stringify(statusData, null, 2));
    }
  }

  if (state !== "Completed" && state !== "PartiallyCompleted") {
    throw new Error(`Job failed with state: ${state}`);
  }

  // 6. Get Download Presigned URL
  const dlUrlRes = await fetch(`${DOC_BASE}/${jobId}/download-files`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({}),
  });

  const dlUrlData = await dlUrlRes.json();
  if (!dlUrlRes.ok) {
    throw new Error(`Get download URL failed: ${JSON.stringify(dlUrlData)}`);
  }

  // Pick first available download URL (document.zip)
  const downloadUrls = dlUrlData.download_urls || {};
  const firstFile = Object.keys(downloadUrls)[0];
  if (!firstFile) {
    throw new Error("No download URLs returned from Sarvam");
  }

  const presignedDownloadUrl = downloadUrls[firstFile].file_url;
  console.log("📥 Download URL received for:", firstFile);

  // 7. Download ZIP via presigned URL
  const outputRes = await fetch(presignedDownloadUrl);

  if (!outputRes.ok) {
    const errBody = await outputRes.text();
    throw new Error(`Download failed: ${outputRes.status} — ${errBody}`);
  }

  const zipBuffer = Buffer.from(await outputRes.arrayBuffer());
  console.log("📦 Output ZIP downloaded");

  // 7. OCR Text Extraction
  const rawText = extractTextFromZip(zipBuffer);
  console.log("📝 OCR text length:", rawText.length);

  // 8. LLM → Inventory Items
  const items = await llmExtractInvoiceItems(rawText);
  return items;
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. STT
// ═══════════════════════════════════════════════════════════════════════════

const STT_MOCK = "Ramesh ne do kilo chini aur ek litre tel liya, udhaar pe likh lo";

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

// ═══════════════════════════════════════════════════════════════════════════
// 3. LLM — transaction extraction
// ═══════════════════════════════════════════════════════════════════════════

const LLM_MOCK_TRANSACTION = {
  customer_name: "Ramesh",
  items: [
    { name: "chini", quantity: 2, unit: "kg" },
    { name: "tel",   quantity: 1, unit: "litre" },
  ],
  transaction_type: "udhaar",
};

const LLM_MOCK_INVOICE_ITEMS = [
  { item_name: "Aata",  quantity: 10, unit: "kg",    price: 320 },
  { item_name: "Chini", quantity: 5,  unit: "kg",    price: 240 },
];

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

IMPORTANT ITEM RULES:
- Keep common kirana item names in Hindi inventory format.
- Do NOT translate: aata→Aata, chini→Chini, tel→Tel, daal→Daal, chawal→Chawal, aloo→Aloo, pyaz→Pyaz, tamatar→Tamatar, doodh→Doodh`;

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

// ═══════════════════════════════════════════════════════════════════════════
// 4. TTS
// ═══════════════════════════════════════════════════════════════════════════

async function ttsSpeak(hindiText) {
  if (USE_MOCK) {
    await delay(700);
    return SILENT_WAV_BASE64;
  }

  const res = await fetch(`${BASE_URL}/text-to-speech`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      text: hindiText,
      target_language_code: "hi-IN",
      speaker: "priya",
      model: "bulbul:v3",
    }),
  });
  if (!res.ok) throw new Error(`TTS failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.audios?.[0] || "";
}

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

async function imageToPdfBuffer(imageBuffer) {
  const pdfDoc = await PDFDocument.create();

  let image;
  try {
    image = await pdfDoc.embedJpg(imageBuffer);
  } catch {
    image = await pdfDoc.embedPng(imageBuffer);
  }

  const page = pdfDoc.addPage([image.width, image.height]);
  page.drawImage(image, {
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

function extractTextFromZip(zipBuffer) {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();
  let rawText = "";

  // Try JSON first
  const jsonEntry = entries.find(e => e.entryName.endsWith(".json"));
  if (jsonEntry) {
    try {
      const jsonData = JSON.parse(jsonEntry.getData().toString("utf8"));
      if (Array.isArray(jsonData)) {
        rawText = jsonData.map(p => p.text || p.content || "").join("\n");
      } else if (jsonData.pages) {
        rawText = jsonData.pages.map(p => p.text || p.content || "").join("\n");
      }
    } catch (e) {
      console.warn("JSON parse failed, trying .md");
    }
  }

  // Fallback: .md file
  if (!rawText.trim()) {
    const mdEntry = entries.find(e => e.entryName.endsWith(".md"));
    if (mdEntry) rawText = mdEntry.getData().toString("utf8");
  }

  // Last fallback: all text entries
  if (!rawText.trim()) {
    rawText = entries
      .filter(e => !e.isDirectory)
      .map(e => { try { return e.getData().toString("utf8"); } catch { return ""; } })
      .join("\n");
  }

  return rawText;
}

// Silent WAV (used as mock TTS response)
const SILENT_WAV_BASE64 =
  "UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function safeParseJSON(text, fallback) {
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    console.warn("JSON parse failed, returning fallback");
    return fallback;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Exports
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  visionParseInvoice,
  sttTranscribe,
  llmExtractTransaction,
  ttsSpeak,
};