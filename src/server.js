const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(express.static('public'));
app.use(express.json());

const channels = new Map([
  ['general', { id: 'general', name: 'general', messages: [] }],
  ['random', { id: 'random', name: 'random', messages: [] }]
]);

const callRooms = new Map();

app.get('/api/channels', (_, res) => {
  res.json(Array.from(channels.values()).map(({ id, name }) => ({ id, name })));
});

app.post('/api/channels', (req, res) => {
  const name = String(req.body?.name || '').trim().toLowerCase();

  if (!name) {
    return res.status(400).json({ error: 'Channel name is required.' });
  }

  if (channels.has(name)) {
    return res.status(409).json({ error: 'Channel already exists.' });
  }

  channels.set(name, { id: name, name, messages: [] });
  io.emit('channel:created', { id: name, name });
  return res.status(201).json({ id: name, name });
});

io.on('connection', (socket) => {
  socket.data.currentChannel = 'general';

  socket.on('channel:join', (channelId, ack) => {
    if (!channels.has(channelId)) {
      ack?.({ ok: false, error: 'Unknown channel.' });
      return;
    }

    const previous = socket.data.currentChannel;
    socket.leave(previous);

    socket.join(channelId);
    socket.data.currentChannel = channelId;

    const history = channels.get(channelId).messages;
    ack?.({ ok: true, channelId, history });
  });

  socket.on('message:send', (payload, ack) => {
    const channelId = socket.data.currentChannel || 'general';
    const channel = channels.get(channelId);

    if (!channel) {
      ack?.({ ok: false, error: 'Unable to send message in this channel.' });
      return;
    }

    const author = String(payload?.author || 'anonymous').slice(0, 24);
    const text = String(payload?.text || '').trim();

    if (!text) {
      ack?.({ ok: false, error: 'Empty message.' });
      return;
    }

    const message = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      channelId,
      author,
      text: text.slice(0, 2000),
      createdAt: new Date().toISOString()
    };

    channel.messages.push(message);
    if (channel.messages.length > 100) {
      channel.messages.shift();
    }

    io.to(channelId).emit('message:new', message);
    ack?.({ ok: true, messageId: message.id });
  });

  // WebRTC signaling scaffold for future voice/video/screen sharing.
  socket.on('call:join', ({ roomId, userId }) => {
    if (!roomId || !userId) {
      return;
    }

    socket.join(`call:${roomId}`);

    if (!callRooms.has(roomId)) {
      callRooms.set(roomId, new Set());
    }
    callRooms.get(roomId).add(userId);

    io.to(`call:${roomId}`).emit('call:participants', {
      roomId,
      participants: Array.from(callRooms.get(roomId))
    });
  });

  socket.on('webrtc:signal', ({ roomId, to, from, data }) => {
    socket.to(`call:${roomId}`).emit('webrtc:signal', { to, from, data });
  });

  socket.on('disconnect', () => {
    // In a production system, track membership per socket to cleanup call rooms robustly.
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
