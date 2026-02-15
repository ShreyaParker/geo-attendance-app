import Leave from '../models/Leave.js';
import User from '../models/User.js';

export const applyLeave = async (req, res) => {
    try {
        const { userId, startDate, endDate, reason } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const leave = new Leave({
            userId,
            userName: user.name,
            startDate,
            endDate,
            reason
        });
        await leave.save();
        res.json({ success: true, message: "Leave request submitted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getLeaves = async (req, res) => {
    try {
        const { userId } = req.query; 
        const query = userId ? { userId } : {};
        const leaves = await Leave.find(query).sort({ appliedOn: -1 });
        res.json(leaves);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateLeaveStatus = async (req, res) => {
    try {
        const { leaveId, status } = req.body;
        await Leave.findByIdAndUpdate(leaveId, { status });
        res.json({ success: true, message: `Leave ${status}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
