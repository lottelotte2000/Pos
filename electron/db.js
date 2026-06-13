// ============================================================
//  SQLite data layer (better-sqlite3)
//  Replaces the previous appData.json file store.
//  Keeps the same AppData shape so the renderer/IPC is unchanged.
// ============================================================
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db;
let dbFilePath;

const now = () => new Date().toISOString();
const safeParse = (s, def) => { try { return s ? JSON.parse(s) : def; } catch { return def; } };
const num = (v) => (typeof v === 'number' && !isNaN(v) ? v : (v != null && v !== '' ? Number(v) || 0 : 0));
const intOr = (v) => Math.trunc(num(v));

const SETTING_KEYS = ['receiptSettings', 'customerDisplaySettings', 'soundSettings', 'posSettings'];

// --- normalizers: ensure every bound column exists & no `undefined` (better-sqlite3 rejects undefined) ---
function normProduct(p) {
  return {
    id: p.id, barcode: p.barcode ?? '', name: p.name ?? '', description: p.description ?? null,
    price: num(p.price), cost: num(p.cost), stock: intOr(p.stock),
    category: p.category ?? null, imageUrl: p.imageUrl ?? null,
    createdAt: p.createdAt ?? now(), updatedAt: p.updatedAt ?? now(),
  };
}
function normUser(u) {
  return {
    id: u.id, username: u.username, password: u.password ?? null, role: u.role ?? 'cashier',
    createdAt: u.createdAt ?? now(), updatedAt: u.updatedAt ?? now(),
  };
}
function normTx(t) {
  return {
    id: t.id, date: t.date ?? now(), totalAmount: num(t.totalAmount),
    paymentMethod: t.paymentMethod ?? '', cashierId: t.cashierId ?? '', cashierName: t.cashierName ?? '',
    cashReceived: t.cashReceived != null ? num(t.cashReceived) : null,
    changeAmount: t.changeAmount != null ? num(t.changeAmount) : null,
    voided: t.voided ? 1 : 0, voidedAt: t.voidedAt ?? null, voidedBy: t.voidedBy ?? null,
    items: JSON.stringify(Array.isArray(t.items) ? t.items : []),
  };
}

// --- prepared statements (created after the connection is open) ---
let stmt;
function buildStatements() {
  stmt = {
    upProduct: db.prepare(`INSERT INTO products(id,barcode,name,description,price,cost,stock,category,imageUrl,createdAt,updatedAt)
      VALUES(@id,@barcode,@name,@description,@price,@cost,@stock,@category,@imageUrl,@createdAt,@updatedAt)
      ON CONFLICT(id) DO UPDATE SET barcode=excluded.barcode,name=excluded.name,description=excluded.description,
        price=excluded.price,cost=excluded.cost,stock=excluded.stock,category=excluded.category,
        imageUrl=excluded.imageUrl,updatedAt=excluded.updatedAt`),
    delProduct: db.prepare('DELETE FROM products WHERE id=?'),
    allProductIds: db.prepare('SELECT id FROM products'),

    upUser: db.prepare(`INSERT INTO users(id,username,password,role,createdAt,updatedAt)
      VALUES(@id,@username,@password,@role,@createdAt,@updatedAt)
      ON CONFLICT(id) DO UPDATE SET username=excluded.username,password=excluded.password,
        role=excluded.role,updatedAt=excluded.updatedAt`),
    delUser: db.prepare('DELETE FROM users WHERE id=?'),
    allUserIds: db.prepare('SELECT id FROM users'),

    upTx: db.prepare(`INSERT INTO transactions(id,date,totalAmount,paymentMethod,cashierId,cashierName,cashReceived,changeAmount,voided,voidedAt,voidedBy,items)
      VALUES(@id,@date,@totalAmount,@paymentMethod,@cashierId,@cashierName,@cashReceived,@changeAmount,@voided,@voidedAt,@voidedBy,@items)
      ON CONFLICT(id) DO UPDATE SET totalAmount=excluded.totalAmount,paymentMethod=excluded.paymentMethod,
        cashReceived=excluded.cashReceived,changeAmount=excluded.changeAmount,voided=excluded.voided,
        voidedAt=excluded.voidedAt,voidedBy=excluded.voidedBy,items=excluded.items`),

    upSetting: db.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value'),
    getSetting: db.prepare('SELECT value FROM settings WHERE key=?'),
  };
}

export function initDb(userDataPath, legacyJsonPath) {
  dbFilePath = path.join(userDataPath, 'pos.db');
  const isNew = !fs.existsSync(dbFilePath);

  db = new Database(dbFilePath);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS products(
      id TEXT PRIMARY KEY, barcode TEXT, name TEXT, description TEXT,
      price REAL, cost REAL, stock INTEGER, category TEXT, imageUrl TEXT,
      createdAt TEXT, updatedAt TEXT);
    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);

    CREATE TABLE IF NOT EXISTS transactions(
      id TEXT PRIMARY KEY, date TEXT, totalAmount REAL, paymentMethod TEXT,
      cashierId TEXT, cashierName TEXT, cashReceived REAL, changeAmount REAL,
      voided INTEGER DEFAULT 0, voidedAt TEXT, voidedBy TEXT, items TEXT);
    CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(date);

    CREATE TABLE IF NOT EXISTS users(
      id TEXT PRIMARY KEY, username TEXT UNIQUE, password TEXT, role TEXT,
      createdAt TEXT, updatedAt TEXT);

    CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT);
  `);
  buildStatements();

  // One-time migration from the legacy appData.json (so existing data is not lost)
  if (isNew && legacyJsonPath && fs.existsSync(legacyJsonPath)) {
    try {
      const legacy = JSON.parse(fs.readFileSync(legacyJsonPath, 'utf8'));
      importJson(legacy);
      fs.renameSync(legacyJsonPath, legacyJsonPath + '.migrated');
      console.log('[db] Migrated appData.json → pos.db');
    } catch (e) {
      console.error('[db] Migration from appData.json failed:', e);
    }
  }
  return db;
}

// Internal getter for settings JSON blobs
function getSettingValue(key, def) {
  const row = stmt.getSetting.get(key);
  return row ? safeParse(row.value, def) : def;
}

// Build the full AppData object (users include password — callers like read-data strip it)
export function getAppData() {
  const products = db.prepare('SELECT * FROM products').all();
  const transactions = db.prepare('SELECT * FROM transactions ORDER BY date ASC').all()
    .map(t => ({ ...t, voided: !!t.voided, items: safeParse(t.items, []) }));
  const users = db.prepare('SELECT * FROM users').all();
  return {
    products,
    transactions,
    users,
    receiptSettings: getSettingValue('receiptSettings', {}),
    customerDisplaySettings: getSettingValue('customerDisplaySettings', {}),
    soundSettings: getSettingValue('soundSettings', {}),
    posSettings: getSettingValue('posSettings', { preventNegativeStock: false }),
  };
}

// Normal save (debounced full write from the renderer): reconcile rows in one transaction.
// products/users: upsert incoming + delete rows no longer present.
// transactions: upsert only (this app never deletes bills, only voids them).
export function saveAppData(data) {
  const run = db.transaction((d) => {
    if (Array.isArray(d.products)) {
      const incoming = new Set(d.products.map(p => p.id));
      for (const { id } of stmt.allProductIds.all()) if (!incoming.has(id)) stmt.delProduct.run(id);
      for (const p of d.products) stmt.upProduct.run(normProduct(p));
    }
    if (Array.isArray(d.users)) {
      const incoming = new Set(d.users.map(u => u.id));
      for (const { id } of stmt.allUserIds.all()) if (!incoming.has(id)) stmt.delUser.run(id);
      for (const u of d.users) stmt.upUser.run(normUser(u));
    }
    if (Array.isArray(d.transactions)) for (const t of d.transactions) stmt.upTx.run(normTx(t));
    for (const k of SETTING_KEYS) if (d[k] !== undefined) stmt.upSetting.run(k, JSON.stringify(d[k]));
  });
  try { run(data); return { success: true }; }
  catch (e) { console.error('[db] saveAppData error:', e); return { success: false, error: e.message }; }
}

// Full replace (used by migration & restoring from a .json backup)
export function importJson(data) {
  const run = db.transaction((d) => {
    db.prepare('DELETE FROM products').run();
    db.prepare('DELETE FROM transactions').run();
    db.prepare('DELETE FROM users').run();
    for (const p of (d.products || [])) stmt.upProduct.run(normProduct(p));
    for (const u of (d.users || [])) stmt.upUser.run(normUser(u));
    for (const t of (d.transactions || [])) stmt.upTx.run(normTx(t));
    for (const k of SETTING_KEYS) if (d[k] !== undefined) stmt.upSetting.run(k, JSON.stringify(d[k]));
  });
  try { run(data); return { success: true }; }
  catch (e) { console.error('[db] importJson error:', e); return { success: false, error: e.message }; }
}

// Synchronous backup: checkpoint WAL into the main file then copy it (safe & works on will-quit)
export function backupTo(destPath) {
  db.pragma('wal_checkpoint(TRUNCATE)');
  fs.copyFileSync(dbFilePath, destPath);
}

// Restore from another .db file: close, overwrite, drop stale WAL/SHM, reopen
export function restoreFromDb(srcPath, userDataPath) {
  try {
    db.close();
    fs.copyFileSync(srcPath, dbFilePath);
    for (const ext of ['-wal', '-shm']) {
      const p = dbFilePath + ext;
      if (fs.existsSync(p)) fs.rmSync(p);
    }
    initDb(userDataPath); // reopen on the restored file
    return { success: true };
  } catch (e) {
    console.error('[db] restoreFromDb error:', e);
    return { success: false, error: e.message };
  }
}

export function getDbFilePath() { return dbFilePath; }
export function closeDb() { try { db.pragma('wal_checkpoint(TRUNCATE)'); db.close(); } catch { /* ignore */ } }
