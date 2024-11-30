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
    name: { type: String, required: true, unique: true },
    isAvailable: { type: Boolean, required: true },
    description: { type: String, required: false }
});


// Create a Mongoose model from the schema and export it
const Thingy = mongoose.model<IThingy>('Thingy', ThingySchema);



// Define the interface for the SensorData model
export interface ISensorData extends Document {
    thingyName: string;
    timestamp: Date;
    type: 'TEMP'| 'CO2_EQUIV'| 'HUMID'| 'AIR_PRESS'| 'AIR_QUAL' | 'LIGHT';
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
    thingyName: { type: String, required: true },
    timestamp: { type: Date, required: true },
    type: { type: String, required: true, 
        enum: ['TEMP', 'CO2_EQUIV', 'HUMID', 'AIR_PRESS', 'AIR_QUAL', 'LIGHT']
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

export interface IEventData extends Document {
    thingyName: string;
    timestamp: Date;
    type: 'FLIP' | 'BUTTON';
    value: string;
}

const EventDataSchema: Schema = new Schema({
    thingyName: { type: String, required: true },
    timestamp: { type: Date, required: true },
    type: { type: String, required: true, 
        enum: ['FLIP', 'BUTTON']
    },
    value: { type: String, required: true }
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

const EventData = mongoose.model<IEventData>('EventData', EventDataSchema);




export { SensorData, EventData };


export default Thingy;