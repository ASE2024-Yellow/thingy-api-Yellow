import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  transportType: 'bike' | 'wheelchair' | 'car' | 'bus' | 'train' | 'other';
  googleId?: string;
  thingy: Schema.Types.ObjectId;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  transportType: { 
    type: String, 
    enum: ['bike', 'wheelchair', 'car', 'bus', 'train', 'other'], 
    default: 'other' 
  },
  googleId: { type: String, unique: true },
  thingy: { type: Schema.Types.ObjectId, ref: 'Thingy' }
});

export default mongoose.model<IUser>('User', UserSchema);
