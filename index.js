const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const chatSocketHandler = require('./sockets/chatSocket');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const conversationRoutes = require('./routes/conversations');
const contactRoutes = require('./routes/contactRoutes');
const tagRoutes = require('./routes/tags');
const dashboardRoutes = require('./routes/dashboard');
const activityRoutes = require('./routes/activities');
const allowedOrigins = ['http://localhost:3000', 'https://crm-client-dusky.vercel.app'];

dotenv.config();
connectDB();


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
     origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/activities', activityRoutes);

io.on('connection', (socket) => chatSocketHandler(io, socket));

server.listen(process.env.PORT || 5000, () =>
  console.log(`Server running on port ${process.env.PORT || 5000}`)
);
