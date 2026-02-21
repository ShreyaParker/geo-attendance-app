import User from '../models/User.js';
import Room from '../models/Room.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const register = async (req, res) => {
    try {
        const { name, email, password, dateOfJoining, faceData } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            role: 'employee',
            dateOfJoining: new Date(dateOfJoining),
            faceData
        });

        await user.save();

        res.json({ success: true, message: "Registration Successful" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (email === 'admin@hq.com' && password === 'cyber@123') {
            let admin = await User.findOne({ email: 'admin@hq.com' });

            if (!admin) {
                admin = new User({
                    name: 'Admin HQ',
                    email: 'admin@hq.com',
                    password: await bcrypt.hash('cyber@123', 10),
                    role: 'admin'
                });
                await admin.save();
            }

            const token = jwt.sign(
                { id: admin._id, role: 'admin' },
                process.env.JWT_SECRET || 'secret_key'
            );

            return res.json({ token, user: admin, room: null });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch && password !== user.password) {
            return res.status(401).json({ error: "Invalid Password" });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'secret_key'
        );

        let roomData = null;

        if (user.joinedRoomCode) {
            roomData = await Room.findOne({ code: user.joinedRoomCode });
        }

        res.json({
            token,
            user,
            room: roomData
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateFaceModel = async (req, res) => {
    try {
        const { userId, newEmbedding } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        let faceCluster = [];

        try {
            faceCluster = JSON.parse(user.faceData);

            if (!Array.isArray(faceCluster)) {
                faceCluster = [];
            } else if (faceCluster.length > 0 && !Array.isArray(faceCluster[0])) {
                faceCluster = [faceCluster];
            }

        } catch (e) {
            faceCluster = [];
        }

        faceCluster.unshift(newEmbedding);

        if (faceCluster.length > 10) {
            faceCluster.pop();
        }

        user.faceData = JSON.stringify(faceCluster);
        await user.save();

        res.json({ success: true, message: "Model updated" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};