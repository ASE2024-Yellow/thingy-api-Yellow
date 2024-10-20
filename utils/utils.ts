/**
 * @file ./utils/utils.ts
 * @description Contains utility functions for the server.
 */

import Koa from 'koa';
import mongoose from 'mongoose';
import Thingy from '../models/thingyModel';


/**
 * Hardcodes some things to the database
 * - This could be done by admin users in the future.
 */
const hardcodeThingsToDatabase = async () => {
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
        await newThing.save()
    }

    console.log('Hardcoded things to the database');
}

/**
 * Connects to MongoDB
 * @param uri 
 */
export const connectToDatabase = async (uri: string) => {
    try {
        await mongoose.connect(uri);
        console.log('connected to database'); 
        mongoose.connection.on('error', console.error);
        hardcodeThingsToDatabase();
    } catch (error) {
        console.error('Error connecting to MongoDB', error);
    }
};



