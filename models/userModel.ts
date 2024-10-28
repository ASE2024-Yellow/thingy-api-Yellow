/**
 * @file ./models/userModel.ts
 * @description Defines the User model for the server.
 */
import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for the User model
export interface IUser extends Document {
  username: string;
  email: string;
  password?: string;
  transportType: 'bike' | 'wheelchair' | 'car' | 'bus' | 'train' | 'other';
  googleId?: string;
  thingy?: Schema.Types.ObjectId;
}

/**
 * User Schema
 * - username: The username of the user (required, unique)
 * - email: The email of the user (required, unique)
 * - password: The password of the user (required)
 * - transportType: The transport type of the user (required, enum)
 * - googleId: The Google ID of the user (optional)
 * - thingy: The Thingy bound to the user (optional
 */
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
