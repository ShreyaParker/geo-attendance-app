import User from '../models/User.js';
import Room from '../models/Room.js';
import Alert from '../models/Alert.js';

const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const formatDuration = (ms) => {
    if (!ms || ms < 0) return "00:00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds]
        .map(v => String(v).padStart(2, '0'))
        .join(':');
};

export const updateStatus = async (req, res, io) => {
    try {
        const { userId, lat, lng, event, image } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        let updates = { lastLat: lat, lastLng: lng, lastSeen: new Date() };
        const now = new Date();
        let alertTriggered = null;

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

            if (!isInside) {
                updates.lastExitTime = now;

                alertTriggered = new Alert({
                    type: 'CLOCK_IN_OUTSIDE',
                    message: `${user.name} clocked in OUTSIDE the zone.`,
                    userId: user._id,
                    userName: user.name
                });
                await alertTriggered.save();
            } else {
                updates.lastExitTime = null;
            }
        }

        else if (event === 'EXIT_ZONE') {
            updates.isInsideZone = false;
            if (user.isActiveShift && !user.lastExitTime) {
                updates.lastExitTime = now;

                alertTriggered = new Alert({
                    type: 'EXIT_ZONE',
                    message: `${user.name} left the zone boundaries!`,
                    userId: user._id,
                    userName: user.name
                });
                await alertTriggered.save();
            }
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

        await User.findByIdAndUpdate(userId, updates);

        if (alertTriggered) {
            io.emit('new_alert', alertTriggered);
        }
        const freshUser = await User.findById(userId);
        io.emit('status_update', freshUser);

        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getDashboard = async (req, res) => {
    try {
        const { roomCode } = req.query;
        const query = { role: 'employee' };
        if (roomCode) query.joinedRoomCode = roomCode;

        const users = await User.find(query);
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getAlerts = async (req, res) => {
    try {
        const alerts = await Alert.find().sort({ timestamp: -1 }).limit(50);
        res.json(alerts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const parseDurationToMinutes = (str) => {
    if (!str) return 0;
    const parts = str.split(':');
    if (parts.length !== 3) return 0;
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    const seconds = parseInt(parts[2]) || 0;
    return (hours * 60) + minutes + (seconds / 60);
};

export const getMonthlyAttendance = async (req, res) => {
    try {
        const { roomCode, month, year } = req.query;
        const users = await User.find({ joinedRoomCode: roomCode });
        const calendarData = {};

        users.forEach(user => {
            user.history.forEach(session => {
                const date = new Date(session.start).toISOString().split('T')[0];
                const sessionDate = new Date(session.start);

                if (sessionDate.getMonth() + 1 !== parseInt(month) ||
                    sessionDate.getFullYear() !== parseInt(year)) return;

                const outMinutes = parseDurationToMinutes(session.outDuration);
                let status = 'PRESENT';
                if (outMinutes > 120) status = 'ABSENT_VIOLATION';

                if (!calendarData[date]) {
                    calendarData[date] = { date, present: 0, absent: 0, flagged: 0, records: [] };
                }

                if (status === 'PRESENT') calendarData[date].present++;
                else calendarData[date].flagged++;

                calendarData[date].records.push({
                    userId: user._id,
                    name: user.name,
                    status,
                    inTime: session.start,
                    outTime: session.end,
                    totalOutDuration: session.outDuration,
                    outMinutes
                });
            });
        });

        res.json(calendarData);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getUserDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select('-password');
        if (!user) return res.status(404).json({ message: "User not found" });

        const violations = user.history.reduce((acc, shift) => {
            return acc + parseDurationToMinutes(shift.outDuration);
        }, 0);

        res.json({
            ...user._doc,
            currentShiftOutDuration: violations
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};