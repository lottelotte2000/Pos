const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  readData: () => ipcRenderer.invoke('read-data'),
  writeData: (data) => ipcRenderer.invoke('write-data', data),

  // --- 🚀 CHANGE START ---
  getSetupStatus: () => ipcRenderer.invoke('get-setup-status'),
  completeSetup: (setupData) => ipcRenderer.invoke('complete-setup', setupData),
  // --- 🚀 CHANGE END ---

  loginUser: (username, password) => ipcRenderer.invoke('login-user', { username, password }),
  createUser: (userData) => ipcRenderer.invoke('create-user', userData),
  updateUser: (id, data) => ipcRenderer.invoke('update-user', { id, data }),

  selectBackupPath: () => ipcRenderer.invoke('select-backup-path'),
  getBackupPath: () => ipcRenderer.invoke('get-backup-path'),
  createManualBackup: () => ipcRenderer.invoke('create-manual-backup'),
  restoreBackup: () => ipcRenderer.invoke('restore-backup'),
  openBackupFolder: () => ipcRenderer.invoke('open-backup-folder'),

  onUpdateMessage: (callback) => ipcRenderer.on('update-message', (...args) => callback(...args)),
  onUpdateProgress: (callback) => ipcRenderer.on('update-progress', (...args) => callback(...args)),
  onUpdateReady: (callback) => ipcRenderer.on('update-ready', (...args) => callback(...args)),
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (...args) => callback(...args)),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  restartApp: () => ipcRenderer.send('restart-app'),
  reloadApp: () => ipcRenderer.send('reload-app'),
  openCustomerDisplay: () => ipcRenderer.send('open-customer-display'),
  closeCustomerDisplay: () => ipcRenderer.send('close-customer-display'),
  // ✅ เพิ่มฟังก์ชันรับ-ส่งข้อมูล QR Code
  sendCustomerDisplayAction: (action) => ipcRenderer.send('customer-display-action', action),
  // โปรแกรมหลักขอให้บันทึกข้อมูลค้างทันที (ก่อนปิด/ก่อนอัปเดต) → ตอบกลับเมื่อเสร็จ
  onFlushRequest: (callback) => ipcRenderer.on('flush-data', async () => {
    try { await callback(); } finally { ipcRenderer.send('flush-done'); }
  }),
  onCustomerDisplayAction: (callback) => ipcRenderer.on('customer-display-action', (event, action) => callback(action)),
});