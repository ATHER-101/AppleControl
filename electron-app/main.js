// main.js
const { app, BrowserWindow, Menu, Tray, nativeImage, Notification } = require('electron');
const path = require('path');
const crypto = require('crypto');
const net = require('net');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const robot = require('@jitsi/robotjs');
const { exec } = require('child_process');
require('dotenv').config();

let tray, server, io, qrWindow;

function log(...args) {
  if (!app.isPackaged) console.log(...args);
}

// ------------------------------
// ⚡ SERVER CREATION HELPERS
// ------------------------------
async function getAvailablePort(startPort = 3000) {
  const findPort = (port) =>
    new Promise((resolve) => {
      const tester = net
        .createServer()
        .once('error', () => resolve(findPort(port + 1)))
        .once('listening', () => tester.close(() => resolve(port)))
        .listen(port);
    });
  return await findPort(startPort);
}

let dynamicPort;
let dynamicToken;

async function stopServer() {
  return new Promise((resolve) => {
    if (server) {
      log('🛑 Stopping existing server...');
      server.close(() => {
        log('✅ Server stopped');
        server = null;
        io = null;
        resolve();
      });
    } else resolve();
  });
}

async function startServer() {
  await stopServer();

  dynamicPort = await getAvailablePort(3000);
  dynamicToken = crypto.randomBytes(16).toString('hex');

  const expressApp = express();
  server = http.createServer(expressApp);
  io = new Server(server, { cors: { origin: '*' } });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token === dynamicToken) return next();
    return next(new Error('Unauthorized'));
  });

  io.on('connection', (socket) => {
    log(`✅ Client connected: ${socket.id}`);
    socket.on('move', ({ dx = 0, dy = 0 }) => {
      const pos = robot.getMousePos();
      robot.moveMouse(Math.round(pos.x + dx), Math.round(pos.y + dy));
    });
    socket.on('click', () => robot.mouseClick('left'));
    socket.on('rightClick', () => robot.mouseClick('right'));
    socket.on('doubleClick', () => robot.mouseClick('left', true));
    socket.on('scroll', ({ dy = 0 }) => robot.scrollMouse(0, dy));
    socket.on('disconnect', () => log(`❌ Client disconnected: ${socket.id}`));
  });

  expressApp.get('/status', (req, res) => res.json({ ok: true, port: dynamicPort }));

  await new Promise((resolve, reject) => {
    server.listen(dynamicPort, '0.0.0.0')
      .once('listening', resolve)
      .once('error', reject);
  });

  log(`🖱️ Server running on port ${dynamicPort}`);
  log(`🔐 Token: ${dynamicToken}`);
  showNotification(`Server started on port ${dynamicPort}`);
}

// ------------------------------
// 🪟 QR WINDOW
// ------------------------------
function openQRWindow() {
  if (qrWindow) return qrWindow.focus();

  qrWindow = new BrowserWindow({
    width: 400,
    height: 520,
    resizable: false,
    show: false,
    backgroundColor: '#1e1e2f',
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });

  qrWindow.loadFile(path.join(__dirname, 'qr.html'));
  qrWindow.once('ready-to-show', () => {
    qrWindow.show();

    const localIP = getLocalIP();
    const payload = { ip: localIP, port: dynamicPort, secret: dynamicToken };
    const qrData = Buffer.from(JSON.stringify(payload)).toString('base64');

    qrWindow.webContents.send('qr-data', {
      qr: qrData,
      display: payload
    });
  });

  qrWindow.on('closed', () => (qrWindow = null));
}

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

// ------------------------------
// 🍎 TRAY MENU
// ------------------------------
function createTray() {
  const trayIcon = nativeImage.createFromPath(path.join(__dirname, 'assets', 'tray-iconTemplate.png'));
  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show QR Code', click: openQRWindow },
    {
      label: 'Restart Server',
      click: async () => {
        await startServer();
        showNotification(`Server restarted on port ${dynamicPort}`);

        if (qrWindow && !qrWindow.isDestroyed()) {
          const localIP = getLocalIP();
          const payload = { ip: localIP, port: dynamicPort, secret: dynamicToken };
          const qrData = Buffer.from(JSON.stringify(payload)).toString('base64');

          qrWindow.webContents.send('qr-data', {
            qr: qrData,
            display: payload
          });
        }
      }
    },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);

  tray.setToolTip('Mac Remote Server');
  tray.setContextMenu(contextMenu);
}

// ------------------------------
// 🔔 Notification helper
// ------------------------------
function showNotification(message) {
  new Notification({ title: 'Mac Remote Server', body: message }).show();
}

// ------------------------------
// 🚀 APP LIFECYCLE
// ------------------------------
app.on('ready', async () => {
  createTray();
  await startServer();
});

app.on('before-quit', async () => {
  await stopServer();
});

app.on('window-all-closed', (e) => e.preventDefault());