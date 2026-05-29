const express = require('express');
const cors    = require('cors');
const http    = require('http');
const { Server } = require('socket.io');
const admin   = require('firebase-admin');

const app = express();
app.use(express.json({ limit: '20mb' }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET','POST','PUT','PATCH','DELETE'] }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET','POST'] },
  pingInterval: 5000,
  pingTimeout:  10000,
});

const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
console.log('✅ Firebase connected');

// username → Set<socketId>  (supports multiple browser tabs per user)
const onlineUsers = new Map();

const broadcastCount = () => io.emit('userCountUpdate', onlineUsers.size);

io.on('connection', (socket) => {
  socket.on('registerUser', (userId) => {
    if (!userId) return;
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);
    socket.data.userId = userId;
    broadcastCount();
    console.log(`+ ${userId}  online: ${onlineUsers.size}`);
  });

  socket.on('privateMessage', ({ senderId, receiverId, text }) => {
    const sockets = onlineUsers.get(receiverId);
    if (sockets) {
      const msg = { id: Date.now(), sender: 'them', senderId, text, read: true,
        time: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) };
      sockets.forEach(sid => io.to(sid).emit('receiveMessage', msg));
    }
  });

  socket.on('typing', ({ to }) => {
    const sockets = onlineUsers.get(to);
    if (sockets) sockets.forEach(sid => io.to(sid).emit('userTyping', { from: socket.data.userId }));
  });
  socket.on('stopTyping', ({ to }) => {
    const sockets = onlineUsers.get(to);
    if (sockets) sockets.forEach(sid => io.to(sid).emit('userStopTyping', { from: socket.data.userId }));
  });

  socket.on('callUser', ({ userToCall, signalData, from, name }) => {
    const sockets = onlineUsers.get(userToCall);
    if (sockets) sockets.forEach(sid => io.to(sid).emit('incomingCall', { signal: signalData, from, name }));
  });
  socket.on('answerCall', ({ signal, to }) => {
    const sockets = onlineUsers.get(to);
    if (sockets) sockets.forEach(sid => io.to(sid).emit('callAccepted', signal));
  });

  socket.on('disconnect', () => {
    const u = socket.data.userId;
    if (u) {
      const set = onlineUsers.get(u);
      if (set) { set.delete(socket.id); if (set.size === 0) onlineUsers.delete(u); }
    }
    broadcastCount();
    console.log(`- ${socket.id}  online: ${onlineUsers.size}`);
  });
});

app.use('/api/auth',     require('./routes/auth')(db));
app.use('/api/users',    require('./routes/users')(db));
app.use('/api/posts',    require('./routes/posts')(db));
app.use('/api/events',   require('./routes/events')(db));
app.use('/api/messages', require('./routes/messages')(db, io, onlineUsers));

app.get('/api/online-count', (_req, res) => res.json({ count: onlineUsers.size }));
app.get('/api/health',       (_req, res) => res.json({ ok: true, online: onlineUsers.size }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀  http://localhost:${PORT}`));