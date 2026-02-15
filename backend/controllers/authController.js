import User from '../models/User.js';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
    try {
        const { name, email, password, dateOfJoining, faceData } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "Email already exists" });

        const user = new User({
            name,
            email,
            password, 
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
                    password: 'hashed_secret', 
                    role: 'admin' 
                });
                await admin.save();
            }
            
            const token = jwt.sign({ id: admin._id, role: 'admin' }, 'secret_key');
            return res.json({ token, user: admin, room: null });
        }


        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        if (user.password !== password) {
            return res.status(401).json({ error: "Invalid Password" });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, 'secret_key');
        
    
        let roomData = null;
        if (user.joinedRoomCode) {
            roomData = await Room.findOne({ code: user.joinedRoomCode });
        }
        

        res.json({ token, user, room: roomData });

    } catch (err) { res.status(500).json({ error: err.message }); }
};
