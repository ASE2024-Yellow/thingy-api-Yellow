/**
 * @file ./controllers/thingyController.ts
 * @description Defines the controller class for handling operations related to Thingy.
 */

import { Context, Next } from 'koa';
import Thingy, { EventData, IThingy, SensorData } from '../models/thingyModel';
import User from '../models/userModel';
import { Schema } from 'mongoose';
import { PassThrough } from 'stream';
import eventEmitter from '../utils/eventHandler';
import { IThingyMessage } from '../mqtt/mqttHandle';

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
  

    static async subscribetoFlipEvent(ctx: Context, next: Next) {
        console.log('subscribetoFlipEvent');
        const userId = ctx.state.user.id;
        const user = await User.findById(userId);
        if (!user) {
            ctx.status = 404;
            ctx.body = { error: 'User not found' };
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
        const thingyId = userPopulated.thingy.name;
        const stream = new PassThrough();
        eventEmitter.on(thingyId + '-flip', (data: IThingyMessage) => {
            let flipData = new EventData({
                thingyName: thingyId,
                timestamp: new Date(),
                type: data.appId,
                value: data.data,
            });
            flipData.save();
            stream.write(`data: ${data}\n\n`);
            // the data may be lost if there's problem with the connection
            // This is the simplest way to handle it
            // For production, we may need the stream to be closed by frontend user.
            stream.end();
        });
        setInterval(() => {
            if (stream.writable) {
                stream.write('data: beating...\n\n');
            }
        }, 5000);
        
        ctx.request.socket.setTimeout(0);
        ctx.req.socket.setNoDelay(true);
        ctx.req.socket.setKeepAlive(true);
    
        ctx.set({
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        });

        ctx.status = 200;
        ctx.body = stream;
    }
    
    static async subscribetoButtonEvent(ctx: Context, next: Next) {
        console.log('subscribetoButtonEvent');
        const userId = ctx.state.user.id;
        const user = await User.findById(userId);
        if (!user) {
            ctx.status = 404;
            ctx.body = { error: 'User not found' };
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
        const thingyId = userPopulated.thingy.name;
        const stream = new PassThrough();
        eventEmitter.on(thingyId + '-button', (data: IThingyMessage) => {
            let buttonData = new EventData({
                thingyName: thingyId,
                timestamp: new Date(),
                type: data.appId,
                value: data.data,
            });
            buttonData.save();
            stream.write(`data: ${data}\n\n`);
            // the data may be lost if there's problem with the connection
            // This is the simplest way to handle it
            // For production, we may need the stream to be closed by frontend user.
            stream.end(); 
        });
        setInterval(() => {
            if (stream.writable) {
                stream.write('data: beating...\n\n');
            }
        }, 5000);
        
        ctx.request.socket.setTimeout(0);
        ctx.req.socket.setNoDelay(true);
        ctx.req.socket.setKeepAlive(true);
    
        ctx.set({
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        });

        ctx.status = 200;
        ctx.body = stream;
    }

   

    /**
     * Retrieves flip event history.
     * @param ctx - Koa context object.
     * @param next - Koa next middleware function.
     */
    static async getFlipEventHistory(ctx: Context, next: Next) {
        const flipEvents = await EventData.find({ type: 'FLIP' });
        ctx.status = 200;
        ctx.body = flipEvents;
    }

    /**
     * Retrieves button press event history.
     * @param ctx - Koa context object.
     * @param next - Koa next middleware function.
     */
    static async getButtonEventHistory(ctx: Context, next: Next) {
        const buttonEvents = await EventData.find({ type: 'BUTTON' });
        ctx.status = 200;
        ctx.body = buttonEvents;
    }

    

   

    

}

export default ThingyController;