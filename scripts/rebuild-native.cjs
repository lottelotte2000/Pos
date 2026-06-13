// Ensures better-sqlite3 has a binary matching the Electron ABI (not the system Node ABI).
// Runs on postinstall. Best-effort: never fails `npm install`.
// Why: `npm install` fetches the Node-ABI prebuild; Electron needs its own ABI.
// We download the matching Electron prebuild via prebuild-install (no C++ compiler needed).
const { execSync } = require('child_process');
const path = require('path');

try {
  // Electron is a devDependency; skip silently on production/CI installs without it.
  const electronVersion = require('electron/package.json').version;
  const moduleDir = path.join(__dirname, '..', 'node_modules', 'better-sqlite3');

  console.log(`[postinstall] Fetching better-sqlite3 prebuild for Electron ${electronVersion} (${process.platform}/${process.arch})...`);
  execSync(
    `npx --yes prebuild-install -r electron -t ${electronVersion} --arch ${process.arch} --platform ${process.platform}`,
    { cwd: moduleDir, stdio: 'inherit' }
  );
  console.log('[postinstall] better-sqlite3 Electron binary ready.');
} catch (err) {
  console.warn('[postinstall] Could not fetch Electron prebuild for better-sqlite3:', err.message);
  console.warn('[postinstall] If the app fails to open the database, run manually:');
  console.warn('   cd node_modules/better-sqlite3 && npx prebuild-install -r electron -t <electron-version>');
  // Do not fail the install
}
