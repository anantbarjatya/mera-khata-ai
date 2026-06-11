/**
 * routes/transactions.js
 *
 * Key endpoint: POST /api/transactions/voice-commit
 * This is the orchestration route that ties together the full Act 2 pipeline:
 *   STT → LLM extract → deduct inventory → write ledger → TTS confirmation
 */

const express = require("express");
const multer  = require("multer");
const router  = express.Router();
const { v4: uuidv4 } = require("uuid");
const { getDB } = require("../db/database");
const {
  sttTranscribe,
  llmExtractTransaction,
  ttsSpeak,
} = require("../services/sarvamService");

const upload = multer({ storage: multer.memoryStorage() });

// GET /api/transactions — recent ledger entries
router.get("/", (req, res) => {
  const db = getDB();
  const { customer_id, limit = 50 } = req.query;
  let query = `
    SELECT t.*, c.name AS customer_name
    FROM transactions t
    JOIN customers c ON t.customer_id = c.customer_id
  `;
  const params = [];
  if (customer_id) { query += " WHERE t.customer_id = ?"; params.push(customer_id); }
  query += " ORDER BY t.created_at DESC LIMIT ?";
  params.push(parseInt(limit));

  const rows = db.prepare(query).all(...params);
  res.json(rows.map(r => ({ ...r, items_json: JSON.parse(r.items_json) })));
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/transactions/voice-commit   ← THE STAR ENDPOINT
// Full pipeline: audio → transcript → extract → save → TTS confirmation
// Body: multipart/form-data with "audio" field
// ─────────────────────────────────────────────────────────────────────────────
router.post("/voice-commit", upload.single("audio"), async (req, res) => {
  const db = getDB();
  try {
    if (!req.file) return res.status(400).json({ error: "audio file required" });

    // ── Step 1: STT ──────────────────────────────────────────────────────────
    const transcript = await sttTranscribe(req.file.buffer, req.file.mimetype);
    console.log("📝 Transcript:", transcript);

    // ── Step 2: LLM Extract ──────────────────────────────────────────────────
    const extracted = await llmExtractTransaction(transcript);
    let { customer_name, items, transaction_type } = extracted;

if (
  !customer_name ||
  customer_name.toLowerCase() === "unknown"
) {
  const match = transcript.match(
    /^([\u0900-\u097Fa-zA-Z]+)/
  );

  if (match) {
    customer_name = match[1];
    console.log("Fallback customer name:", customer_name);
  }
}
    console.log("TRANSCRIPT:", transcript);
console.log("EXTRACTED:", extracted);
const CUSTOMER_MAP = {
  "अनंत": "Anant",
  "आनंद": "Anand",
  "राजू": "Raju",
  "रमेश": "Ramesh",
  "अंजू": "Anju"
};

customer_name =
  CUSTOMER_MAP[customer_name] || customer_name;

    // ── Step 3: Upsert customer ──────────────────────────────────────────────
    let customer = db
      .prepare("SELECT * FROM customers WHERE LOWER(name) = LOWER(?)")
      .get(customer_name);

    if (!customer) {
      const customer_id = `cust-${uuidv4().slice(0, 8)}`;
      db.prepare("INSERT INTO customers (customer_id, name) VALUES (?, ?)").run(
        customer_id, customer_name
      );
      customer = db.prepare("SELECT * FROM customers WHERE customer_id = ?").get(customer_id);
    }


// ── Step 4: Calculate amounts + deduct inventory ─────────────────────────
let totalAmount = 0;
const enrichedItems = [];

for (const item of items) {
const ITEM_MAP = {
  // Existing
  flour: "Aata",
  aata: "Aata",
  "आटा": "Aata",

  sugar: "Chini",
  chini: "Chini",
  "चीनी": "Chini",

  oil: "Tel",
  tel: "Tel",
  "तेल": "Tel",

  salt: "Namak",
  namak: "Namak",
  "नमक": "Namak",

  rice: "Chawal",
  chawal: "Chawal",
  "चावल": "Chawal",

  lentils: "Daal",
  dal: "Daal",
  daal: "Daal",
  "दाल": "Daal",

  // Vegetables
  potato: "Aloo",
  potatoes: "Aloo",
  aloo: "Aloo",
  "आलू": "Aloo",

  cucumber: "Kheera",
  kheera: "Kheera",
  "खीरा": "Kheera",

  onion: "Pyaz",
  pyaz: "Pyaz",
  "प्याज": "Pyaz",

  tomato: "Tamatar",
  tamatar: "Tamatar",
  "टमाटर": "Tamatar",

  // Dairy
  milk: "Doodh",
  doodh: "Doodh",
  "दूध": "Doodh",

  // Packaged goods
  biscuit: "Biscuit",
  biscuits: "Biscuit",
  "बिस्किट": "Biscuit",

  soap: "Soap",
  "साबुन": "Soap",

  tea: "Tea",
  chai: "Tea",
  "चाय": "Tea"
};

  const normalizedName =
  ITEM_MAP[item.name?.toLowerCase?.()] || item.name;

const stock = db
  .prepare("SELECT * FROM inventory WHERE LOWER(item_name) LIKE LOWER(?) LIMIT 1")
  .get(`%${normalizedName}%`);

  console.log("Original:", item.name);
  console.log("Normalized:", normalizedName);
  if (!stock) {
  return res.status(400).json({
    error: `${normalizedName} inventory me nahi mila`
  });
}

if (stock.quantity < item.quantity) {
  return res.status(400).json({
    error: `${normalizedName} ka sirf ${stock.quantity} ${stock.unit} stock available hai`
  });
}
  console.log("Stock Found:", stock);

  const unitPrice = stock?.sell_price || 0;
  const lineTotal = unitPrice * (item.quantity || 1);

  totalAmount += lineTotal;

  enrichedItems.push({
    name: normalizedName,
    quantity: item.quantity,
    unit: item.unit || stock?.unit || "unit",
    unit_price: unitPrice,
    line_total: lineTotal,
  });

  // Deduct inventory
  if (stock && stock.quantity >= item.quantity) {
    db.prepare(`
      UPDATE inventory
      SET quantity = quantity - ?,
          updated_at = datetime('now')
      WHERE item_id = ?
    `).run(item.quantity, stock.item_id);
  }
}

    // ── Step 5: Write ledger entry ───────────────────────────────────────────
    const txn_id = `txn-${uuidv4().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO transactions (txn_id, customer_id, items_json, total_amount, status, voice_input)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      txn_id,
      customer.customer_id,
      JSON.stringify(enrichedItems),
      totalAmount,
      transaction_type === "paid" ? "paid" : "udhaar",
      transcript
    );

    // Update customer's total_due if udhaar
    if (transaction_type !== "paid") {
      db.prepare("UPDATE customers SET total_due = total_due + ? WHERE customer_id = ?")
        .run(totalAmount, customer.customer_id);
    }

    // ── Step 6: Build & speak Hindi confirmation ─────────────────────────────
    const itemList = enrichedItems
      .map(i => `${i.quantity} ${i.unit} ${i.name}`)
      .join(" aur ");
    const confirmationText =
      transaction_type === "paid"
        ? `${customer_name} ka ₹${totalAmount} ka payment receive ho gaya. ${itemList} — paid.`
        : `${customer_name} ke khaate mein ${itemList} jod diya gaya. Kul udhaar ₹${totalAmount}.`;

    const audioBase64 = await ttsSpeak(confirmationText);

    // ── Respond ──────────────────────────────────────────────────────────────
    res.json({
      success:          true,
      txn_id,
      transcript,
      extracted,
      items:            enrichedItems,
      total_amount:     totalAmount,
      transaction_type: transaction_type !== "paid" ? "udhaar" : "paid",
      customer: {
        id:        customer.customer_id,
        name:      customer.name,
        total_due: customer.total_due + (transaction_type !== "paid" ? totalAmount : 0),
      },
      confirmation_text: confirmationText,
      audio:            audioBase64,
    });

  } catch (err) {
    console.error("voice-commit error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/transactions — manual ledger entry (fallback without voice)
router.post("/", (req, res) => {
  const db = getDB();
  const { customer_id, items, total_amount, status } = req.body;
  if (!customer_id || !items) return res.status(400).json({ error: "customer_id and items required" });

  const txn_id = `txn-${uuidv4().slice(0, 8)}`;
  db.prepare(`
    INSERT INTO transactions (txn_id, customer_id, items_json, total_amount, status)
    VALUES (?, ?, ?, ?, ?)
  `).run(txn_id, customer_id, JSON.stringify(items), total_amount || 0, status || "udhaar");

  if (status !== "paid") {
    db.prepare("UPDATE customers SET total_due = total_due + ? WHERE customer_id = ?")
      .run(total_amount || 0, customer_id);
  }

  res.status(201).json({ success: true, txn_id });
});

module.exports = router;
