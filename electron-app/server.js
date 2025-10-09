// server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const robot = require('@jitsi/robotjs');
const { exec } = require("child_process");
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;
const PAIR_TOKEN = process.env.PAIR_TOKEN || 'dev-token';

/* ------------------- 🔤 Key Normalization ------------------- */
const keyMap = {
  'caps_lock': 'capslock',
  'option': 'alt',
  'command': 'command',
  'control': 'control',
  'shift': 'shift',
  'delete': 'delete',
  'backspace': 'backspace',
  'left': 'left',
  'right': 'right',
  'up': 'up',
  'down': 'down',
  'enter': 'enter',
  'space': 'space',
  'tab': 'tab',
  'esc': 'escape',
};

const modifierMap = {
  'shift': 'shift',
  'control': 'control',
  'option': 'alt',
  'command': 'command',
};

function normalizeKey(key) {
  if (!key) return null;
  const lower = key.toLowerCase();
  return keyMap[lower] || lower;
}

function normalizeModifiers(mods = []) {
  return mods.map((m) => modifierMap[m.toLowerCase()]).filter(Boolean);
}

/* ------------------- 🔐 Auth ------------------- */
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (token === PAIR_TOKEN) return next();
  return next(new Error('Unauthorized'));
});

/* ------------------- ⚡ Connection Handler ------------------- */
io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);

  /* -------- 🖱️ Mouse Controls -------- */
  socket.on('move', ({ dx = 0, dy = 0 }) => {
    const pos = robot.getMousePos();
    robot.moveMouse(Math.round(pos.x + dx), Math.round(pos.y + dy));
  });

  socket.on('click', () => robot.mouseClick('left'));
  socket.on('rightClick', () => robot.mouseClick('right'));
  socket.on('doubleClick', () => robot.mouseClick('left', true));

  // Drag & Drop
  socket.on('mouseDown', () => robot.mouseToggle('down'));
  socket.on('mouseUp', () => robot.mouseToggle('up'));
  socket.on('drag', ({ dx = 0, dy = 0 }) => {
    const pos = robot.getMousePos();
    robot.dragMouse(Math.round(pos.x + dx), Math.round(pos.y + dy));
  });

  // Smooth Scroll
  socket.on('scroll', ({ dy = 0 }) => {
    robot.scrollMouse(0, dy);
  });

  /* -------- 🎹 Keyboard Controls -------- */
  socket.on("keyTap", (key, modifiers = []) => {
    const normKey = normalizeKey(key);
    const normMods = normalizeModifiers(modifiers);
    try {
      if (normKey) robot.keyTap(normKey, normMods);
    } catch (err) {
      console.error("keyTap error:", err.message);
    }
  });

  socket.on("keyDown", (key) => {
    const normKey = normalizeKey(key);
    try {
      if (normKey) robot.keyToggle(normKey, "down");
    } catch (err) {
      console.error("keyDown error:", err.message);
    }
  });

  socket.on("keyUp", (key) => {
    const normKey = normalizeKey(key);
    try {
      if (normKey) robot.keyToggle(normKey, "up");
    } catch (err) {
      console.error("keyUp error:", err.message);
    }
  });

  socket.on("toggleCapsLock", () => {
    exec(`osascript -e 'tell application "System Events" to key code 57'`);
  });

  /* -------- 💻 System Controls -------- */
  socket.on("systemCommand", (action) => {
    console.log(`🧩 systemCommand: ${action}`);
    try {
      switch (action) {
        case "lock":
          exec(`pmset displaysleepnow`);
          break;
        case "sleep":
          exec(`osascript -e 'tell application "System Events" to sleep'`);
          break;
        case "restart":
          exec(`osascript -e 'tell application "System Events" to restart'`);
          break;
        case "shutdown":
          exec(`osascript -e 'tell application "System Events" to shut down'`);
          break;
        case "logout":
          exec(`osascript -e 'tell application "System Events" to log out'`);
          break;
        default:
          console.log("Unhandled system command:", action);
      }
    } catch (err) {
      console.error("systemCommand error:", err.message);
    }
  });

  /* -------- 🎵 Media Controls -------- */
  socket.on("mediaKey", (action) => {
    console.log(`🎵 mediaKey: ${action}`);
    try {
      switch (action) {
        case "playPause":
          exec(`osascript -e 'tell application "System Events" to key code 16 using {command down, option down}'`);
          break;
        case "next":
          exec(`osascript -e 'tell application "System Events" to key code 19 using {command down, option down}'`);
          break;
        case "previous":
          exec(`osascript -e 'tell application "System Events" to key code 18 using {command down, option down}'`);
          break;
        default:
          console.log("Unhandled media key:", action);
      }
    } catch (err) {
      console.error("mediaKey error:", err.message);
    }
  });

  /* -------- 📋 Clipboard -------- */
  socket.on("setClipboard", (text) => {
    exec(`echo "${text}" | pbcopy`);
    console.log("📋 Clipboard set");
  });

  socket.on("getClipboard", (callbackId) => {
    exec(`pbpaste`, (err, stdout) => {
      io.emit(`clipboardResponse-${callbackId}`, stdout.trim());
    });
  });

  /* -------- 🧰 App Shortcuts -------- */
  socket.on("openApp", (appName) => {
    const apps = {
      safari: "Safari",
      terminal: "Terminal",
      finder: "Finder",
      chrome: "Google Chrome",
      settings: "System Settings",
    };
    const target = apps[appName.toLowerCase()];
    if (target) {
      exec(`open -a "${target}"`);
    } else {
      console.log("⚠️ Unknown app:", appName);
    }
  });

  /* -------- 🔊 macOS Special Keys -------- */
  socket.on("specialKey", (action) => {
    try {
      switch (action) {
        case "brightnessUp":
          exec("osascript -e 'tell application \"System Events\" to key code 144'");
          break;
        case "brightnessDown":
          exec("osascript -e 'tell application \"System Events\" to key code 145'");
          break;
        case "missionControl":
          exec("open -a 'Mission Control'");
          break;
        case "spotlightSearch":
          exec(`osascript -e 'tell application "System Events" to keystroke " " using {command down}'`);
          break;
        case "mute":
          exec(`osascript -e 'set volume output muted true'`);
          break;
        case "unmute":
          exec(`osascript -e 'set volume output muted false'`);
          break;
        case "volumeUp":
          exec(`osascript -e 'set volume output volume ((output volume of (get volume settings)) + 5)'`);
          break;
        case "volumeDown":
          exec(`osascript -e 'set volume output volume ((output volume of (get volume settings)) - 5)'`);
          break;
        default:
          console.log("Unhandled special key:", action);
      }
    } catch (err) {
      console.error("specialKey error:", err.message);
    }
  });

  /* -------- 🧹 Disconnect -------- */
  socket.on('disconnect', () => console.log('❌ Client disconnected:', socket.id));
});

/* ------------------- 🌐 API Routes ------------------- */
app.get('/status', (req, res) => {
  res.json({
    ok: true,
    platform: os.platform(),
    arch: os.arch(),
    port: PORT,
    token: PAIR_TOKEN,
  });
});

/* ------------------- 🚀 Start Server ------------------- */
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🖱️ Remote Control Server running at http://localhost:${PORT}`);
});