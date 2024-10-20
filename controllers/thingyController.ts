/**
 * @file ./controllers/thingyController.ts
 * @description Defines the controller class for handling operations related to Thingy.
 */

import { Context, Next } from 'koa';
import Thingy, { IThingy, SensorData } from '../models/thingyModel';
import User from '../models/userModel';
import { Schema } from 'mongoose';

/**
 * Controller class for handling operations related to Thingy.
 */
class ThingyController {
    /**
     * Retrieves all Thingy records.
     * @param ctx - Koa context object.
     * @param next - Koa next middleware function.
     */
    static async getThingy(ctx: Context, next: Next) {
        const things = await Thingy.find();
        ctx.body = things;
        ctx.status = 200;
    }

    /**
     * Binds a Thingy to a user.
     * @param ctx - Koa context object.
     * @param next - Koa next middleware function.
     */
    static async bindThingyToUser(ctx: Context, next: Next) {
        const userId = ctx.state.user.id;
        const thingyId = ctx.params.thingyId;

        if (!thingyId) {
            ctx.status = 400;
            ctx.body = { error: 'Thingy ID are required' };
            return;
        }
        const thingy = await Thingy.findById(thingyId);
        if (!thingy) {
            ctx.status = 404;
            ctx.body = { error: 'Thingy not found' };
            return;
        }
        const user = await User.findById(userId);
        if (!user) {
            ctx.status = 404;
            ctx.body = { error: 'User not found' };
            return;
        }
        user.thingy = thingyId;
        await user.save();
        thingy.isAvailable = false;
        await thingy.save();
        ctx.status = 200;
        ctx.body = { 
            message: 'Thingy successfully bound to user',
            thingy: thingy
        };
    }

    /**
     * Unbinds a Thingy from a user.
     * @param ctx - Koa context object.
     * @param next - Koa next middleware function.
     */
    static async unbindThingyFromUser(ctx: Context, next: Next) {
       const userId = ctx.state.user.id;
        const user = await User.findById(userId);
        if (!user) {
            ctx.status = 404;
            ctx.body = { error: 'User not found' };
            return;
        }

        const thingyId = ctx.params.thingyId;
        if (!thingyId) {
            ctx.status = 400;
            ctx.body = { error: 'Thingy ID is required' };
            return;
        }

        if (!user.thingy || user.thingy.toString() !== thingyId.toString()) {
            ctx.status = 400;
            ctx.body = { error: 'Thingy is not bound to the user' };
            return;
        }

        const thingy = await Thingy.findById(thingyId);
        if (!thingy) {
            ctx.status = 404;
            ctx.body = { error: 'Thingy not found' };
            return;
        }
        delete user.thingy;
        await user.save();
        thingy.isAvailable = true;
        await thingy.save();

        ctx.status = 200;
        ctx.body = { 
            message: 'Thingy successfully unbound from user',
            thingy: thingy
        };

    }

    /**
     * Retrieves sensor data from a Thingy.
     * @param ctx - Koa context object.
     * @param next - Koa next middleware function.
     */
    static async getThingySensorData(ctx: Context, next: Next) {
        const userId = ctx.state.user.id;
        const sensorType = ctx.params.sensorType;
        const startTime = ctx.request.query.startTime;
        const endTime = ctx.request.query.endTime;

        const user = await User.findById(userId);
        if (!user) {
            ctx.status = 404;
            ctx.body = { error: 'User not found' };
            return;
        }
        if (!sensorType || !startTime || !endTime
            || typeof sensorType !== 'string' || typeof startTime !== 'string' || typeof endTime !== 'string'
        ) {
            ctx.status = 400;
            ctx.body = { error: 'sensorType, startTime, and endTime are required' };
            return;
        }
        if (!user.thingy) {
            ctx.status = 400;
            ctx.body = { error: 'Thingy is not bound to the user' };
            return;
        }
        const userPopulated = await user.populate<{ thingy: IThingy }>('thingy');
        if (!userPopulated.thingy) {
            ctx.status = 400;
            ctx.body = { error: 'Thingy is not bound to the user' };
            return;
        }
        const sensorData = await SensorData.find({ 
            thingyName: userPopulated.thingy.name,
            type: sensorType,
            timestamp: { $gte: new Date(startTime), $lte: new Date(endTime) }
        });
        ctx.status = 200;
        ctx.body = sensorData;
    }
}

export default ThingyController;