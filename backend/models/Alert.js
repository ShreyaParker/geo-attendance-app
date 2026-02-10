import mongoose from 'mongoose';

const AlertSchema = new mongoose.Schema({
    type: { type: String, enum: ['EXIT_ZONE', 'CLOCK_IN_OUTSIDE', 'SOS'] },
    message: String,
    userName: String,
    userId: mongoose.Schema.Types.ObjectId,
    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false }
});

export default mongoose.model('Alert', AlertSchema);