import User from '../models/User.js';
import Room from '../models/Room.js';

const login = async (req, res) => {
    try {
        const { name, email, role } = req.body;
        let user = await User.findOne({ email });

        if (!user) {
            user = new User({ name, email, role, history: [] });
            await user.save();
        }

        let roomDetails = null;
        if (user.joinedRoomCode) {
            roomDetails = await Room.findOne({ code: user.joinedRoomCode });
        }

        res.json({
            ...user.toObject(),
            roomLat: roomDetails ? roomDetails.lat : null,
            roomLng: roomDetails ? roomDetails.lng : null,
            roomRadius: roomDetails ? roomDetails.radius : null,
            roomName: roomDetails ? roomDetails.name : null
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export default { login };
