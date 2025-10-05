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
    try {
      const pos = robot.getMousePos();
      robot.moveMouse(Math.round(pos.x + dx), Math.round(pos.y + dy));
    } catch (err) { console.error(err); }
  });

  socket.on('click', () => robot.mouseClick('left'));
  socket.on('rightClick', () => robot.mouseClick('right'));
  socket.on('doubleClick', () => robot.mouseClick('left', true));

  // Keyboard events
  socket.on("keyTap", (key, modifiers = []) => {
    try { robot.keyTap(key, modifiers); } 
    catch (err) { console.error("keyTap error:", key, modifiers, err); }
  });

  socket.on("keyDown", (key) => {
    try { robot.keyToggle(key, "down"); } 
    catch (err) { console.error("keyDown error:", err); }
  });

  socket.on("keyUp", (key) => {
    try { robot.keyToggle(key, "up"); } 
    catch (err) { console.error("keyUp error:", err); }
  });

  // Special macOS keys
  socket.on("specialKey", (action) => {
    try {
      switch (action) {
        case "brightnessUp": exec("osascript -e 'tell application \"System Events\" to key code 144'"); break;
        case "brightnessDown": exec("osascript -e 'tell application \"System Events\" to key code 145'"); break;
        case "missionControl": exec("open -a 'Mission Control'"); break;
        case "spotlightSearch": exec(`osascript -e 'tell application "System Events" to keystroke " " using {command down}'`); break;
        case "mute":
          exec(`osascript -e 'set curMuted to output muted of (get volume settings)
               if curMuted then set volume without output muted
               else set volume with output muted end if'`);
          break;
        case "volumeUp": exec(`osascript -e 'set volume output volume ((output volume of (get volume settings)) + 10)'`); break;
        case "volumeDown": exec(`osascript -e 'set volume output volume ((output volume of (get volume settings)) - 10)'`); break;
        default: console.log("Unhandled special key:", action);
      }
    } catch (err) { console.error(err); }
  });

  socket.on('disconnect', () => console.log('❌ Client disconnected:', socket.id));
});

app.get('/status', (req, res) => res.json({ ok: true, port: PORT, token: PAIR_TOKEN }));

server.listen(PORT, '0.0.0.0', () => console.log(`🖱️ Server running on port ${PORT}`));