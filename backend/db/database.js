/**
 * db/database.js
 * Pure-JS SQLite via sql.js — no native build required. Perfect for MVP.
 */
const path = require("path");
const fs   = require("fs");
const DB_PATH = path.join(__dirname, "merakhata.db.json");

let _db  = null;
let _SQL = null;

async function initDB() {
  _SQL = await require("sql.js")();

  if (fs.existsSync(DB_PATH)) {
    const saved = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
    _db = new _SQL.Database(new Uint8Array(saved));
  } else {
    _db = new _SQL.Database();
  }

  _db.run(`CREATE TABLE IF NOT EXISTS inventory (
    item_id TEXT PRIMARY KEY, item_name TEXT NOT NULL UNIQUE,
    quantity REAL NOT NULL DEFAULT 0, unit TEXT NOT NULL DEFAULT 'unit',
    cost_price REAL NOT NULL DEFAULT 0, sell_price REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')))`);

  _db.run(`CREATE TABLE IF NOT EXISTS customers (
    customer_id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT,
    total_due REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')))`);

  _db.run(`CREATE TABLE IF NOT EXISTS transactions (
    txn_id TEXT PRIMARY KEY, customer_id TEXT NOT NULL,
    items_json TEXT NOT NULL, total_amount REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'udhaar', voice_input TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id))`);

  const seed = [
    ["inv-001","Aata",50,"kg",28,32],
    ["inv-002","Chini",40,"kg",42,48],
    ["inv-003","Tel",20,"litre",120,135],
    ["inv-004","Namak",30,"kg",18,22],
    ["inv-005","Daal",25,"kg",90,105],
    ["inv-006","Chawal",60,"kg",45,52],
  ];
  for (const [id,nm,qty,unit,cost,sell] of seed) {
    _db.run(
      `INSERT OR IGNORE INTO inventory (item_id,item_name,quantity,unit,cost_price,sell_price) VALUES (?,?,?,?,?,?)`,
      [id,nm,qty,unit,cost,sell]
    );
  }
  _persist();
  console.log("✅ Database initialised (sql.js)");
}

function _persist() {
  if (!_db) return;
  fs.writeFileSync(DB_PATH, JSON.stringify(Array.from(_db.export())));
}

function getDB() {
  if (!_db) throw new Error("DB not ready — await initDB() first");
  const db = _db;
  const persist = _persist;

  function makeStmt(sql) {
    return {
      run(...params) {
        db.run(sql, params);
        persist();
        return { changes: 1 };
      },
      get(...params) {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        let result;
        if (stmt.step()) result = stmt.getAsObject();
        stmt.free();
        return result;
      },
      all(...params) {
        let results;
        try {
          results = db.exec(sql, params.length ? params : undefined);
        } catch(e) {
          return [];
        }
        if (!results || !results.length) return [];
        const { columns, values } = results[0];
        return values.map(row =>
          Object.fromEntries(columns.map((c, i) => [c, row[i]]))
        );
      },
    };
  }

  return {
    prepare: (sql) => makeStmt(sql),
    exec: (sql) => { db.run(sql); persist(); },
  
  transaction(fn) {
  return function(...args) {
    try { db.run("BEGIN"); } catch(_) {}
    try {
      fn(...args);
      try { db.run("COMMIT"); } catch(_) {}
      persist();
    } catch(e) {
      try { db.run("ROLLBACK"); } catch(_) {}
      throw e;
    }
  };
},
  };
}

module.exports = { initDB, getDB };