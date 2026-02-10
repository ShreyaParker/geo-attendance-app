import Room from '../models/Room.js';
import User from '../models/User.js';


export const createRoom = async (req, res) => {
    try {
        const { name, lat, lng, radius } = req.body;
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const room = new Room({ name, code, lat, lng, radius });
        await room.save();
        res.json(room);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

export const deleteRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const room = await Room.findById(id);
        if(room) {
            // Unlock all users in this room
            await User.updateMany({ joinedRoomCode: room.code }, { joinedRoomCode: null });
            await Room.findByIdAndDelete(id);
        }
        res.json({ success: true, message: "Room deleted and users unlocked" });
    } catch (err) { res.status(500).json({ error: err.message }); }
};


export const joinRoom = async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.userId; // Extracted from Token

        const user = await User.findById(userId);

        if (user.joinedRoomCode) {
            return res.status(400).json({ error: "You are already locked to a location. Ask admin to remove you." });
        }

        const room = await Room.findOne({ code });
        if (!room) return res.status(404).json({ error: "Invalid Room Code" });


        user.joinedRoomCode = code;
        await user.save();

        res.json({ success: true, room });
    } catch (err) { res.status(500).json({ error: err.message }); }
};


export const kickUser = async (req, res) => {
    try {
        const { userId } = req.body;
        await User.findByIdAndUpdate(userId, {
            joinedRoomCode: null,
            isActiveShift: false // Auto Clock Out
        });
        res.json({ success: true, message: "User removed from location" });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

export const getAllRooms = async (req, res) => {
    const rooms = await Room.find();
    res.json(rooms);
};