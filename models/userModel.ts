/**
 * @file ./models/userModel.ts
 * @description Defines the User model for the server.
 */
import mongoose, { Schema, Document } from 'mongoose';

// Define the interface for the User model
export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    transportType: 'bike' | 'wheelchair' | 'car' | 'bus' | 'train' | 'other';
}

/**
 * User Schema
 * - username: The username of the user (required)
 * - email: The email of the user (required, unique)
 * - password: The password of the user (required)
 * - transportType: The type of transport the user uses (required, enum)
 * - thingy: The Thingy associated with the user (optional)
 */
const UserSchema: Schema = new Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    transportType: { 
        type: String, 
        enum: ['bike', 'wheelchair', 'car', 'bus', 'train', 'other'], 
        required: true 
    },
    thingy: { type: Schema.Types.ObjectId, ref: 'Thingy' }
});

// Create a Mongoose model from the schema and export it
const User = mongoose.model<IUser>('User', UserSchema);

export default User;