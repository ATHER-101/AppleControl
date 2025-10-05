// backend/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const robot = require('@jitsi/robotjs'); // your installed package
const { v4: uuidv4 } = require('uuid');

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;
const PAIR_TOKEN = process.env.PAIR_TOKEN || 'dev-token';

// simple socket auth middleware using a pairing token
io.use((socket, next) => {
  const token = (socket.handshake.auth && socket.handshake.auth.token) || socket.handshake.query?.token;
  if (token === PAIR_TOKEN) return next();
  return next(new Error('Unauthorized - invalid token'));
});

io.on('connection', (socket) => {
  console.log('client connected:', socket.id);

  socket.on('move', ({ dx = 0, dy = 0 } = {}) => {
    try {
      const pos = robot.getMousePos();
      const newX = Math.round(pos.x + dx);
      const newY = Math.round(pos.y + dy);
      robot.moveMouse(newX, newY);
    } catch (err) {
      console.error('move error:', err);
    }
  });

  socket.on('moveTo', ({ x, y } = {}) => {
    try {
      if (typeof x === 'number' && typeof y === 'number') {
        robot.moveMouse(Math.round(x), Math.round(y));
      }
    } catch (err) {
      console.error('moveTo error:', err);
    }
  });

  socket.on('click', () => {
    try { robot.mouseClick(); } catch (err) { console.error('click error:', err); }
  });

  socket.on('rightClick', () => {
    try { robot.mouseClick('right'); } catch (err) { console.error('rightClick error:', err); }
  });

  socket.on('doubleClick', () => {
    try { robot.mouseClick('left', true); } catch (err) { console.error('doubleClick error:', err); }
  });

  socket.on('type', ({ text = '' } = {}) => {
    try { robot.typeString(String(text)); } catch (err) { console.error('type error:', err); }
  });

  socket.on('keyTap', ({ key } = {}) => {
    try { if (key) robot.keyTap(String(key)); } catch (err) { console.error('keyTap error:', err); }
  });

  socket.on('disconnect', () => {
    console.log('client disconnected:', socket.id);
  });
});

app.get('/status', (req, res) => {
  res.json({ ok: true, port: PORT, token: PAIR_TOKEN });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Control server listening on port ${PORT}`);
  console.log(`Pair token: ${PAIR_TOKEN}`);
});