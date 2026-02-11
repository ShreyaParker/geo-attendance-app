import User from '../models/User.js';
import Room from '../models/Room.js';
import jwt from 'jsonwebtoken';

export const login = async (req, res) => {
    try {
        const { email, name, role } = req.body;

        let user = await User.findOne({ email });

        if (!user) {
            
            user = new User({ email, name, role });
        } else {
            user.role = role;
            user.name = name;
        }
        
        await user.save();

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '30d' }
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
    } catch (err) { res.status(500).json({ error: err.message }); }
};
