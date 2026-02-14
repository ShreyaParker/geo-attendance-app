import mongoose from 'mongoose';

const LeaveSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    reason: String,
    startDate: Date,
    endDate: Date,
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    appliedOn: { type: Date, default: Date.now }
});

export default mongoose.model('Leave', LeaveSchema);
