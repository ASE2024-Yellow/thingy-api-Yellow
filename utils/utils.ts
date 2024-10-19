/**
 * @file ./utils/utils.ts
 * @description Contains utility functions for the server.
 */

import Koa from 'koa';
import mongoose from 'mongoose';
import Thingy from '../models/thingyModel';



export const isAuthenticated = async (token: string) => {
    // Check if the token is valid
    // - This could be done using a JWT library or a database query
    return true;
}



/**
 * Hardcodes some things to the database
 * - This could be done by admin users in the future.
 */
const hardcodeThingsToDatabase = async () => {
    const things = [
        { name: 'Thingy 1', isAvailable: true, description: 'This is the first thingy' },
        { name: 'Thingy 2', isAvailable: true, description: 'This is the second thingy' },
        { name: 'Thingy 3', isAvailable: true, description: 'This is the third thingy' }
    ];

    for (const thing of things) {
        const newThing = new Thingy(thing);
        await newThing.save();
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

/**
 * Middleware to handle errors
 * @param ctx 
 * @param next 
 */
export const errorHandler = async (ctx: Koa.Context, next: Koa.Next) => {
    try {
        await next();
    } catch (err) {
        ctx.status = err.status || 500;
        ctx.body = { message: err.message };
        ctx.app.emit('error', err, ctx);
    }
};

/**
 * Starts the Koa server
 * @param app  
 * @param port 
 */
export const startServer = (app: Koa, port: number) => {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
};

