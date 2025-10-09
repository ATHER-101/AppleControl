const { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let tray, serverProcess, qrWindow, logWindow;

// Store logs
let logs = [];

// SERVER MANAGEMENT
function startServer() {
  const serverPath = path.join(__dirname, 'server.js');
  serverProcess = spawn(process.execPath, [serverPath], { env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' } });

  serverProcess.stdout.on('data', (data) => {
    const message = data.toString().trim();
    logs.push(message);
    if (logWindow) logWindow.webContents.send('server-log', message);
  });

  serverProcess.stderr.on('data', (data) => {
    const message = `❌ ${data.toString().trim()}`;
    logs.push(message);
    if (logWindow) logWindow.webContents.send('server-log', message);
  });

  serverProcess.on('exit', (code) => {
    const msg = `Server exited with code ${code}`;
    logs.push(msg);
    if (logWindow) logWindow.webContents.send('server-status', msg);
  });
}

function restartServer() {
  if (serverProcess) serverProcess.kill();
  setTimeout(startServer, 1000);
}

// TRAY
function createTray() {
  const trayIcon = nativeImage.createFromPath(path.join(__dirname, 'assets', 'tray-iconTemplate.png'));
  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show QR Code', click: openQRWindow },
    { label: 'Server Logs', click: openLogWindow },
    { label: 'Restart Server', click: restartServer },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);

  tray.setToolTip('Mac Remote Server');
  tray.setContextMenu(contextMenu);
}

// QR CODE WINDOW
function openQRWindow() {
  if (qrWindow) return qrWindow.focus();
  qrWindow = new BrowserWindow({
    width: 400,
    height: 500,
    resizable: false,
    show: false,
    backgroundColor: '#1e1e2f',
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });
  qrWindow.loadFile(path.join(__dirname, 'qr.html'));
  qrWindow.once('ready-to-show', () => {
    qrWindow.show();
    // Send QR data after window is ready
    qrWindow.webContents.send('qr-data', {
      ip: getLocalIP(),
      port: process.env.PORT || 3000,
      secret: process.env.PAIR_TOKEN || 'dev-token'
    });
  });
  qrWindow.on('closed', () => { qrWindow = null; });
}

// LOG WINDOW
function openLogWindow() {
  if (logWindow) return logWindow.focus();
  logWindow = new BrowserWindow({
    width: 600,
    height: 500,
    show: false,
    backgroundColor: '#1e1e2f',
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });
  logWindow.loadFile(path.join(__dirname, 'logs.html'));
  logWindow.once('ready-to-show', () => {
    logWindow.show();
    // Send existing logs to window
    logs.forEach(msg => logWindow.webContents.send('server-log', msg));
  });
  logWindow.on('closed', () => { logWindow = null; });
}

// Get local network IP
function getLocalIP() {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return '127.0.0.1';
}

// APP LIFECYCLE
app.on('ready', () => { createTray(); startServer(); });
app.on('before-quit', () => { if (serverProcess) serverProcess.kill(); });
app.on('window-all-closed', (e) => e.preventDefault());