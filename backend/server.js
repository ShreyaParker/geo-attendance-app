import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import roomRoutes from "./routes/roomRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(express.json({ limit: '50mb' }));
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.set('io', io);

app.use('/api', authRoutes);
app.use('/api', attendanceRoutes);
app.use('/api',roomRoutes);
app.use('/api', leaveRoutes);

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/geo_pro')
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.log("❌ DB Error:", err));

io.on('connection', (socket) => {
    console.log('⚡ Client Connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client Disconnected');
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server & Sockets running on port ${PORT}`);
});
