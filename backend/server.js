import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import { verifyToken, isAdmin } from './middleware/auth.js';
import { login } from './controllers/authController.js';
import { createRoom, deleteRoom, kickUser, joinRoom, getAllRooms } from './controllers/roomController.js';
import { updateStatus, getDashboard, getAlerts } from './controllers/attendanceController.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(express.json({ limit: '50mb' })); // For image uploads
app.use(cors());


app.post('/api/login', login);

app.post('/api/admin/create-room', verifyToken, isAdmin, createRoom);
app.delete('/api/admin/delete-room/:id', verifyToken, isAdmin, deleteRoom);
app.post('/api/admin/kick-user', verifyToken, isAdmin, kickUser);
app.get('/api/admin/rooms', verifyToken, isAdmin, getAllRooms);
app.get('/api/admin/dashboard', verifyToken, isAdmin, getDashboard);
app.get('/api/admin/alerts', verifyToken, isAdmin, getAlerts);


app.post('/api/join-room', verifyToken, joinRoom);
app.post('/api/update-status', verifyToken, (req, res) => updateStatus(req, res, io));
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/geo_pro')
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.log("❌ DB Error:", err));

io.on('connection', (socket) => {
    console.log('⚡ Client Connected:', socket.id);
    socket.on('disconnect', () => console.log('Client Disconnected'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server & Sockets running on port ${PORT}`));