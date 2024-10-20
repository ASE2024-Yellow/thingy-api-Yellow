import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password?: string;
  transportType: 'bike' | 'wheelchair' | 'car' | 'bus' | 'train' | 'other';
  googleId?: string;
  thingy?: Schema.Types.ObjectId;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: false },
  transportType: { 
    type: String, 
    enum: ['bike', 'wheelchair', 'car', 'bus', 'train', 'other'], 
    default: 'other' 
  },
  googleId: { type: String, required: false },
  thingy: { type: Schema.Types.ObjectId, ref: 'Thingy', required: false },
});

export default mongoose.model<IUser>('User', UserSchema);
