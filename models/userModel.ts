import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  transportType: string;
  googleId?: string;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String },
  transportType: { 
    type: String, 
    enum: ['bike', 'wheelchair', 'car', 'bus', 'train', 'other'], 
    default: 'other' 
  },
  googleId: { type: String, unique: true },
});

export default mongoose.model<IUser>('User', UserSchema);