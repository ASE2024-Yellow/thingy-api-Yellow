/**
 * @file ./models/thingyModel.ts
 * @description Defines the Thingy model for the server.
 */

import mongoose, { Schema } from 'mongoose';
import { Document } from 'mongoose';

// Define the interface for the Thingy model
export interface IThingy extends Document {
    name: string;
    isAvailable: boolean;
    description?: string;
}

/**
 * Thingy Schema
 * - name: The name of the Thingy (required)
 * - isAvailable: Whether the Thingy is available (required)
 * - description: A description of the Thingy (optional)
 */
const ThingySchema: Schema = new Schema({
    name: { type: String, required: true },
    isAvailable: { type: Boolean, required: true },
    description: { type: String, required: false }
});


// Create a Mongoose model from the schema and export it
const Thingy = mongoose.model<IThingy>('Thingy', ThingySchema);


export default Thingy;