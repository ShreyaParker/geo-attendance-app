import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import User from './models/User.js';

import authRoutes from './routes/authRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import roomRoutes from "./routes/roomRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json({ limit: '50mb' }));
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.set('io', io);

app.use('/api', authRoutes);
app.use('/api', attendanceRoutes);
app.use('/api', roomRoutes);
app.use('/api', leaveRoutes);

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/geo_pro')
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.log("❌ DB Error:", err));

io.on('connection', (socket) => {
    console.log('⚡ Client Connected:', socket.id);
    socket.on('disconnect', () => console.log('Client Disconnected'));
});

cron.schedule('0 0 * * *', async () => {
    console.log("🧹 Running nightly auto-clock-out cleanup...");
    try {
        const now = new Date();
        const activeUsers = await User.find({ isActiveShift: true });

        for (const user of activeUsers) {
            const totalDiff = now - new Date(user.shiftStartTime);
            let finalOutDuration = user.currentShiftOutDuration || 0;

            if (user.lastExitTime) {
                finalOutDuration += (now - new Date(user.lastExitTime));
            }

            const formatMs = (ms) => {
                const totalSeconds = Math.floor(ms / 1000);
                const h = Math.floor(totalSeconds / 3600);
                const m = Math.floor((totalSeconds % 3600) / 60);
                const s = totalSeconds % 60;
                return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
            };

            await User.findByIdAndUpdate(user._id, {
                isActiveShift: false,
                isInsideZone: false,
                shiftStartTime: null,
                lastExitTime: null,
                currentShiftOutDuration: 0,
                $push: {
                    history: {
                        start: user.shiftStartTime,
                        end: now,
                        duration: formatMs(totalDiff),
                        outDuration: formatMs(finalOutDuration)
                    }
                }
            });
        }

        console.log(`✅ Auto-clocked out ${activeUsers.length} users.`);
    } catch (err) {
        console.error("Cron Error:", err);
    }
}, {
    timezone: "Asia/Kolkata"
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server & Sockets running on port ${PORT}`);
});