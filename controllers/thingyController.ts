/**
 * @file ./controllers/thingyController.ts
 * @description Defines the controller class for handling operations related to Thingy.
 */

import { Context, Next } from 'koa';
import Thingy from '../models/thingyModel';
import { isAuthenticated } from '../utils/utils';

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
        // let authorization = ctx.request.header.authorization;
        // if (!authorization || !await isAuthenticated(authorization)) {
        //     ctx.status = 401;
        //     ctx.body = { error: 'Unauthorized' };
        //     return;
        // }
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
        // let authorization = ctx.request.header.authorization;
        // if (!authorization || !await isAuthenticated(authorization)) {
        //     ctx.status = 401;
        //     ctx.body = { error: 'Unauthorized' };
        //     return;
        // }
        
        const { thingyId } = ctx.request.body as { thingyId: string };
        
        if (!userId || !thingyId) {
            ctx.status = 400;
            ctx.body = { error: 'User ID and Thingy ID are required' };
            return;
        }
        const thingy = await Thingy.findById(thingyId);

        if (!thingy) {
            ctx.status = 404;
            ctx.body = { error: 'Thingy not found' };
            return;
        }

        thingy.userId = userId;
        await thingy.save();

        ctx.status = 200;
        ctx.body = { message: 'Thingy successfully bound to user' };
        
    }

    /**
     * Unbinds a Thingy from a user.
     * @param ctx - Koa context object.
     * @param next - Koa next middleware function.
     */
    static async unbindThingyFromUser(ctx: Context, next: Next) {
        // const authorization = ctx.request.header.authorization;
        // if (!authorization || !await isAuthenticated(authorization)) {
        //     ctx.status = 401;
        //     ctx.body = { error: 'Unauthorized' };
        //     return;
        // }

    }

    /**
     * Retrieves sensor data from a Thingy.
     * @param ctx - Koa context object.
     * @param next - Koa next middleware function.
     */
    static async getThingySensorData(ctx: Context, next: Next) {
        // Implementation here
        // const authorization = ctx.request.header.authorization;
        // if (!authorization || !await isAuthenticated(authorization)) {
        //     ctx.status = 401;
        //     ctx.body = { error: 'Unauthorized' };
        //     return;
        // }
    }
}

export default ThingyController;