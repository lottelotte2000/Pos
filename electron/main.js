import electron from 'electron';
const { app, BrowserWindow, ipcMain, screen, dialog, protocol } = electron;
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import electronUpdater from 'electron-updater';
import bcrypt from 'bcrypt';
import { initDb, getAppData, saveAppData, importJson, backupTo, restoreFromDb, closeDb } from './db.js';

const { autoUpdater } = electronUpdater;
const SALT_ROUNDS = 10;

// --- Global Variables ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let mainWindow;
let customerWindow = null;

// ✅ ลงทะเบียน custom scheme "app://" สำหรับโหลดหน้าเว็บที่ build แล้วในโหมด production
// (แก้ปัญหา white screen: โมดูล ES script โหลดผ่าน file:// ไม่ได้เพราะ MIME/CORS)
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }
]);

const MIME_TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.map': 'application/json', '.mp3': 'audio/mpeg',
};

function registerAppProtocol() {
  protocol.handle('app', (request) => {
    try {
      const url = new URL(request.url);
      let pathname = decodeURIComponent(url.pathname);
      if (!pathname || pathname === '/') pathname = '/index.html';
      const filePath = path.join(__dirname, '../dist', pathname);
      const data = fs.readFileSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      return new Response(data, { headers: { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' } });
    } catch (error) {
      console.error('[app://] failed to serve', request.url, error.message);
      return new Response('Not found', { status: 404 });
    }
  });
}

// --- Helper Functions ---
function sendStatusToWindow(text) {
  if (mainWindow) {
    mainWindow.webContents.send('update-message', text);
  }
}

// --- Data & Settings Handling ---
// ✅ กำหนดโฟลเดอร์เก็บข้อมูลของแอปเอง → %APPDATA%\PosApp
// เดิม Electron ใช้ชื่อจากฟิลด์ "name" ใน package.json (vite-react-typescript-starter)
// ต้องตั้งค่าก่อนเรียก app.getPath('userData') ครั้งแรกเสมอ
// DEV override: ถ้ามี env POS_USERDATA_DIR จะใช้โฟลเดอร์นั้นแทน (ใช้ตอนทดสอบ dev เพื่อไม่แตะข้อมูลจริง)
//   production ไม่ได้ตั้ง env นี้ จึงใช้ PosApp ตามปกติเสมอ
app.setPath('userData', process.env.POS_USERDATA_DIR || path.join(app.getPath('appData'), 'PosApp'));

const userDataPath = app.getPath('userData');
const dataFileName = 'appData.json';
const dataFilePath = path.join(userDataPath, dataFileName);
const settingsFileName = 'settings.json';
const settingsFilePath = path.join(userDataPath, settingsFileName);

// ข้อมูลเริ่มต้นจะไม่มี user อีกต่อไป user แรกจะมาจากการตั้งค่า
const initialData = {
  products: [],
  transactions: [],
  users: [], // Array ว่าง
  receiptSettings: { storeName: 'ชื่อร้านค้าของคุณ', address: '', phone: '', thankYouMessage: 'ขอบคุณที่ใช้บริการ' },
  customerDisplaySettings: { welcomeMessage: "ยินดีต้อนรับ", secondaryMessage: "กรุณาตรวจสอบรายการสินค้า", idleImageUrl: "", thankYouTitle: "ขอบคุณที่ใช้บริการ", thankYouSubtitle: "หวังว่าท่านจะกลับมาอีกครั้ง!" },
  posSettings: { preventNegativeStock: false }
};

function readSettings() {
  try {
    if (fs.existsSync(settingsFilePath)) {
      return JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'));
    }
  } catch (error) { console.error('Error reading settings file:', error); }
  return {}; // return object ว่างถ้าไม่มีไฟล์หรือ error
}

function writeSettings(settings) {
  try {
    fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (error) { console.error('Error writing settings file:', error); }
}

// ✅ อ่าน/เขียนข้อมูลผ่าน SQLite (better-sqlite3) แทนไฟล์ JSON — รูปแบบ AppData เหมือนเดิม
function readDataFile() {
  try {
    return getAppData();
  } catch (error) {
    console.error('Main Process: Error reading from database:', error);
    return initialData;
  }
}

function writeDataFile(data) {
  return saveAppData(data);
}

async function backupDataFile() {
  const settings = readSettings();
  const backupDir = settings.backupPath || path.join(userDataPath, 'backups');

  try {
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    // สำรองอัตโนมัติ: ใช้ชื่อไฟล์คงที่ (กันกินพื้นที่) — สำเนาฐานข้อมูล SQLite
    const backupFilePath = path.join(backupDir, 'auto_backup.db');
    backupTo(backupFilePath);
    console.log(`Backup created at: ${backupFilePath}`);
  } catch (error) {
    console.error(`Failed to create backup at ${backupDir}:`, error);
    dialog.showErrorBox('Backup Failed', `Could not create backup at ${backupDir}.`);
  }
}

// --- Window Creation ---
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  const startUrl = !app.isPackaged ? 'http://localhost:5173' : 'app://bundle/index.html';
  mainWindow.loadURL(startUrl);

  if (!app.isPackaged) {
    // mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => (mainWindow = null));
}

function createCustomerDisplay() {
  if (customerWindow) {
    customerWindow.focus();
    return;
  }
  const displays = screen.getAllDisplays();
  const externalDisplay = displays.find((display) => display.bounds.x !== 0 || display.bounds.y !== 0);

  if (externalDisplay) {
    customerWindow = new BrowserWindow({
      x: externalDisplay.bounds.x,
      y: externalDisplay.bounds.y,
      width: externalDisplay.bounds.width,
      height: externalDisplay.bounds.height,
      fullscreen: true,
      frame: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });
    const customerDisplayUrl = !app.isPackaged ? 'http://localhost:5173/#/customer-display' : 'app://bundle/index.html#/customer-display';
    customerWindow.loadURL(customerDisplayUrl);
    customerWindow.on('closed', () => (customerWindow = null));
  } else {
    dialog.showErrorBox('ไม่พบจอแสดงผล', 'ไม่พบจอภาพที่สองสำหรับเปิดหน้าจอของลูกค้า');
  }
}

// --- App Lifecycle ---
// ความปลอดภัย: ไม่สร้าง default admin/admin123 อีกต่อไป
// ถ้าไม่มีผู้ใช้ในระบบ → บังคับให้เข้าหน้า Setup เพื่อสร้างผู้ดูแลระบบด้วยรหัสผ่านที่ผู้ใช้ตั้งเอง
async function ensureDefaultAdmin() {
  const data = readDataFile();
  if (!data.users || data.users.length === 0) {
    console.log("No users found → forcing first-time setup wizard.");
    const settings = readSettings();
    if (settings.isSetupComplete) {
      settings.isSetupComplete = false;
      writeSettings(settings);
    }
  }
}

app.whenReady().then(async () => {
  registerAppProtocol(); // ต้องลงทะเบียนก่อนสร้างหน้าต่างในโหมด production
  initDb(userDataPath, dataFilePath); // เปิดฐานข้อมูล + ย้ายข้อมูลจาก appData.json เดิม (ครั้งเดียว)
  await ensureDefaultAdmin(); // Ensure admin exists before UI loads
  createMainWindow();
  backupDataFile();
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

app.on('will-quit', () => {
  backupDataFile();
  closeDb();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// --- IPC Handlers ---
ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.handle('get-setup-status', () => {
  const settings = readSettings();
  return { isSetupComplete: settings.isSetupComplete === true };
});

ipcMain.handle('complete-setup', async (event, setupData) => {
  try {
    const { adminUser, settings } = setupData;
    if (!adminUser || !adminUser.password || !settings || !settings.storeName) {
      throw new Error("ข้อมูลการตั้งค่าไม่สมบูรณ์");
    }

    if (adminUser.username.toLowerCase() === 'admin') {
      throw new Error("ไม่สามารถใช้งาน user admin ได้");
    }

    const hashedPassword = await bcrypt.hash(adminUser.password, SALT_ROUNDS);
    const superAdmin = {
      id: `user-${Date.now()}`,
      username: adminUser.username,
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date().toISOString(),
    };

    const newAppData = { ...initialData };
    newAppData.users.push(superAdmin);
    newAppData.receiptSettings.storeName = settings.storeName;

    writeDataFile(newAppData);

    const currentSettings = readSettings();
    currentSettings.isSetupComplete = true;
    writeSettings(currentSettings);

    console.log("✅ System setup complete. Superadmin created.");
    return { success: true };
  } catch (error) {
    console.error("Setup failed:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('read-data', async () => {
  const data = readDataFile();
  if (data.users) {
    const usersWithoutPasswords = data.users.map(u => {
      const { password, ...user } = u;
      return user;
    });
    return { ...data, users: usersWithoutPasswords };
  }
  return data;
});

ipcMain.handle('write-data', async (event, dataFromFrontend) => {
  const currentData = readDataFile();

  // Protect admin user: Ensure 'admin' user from currentData is preserved if missing in frontend data
  if (dataFromFrontend.users) {
    const adminUser = currentData.users.find(u => u.username.toLowerCase() === 'admin');
    if (adminUser) {
      const frontendAdmin = dataFromFrontend.users.find(u => u.username.toLowerCase() === 'admin');
      if (!frontendAdmin) {
        // Admin missing in frontend data? Restore it!
        dataFromFrontend.users.push(adminUser);
      } else {
        // Admin exists, but ensure ID/Password remains if frontend didn't send full data (though frontend sends full user objects usually)
        // Frontend sends users without passwords usually.
        // We need to merge passwords back.
      }
    }

    // Merge passwords back, because frontend doesn't have them
    dataFromFrontend.users = dataFromFrontend.users.map(feUser => {
      const originalUser = currentData.users.find(u => u.id === feUser.id || u.username === feUser.username);
      if (originalUser) {
        return { ...feUser, password: originalUser.password };
      }
      return feUser;
    });
  }

  const updatedData = {
    ...currentData,
    ...dataFromFrontend
  };
  return writeDataFile(updatedData);
});

ipcMain.handle('login-user', async (event, { username, password }) => {
  const data = readDataFile();
  const user = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());

  if (!user || !user.password) {
    console.log(`Login failed: User '${username}' not found or has no password hash.`);
    return { success: false };
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (isPasswordCorrect) {
    console.log(`Login successful for '${username}'.`);
    const { password, ...userWithoutPassword } = user;
    return { success: true, user: userWithoutPassword };
  } else {
    console.log(`Login failed: Incorrect password for '${username}'.`);
    return { success: false };
  }
});

ipcMain.handle('create-user', async (event, userData) => {
  if (!userData.username || !userData.password || !userData.role) {
    return { success: false, message: 'Missing user data.' };
  }

  // Validate role (must be 'admin' or 'cashier')
  if (!['admin', 'cashier'].includes(userData.role)) {
    return { success: false, message: 'บทบาทไม่ถูกต้อง (ต้องเป็น admin หรือ cashier เท่านั้น)' };
  }

  // Prevent creating 'admin' username
  if (userData.username.toLowerCase() === 'admin') {
    return { success: false, message: 'ไม่สามารถใช้งาน user admin ได้' };
  }

  const data = readDataFile();
  if (data.users.some(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
    return { success: false, message: 'Username already exists.' };
  }
  const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
  const newUser = {
    ...userData,
    id: `user-${Date.now()}`,
    createdAt: new Date().toISOString(),
    password: hashedPassword,
  };
  data.users.push(newUser);
  const writeResult = writeDataFile(data);

  if (writeResult.success) {
    const { password, ...userWithoutPassword } = newUser;
    return { success: true, user: userWithoutPassword };
  } else {
    return { success: false, message: 'Failed to save new user.' };
  }
});

// ✅ แก้ไขข้อมูลผู้ใช้ (รวมถึงการเปลี่ยนรหัสผ่าน) — hash รหัสผ่านใหม่และบันทึกลงไฟล์จริง
ipcMain.handle('update-user', async (event, { id, data }) => {
  if (!id || !data) {
    return { success: false, message: 'Missing update data.' };
  }

  const appData = readDataFile();
  const userIndex = appData.users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return { success: false, message: 'User not found.' };
  }

  // Validate role if provided
  if (data.role && !['admin', 'cashier'].includes(data.role)) {
    return { success: false, message: 'บทบาทไม่ถูกต้อง' };
  }

  // Prevent duplicate username (excluding self)
  if (data.username && appData.users.some(u => u.id !== id && u.username.toLowerCase() === data.username.toLowerCase())) {
    return { success: false, message: 'Username already exists.' };
  }

  const existing = appData.users[userIndex];
  const updated = { ...existing };
  if (data.username) updated.username = data.username;
  if (data.role) updated.role = data.role;
  if (data.password) {
    updated.password = await bcrypt.hash(data.password, SALT_ROUNDS);
  }
  updated.updatedAt = new Date().toISOString();

  appData.users[userIndex] = updated;
  const writeResult = writeDataFile(appData);
  if (!writeResult.success) {
    return { success: false, message: 'Failed to save user.' };
  }

  const { password, ...userWithoutPassword } = updated;
  return { success: true, user: userWithoutPassword };
});

ipcMain.handle('select-backup-path', async () => {
  if (!mainWindow) return null;
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'เลือกโฟลเดอร์สำหรับสำรองข้อมูล',
    properties: ['openDirectory']
  });
  if (!canceled && filePaths.length > 0) {
    const selectedPath = filePaths[0];
    const settings = readSettings();
    settings.backupPath = selectedPath;
    writeSettings(settings);
    return selectedPath;
  }
  return null;
});

ipcMain.handle('get-backup-path', () => {
  const settings = readSettings();
  return settings.backupPath || null;
});

ipcMain.handle('create-manual-backup', async () => {
  const settings = readSettings();
  const backupDir = settings.backupPath || path.join(userDataPath, 'backups');

  try {
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    // Manual Backup: Use timestamp to keep history — สำเนาฐานข้อมูล SQLite
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilePath = path.join(backupDir, `manual-backup-${timestamp}.db`);
    backupTo(backupFilePath);
    return { success: true, path: backupFilePath, message: 'Backup created successfully' };
  } catch (error) {
    console.error(`Failed to create manual backup:`, error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('restore-backup', async () => {
  if (!mainWindow) return { success: false, message: 'Window not found' };

  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'เลือกไฟล์เพื่อกู้คืนข้อมูล',
    filters: [{ name: 'POS Backup', extensions: ['db', 'json'] }],
    properties: ['openFile']
  });

  if (canceled || filePaths.length === 0) {
    return { success: false, message: 'Cancelled' };
  }

  const backupFile = filePaths[0];

  try {
    if (backupFile.toLowerCase().endsWith('.json')) {
      // ไฟล์สำรองรูปแบบเดิม (.json) → import แบบแทนที่ข้อมูลทั้งหมด
      const parsedData = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
      if (!parsedData.users && !parsedData.products && !parsedData.receiptSettings) {
        throw new Error('Invalid backup file format');
      }
      const res = importJson(parsedData);
      if (!res.success) throw new Error(res.error || 'Import failed');
    } else {
      // ไฟล์ฐานข้อมูล SQLite (.db) → ตรวจ header แล้วแทนที่ไฟล์ฐานข้อมูล
      const header = fs.readFileSync(backupFile).subarray(0, 16).toString('utf-8');
      if (!header.startsWith('SQLite format 3')) {
        throw new Error('ไฟล์ไม่ใช่ฐานข้อมูล SQLite ที่ถูกต้อง');
      }
      const res = restoreFromDb(backupFile, userDataPath);
      if (!res.success) throw new Error(res.error || 'Restore failed');
    }

    // Return success to frontend, let frontend trigger restart
    return { success: true, message: 'Restore successful' };

  } catch (error) {
    console.error('Restore failed:', error);
    return { success: false, message: 'Invalid backup file or restore failed: ' + error.message };
  }
});

ipcMain.on('restart-app', () => autoUpdater.quitAndInstall());
ipcMain.on('reload-app', () => {
  mainWindow?.reload();
});
ipcMain.on('open-customer-display', () => createCustomerDisplay());
ipcMain.on('close-customer-display', () => {
  if (customerWindow) customerWindow.close();
});

// ✅ เพิ่ม Listener สำหรับส่งข้อมูลไปยังหน้าจอ Customer
ipcMain.on('customer-display-action', (event, action) => {
  if (customerWindow) {
    customerWindow.webContents.send('customer-display-action', action);
  }
});

// --- Auto-Updater Event Listeners ---
let isManualCheck = false;

autoUpdater.on('checking-for-update', () => {
  if (isManualCheck) {
    sendStatusToWindow('กำลังตรวจสอบอัปเดต...');
  }
});

autoUpdater.on('update-available', (info) => {
  sendStatusToWindow(`พบเวอร์ชันใหม่ ${info.version} กำลังดาวน์โหลด...`);
  if (mainWindow) {
    mainWindow.webContents.send('update-available', info);
  }
});

autoUpdater.on('update-not-available', () => {
  if (isManualCheck) {
    sendStatusToWindow('คุณใช้เวอร์ชันล่าสุดแล้ว');
    setTimeout(() => sendStatusToWindow(''), 5000);
    isManualCheck = false; // Reset flag
  }
});

autoUpdater.on('error', (err) => {
  if (isManualCheck) {
    sendStatusToWindow('เกิดข้อผิดพลาดในการอัปเดต: ' + err.message);
    isManualCheck = false; // Reset flag
  } else {
    console.error('Auto-updater error:', err);
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-progress', progressObj);
  }
});

autoUpdater.on('update-downloaded', () => {
  sendStatusToWindow('ดาวน์โหลดอัปเดตเรียบร้อยแล้ว');
  if (mainWindow) {
    mainWindow.webContents.send('update-ready');
  }
});

// --- Update Handlers ---
ipcMain.handle('check-for-updates', () => {
  isManualCheck = true; // Flag that this is a user-initiated check
  if (app.isPackaged) {
    autoUpdater.checkForUpdates();
    return { success: true, message: 'Checking started' };
  } else {
    // Simulate check in dev mode so the UI shows something
    sendStatusToWindow('กำลังตรวจสอบอัปเดต... (Dev Mode)');
    setTimeout(() => {
      sendStatusToWindow('คุณใช้เวอร์ชันล่าสุดแล้ว (Dev Mode)');
      setTimeout(() => sendStatusToWindow(''), 3000);
      isManualCheck = false;
    }, 2000);
    return { success: true, message: 'Dev info sent' };
  }
});

ipcMain.handle('install-update', async () => {
  // Perform backup before installing
  console.log("Creating backup before update...");
  await backupDataFile();
  autoUpdater.quitAndInstall();
});