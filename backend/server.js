const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const robot = require('@jitsi/robotjs');
const { exec } = require("child_process");
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;
const PAIR_TOKEN = process.env.PAIR_TOKEN || 'dev-token';

/* 
   Normalization ensures robotjs receives valid keys.
   Frontend can keep using "option", "command", etc.
*/
const keyMap = {
  'caps_lock': 'capslock',
  'option': 'alt',
  'command': 'command',
  'control': 'control',
  'shift': 'shift',
  'fn': null, // handled in frontend only
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

// Simple socket auth
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (token === PAIR_TOKEN) return next();
  return next(new Error('Unauthorized'));
});

io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);

  // Mouse events
  socket.on('move', ({ dx = 0, dy = 0 }) => {
    const pos = robot.getMousePos();
    robot.moveMouse(Math.round(pos.x + dx), Math.round(pos.y + dy));
  });

  socket.on('click', () => robot.mouseClick('left'));
  socket.on('rightClick', () => robot.mouseClick('right'));
  socket.on('doubleClick', () => robot.mouseClick('left', true));
  socket.on('scroll', ({ dy = 0 }) => {
    robot.scrollMouse(0, dy);
  });

  // Keyboard events
  socket.on("keyTap", (key, modifiers = []) => {
    const normKey = normalizeKey(key);
    const normMods = normalizeModifiers(modifiers);

    console.log(`🟢 keyTap: ${key} (${normKey}) | mods: [${modifiers.join(', ')}] → [${normMods.join(', ')}]`);

    try {
      if (normKey) robot.keyTap(normKey, normMods);
      else console.warn(`⚠️ Ignored unknown key: ${key}`);
    } catch (err) {
      console.error("❌ keyTap error:", key, modifiers, err.message);
    }
  });

  socket.on("keyDown", (key) => {
    const normKey = normalizeKey(key);
    console.log(`⬇️ keyDown: ${key} (${normKey})`);
    try {
      if (normKey) robot.keyToggle(normKey, "down");
      else console.warn(`⚠️ Ignored unknown keyDown: ${key}`);
    } catch (err) {
      console.error("❌ keyDown error:", key, err.message);
    }
  });

  socket.on("keyUp", (key) => {
    const normKey = normalizeKey(key);
    console.log(`⬆️ keyUp: ${key} (${normKey})`);
    try {
      if (normKey) robot.keyToggle(normKey, "up");
      else console.warn(`⚠️ Ignored unknown keyUp: ${key}`);
    } catch (err) {
      console.error("❌ keyUp error:", key, err.message);
    }
  });

  // macOS special keys
  socket.on("specialKey", (action) => {
    console.log(`💡 specialKey: ${action}`);
    try {
      switch (action) {
        case "brightnessUp": exec("osascript -e 'tell application \"System Events\" to key code 144'"); break;
        case "brightnessDown": exec("osascript -e 'tell application \"System Events\" to key code 145'"); break;
        case "missionControl": exec("open -a 'Mission Control'"); break;
        case "spotlightSearch": exec(`osascript -e 'tell application "System Events" to keystroke " " using {command down}'`); break;
        case "mute": exec(`osascript -e 'set curMuted to output muted of (get volume settings)
          if curMuted then set volume without output muted
          else set volume with output muted end if'`); break;
        case "volumeUp": exec(`osascript -e 'set volume output volume ((output volume of (get volume settings)) + 10)'`); break;
        case "volumeDown": exec(`osascript -e 'set volume output volume ((output volume of (get volume settings)) - 10)'`); break;
        default: console.log("Unhandled special key:", action);
      }
    } catch (err) {
      console.error("specialKey error:", err.message);
    }
  });

  socket.on('disconnect', () => console.log('❌ Client disconnected:', socket.id));
});

app.get('/status', (req, res) =>
  res.json({ ok: true, port: PORT, token: PAIR_TOKEN })
);

server.listen(PORT, '0.0.0.0', () =>
  console.log(`🖱️ Server running on port ${PORT}`)
);