import User from '../models/User.js';
import Room from '../models/Room.js';

const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) ** 2 +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

const formatDuration = (ms) => {
    if (!ms || ms < 0) return "0m";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (h === 0 && m === 0) return "0m";
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const updateStatus = async (req, res) => {
    try {
        const { userId, lat, lng, event, image } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        let updates = { lastLat: lat, lastLng: lng };
        const now = new Date();

        if (event === 'CLOCK_IN') {
            updates.isActiveShift = true;
            updates.shiftStartTime = now;
            updates.checkInImage = image;
            updates.currentShiftOutDuration = 0;

            let isInside = true;
            if (user.joinedRoomCode) {
                const room = await Room.findOne({ code: user.joinedRoomCode });
                if (room) {
                    const dist = getDistance(lat, lng, room.lat, room.lng);
                    isInside = dist <= room.radius;
                }
            }

            updates.isInsideZone = isInside;
            updates.lastExitTime = !isInside ? now : null;
        }
        else if (event === 'EXIT_ZONE') {
            updates.isInsideZone = false;
            if (user.isActiveShift && !user.lastExitTime) updates.lastExitTime = now;
        }
        else if (event === 'ENTER_ZONE') {
            updates.isInsideZone = true;
            if (user.isActiveShift && user.lastExitTime) {
                const diff = now - new Date(user.lastExitTime);
                updates.currentShiftOutDuration = (user.currentShiftOutDuration || 0) + diff;
                updates.lastExitTime = null;
            }
        }
        else if (event === 'CLOCK_OUT') {
            updates.isActiveShift = false;
            updates.isInsideZone = false;

            if (user.shiftStartTime) {
                const totalDiff = now - new Date(user.shiftStartTime);
                let finalOutDuration = user.currentShiftOutDuration || 0;
                if (user.lastExitTime) finalOutDuration += (now - new Date(user.lastExitTime));

                await User.findByIdAndUpdate(userId, {
                    $push: {
                        history: {
                            start: user.shiftStartTime,
                            end: now,
                            duration: formatDuration(totalDiff),
                            outDuration: formatDuration(finalOutDuration)
                        }
                    }
                });
            }

            updates.shiftStartTime = null;
            updates.lastExitTime = null;
            updates.currentShiftOutDuration = 0;
        }

        if (event === 'GPS_OFF') updates.isGpsOff = true;
        if (event === 'GPS_ON') updates.isGpsOff = false;

        await User.findByIdAndUpdate(userId, updates);
        res.json({ success: true });

    } catch (err) {
        console.error("Update Error:", err);
        res.status(500).json({ error: err.message });
    }
};

const getDashboard = async (req, res) => {
    try {
        const { roomCode } = req.params;
        const query = { role: 'employee' };
        if (roomCode) query.joinedRoomCode = roomCode;
        const users = await User.find(query);
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
const getAlerts = async (req, res) => {
    try {
        const alerts = await Alert.find().sort({ timestamp: -1 }).limit(50);
        res.json(alerts);
    } catch (err) { res.status(500).json({ error: err.message }); }
};
export default { updateStatus, getDashboard,getAlerts };
