import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    role: { type: String, default: 'employee' },
    joinedRoomCode: String,
    isActiveShift: { type: Boolean, default: false },
    isInsideZone: { type: Boolean, default: false },
    isGpsOff: { type: Boolean, default: false },
    lastLat: Number,
    lastLng: Number,
    checkInImage: String,
    shiftStartTime: Date,
    lastExitTime: Date,
    currentShiftOutDuration: { type: Number, default: 0 },
    history: [{
        start: Date,
        end: Date,
        duration: String,
        outDuration: String
    }]
});

export default mongoose.model('User', UserSchema);
