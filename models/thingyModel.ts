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



// Define the interface for the SensorData model
export interface ISensorData extends Document {
    thingyId: mongoose.Types.ObjectId;
    timestamp: Date;
    value: number;
    
}

/**
 * SensorData Schema
 * - thingyId: The ID of the Thingy (required)
 * - timestamp: The time when the data was recorded (required)
 * - type: The type of sensor data (required, enum)
 * - value: The sensor value (required)
 */
const SensorDataSchema: Schema = new Schema(
{
    thingyId: { type: mongoose.Types.ObjectId, ref: 'Thingy', required: true },
    timestamp: { type: Date, required: true },
    type: { type: String, required: true, 
        enum: ['temperature', 'humidity', 'pressure', 'airQuality', 'color', 'motion', 'battery']
    },
    value: { type: Number, required: true }
}, 
{
    timeseries: {
        timeField: 'timestamp',
        // metaField: 'metadata',
        granularity: 'seconds'
    },
    autoCreate: false,
    expireAfterSeconds: 86400
});

// Create a Mongoose model from the schema and export it
const SensorData = mongoose.model<ISensorData>('SensorData', SensorDataSchema);

export { SensorData };


export default Thingy;