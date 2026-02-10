import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, default: '123456' },
    role: { type: String, enum: ['admin', 'employee'], default: 'employee' },


    joinedRoomCode: { type: String, default: null },


    isActiveShift: { type: Boolean, default: false },
    isInsideZone: { type: Boolean, default: false },
    lastLat: Number,
    lastLng: Number,
    lastSeen: Date,


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