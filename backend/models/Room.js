import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema({
    name: String,
    code: String,
    lat: Number,
    lng: Number,
    radius: Number,
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Room', RoomSchema);
