import Room from '../models/Room.js';
import User from '../models/User.js';

const createRoom = async (req, res) => {
    try {
        const { name, lat, lng, radius } = req.body;
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const room = new Room({ name, code, lat, lng, radius });
        await room.save();
        res.json(room);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getAllRooms = async (req, res) => {
    const rooms = await Room.find();
    res.json(rooms);
};

const joinRoom = async (req, res) => {
    try {
        const { email, code } = req.body;
        const room = await Room.findOne({ code });
        if (!room) return res.status(404).json({ error: "Invalid Room Code" });

        await User.findOneAndUpdate({ email }, { joinedRoomCode: code });
        res.json(room);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export default {
    createRoom,
    getAllRooms,
    joinRoom
};
