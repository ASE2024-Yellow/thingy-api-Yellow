/**
 * @file ./utils/utils.ts
 * @description Contains utility functions for the server.
 */

import Koa from 'koa';
import mongoose from 'mongoose';
import Thingy from '../models/thingyModel';

class MongoDBHandler {
    private static instance: MongoDBHandler;
    private connected = false;
    private constructor() {}

    public static getInstance(): MongoDBHandler {
        if (!MongoDBHandler.instance) {
            MongoDBHandler.instance = new MongoDBHandler();
        }
        return MongoDBHandler.instance;
    }

    public async connect(): Promise<void> {
        try {
            if (this.connected) {
                return;
            }
            await mongoose.connect(process.env.MONGODB_URI!);
            console.log('connected to database');
            mongoose.connection.on('error', console.error);
            await this.hardcodeThingsToDatabase();
            this.connected = true;
        } catch (error) {
            console.error('Error connecting to MongoDB', error);
        }
    }

    /**
     * Hardcodes some things to the database
     * - This could be done by admin users in the future.
     */
    private async hardcodeThingsToDatabase(): Promise<void> {
        const things = [
            { name: 'yellow-1', isAvailable: true, description: 'This is the first thingy' },
            { name: 'yellow-2', isAvailable: true, description: 'This is the second thingy' },
            { name: 'yellow-3', isAvailable: true, description: 'This is the third thingy' }
        ];

        for (const thing of things) {
            const existingThing = await Thingy.findOne({ name: thing.name });
            if (existingThing) {
                continue;
            }
            const newThing = new Thingy(thing);
            await newThing.save();
        }

        console.log('Hardcoded things to the database');
    }
}

export default MongoDBHandler;







